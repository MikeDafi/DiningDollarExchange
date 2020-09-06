import React, { useState } from "react";
import { IconButton } from "react-native-paper";
import { GiftedChat, Bubble, Composer, Day } from "react-native-gifted-chat";
import {
  StyleSheet,
  Platform,
  Image,
  View,
  KeyboardAvoidingView,
  Dimensions,
  Animated,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  AsyncStorage,
  Text,
  Keyboard,
  Clipboard,
  TextInput,
} from "react-native";
import firebase from "../../config";
import Modal from "react-native-modal";
import LottieView from "lottie-react-native";
import { Entypo, AntDesign, MaterialCommunityIcons,MaterialIcons } from "@expo/vector-icons";
import { Col, Row, Grid } from "react-native-easy-grid";
import UploadImages from "./UploadImages";
import AwesomeButton from "react-native-really-awesome-button";
import * as ImagePicker from "expo-image-picker";
import ImageViewer from "react-native-image-zoom-viewer";
import * as FileSystem from "expo-file-system";
import ToolTip from "react-native-tooltip";
import DropDownPicker from "react-native-dropdown-picker";

const windowWidth = Dimensions.get("window").width;
const windowHeight = Dimensions.get("window").height;

export default class RoomScreen extends React.Component {
  constructor(props) {
    super(props);
    this.user = firebase.auth().currentUser;
    this.userId = this.user.uid;
    const start = this.user.email.indexOf("@");
    const end = this.user.email.indexOf(".com");
    const domain = this.user.email.substring(start, end);
    const email = this.user.email.substring(0, end);
    this.earlierMessage = "";
    this.earlierMessagetext = "";
    this.historyObject = {
      historyMessages: [],
      snapshot: {},
      startIndex: 0,
      endIndex: 0,
    };
    const path = "profilePics/" + domain + "/" + email + "/profilePic.jpg";

    this.state = {
      paymentDropdown: new Animated.Value(30),
      confirmModalHeight: new Animated.Value(330),
      confirmOrderError: {
        priceInputtedError: false,
        paymentOptionsError: false,
      },
      possibleProfitVisible: false,
      possibleProfit : {
        actualPrice : 0,
        newPrice : 0,
      },
      chosenPaymentOptions: [],
      allChats: {},
      notificationsOn: true,
      messages: [],
      messagesObject: {},
      thread: (this.props.navigation.state.params || {}).thread,
      domain: domain,
      refreshing: false,
      opacities: {},
      messagess: {},
      lastMessageId: "",
      hasSentMessage: false,
      read: false,
      text: "",
      otherChatterToken: "",
      priceInputted: "",
      noteInputted: "",
      confirmModal: false,
      delivered: false,
      date: new Date(),
      uploadImagesVisible: false,
      count: 20,
      // tempCount:0,
      imageUris: [],
      imageCount: 0,
      index: 0,
      showImageViewer: false,
      confirmModalViewer: false,
      chattingUser: (this.props.navigation.state.params || {}).chattingUser,
      otherChatterEmail: (this.props.navigation.state.params || {})
        .otherChatterEmail,
      otherChatterOnline: false,
      user: {
        _id: firebase.auth().currentUser.uid,
      },
      historyOrderKey: this.props.navigation.state.params.historyOrderKey || "",
      orderNumber: "",
    };
  }

  getOtherChatterProfileImage = async () => {
    const user = firebase.auth().currentUser;
    const start = user.email.indexOf("@");
    const end = user.email.indexOf(".com");
    const domain = user.email.substring(start, end);
    const email = user.email.substring(0, end);
    let otherChattersObject = await AsyncStorage.getItem(
      "otherChattersProfileImages"
    );
    otherChattersObject = JSON.parse(otherChattersObject);
    //1 console.log("before other ", otherChattersObject)
    if (!otherChattersObject) {
      otherChattersObject = {};
    }
    var otherChatterEmail = this.state.otherChatterEmail;
    firebase
      .database()
      .ref("users/" + domain + "/" + otherChatterEmail)
      .once("value", async (snapshot) => {
        // //1 console.log("otherChatterEmail", otherChatterEmail);
        //1 console.log("CODE RED",otherChattersObject)
        //1 console.log("otherChatterEmail ", otherChatterEmail)
        if (snapshot.val().profileImageUrl) {
          if (
            otherChattersObject[[otherChatterEmail]] == undefined ||
            !otherChattersObject[[otherChatterEmail]].uri ||
            otherChattersObject[[otherChatterEmail]].url !=
              snapshot.val().profileImageUrl
          ) {
            //1 console.log("trying to download")
            if (
              otherChattersObject[[otherChatterEmail]] &&
              !otherChattersObject[[otherChatterEmail]].uri
            ) {
              //1 console.log("delete")
              this.deleteUri(otherChattersObject[[otherChatterEmail]].uri);
            }
            try {
              const uri = await this.downloadUrl(
                snapshot.val().profileImageUrl,
                otherChatterEmail
              );
              const newProfileObject = {
                uri,
                url: snapshot.val().profileImageUrl,
              };
              otherChattersObject[[otherChatterEmail]] = newProfileObject;
              //1 console.log("WOOOHOOO",otherChattersObject[[otherChatterEmail]])
              //1 console.log("uri ", uri)
              this.setState({
                otherChatterProfileImage:
                  otherChattersObject[[otherChatterEmail]].uri,
              });
              AsyncStorage.setItem(
                "otherChattersProfileImages",
                JSON.stringify(otherChattersObject)
              );
            } catch (e) {
              //1 console.log("big error")
            }
          } else {
            //1 console.log("already defined")
            //1 console.log(otherChattersObject[[otherChatterEmail]])
            this.setState({
              otherChatterProfileImage:
                otherChattersObject[[otherChatterEmail]].uri,
            });
          }
        }
      });
  };

  worthPuttingCenterTimestamp = (currentTimestamp, text) => {
    if (this.earlierMessage == "") {
      this.earlierMessage = currentTimestamp;
      this.earlierMessagetext = text;
      return null;
    } else {
      const old = this.earlierMessage;
      this.earlierMessage = currentTimestamp;
      this.earlierMessagetext = text;
      if (this.earlierMessage - old >= 3600000) {
        return (
          <View style={{ alignItems: "center", marginVertical: 10 }}>
            <Text style={{ fontSize: 11, color: "gray" }}>
              {this.displayTime(currentTimestamp)}
            </Text>
          </View>
        );
      }
      return null;
    }
  };

  renderBubble = (props) => {
    const currentTimestamp = props.currentMessage.timestamp;
    const messageId = props.currentMessage._id;
    const userId = props.currentMessage.user._id;
    const centerTimestamp = this.state.messagess[[messageId]].centerTimestamp;
    return (
      <View style={{ flex: 1 }}>
        {centerTimestamp != null && centerTimestamp}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {userId == this.userId && (
            <View>
              <Text style={{ fontSize: 10, color: "gray", marginLeft: 5 }}>
                {this.displayActualTime(currentTimestamp)}
              </Text>
            </View>
          )}
          <View>
            <Bubble
              {...props}
              wrapperStyle={{
                right: {
                  paddingHorizontal: 3,
                  paddingVertical: 1,
                  // Here is the color change
                  backgroundColor: "#1273de",
                },
              }}
              textStyle={{
                right: {
                  color: "#fff",
                },
              }}
            />
          </View>
          {userId != this.userId && (
            <View>
              <Text style={{ fontSize: 10, color: "gray", marginRight: 5 }}>
                {this.displayActualTime(currentTimestamp)}
              </Text>
            </View>
          )}
        </View>
        <View style={{ alignItems: "flex-end", justifyContent: "center" }}>
          {this.state.lastMessageId == props.currentMessage._id &&
            this.renderDelivered()}
        </View>
      </View>
    );
  };

  scrollToBottomComponent = () => {
    return (
      <View style={styles.bottomComponentContainer}>
        <IconButton icon="chevron-double-down" size={36} color="#6646ee" />
      </View>
    );
  };

  renderLoading = () => {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6646ee" />
      </View>
    );
  };

  photoCallback = (params) => {
    this.setState({ uploadImagesVisible: false });
    if (params == null) {
      return;
    }

    params.then(async (images) => {
      // for(var i = 0; i < images.length;i++){
      // //1 console.log("in for loop")
      this.uriToBlob(images[0].uri).then((blob) => {
        //   //1 console.log("in uritoblob")
        const name = this.generateRandomString();
        //1 console.log("name ", name);
        this.uploadToFirebase(blob, name).then((snapshot) => {
          //1 console.log("in snapshot");

          snapshot.ref.getDownloadURL().then((url) => {
            var message = {
              text: "",
              image: url,
              read: this.state.otherChatterOnline,
              timestamp: this.timestamp(),
              user: { _id: firebase.auth().currentUser.uid },
            };

            //1 console.log("message", message);
            this.append(message);
          });
          //1 console.log("Hi there");
        });
      });
      // }
    });
  };

  // Promise.all(uriToBlobPromises).then(() => {
  // Promise.all(uploadToFirebasePromises).then(() => {
  //   params.then(async (images) =>{
  //     for(var i = 0; i < images.length;i++){
  //         //1 console.log("imageHappened")
  //         let name = this.generateRandomString();
  //         await firebase.storage().ref(`/chats/${this.state.domain}/${this.state.thread}/${name}.jpg`).getDownloadURL().then((foundURL) =>{
  //           let name = foundURL
  //           var message = {
  //             text:"",
  //             image:name,
  //             read : this.state.otherChatterOnline,
  //             timestamp: this.timestamp(),
  //             user:{_id:notification.data.data.uid}
  //           }

  //           //1 console.log("message", message)
  //           this.append(message);

  //         }).catch((error) => //1 console.log(error))
  //     }
  // })
  // params.then(async (images) =>{
  //   for(var i = 0; i < images.length;i++){
  //     this.uriToBlob(images[i].uri).then(async(blob) =>{
  //       //1 console.log("oh man")
  //       this.uploadToFirebase(blob )
  //      await firebase.storage().ref(`/chats/${this.state.domain}/${this.state.thread}/${this.state.name}.jpg`).getDownloadURL().then(onResolve, onReject);

  //       function onResolve(foundURL) {
  //           this.setState({ name: foundURL})
  //       }

  //       function onReject(error) {
  //           //1 console.log(error.code);
  //       }
  //       //1 console.log("here i am")
  //       var message = {
  //           text:"",
  //           image:name,
  //           read : this.state.otherChatterOnline,
  //           timestamp: this.timestamp(),
  //           user:{_id:notification.data.data.uid}

  //       }
  //       if(thisClass.state.profileImage){
  //           message.user.avatar = thisClass.state.profileImage
  //       }
  //       //1 console.log("message", message)
  //       this.append(message);
  //     })
  //   }
  // })
  //}

  uriToBlob = (text) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = function () {
        // return the blob
        resolve(xhr.response);
      };

      xhr.onerror = function () {
        // something went wrong
        reject(new Error("uriToBlob failed"));
      };
      // this helps us get a blob
      xhr.responseType = "blob";
      xhr.open("GET", text, true);

      xhr.send(null);
    });
  };

  generateRandomString = () => {
    return Math.random().toString().substr(2, 20);
  };

  uploadToFirebase = (blob, name) => {
    //1 console.log("in upload");
    const user = firebase.auth().currentUser;
    const start = user.email.indexOf("@");
    const end = user.email.indexOf(".com");
    const domain = user.email.substring(start, end);
    const email = user.email.substring(0, end);
    this.setState({ name });
    return firebase
      .storage()
      .ref(`/chats/${this.state.domain}/${this.state.thread}/${name}.jpg`)
      .put(blob, {
        contentType: "image/jpeg",
      });
  };

  renderComposer = (props) => {
    return (
      <>
        {this.state.historyOrderKey == "" && (
          <View
            style={{
              flexDirection: "row",
              borderBottomWidth: 0.5,
              borderTopWidth: 0.2,
            }}
          >
            <TouchableOpacity
              style={{ paddingHorizontal: 10, justifyContent: "flex-end" }}
              onPress={() => this.setState({ uploadImagesVisible: true })}
            >
              <UploadImages
                isVisible={this.state.uploadImagesVisible}
                photoCallb={this.photoCallback}
              />
              <Entypo name="camera" size={30} color="black" />
            </TouchableOpacity>
            <View
              style={{
                alignItems: "flex-end",
                flexDirection: "row",
                justifyContent: "center",
                width: windowWidth - 50,
              }}
            >
              <Composer {...props} />
              {props.text.length != 0 && (
                <TouchableOpacity
                  style={{ marginRight: 5, marginBottom: 10 }}
                  onPress={() => this.send(props.user, props.text)}
                >
                  <Text style={{ color: "#0A9CBF", fontSize: 20 }}>Send</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </>
    );
  };

  userId = () => {
    return firebase.auth().currentUser.uid;
  };

  ref = () => {
    return firebase
      .database()
      .ref("/chats/" + this.state.domain + "/" + this.state.thread + "/chat");
  };

  refCheckChatter = () => {
    //1 console.log("this.state.thread ", this.state.thread);
    return firebase
      .database()
      .ref("/chats/" + this.state.domain + "/" + this.state.thread + "/");
  };

  timestamp = () => {
    return firebase.database.ServerValue.TIMESTAMP;
  };

  displayActualTime = (timestamp) => {
    var messageDate = new Date(timestamp);
    var hour, minute, seconds;
    hour = messageDate.getHours();
    var afterNoon = hour > 11 ? "PM" : "AM";
    hour = hour == 0 || hour == 12 ? "12" : hour > 12 ? hour - 12 : hour;

    minute = "0" + messageDate.getMinutes();
    return hour + ":" + minute.substr(-2) + " " + afterNoon;
  };

  displayTime = (timestamp) => {
    // //1 console.log("-----------------Display Time----------")
    // //1 console.log("current",this.state.date)
    // //1 console.log("timestamp",timestamp)
    const dayOfTheWeek = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    var messageDate = new Date(timestamp);
    var currentDate = this.state.date;
    ////1 console.log("getHours ",messageDate.getHours())
    var hour, minute, seconds;
    hour = messageDate.getHours();

    var afterNoon = hour > 11 ? "PM" : "AM";
    hour = hour == 0 || hour == 12 ? "12" : hour > 12 ? hour - 12 : hour;

    minute = "0" + messageDate.getMinutes();
    const time = hour + ":" + minute.substr(-2) + " " + afterNoon;
    if (messageDate.getFullYear() == currentDate.getFullYear()) {
      if (messageDate.getMonth() == currentDate.getMonth()) {
        const difference = currentDate.getDate() - messageDate.getDate();
        if (difference < 7) {
          if (difference == 0) {
            return "Today " + time;
          } else if (difference == 1) {
            return "Yesterday " + time;
          } else {
            return dayOfTheWeek[messageDate.getDay()] + " " + time;
          }
        }
      }
    }

    const month = messageDate.getMonth() + 1;
    const day = messageDate.getDate();
    const year = ("" + messageDate.getFullYear()).substr(-2);
    return month + "/" + day + "/" + year + " " + time;
  };

  parse = (snapshot, loadEarlier) => {
    var {
      timestamp,
      text,
      user,
      image,
      confirmAnswer,
      confirmationId,
      noteInputted,
      priceInputted,
      paymentOptions,
      read,
      readTime,
    } = snapshot.val();
    const { key: _id } = snapshot;
    const centerTimestamp = this.worthPuttingCenterTimestamp(timestamp, text);

    var message = {
      _id,
      timestamp,
      text,
      user,
      image,
    };
    if (!loadEarlier && user._id == firebase.auth().currentUser.uid) {
      // //1 console.log("user._id ", user._id)
      // //1 console.log("firebase.auth",firebase.auth().currentUser.uid)
      // //1 console.log("readTime",readTime)
      // //1 console.log("read", read)
      const readTimeStamp = readTime ? readTime : new Date().getTime();
      //1 console.log("readTimeStamp ", readTimeStamp);
      this.setState({
        read,
        lastMessageId: _id,
        readTime: read ? this.displayTime(readTimeStamp) : "User Invalid",
        delivered: true,
        deliveredTime: this.displayTime(message.timestamp),
      });
    }
    if (text == "" && image == undefined ) {
      this.setState((previousState) => {
        let opacities = previousState.opacities;
        opacities[[_id]] = {
          animatedValue: new Animated.Value(confirmAnswer == undefined ? 1 : 0),
          confirmedOpacity: new Animated.Value(confirmAnswer == undefined ? 0 : 1),
        };

        return { opacities };
      });
    }
    this.setState((previousState) => {
      let messagess = previousState.messagess;
      if (!messagess[[_id]]) {
        messagess[[_id]] = {
          confirmAnswer,
          confirmationId,
          centerTimestamp,
          noteInputted,
          priceInputted,
          paymentOptions,
        };
      } else {
        messagess[[_id]].confirmAnswer = confirmAnswer;
      }
      return { messagess };
    });

    // if (image != "") {
    //   const imageUris = this.state.imageUris;
    //   const imageCount = (this.state.imageCount += 1);
    //   imageUris.push({ url: image });
    //   this.setState({ imageUris, imageCount });
    // }

    // //1 console.log("opacities1",this.state.messagess)
    return message;
  };

  historyFinder = () => {
    var count = 0;
    this.ref().once("value", (snapshot) => {
      this.historyObject.historyMessages = snapshot.val()
        ? Object.keys(snapshot.val())
        : [];
      this.snapshot = snapshot;
      for (; count < this.historyObject.historyMessages.length; count++) {
        if (
          this.historyObject.historyMessages[count] ==
          this.state.historyOrderKey
        ) {
          this.historyObject.endIndex = count;
          break;
        }
      }
      this.historyObject.startIndex =
        count < 20
          ? this.historyObject.endIndex - count
          : this.historyObject.endIndex - 20;
      //1 console.log(this.historyObject.startIndex);
      //1 console.log("endIndex ", this.historyObject.endIndex);
      for (
        var i = this.historyObject.startIndex;
        i <= this.historyObject.endIndex;
        i++
      ) {
        this.historyObject.historyMessages[i] = this.parse(
          snapshot.child(this.historyObject.historyMessages[i])
        );
      }
      this.setState((previousState) => ({
        messages: this.historyObject.historyMessages
          .slice(this.historyObject.startIndex, this.historyObject.endIndex + 1)
          .reverse(),
      }));
    });
  };

  on = (callback) => {
    this.ref()
      .limitToLast(this.state.count)
      .on("child_added", (snapshot) => {
        // const impact = Object.keys(snapshot.val())
        // for(var i = 0; i < impact.length; i++){
        callback(this.parse(snapshot, false));
        // }
      });
  };

  onCheckOtherChatter = (callback) => {
    this.refCheckChatter()
      .child(this.state.otherChatterEmail)
      .on("value", (snapshot) => {
        //1 console.log("NOT IN RHYTHM ", snapshot.val());
        this.setState({
          otherChatterOnline:
            snapshot.val() && snapshot.val()[[this.state.otherChatterEmail]]
              ? true
              : false,
        });
        if (snapshot.val() && snapshot.val()[[this.state.otherChatterEmail]]) {
          callback(snapshot.val());
        }
      });
  };
  // send the message to the Backend
  send = (user, text,confirmationId) => {
    // for (let i = 0; i < messages.length; i++) {
    //   const { text, user } = messages[i];
    //   const message = {
    //     text,
    //     user,
    //     timestamp: this.timestamp(),
    //   };
    //   //1 console.log("message in send")
    //   //1 console.log(message)
    //   this.append(message);
    // }
    const message = {
      text: text,
      user: user,
      read: this.state.otherChatterOnline,
      timestamp: this.timestamp(),
    };

    if (text == ""){
      if(confirmationId == undefined) {
        message.priceInputted = this.state.priceInputted;
        message.paymentOptions = this.state.chosenPaymentOptions;
        message.noteInputted = this.state.noteInputted;
      }else{
        message.confirmationId = confirmationId
      }
    }

    this.setState({ text: "" });

    this.append(message);
  };

  _payment = (payment, value) => {
    //1 console.log("oooooooooo");
    Animated.timing(payment, {
      toValue: value,
      duration: 50,
    }).start();
  };

  sendSingleNotification = async (text) => {
    //1 console.log("sendSingle")
    const message = {
      to: this.state.otherChatterToken,
      sound: "default",
      title: this.state.chattingUser,
      body: text,
      data: {
        data: {
          thread: this.state.thread,
          name: this.state.chattingUser,
          otherChatterEmail: this.state.otherChatterEmail,
        },
      },
      _displayInForeground: true,
    };
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });
  };

  whatIsMessage(image, text) {
    if (text == undefined || text == "") {
      if (image == undefined || image == "") {
        return "Order Confirmation";
      } else {
        return "Image";
      }
    }
    return text;
  }

  append = (message) => {
    const user = firebase.auth().currentUser;
    const end = user.email.indexOf(".com");
    const email = user.email.substring(0, end);
    const hasSentMessage = email + "_hasSentMessage";
    const isBuyer =
      this.state.thread.substring(0, email.length) == email ? true : false;

    this.setState({ delivered: false, read: false, hasSentMessage: true });
    this.refCheckChatter()
      .child(email)
      .update({ [hasSentMessage]: true });
    this.ref()
      .push(message)
      .then(() => {
        this.setState({
          delivered: true,
          deliveredTime: this.displayTime(new Date().getTime()),
        });
        if (this.state.notificationsOn && this.state.otherChatterToken != "") {
          this.sendSingleNotification(
            this.whatIsMessage(message.image, message.text)
          );
        }
        firebase
          .database()
          .ref(
            "users/" +
              this.state.domain +
              "/" +
              email +
              "/chats/" +
              (isBuyer ? "buyer" : "seller") +
              "/" +
              this.state.thread
          )
          .update({
            text: this.whatIsMessage(message.image, message.text),
            timestamp: message.timestamp,
            read: true,
          });
        firebase
          .database()
          .ref(
            "users/" +
              this.state.domain +
              "/" +
              this.state.otherChatterEmail +
              "/chats/" +
              (!isBuyer ? "buyer" : "seller") +
              "/" +
              this.state.thread
          )
          .update({
            text: this.whatIsMessage(message.image, message.text),
            timestamp: message.timestamp,
            read: this.state.otherChatterOnline,
          });
        setTimeout(() => {
          this.setState({ read: this.state.otherChatterOnline });
        }, 500);
      });
  };

  async componentDidMount() {
    const user = firebase.auth().currentUser;
    const end = user.email.indexOf(".com");
    const email = user.email.substring(0, end);
    const isBuyer =
      this.state.thread.substring(0, email.length) == email
        ? "buyer"
        : "seller";
    let allChats = await AsyncStorage.getItem("allChats");
    allChats = JSON.parse(allChats);
    if (!allChats) {
      allChats = { [[isBuyer]]: { [[this.state.thread]]: {} } };
    } else if (!allChats[[isBuyer]]) {
      let newObject = { [[isBuyer]]: { [[this.state.thread]]: {} } };
      allChats = { ...allChats, ...newObject };
    } else if (!allChats[[isBuyer]][[this.state.thread]]) {
      allChats[[isBuyer]] = { [[this.state.thread]]: {} };
    }
    //1 console.log("allChats ",allChats)
    await this.setState({ allChats, isBuyer });
    this.getOtherChatterProfileImage();
    // firebase.storage().ref("/chats/@gmail/fakedafi2@gmailfakedafi@gmail/0405095287031324.jpg").getDownloadURL().then(() => {
    //   this.setState({profileImage : foundURL})
    //   //1 console.log("found profile image")
    // }).catch((error) => {//1 console.log("no profileeeeeeee image")})

    // //firebase.storage().ref("profilePics/@gmail/fakedafi@gmail/profilePic.jpg").once("value",(snapshot) => {//1 console.log("snapshot",snapshot)})
    // await firebase.storage().ref(path).getDownloadURL().then(() => {
    //   this.setState({profileImage : foundURL})
    //   //1 console.log("found profile image")
    // }).catch((error) => {//1 console.log("no profile image")})

    if (this.state.historyOrderKey != "") {
      this.historyFinder();
    } else {
      this.refCheckChatter()
        .child(email + "/" + email + "_hasSentMessage")
        .once("value", (snapshot) => {
          this.setState({ hasSentMessage: snapshot.val() });
        });
      this.refCheckChatter()
        .child("orderNumber")
        .once("value", (snapshot) => {
          this.setState({ orderNumber: snapshot.val() });
        });

      this.refCheckChatter()
        .child(email)
        .update({ [email]: true });

      firebase
        .database()
        .ref(
          "users/" +
            this.state.domain +
            "/" +
            email +
            "/chats/" +
            isBuyer +
            "/" +
            this.state.thread
        )
        .update({
          read: true,
        });

      firebase
        .database()
        .ref("users/" + this.state.domain + "/" + this.state.otherChatterEmail)
        .once("value", (snapshot) => {
          this.setState({
            otherChatterToken: snapshot.val().expoToken,
            notificationsOn:
              snapshot.val()["notifications"].notifications &&
              snapshot.val()["notifications"].newMessages,
          });
        });

      this.on(async (message) => {
        const allChats = this.state.allChats;
        await this.getUpdatedImage(message, true);
        const messagesObject = this.state.messagesObject;
        messagesObject[[message._id]] = message;
        // //1 console.log("tempCount ",this.state.tempCount)
        // if(this.state.tempCount - this.state.count == -1){
        //   const currentArray = Object.values(this.state.messagesObject).sort(function(a, b) {
        //     return b["timestamp"] - a["timestamp"];
        //   });
        //   this.setState((previousState) => ({
        //   messages : currentArray,
        //   tempCount: 0,
        //   }));
        // }else{
        //   this.setState({tempCount : this.state.tempCount + 1 })
        // }
        const currentArray = Object.values(this.state.messagesObject).sort(
          function (a, b) {
            return b["timestamp"] - a["timestamp"];
          }
        );
        this.setState({ messages: currentArray, messagesObject });

        // this.setState((previousState) => ({
        //   messages : GiftedChat.append(previousState.messages,message)
        // }));
      });

      this.onCheckOtherChatter((otherChatterOnline) => {
        this.setState({
          read: otherChatterOnline[[this.state.otherChatterEmail]],
        });
        if (otherChatterOnline && !this.state.read) {
          //1 console.log("NOOOO");
          this.ref()
            .child(key)
            .update({
              read: otherChatterOnline[[this.state.otherChatterEmail]],
              readTime: timestamp,
            });
        }
      });
    }
  }
  downloadUrl = async (url, messageId) => {
    // return new Promise(async() => {
    const callback = (downloadProgress) => {
      const progress =
        downloadProgress.totalBytesWritten /
        downloadProgress.totalBytesExpectedToWrite;
      // this.setState({
      //   downloadProgress: progress,
      // });
    };

    //1 console.log("url ", url)
    await FileSystem.makeDirectoryAsync(
      FileSystem.documentDirectory + this.state.thread + "/",
      { intermediates: true }
    );
    // const downloadResumable = FileSystem.createDownloadResumable(
    //     url,
    //     FileSystem.documentDirectory  + name + ".png",
    //     {},
    //     callback
    //   )

    try {
      const { uri } = await FileSystem.downloadAsync(
        url,
        FileSystem.documentDirectory +
          this.state.thread +
          "/" +
          messageId +
          ".png",
        {},
        callback
      );
      //1 console.log('Finished downloading to ', uri);
      return uri;
    } catch (e) {
      console.error(e);
    }
    // })

    // try {
    //   await downloadResumable.pauseAsync();
    //   //1 console.log('Paused download operation, saving for future retrieval');
    //   AsyncStorage.setItem('pausedDownload', JSON.stringify(downloadResumable.savable()));
    // } catch (e) {
    //   console.error(e);
    // }

    // try {
    //   const { uri } = await downloadResumable.resumeAsync();
    //   //1 console.log('Finished downloading to ', uri);
    //   this.setState({imageUrl :uri})
    // } catch (e) {
    //   console.error(e);
    // }

    //To resume a download across app restarts, assuming the the DownloadResumable.savable() object was stored:
    // const downloadSnapshotJson = await AsyncStorage.getItem('pausedDownload');
    // const downloadSnapshot = JSON.parse(downloadSnapshotJson);
    // const downloadResumable = new FileSystem.DownloadResumable(
    //   downloadSnapshot.url,
    //   downloadSnapshot.fileUri,
    //   downloadSnapshot.options,
    //   callback,
    //   downloadSnapshot.resumeData
    // );

    // try {
    //   const { uri } = await downloadResumable.resumeAsync();
    //   //1 console.log('Finished downloading to ', uri);
    // } catch (e) {
    //   console.error(e);
    // }
  };

  componentWillUnmount() {
    const user = firebase.auth().currentUser;
    const end = user.email.indexOf(".com");
    const email = user.email.substring(0, end);
    this.ref().off();
    this.refCheckChatter().child(this.state.otherChatterEmail).off();
    this.refCheckChatter()
      .child(email)
      .update({ [email]: false });
  }

  updatedMessageConfirmAnswer = (_id, answer) => {
    this.ref().child(_id).update({ confirmAnswer: answer });

  };

  _start = async (_id, answer) => {
          this.setState((previousState) => {
        let messagess = previousState.messagess;
        messagess[[_id]].confirmAnswer = answer
        return { messagess };
      });
    await Animated.parallel([
      Animated.timing(this.state.opacities[[_id]].animatedValue, {
        toValue: 0,
        duration: 500,
      }),
      Animated.timing(this.state.opacities[_id].confirmedOpacity, {
        toValue: 1,
        duration: 500,
      }),
    ]).start();
    setTimeout(() => {
      this.updatedMessageConfirmAnswer(_id, answer);
      this.send(answer ? {_id} : this.state.user,"",answer ? _id : "")
      this.addToHistory(_id);
    }, 750);
  };

  addToHistory = (_id) => {
    const user = firebase.auth().currentUser;
    const start = user.email.indexOf("@");
    const end = user.email.indexOf(".com");
    const domain = user.email.substring(start, end);
    const email = user.email.substring(0, end);
    const isBuyer =
      this.state.thread.substring(0, email.length) == email ? true : false;
    const orderNumber = (this.state.orderNumber != "" && this.state.orderNumber != null && this.state.orderNumber != undefined) ? this.generateRandomString() : this.generateRandomString()
    // firebase
    //   .database()
    //   .ref("orders/" + domain + "/currentOrders/" + this.state.orderNumber)
    //   .once("value", (snapshot) => {
        //1 console.log('sna' ,snapshot.val())
        console.log("this.state.messagess[[_id]].priceInputted ", this.state.messagess[[_id]].priceInputted)
        const order = {
          price: this.state.messagess[[_id]].priceInputted,
          timestamp: new Date().getTime(),
          chatId: this.state.thread,
          historyOrderKey: _id,
        };
        console.log("order ",order)
        console.log("orderNumber ",orderNumber)
        firebase
          .database()
          .ref(
            "users/" +
              domain +
              "/" +
              email +
              "/historyOrders/" +
              (isBuyer ? "buyer" : "seller")
          )
          .update({
            [[orderNumber]]: order,
          });
        firebase
          .database()
          .ref(
            "users/" +
              domain +
              "/" +
              this.state.otherChatterEmail +
              "/historyOrders/" +
              (isBuyer ? "seller" : "buyer")
          )
          .update({
            [[orderNumber]]: order,
          });
      // });
  };

  initialBuyerConfirmMessage = (_id, confirmAnswer) => {
    return (
      <View style={{ width: (windowWidth * 2) / 3, height: 150 }}>
        <View style={{ alignItems: "center" }}>
          <Text style={{ fontSize: 17, fontWeight: "bold" }}>
            Confirm Order
          </Text>
        </View>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginLeft: 5,
          }}
        >
          <Animated.View
            style={{
              position: "absolute",
              justifyContent: "center",
              alignItems: "center",
              width: (windowWidth * 2) / 3,
              // translateX: -(windowWidth - 315) / 2,
              opacity: this.state.opacities[[_id]].confirmedOpacity,
            }}
          >
            <View
              style={[
                styles.confirmButton,
                { backgroundColor: confirmAnswer ? "green" : "red" },
              ]}
            >
              <Text>{confirmAnswer ? "You Accepted!" : "You Rejected"}</Text>
            </View>
          </Animated.View>
          <Animated.View
            style={{
              transform: [
                {
                  translateX: this.state.opacities[
                    [_id]
                  ].animatedValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [((windowWidth * 2) / 3 - 100) / 2, 0],
                  }),
                },
              ],
              opacity: this.state.opacities[[_id]].animatedValue,
            }}
          >
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={async () => {
                this._start(_id, false);
              }}
            >
              <Text>NO</Text>
            </TouchableOpacity>
          </Animated.View>
          <View
            style={{
              justifyContent: "flex-end",
              position: "absolute",
              left: ((windowWidth * 2 / 3) / 2) - 27,
              bottom: 10,
            }}
          >
            {/* {console.log(this.state.messagess[[_id]])} */}
            <Text style={{ fontSize: (this.state.messagess[[_id]].priceInputted || "").toString().length == 5 ? 17 : 19, color: "#FFDB0C" }}>
              ${this.state.messagess[[_id]].priceInputted}
            </Text>
          </View>
          <Animated.View
            style={{
              transform: [
                {
                  translateX: this.state.opacities[
                    [_id]
                  ].animatedValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-(((windowWidth * 2) / 3 - 100) / 2), 0],
                  }),
                },
              ],
              opacity: this.state.opacities[[_id]].animatedValue,
            }}
          >
            <TouchableOpacity
              style={[styles.confirmButton, { backgroundColor: "green" }]}
              onPress={() => {
                this._start(_id, true);
              }}
            >
              <Text>YES</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
        <View style={{ alignItems: "center" }}>
          <Text style={{ fontSize: 13, fontWeight: "bold" }}>
            By Accepting, You Will See How to Pay
          </Text>
        </View>
      </View>
    );
  };

  initialSellerConfirmMessage = () => {
    return (
      <View style={{ width: (windowWidth * 2) / 3, height: 110 }}>
        <View style={{ alignItems: "center" }}>
          <Text style={{ fontSize: 17, fontWeight: "bold" }}>
            Confirm Order
          </Text>
          <Text style={{ fontSize: 15, fontWeight: "bold" }}>
            Sent Order Confirmation
          </Text>
          <Text style={{marginTop:5}}>
            Will Receive Confirmation Text. Buyer Accepting makes Payment Options visible
          </Text>
        </View>
      </View>
    );
  };

  selectedSellerConfirmMessage = (confirmationId) => {
    return(
            <View
        style={{
          justifyContent:"center",
          alignItems:"center",
          width: (windowWidth * 2) / 3,
          height:180}}
      >
        <View style={{ alignItems: "center",marginTop:1 }}>
          <Text style={{ fontSize: 17, fontWeight: "bold" }}>
            Confirm Order
            
          </Text>
        </View>
                <Animated.View
            style={{
              justifyContent: "center",
              alignItems: "center",
              width: (windowWidth * 2) / 3,
            }}
          >
            <View
              style={[
                styles.confirmButton,
                { backgroundColor: confirmationId != "" ? "green" : "red"},
              ]}
            >
              <Text style={{fontWeight:"900",fontSize:17,textAlign:"center"}}>{confirmationId != "" ? "Buyer Accepted!" : "Buyer Rejected"}</Text>
            </View>
          </Animated.View>
                  <View style={{ alignItems: "center" }}>
          <Text style={{ fontSize: 12, fontWeight: "bold",marginHorizontal:2 }}>
            {confirmationId == "" ? "Buyer Rejected. Speak with Buyer Again." :
            "Buyer Accepted. Proof of Payment will be sent soon. Once recieved, make the purchase and send proof of purchase(screenshot)."}
          </Text>
        </View>
          </View>
    )
  }

  selectedBuyerConfirmMessage = (_id) => {
    // console.log("this.state.messagess[[_id]] ", this.state.messagess[[_id]]);
    if(_id == ""){
      return          (   <View
        style={{
          justifyContent:"center",
          alignItems:"center",
          width: (windowWidth * 2) / 3,
          height:75}}
      >
        <View style={{ alignItems: "center",marginTop:1 }}>
          <Text style={{ fontSize: 17, fontWeight: "bold" }}>
            Confirm Order
          </Text>
        </View>
                {/* <Animated.View
            style={{
              justifyContent: "center",
              alignItems: "center",
              width: (windowWidth * 2) / 3,
            }}
          >
            <View
              style={[
                styles.confirmButton,
                { backgroundColor: confirmationId != "" ? "green" : "red"},
              ]}
            >
              <Text style={{fontWeight:"900",fontSize:17,textAlign:"center"}}>{confirmationId != "" ? "Buyer Accepted!" : "Buyer Rejected"}</Text>
            </View>
          </Animated.View> */}
                  <View style={{ alignItems: "center" }}>
          <Text style={{ fontSize: 12, fontWeight: "bold",marginHorizontal:2 }}>
            System Message: Clarify to Seller what the issue was
          </Text>
        </View>
          </View>)
    }
    return (
      <View
        style={{
          width: (windowWidth * 2) / 3,
          height:
            180 +
            (this.state.messagess[[_id]].paymentOptions
              ? this.state.messagess[[_id]].paymentOptions.length * 30
              : 0) +
            (this.state.messagess[[_id]].noteInputted ? 100 : 0),
        }}
      >
        <View style={{ alignItems: "center" }}>
          <Text style={{ fontSize: 17, fontWeight: "bold" }}>
            Confirm Order
          </Text>
        </View>
        {this.state.messagess[[_id]].priceInputted && (
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginHorizontal: 10,
              marginTop: 10,
            }}
          >
            <View style={{ flexDirection: "col", alignItems: "center" }}>
              <Text style={{ fontSize: 24 }}>Price You Pay:</Text>
              <View style={{flexDirection:"row"}}>
                                                  <TouchableOpacity
                        onPress={() =>{
                          const possibleProfit = {actualPrice: this.state.messagess[[_id]].priceInputted/0.8,newPrice:this.state.messagess[[_id]].priceInputted }
                          this.setState({ possibleProfitVisible: true,possibleProfit })
                        }}
                                                  style={{flexDirection:"row",alignItems:"center"}}
                      >
              <Text style={{ fontSize: 13 }}>
                You Saved{" "}
                <Text style={{ color: "#0DCC0D", fontWeight: "800" }}>{ "$" + ((this.state.messagess[[_id]].priceInputted / 0.8) - this.state.messagess[[_id]].priceInputted).toFixed(2)}</Text>
              </Text>

                                        <Entypo
                            name="info-with-circle"
                            size={12}
                            color="black"
                          />
                          </TouchableOpacity>
                          </View>
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <LottieView
                style={{
                  position: "absolute",
                  width:
                    75 +(this.state.messagess[[_id]].priceInputted.length == 5 ? 50 :
                    (this.state.messagess[[_id]].priceInputted.length - 1) * 20
                    ),
                  height:
                    75 +(this.state.messagess[[_id]].priceInputted.length == 5 ? 50 :
                    (this.state.messagess[[_id]].priceInputted.length - 1) * 20
                    ),
                }}
                source={require("../assets/yellowCircle.json")}
                autoPlay
              />
              <Text style={{ fontSize: 10 }}>$</Text>
              <Text style={{ fontSize: (this.state.messagess[[_id]].priceInputted || "").toString().length == 5 ? 27 : 35 }}>
                {this.state.messagess[[_id]].priceInputted}
              </Text>
            </View>
          </View>
        )}
        <View
          style={{
            flexDirection: "col",
            marginHorizontal: 10,
          }}
        >
          {this.state.messagess[[_id]].paymentOptions && (
            <View style={{ marginTop: 5 }}>
              <Text style={{ fontSize: 24 }}>Pay Options:</Text>
              {this.state.messagess[[_id]].paymentOptions.map((x, i) => (
                <AwesomeButton
                  // style={{
                  //   position: "absolute",
                  //   left: windowWidth / 2 - 90,
                  //   top: windowHeight / 2 - 180,
                  // }}
                  onPress={() => Clipboard.setString(x)}
                  width={(windowWidth * 2) / 3 - 20}
                  height={30}
                  ripple={true}
                  borderColor="black"
                  borderWidth={1}
                  raiseLevel={4}
                  borderRadius={180}
                  backgroundColor="#FFDA00"
                  backgroundShadow="#B79D07"
                  backgroundDarker="#B79D07"
                  textSize={30}
                  textColor="black"

                >
                  <View
                    style={{
                      width: (windowWidth * 2) / 3 - 30,
                      marginHorizontal:5,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <View style={{width:(windowWidth * 2) / 3 - 75    ,               flexDirection:"row",alignItems: "center"}}>
                      <MaterialCommunityIcons
                        name="venmo"
                        size={25}
                        color="black"
                      />
                      <Text
                        style={{
                          fontSize: 20,
                        }}
                        adjustsFontSizeToFit={true}
                        numberOfLines={1}

                      >
                        {x}
                      </Text>
                    </View>
                    <View>
                      <Text style={{textDecorationLine:"underline",fontSize:15}}>Copy</Text>
                    </View>
                  </View>
                </AwesomeButton>
              ))}
            </View>
          )}
        </View>
        <View
          style={{
            marginHorizontal: 10,
          }}
        >
          <Text style={{ fontSize: 24 }}>
            {(this.state.messagess[[_id]].noteInputted != undefined && this.state.messagess[[_id]].noteInputted != "")
              ? "Seller's Notes:"
              : "No Notes From Seller"}
          </Text>
          {console.log(this.state.messagess[[_id]].noteInputted)}
          {this.state.messagess[[_id]].noteInputted != undefined &&
            this.state.messagess[[_id]].noteInputted != "" && (
              <View
                style={{
                  width: (windowWidth * 2) / 3 - 20,
                  height: 105,
                  padding:2,
                  borderColor: "black",
                  borderWidth: 3,
                  borderRadius: 10,
                  backgroundColor: "rgba(240,244,240,1)",
                }}
              >
                <Text style={{ fontSize: 20, color: "rgba(150,150,150,1)" }}>
                  {this.state.messagess[[_id]].noteInputted}
                </Text>
              </View>
            )}
        </View>
                <View style={{ alignItems: "center" }}>
          <Text style={{ fontSize: 13, fontWeight: "bold" }}>
            Send Screenshot of Proof of Payment in Chat to complete order.
          </Text>
        </View>
      </View>
    );
  };

  renderTime = (timestamp) => {
    return <Text>{this.displayTime(timestamp)}</Text>;
  };

  renderConfirm = (props) => {
    const message = props.currentMessage;
    const confirmAnswer = this.state.messagess[[message._id]].confirmAnswer;
    const confirmationId = this.state.messagess[[message._id]].confirmationId
    if (message.text == "" && message.image == undefined) {
      if (confirmationId == undefined) {
        if(message.user._id == this.state.user._id){
          return this.initialSellerConfirmMessage(
            message._id,
            confirmAnswer
          )
        }else{
        return this.initialBuyerConfirmMessage(
          message._id,
          confirmAnswer
        );
        }
      } 

      if(message.user._id == this.state.user._id){
        return this.selectedBuyerConfirmMessage(confirmationId)
      }
        return this.selectedSellerConfirmMessage(confirmationId);
    }
  };

  renderNavigation = () => {
    const user = firebase.auth().currentUser;
    const end = user.email.indexOf(".com");
    const email = user.email.substring(0, end);
    const isBuyer =
      this.state.thread.substring(0, email.length) == email ? true : false;
    return (
      <View
        style={{
          height: 50,
          backgroundColor: "white",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginHorizontal: 10,
        }}
      >
        <TouchableOpacity onPress={() => this.props.navigation.goBack(null)}>
          <AntDesign name="arrowleft" size={30} color="black" />
        </TouchableOpacity>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Image
            source={{ uri: this.state.otherChatterProfileImage }}
            style={{
              width: 50,
              height: 50,
              borderRadius: 50,
              borderWidth: 2,
              borderColor: "#E2E2E2",
            }}
          />
          <Text style={{ fontSize: 20 }} numberOfLines={1}>
            {" "}
            {this.state.chattingUser}
          </Text>
        </View>
        <View style={{alignItems:"center",flexDirection:"row"}}>
                  <TouchableOpacity
            onPress={() => {
            }}
            style={{flexDirection:"col",alignItems:"center"}}
          >
                      <MaterialIcons name="error" size={27} color="black" />
              <Text style={{fontSize:13}}>Report</Text>
              </TouchableOpacity>
        {(this.state.historyOrderKey == undefined || !isBuyer) ? (
          <TouchableOpacity
            onPress={() => {
              this.setState({ confirmModalViewer: true });
            }}
            style={{flexDirection:"row",alignItems:"center"}}
          >
            <Text style={{fontSize:25,fontWeight:"700"}}>/</Text>
            <View style={{alignItems:"center"}}>
            <Text>Confirm</Text>
            <Text>Order</Text>
            </View>
          </TouchableOpacity>
        ) :null}
        </View>
      </View>
    );
  };

  renderDelivered = () => {
    if (this.state.read && this.state.hasSentMessage) {
      return (
        <View style={{ alignItems: "flex-end", marginRight: 5 }}>
          <Text style={{ fontSize: 10, color: "gray" }}>
            <Text style={{ fontWeight: "bold" }}>Read</Text>{" "}
            {this.state.readTime}
          </Text>
        </View>
      );
    } else if (this.state.delivered && this.state.hasSentMessage) {
      return (
        <View style={{ alignItems: "flex-end", marginRight: 5 }}>
          <Text style={{ fontSize: 10, color: "gray" }}>
            <Text style={{ fontWeight: "bold" }}>Delivered</Text>{" "}
            {this.state.deliveredTime}
          </Text>
        </View>
      );
    } else {
      return null;
    }
  };

  onLoadingEarlier = async () => {
    // //1 console.log("oldMessages",this.state.messages)
    //1 console.log("------------------------------------");
    var originalCount = 1;
    await this.setState((previousState) => ({
      count: previousState.count + 20,
    }));
    var possible = true;
    var atLeastOneNewText = false;
    var messagesObject = this.state.messagesObject;
    const n = this.state.messages.length;
    const promises = [];
    const lastMessage = this.state.messages.slice(n - 1, n)[0];
    await this.ref()
      .limitToLast(this.state.count)
      .once("value", (snapshot) => {
        const array = [];
        snapshot.forEach((premessage) => {
          // //1 console.log("premessage ",premessage)
          if (originalCount <= 20 && possible) {
            const message = this.parse(premessage, true);

            if (lastMessage && message._id != lastMessage._id) {
              if (this.state.messagess[[message._id]] != undefined) {
                atLeastOneNewText = true;
                array.push(message);
                // promises.push(this.getUpdatedImage(message))
                // //1 console.log("called message")
              }
            } else {
              possible = false;
            }
            originalCount += 1;
          }
        });
        //1 console.log('array')
        for (var i = 0; i < array.length; i++) {
          const message = array[i];
          atLeastOneNewText = true;
          messagesObject[[message._id]] = message;
          promises.push(this.getUpdatedImage(message, false));
          //1 console.log("called message")
        }
      });

    await Promise.all(promises);
    //1 console.log("Done")
    messagesObject = Object.values(messagesObject);
    //1 console.log("messagesObject ", messagesObject)
    if (atLeastOneNewText) {
      messagesObject = messagesObject.sort(function (a, b) {
        return b["timestamp"] - a["timestamp"];
      });
      this.setState((previousState) => ({
        messages: messagesObject,
      }));
      // });
      // this.setState({
      //   messages:newMessages.reverse()
      // })
      // //1 console.log("MESSAGES ", this.state.messages);
    }
  };

  getUpdatedImage = async (message, isANewImage) => {
    if (message.image != undefined) {
      const allChats = this.state.allChats;
      //1 console.log("there is image ", message.image)
      var doesExist = true;
      if (
        !allChats[[this.state.isBuyer]][[this.state.thread]][[message._id]] ||
        !allChats[[this.state.isBuyer]][[this.state.thread]][[message._id]].uri
      ) {
        const uri = await this.downloadUrl(message.image, message._id);
        doesExist = false;
        allChats[[this.state.isBuyer]][[this.state.thread]][[message._id]] = {
          uri,
        };
        //1 console.log("had to download")
      }
      // //1 console.log("thisMessage ",allChats[[this.state.isBuyer]][[this.state.thread]][[message._id]])
      message.image =
        allChats[[this.state.isBuyer]][[this.state.thread]][[message._id]].uri;
      console.log("message image ", message.image);
      const promises = [];
      if (!doesExist) {
        promises.push(this.setState({ allChats }));
        promises.push(
          AsyncStorage.setItem("allChats", JSON.stringify(allChats))
        );
        await Promise.all(promises);
      }
      const imageUris = this.state.imageUris;
      const messagess = this.state.messagess;

      if (!messagess[[message._id]]) {
        messagess[[message._id]] = {
          centerTimestamp: this.worthPuttingCenterTimestamp(
            message.timestamp,
            message.text
          ),
          confirmAnswer: "",
        };
      }

      messagess[[message._id]].index = this.state.imageCount;

      const imageCount = (this.state.imageCount += 1);
      const uri =
        allChats[[this.state.isBuyer]][[this.state.thread]][[message._id]].uri;
      //1 console.log("uri ", uri)
      if (isANewImage) {
        imageUris.unshift({ url: uri });
        const keys = Object.keys(messagess);
        for (var i = 0; i < keys.length; i++) {
          messagess[[keys[i]]].index = messagess[[keys[i]]].index + 1;
        }
        messagess[[message._id]].index = 0;
      } else {
        imageUris.push({ url: uri });
      }
      await this.setState({ imageUris, imageCount, messagess });
    }
    //1 console.log("done with single message")
    return true;
  };

  /*
onLoadingEarlier = async () => {
    // //1 console.log("oldMessages",this.state.messages)
    //1 console.log("------------------------------------");
    var originalCount = 1;
    await this.setState((previousState) => ({
      count: previousState.count + 20,
    }));
    var possible = true;
    const n = this.state.messages.length;
    const messagesObject = this.state.messagesObject
    const lastMessage = this.state.messages.slice(n - 1, n)[0];
    await this.ref()
      .limitToLast(this.state.count)
      .once("value", (snapshot) => {

        snapshot.forEach(async (premessage) => {
          //1 console.log("premessage ", premessage)
          if (originalCount <= 20 && possible) {
            const message = this.parse(premessage, true);
            //1 console.log("actually ", message)
            if (lastMessage && message._id != lastMessage._id) {

              if (this.state.messagess[[message._id]] != undefined) {
                const allChats = this.state.allChats
                // if (message.image != undefined) {
                //   //1 console.log("there is image ", message.image)
                //   if(!allChats[[this.state.isBuyer]][[this.state.thread]][[message._id]] || !allChats[[this.state.isBuyer]][[this.state.thread]][[message._id]].uri){
                //     const uri = await this.downloadUrl(message.image,message._id)
                //     //1 console.log("uri ",uri)
                //     var doesExist = true
                //     if(!allChats[[this.state.isBuyer]][[this.state.thread]][[message._id]]){
                //       //1 console.log("doesn't exist message ")
                //       doesExist = false
                //       allChats[[this.state.isBuyer]][[this.state.thread]][[message._id]] = {uri}
                //     }else{
                //       allChats[[this.state.isBuyer]][[this.state.thread]][[message._id]].uri = uri
                //     }
                //     //1 console.log("thisMessage ",allChats[[this.state.isBuyer]][[this.state.thread]][[message._id]])
                //     message.image = allChats[[this.state.isBuyer]][[this.state.thread]][[message._id]].uri
                //     const promises = []
                //     if(!doesExist){
                //       promises.push(
                //         this.setState({allChats})
                //       )
                //       promises.push(
                //         AsyncStorage.setItem('allChats',JSON.stringify(allChats))
                //       )
                //       await Promise.all(promises)
                //     }
                //   }
                //   const imageUris = this.state.imageUris;
                //   const messagess = this.state.messagess
                //   messagess[[message._id]].index = this.state.imageCount
                //   const imageCount = (this.state.imageCount += 1);
                //   const uri = allChats[[this.state.isBuyer]][[this.state.thread]][[message._id]].uri
                //   //1 console.log("uri ", uri)
                //   imageUris.push({ url: uri});
                //   this.setState({ imageUris, imageCount,messagess });
                // }
                messagesObject[[message._id]] = message
                //1 console.log("newMessage ",message)
              }
            } else {
              possible = false;
            }
            originalCount += 1;
          } 
        });
      });
              if(originalCount > 1){
                //1 console.log()
                const currentArray = Object.values(messagesObject).sort(function(a, b) {
                  return b["timestamp"] - a["timestamp"];
                });
                this.setState((previousState) => ({
                messages : currentArray,
                messagesObject,
                tempCount: 0
                }));
              }

    // newMessages = Object.values(newMessages)
    // if (atLeastOneNewText) {
    //   newMessages = newMessages.sort(function(a, b) {
    //     return b["timestamp"] - a["timestamp"];
    //   });
    //   this.setState((previousState) => ({
    //     messages: newMessages
    //   }));
      // });
      // this.setState({
      //   messages:newMessages.reverse()
      // })
      // //1 console.log("MESSAGES ", this.state.messages);
  };

*/

  onLoadHistory = async (earlier) => {
    const amount = 20;
    if (earlier) {
      const newStart =
        this.historyObject.startIndex - amount >= 0
          ? this.historyObject.startIndex - amount
          : 0;
      if (newStart != this.historyObject.startIndex) {
        //1 console.log();
        const messagesObject = this.state.messagesObject;
        const promises = [];
        for (var i = newStart; i < this.historyObject.startIndex; i++) {
          if (!messagesObject[[this.historyObject.historyMessages[i]]]) {
            messagesObject[[this.historyObject.historyMessages[i]]];
            this.historyObject.historyMessages[i] = this.parse(
              this.snapshot.child(this.historyObject.historyMessages[i]),
              true
            );
            promises.push(
              this.getUpdatedImage(this.historyObject.historyMessages[i], false)
            );
          }
        }

        await Promise.all(promises);

        this.setState((previousState) => ({
          messages: GiftedChat.prepend(
            previousState.messages,
            this.historyObject.historyMessages
              .slice(newStart, this.historyObject.startIndex)
              .reverse()
          ),
          messagesObject,
        }));

        this.historyObject.startIndex = newStart;
      }
    } else {
      const newEnd =
        this.historyObject.endIndex + amount <
        this.historyObject.historyMessages.length
          ? this.historyObject.endIndex + amount
          : this.historyObject.historyMessages.length - 1;
      //1 console.log("newEnd ", newEnd)
      //1 console.log("absolue last ",this.historyObject.historyMessages.length - 1)
      //1 console.log("end index ", this.historyObject.endIndex)
      //1 console.log("would be first item ",this.historyObject.historyMessages[this.historyObject.endIndex + 1] )
      if (newEnd != this.historyObject.endIndex) {
        const messagesObject = this.state.messagesObject;
        const promises = [];
        for (var i = this.historyObject.endIndex + 1; i <= newEnd; i++) {
          //1 console.log("in loop", this.historyObject.historyMessages[i]);
          if (!messagesObject[[this.historyObject.historyMessages[i]]]) {
            messagesObject[[this.historyObject.historyMessages[i]]];
            this.historyObject.historyMessages[i] = this.parse(
              this.snapshot.child(this.historyObject.historyMessages[i]),
              true
            );
            promises.push(
              this.getUpdatedImage(this.historyObject.historyMessages[i], false)
            );
          }
        }
        //1 console.log("last message possible ", this.historyObject.historyMessages[this.historyObject.historyMessages.length - 1])
        await Promise.all(promises);
        ////1 console.log("last message possible ", this.snapshot.child(this.historyObject.historyMessages[this.historyObject.historyMessages.length - 1]))
        // //1 console.log(
        //   "sliced ",
        //   this.historyObject.historyMessages
        //     .slice(this.historyObject.endIndex + 1, newEnd)
        //     .reverse()
        // );
        this.setState((previousState) => ({
          messages: this.historyObject.historyMessages
            .slice(this.historyObject.startIndex, newEnd + 1)
            .reverse(),
          messagesObject,
        }));
        this.historyObject.endIndex = newEnd;
      }
    }
  };

  isCloseToTop({ layoutMeasurement, contentOffset, contentSize }) {
    if (contentOffset.y < 10) {
      return false;
    }
    //1 console.log(contentOffset);
    const paddingToTop = 80;
    //1 console.log(
    //1   "calculation ",
    //1   contentSize.height - layoutMeasurement.height - paddingToTop
    //1 );
    //1 console.log("offset.y ", contentOffset.y);
    return (
      contentSize.height - layoutMeasurement.height - paddingToTop <=
      contentOffset.y
    );
  }

  isCloseToBottom({ contentOffset }) {
    return contentOffset.y < -15;
  }

  renderLoadEarlier = () => {
    return (
      <View style={{ flex: 1, justifyContent: "center" }}>
        <ActivityIndicator size="large" color="blue" />
      </View>
    );
  };

  renderDay = () => {
    return <Day textStyle={{ color: "red" }} />;
  };

  handleImageViewer(index, close) {
    this.setState({ showImageViewer: !close, index });
  }

  renderMessageImage(props) {
    const id = props.currentMessage._id;
    //1 console.log("index ", this.state.messagess[[id]].index);
    //1 console.log(this.displayTime(props.currentMessage.timestamp));
    return (
      <TouchableOpacity
        activeOpacity={1}
        style={{
          width: 200,
          height: 150,
          justifyContent: "center",
          alignItems: "center",
        }}
        onPress={() =>
          this.handleImageViewer(this.state.messagess[[id]].index, false)
        }
      >
        <Image
          source={{ uri: props.currentMessage.image }}
          style={{ width: 186, height: 140 }}
        />
      </TouchableOpacity>
    );
  }

  possibleProfit = () => {
    const actualPrice = this.state.possibleProfit.actualPrice.toFixed().toString()
    const newPrice = this.state.possibleProfit.newPrice.toFixed().toString()
    return (
      <View
        style={{
          position: "absolute",
          width: windowWidth,
          height: windowHeight,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "rgba(0,0,0,0.8)",
        }}
      >
        <View
          style={{
            width: 250,
            height: 200,
            flexDirection: "column",
            justifyContent: "space-between",
            backgroundColor: "white",
            borderRadius: 20,
          }}
        >
          <View
            style={{
              height: 30,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 20 }}>How Much You Saved</Text>
          </View>
          <View
            style={{
              alignItems: "center",
              marginHorizontal: 10,
              justifyContent: "center",
              height: 100,
              flexDirection:"col",
            }}
          >
            <Text style={{ fontSize: 15 }}>
            The actual price was
            <Text style={{color:"red"}}>{" $" + actualPrice}</Text>. So you pay the seller 80% (
              <Text style={{color:"#4CBB17"}}>{"$" + newPrice }</Text>
              ). 
            </Text>
            <Text style={{marginTop:5}}>
              They used Dining Dollars.
            </Text>
            <Text>  
              You saved Money.
            </Text>
            <Text>
             Win win.
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => this.setState({ possibleProfitVisible: false })}
          >
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                borderTopWidth: 0.2,
                height: 50,
                borderColor: "gray",
              }}
            >
              <Text>Dismiss</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  render() {
    // //1 console.log("imageUris ",this.state.imageUris)
    // //1 console.log("this.state.index ", this.state.index)
    ////1 console.log("messages", this.state.messages)
    const thisClass = this;
    const paymentOptions = [
      {
        label: "Price (High to Low)ffffffffffffffffffff",
        value: "price0",
      },
      { label: "Price (Low to High)", value: "price1" },
      { label: "Date (Most Recent)", value: "date1" },
    ];
    const mainContent = (
      <GiftedChat
        renderLoadEarlier={this.renderLoadEarlier}
        loadEarlier={this.state.refreshing}
        isLoadingEarlier={this.state.refreshing}
        messages={this.state.messages}
        renderComposer={this.renderComposer}
        onSend={this.send}
        renderCustomView={this.renderConfirm}
        renderSend={null}
        user={this.state.user}
        isCustomViewBottom={true}
        renderAvatar={null}
        renderBubble={this.renderBubble}
        onInputTextChanged={(text) => this.setState({ text })}
        text={this.state.text}
        placeholder="Type your message here..."
        showAvatarForEveryMessage={false}
        renderLoading={this.renderLoading}
        scrollToBottomComponent={this.scrollToBottomComponent}
        renderMessageImage={(props) => this.renderMessageImage(props)}
        imageProps={{ openImageViewer: this.openImageViewer }}
        listViewProps={{
          scrollEventThrottle: 400,
          onScroll: async ({ nativeEvent }) => {
            if (this.isCloseToTop(nativeEvent)) {
              await this.setState({ refreshing: true });
              if (this.state.historyOrderKey != "") {
                await this.onLoadHistory(true);
              } else {
                await this.onLoadingEarlier();
              }
              setTimeout(() => {
                this.setState({ refreshing: false });
              }, 1000);
            } else if (
              this.state.historyOrderKey != "" &&
              this.isCloseToBottom(nativeEvent)
            ) {
              //1 console.log("SCROLLED DOWN");
              await this.onLoadHistory(false);
            }
          },
        }}
      />
    );

    const imageModel = (
      <Modal
        testID={"modal"}
        isVisible={this.state.showImageViewer}
        // onBackdropPress={() => {this.props.togglePopupVisibility(false);}}
        animationIn="slideInUp"
        animationInTiming={500}
        style={{ width: windowWidth, height: windowHeight, margin: 0 }}
      >
        <ImageViewer
          index={this.state.index}
          enablePreload
          imageUrls={this.state.imageUris}
          renderImage={(props) => <Image {...props} />}
          enableSwipeDown
          onSwipeDown={() => this.handleImageViewer(0, true)}
        />
        <View style={{ position: "absolute", left: windowWidth - 50, top: 30 }}>
          <TouchableOpacity onPress={() => this.handleImageViewer(0, true)}>
            <AntDesign name="close" size={35} color="white" />
          </TouchableOpacity>
        </View>
      </Modal>
    );

    const confirmModal = (
      <Modal
        testID={"modal"}
        isVisible={true}
        // onBackdropPress={() => {this.props.togglePopupVisibility(false);}}
        animationIn="slideInUp"
        animationInTiming={500}
        style={{
          margin: 0,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(0,0,0,0.4)",
        }}
      >
        <Animated.View
          style={{
            width: windowWidth - 50,
            height: this.state.confirmModalHeight,
            marginTop: this.state.notes || this.state.priceInputtedSelected ? -200 : 0,
          }}
        >
          <Grid
            style={{
              justifyContent: "flex-start",
              backgroundColor: "white",
              borderRadius: 75,
              overflow: "hidden",
            }}
          >
            <Row
              style={{
                justifyContent: "center",
                flexDirection: "col",
                alignItems: "center",
                height: 50,
              }}
            >
              <Text style={{ fontSize: 28, fontWeight: "bold" }}>
                Confirm Order
              </Text>
              <Text style={{ fontSize: 15 }}>
                {" "}
                To Buyer: {this.state.chattingUser}
              </Text>
            </Row>
            <Row
              style={{
                justifyContent: "center",
                height: 50,
                alignItems: "center",
                marginTop: 5,
                justifyContent: "space-between",
                paddingLeft: 20,
                paddingRight: 20,
                flexDirection: "row",
              }}
            >
              <Text style={{ fontSize: 25 }}>Confirm Price: </Text>
              <View style={{flexDirection:"row",alignItems: 'center',}}>
              <Text style={{ fontSize: 28 }}>$</Text>
              <TextInput
                style={{
                  backgroundColor: "white",
                  borderRadius: 4,
                  padding: 8,
                  paddingRight:0,
                  width: 75,
                  borderWidth: 3,
                  height: 50,
                  borderColor: this.state.confirmOrderError.priceInputtedError
                    ? "red"
                    : "#FFDB0C",
                  shadowColor: this.state.confirmOrderError.priceInputtedError
                    ? "red"
                    : "#FFDB0C",
                  shadowOffset: {
                    width: 0,
                    height: 6,
                  },
                  fontSize: 20,
                  shadowOpacity: 0.39,
                  shadowRadius: 10,
                }}
                onFocus={() => {
                  
                  this.setState({ priceInputted: "",priceInputtedSelected:true });
                }}
                value={this.state.priceInputted}
                onEndEditing={() => {
                  const actualPrice = (parseInt(this.state.priceInputted) * 0.8).toFixed(2).toString()
                  this.setState({priceInputtedSelected : false})
                  if (isNaN(this.state.priceInputted)) {
                    this.setState({ priceInputted: "" });
                  } else if (parseInt(this.state.priceInputted) < 1) {
                    this.setState({ priceInputted: "1" });
                  } else if (parseInt(this.state.priceInputted) > 100) {
                    this.setState({ priceInputted: "80" });
                  }else{
                    this.setState({ priceInputted: isNaN(this.state.priceInputted) ? "" : actualPrice  });
                  }
                }}
                autoCapitalize="none"
                onSubmitEditing={Keyboard.dismiss}
                onChangeText={(field) => {
                  if (parseInt(field) < 1) {
                    this.setState({ priceInputted: "1" });
                  } else if (parseInt(field) > 100) {
                    this.setState({ priceInputted: "100" });
                  } else {
                    this.setState({ priceInputted: field });
                  }
                }}
              />
              </View>
            </Row>
            <Animated.View
              style={{
                justifyContent: "center",
                alignItems: "flex-start",
                justifyContent: "space-between",
                width: windowWidth - 50,
                paddingRight: 80,
                paddingLeft: 20,
                height: this.state.paymentDropdown,
                marginTop: 5,
                flexDirection: "row",
              }}
            >
              <View style={{ justifyContent: "center", alignItems: "center" }}>
                <Text style={{ fontSize: 25 }}>Payment: </Text>
              </View>
              <DropDownPicker
                onOpen={() => {
                  this._payment(this.state.paymentDropdown, 150);
                  this._payment(this.state.confirmModalHeight, 460);
                }}
                onClose={() => {
                  this._payment(this.state.paymentDropdown, 30);
                  this._payment(this.state.confirmModalHeight, 330);
                }}
                style={{
                  width: 180,
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                  borderBottomLeftRadius: 20,
                  borderBottomRightRadius: 20,
                  borderColor: this.state.confirmOrderError.paymentOptionsError
                    ? "red"
                    : "gray",
                  borderWidth: this.state.confirmOrderError.paymentOptionsError
                    ? 3
                    : 1,
                }}
                items={[
                  { label: "Select All", value: "Select All" },
                  ...paymentOptions,
                ]}
                min={1}
                max={5}
                multiple
                multipleText="%d items have been selected."
                placeholder="Select 1+"
                arrowStyle={{
                  alignItems: "center",
                  justifyContent: "center",
                  height: 30,
                }}
                defaultValue={this.state.chosenPaymentOptions}
                containerStyle={{ height: 30, numberOfLines: 1, width: 180 }}
                onChangeItem={async (items) => {
                  console.log("before ", this.state.chosenPaymentOptions);
                  console.log("items ", items);
                  for (var i = 0; i < items.length; i++) {
                    if (items[i] == "Select All") {
                      console.log("payment ", paymentOptions);
                      const values = [
                        "Select All",
                        ...paymentOptions.map((x) => x.value),
                      ];
                      console.log("values ", values);
                      this.setState({ chosenPaymentOptions: values });
                      return;
                    }
                  }
                  for (
                    var i = 0;
                    i < this.state.chosenPaymentOptions.length;
                    i++
                  ) {
                    if (this.state.chosenPaymentOptions[i] == "Select All") {
                      this.setState({ chosenPaymentOptions: [] });
                      return;
                    }
                  }

                  this.setState({ chosenPaymentOptions: items });
                }}
              />
            </Animated.View>
            <Row
              style={{
                alignItems: "flex-start",
                flexDirection: "col",
                width: windowWidth - 50,
                paddingHorizontal: 20,
                marginTop: 10,
              }}
            >
              <Text style={{ fontSize: 20 }}>Notes: </Text>
              <TextInput
                style={{
                  backgroundColor: "white",
                  justifyContent: "flex-start",
                  alignItems: "flex-start",
                  borderRadius: 4,
                  paddingHorizontal: 8,
                  height: 100,
                  width: windowWidth - 90,
                  borderWidth: 3,
                  borderColor: "#FFDB0C",
                  shadowColor: "#FFDB0C",
                  shadowOffset: {
                    width: 0,
                    height: 6,
                  },
                  fontSize: 20,
                  shadowOpacity: 0.39,
                  shadowRadius: 10,
                }}
                onFocus={() => {
                  this.setState({ notes: true });
                }}
                onEndEditing={() => {
                  this.setState({ notes: false });
                }}
                multiline
                value={this.state.noteInputted}
                autoCapitalize="none"
                onSubmitEditing={Keyboard.dismiss}
                onChangeText={(field) => {
                  this.setState({ noteInputted: field });
                }}
              />
            </Row>

            <View style={{ position: "absolute", right: 0, top: -30 }}>
              <TouchableOpacity onPress={() => this.handleImageViewer(0, true)}>
                <AntDesign name="close" size={35} color="white" />
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: "row" }}>
              <TouchableOpacity
                activeOpacity={0.6}
                style={{
                  height: 50,
                  width: (windowWidth - 50) / 2,
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: "red",
                }}
                onPress={() => {
                  this.setState({
                    chosenPaymentOptions: [],
                    confirmModalViewer: false,
                    priceInputted: "",
                    noteInputted: "",
                  });
                  this._payment(this.state.paymentDropdown, 30);
                  this._payment(this.state.confirmModalHeight, 330);
                }}
              >
                <Text style={{ fontSize: 25 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.6}
                style={{
                  height: 50,
                  width: (windowWidth - 50) / 2,
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: "#4cBB17",
                }}
                onPress={() => {
                  const priceInputtedInvalid =
                    this.state.priceInputted == "" ? true : false;
                  const paymentOptionsInvalid =
                    this.state.chosenPaymentOptions.length == 0 ? true : false;
                  const confirmOrderError = this.state.confirmOrderError;
                  confirmOrderError.priceInputtedError = priceInputtedInvalid;
                  confirmOrderError.paymentOptionsError = paymentOptionsInvalid;
                  this.setState({ confirmOrderError });
                  if (!priceInputtedInvalid && !paymentOptionsInvalid) {
                    this.send(this.state.user, "");
                    this.setState({
                      chosenPaymentOptions: [],
                      confirmModalViewer: false,
                      priceInputted: "",
                      noteInputted: "",
                    });
                  this._payment(this.state.paymentDropdown, 30);
                  this._payment(this.state.confirmModalHeight, 330);
                  }
                }}
              >
                <Text style={{ fontSize: 25 }}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </Grid>
        </Animated.View>
      </Modal>
    );

    if (Platform.OS === "android") {
      return (
        <KeyboardAvoidingView
          style={{ backgroundColor: "white" }}
          behavior="padding"
          keyboardVerticalOffset={80}
          enabled
        >
          {thisClass.renderNavigation()}
          {mainContent}
          {this.state.showImageViewer && imageModel}
          {this.state.confirmModalViewer && confirmModal}
          {this.state.possibleProfitVisible && this.possibleProfit()}
        </KeyboardAvoidingView>
      );
    } else {
      return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
          {thisClass.renderNavigation()}
          {mainContent}
          {this.state.showImageViewer && imageModel}
          {this.state.confirmModalViewer && confirmModal}
          {this.state.possibleProfitVisible && this.possibleProfit()}
        </SafeAreaView>
      );
    }
  }
}

const styles = StyleSheet.create({
  // rest remains same
  bottomComponentContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmButton: {
    width: 100,
    height: 100,
    borderRadius: 100,
    borderWidth: 3,
    justifyContent: "center",
    alignItems: "center",
    borderColor: "white",
    backgroundColor: "red",
    color: "white",
  },
});
