import React, { useState } from "react";
import { IconButton } from "react-native-paper";
import { GiftedChat, Bubble, Composer, Day } from "react-native-gifted-chat";
import {
  StyleSheet,
  Platform,
  Image,
  View,
  Dimensions,
  Animated,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
  AsyncStorage,
  Text,
} from "react-native";
import firebase from "../../config";
import Modal from "react-native-modal";
import { Entypo, AntDesign } from "@expo/vector-icons";
import UploadImages from "./UploadImages";
import * as ImagePicker from "expo-image-picker";
import ImageViewer from "react-native-image-zoom-viewer";
import * as FileSystem from 'expo-file-system';
import Loading from "./LoadingScreen";
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

    this.state = {
      loading: true,
      notificationsOn : true,
      allChats : {},
      messages: [],
      thread: (this.props.navigation.state.params || {}).thread,
      domain: domain,
      refreshing: false,
      opacities: {},
      messagess: {},
      lastMessageId: "",
      hasSentMessage: false,
      read: false,
      text: "",
      isBuyer:"",
      otherChatterToken: "",
      delivered: false,
      date: new Date(),
      uploadImagesVisible: false,
      count: 20,
      imageUris: [],
      imageCount: 0,
      index: 0,
      showImageViewer: false,
      chattingUser: (this.props.navigation.state.params || {}).chattingUser,
      otherChatterEmail: (this.props.navigation.state.params || {})
        .otherChatterEmail,
      otherChatterOnline: false,
      user: {
        _id: firebase.auth().currentUser.uid,
      },
      historyOrderKey:
        this.props.navigation.state.params.historyOrderKey || "",
    };
  }

  worthPuttingCenterTimestamp = (currentTimestamp, text) => {
    if (this.earlierMessage == "") {
      this.earlierMessage = currentTimestamp;
      this.earlierMessagetext = text;
      return null;
    } else {
      const old = this.earlierMessage;
      this.earlierMessage = currentTimestamp;
      this.earlierMessagetext = text;
      if (this.earlierMessage - old >= 216000) {
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
    console.log("currentMessage ",props.currentMessage)
    const currentTimestamp = props.currentMessage.timestamp;
    const messageId = props.currentMessage._id;
    const userId = props.currentMessage.user._id;
    // console.log("messageId ",messageId )
    // console.log("all messagess", this.state.messagess)
    //     console.log("messagess ",this.state.messagess[[messageId]])
    const centerTimestamp = this.state.messagess[[messageId]] ? this.state.messagess[[messageId]].centerTimestamp : "";
    // const centerTimestamp = ""
    return (
      <View style={{ flex: 1 }}>
        <Text>What up milk
        {centerTimestamp != null && centerTimestamp}
        </Text>
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
      // console.log("in for loop")
      this.uriToBlob(images[0].uri).then((blob) => {
        //   console.log("in uritoblob")
        const name = this.generateRandomString();
        console.log("name ", name);
        this.uploadToFirebase(blob, name).then((snapshot) => {
          console.log("in snapshot");

          snapshot.ref.getDownloadURL().then((url) => {
            var message = {
              text: "",
              image: url,
              read: this.state.otherChatterOnline,
              timestamp: this.timestamp(),
              user: { _id: firebase.auth().currentUser.uid },
            };

            console.log("message", message);
            this.append(message);
          });
          console.log("Hi there");
        });
      });
      // }
    });
  };

  // Promise.all(uriToBlobPromises).then(() => {
  // Promise.all(uploadToFirebasePromises).then(() => {
  //   params.then(async (images) =>{
  //     for(var i = 0; i < images.length;i++){
  //         console.log("imageHappened")
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

  //           console.log("message", message)
  //           this.append(message);

  //         }).catch((error) => console.log(error))
  //     }
  // })
  // params.then(async (images) =>{
  //   for(var i = 0; i < images.length;i++){
  //     this.uriToBlob(images[i].uri).then(async(blob) =>{
  //       console.log("oh man")
  //       this.uploadToFirebase(blob )
  //      await firebase.storage().ref(`/chats/${this.state.domain}/${this.state.thread}/${this.state.name}.jpg`).getDownloadURL().then(onResolve, onReject);

  //       function onResolve(foundURL) {
  //           this.setState({ name: foundURL})
  //       }

  //       function onReject(error) {
  //           console.log(error.code);
  //       }
  //       console.log("here i am")
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
  //       console.log("message", message)
  //       this.append(message);
  //     })
  //   }
  // })
  //}

  downloadUrl = async (url,messageId) => {
    return new Promise(async() => {
    const callback = downloadProgress => {
    const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
    // this.setState({
    //   downloadProgress: progress,
    // });
    }
     

    console.log("url ", url)
    await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory +this.state.thread +"/",{intermediates:true})
    // const downloadResumable = FileSystem.createDownloadResumable(
    //     url,
    //     FileSystem.documentDirectory  + name + ".png",
    //     {},
    //     callback
    //   )

    try {
      const { uri } = await FileSystem.downloadAsync(
              url,
      FileSystem.documentDirectory  + this.state.thread +"/" + messageId + ".png",
      {},
      callback
      );
      console.log('Finished downloading to ', uri);
      return uri
    } catch (e) {
      console.error(e);
    }
    })

    // try {
    //   await downloadResumable.pauseAsync();
    //   console.log('Paused download operation, saving for future retrieval');
    //   AsyncStorage.setItem('pausedDownload', JSON.stringify(downloadResumable.savable()));
    // } catch (e) {
    //   console.error(e);
    // }

    // try {
    //   const { uri } = await downloadResumable.resumeAsync();
    //   console.log('Finished downloading to ', uri);
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
    //   console.log('Finished downloading to ', uri);
    // } catch (e) {
    //   console.error(e);
    // }
  }

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
    console.log("in upload");
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
      {this.state.historyOrderKey == "" && 
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
          {props.text.length != 0 && 
          <TouchableOpacity
            style={{ marginRight: 5, marginBottom: 10 }}
            onPress={() => this.send(props.user, props.text)}
          >
            <Text style={{ color: "#0A9CBF", fontSize: 20 }}>Send</Text>
          </TouchableOpacity>}
        </View>
      </View>}
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
    console.log("this.state.thread ", this.state.thread);
    return firebase
      .database()
      .ref("/chats/" + this.state.domain + "/" + this.state.thread + "/");
  };

  timestamp = () => {
    return firebase.database.ServerValue.TIMESTAMP;
  };

  displayActualTime = (timestamp) => {
    if(timestamp == undefined || timestamp == "" || timestamp.length == 0){return ""}
    var messageDate = new Date(timestamp);
    var hour, minute, seconds;
    hour = messageDate.getHours();
    var afterNoon = hour  > 11 ? "PM" : "AM";
    hour = hour == 0 || hour == 12 ? "12" : (hour > 12 ? hour - 12 : hour)

    minute = "0" + messageDate.getMinutes();
    return hour + ":" + minute.substr(-2) + " " + afterNoon;
  };

  displayTime = (timestamp) => {
    // console.log("-----------------Display Time----------")
    // console.log("current",this.state.date)
    // console.log("timestamp",timestamp)
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
    //console.log("getHours ",messageDate.getHours())
    var hour, minute, seconds;
    hour = messageDate.getHours();

    var afterNoon = hour  > 11 ? "PM" : "AM";
    hour = hour == 0 || hour == 12 ? "12" : (hour > 12 ? hour - 12 : hour)

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

  parse = async (snapshot, loadEarlier) => {
    var {
      timestamp,
      text,
      user,
      image,
      confirmAnswer,
      read,
      readTime,
    } = snapshot.val();
    const { key: _id } = snapshot;
    const centerTimestamp = this.worthPuttingCenterTimestamp(timestamp, text);
    // console.log("messages in parse ", this.state.messagess)


        console.log("adjusting messagess ",_id)
    let messagess = this.state.messagess
      messagess[[_id]] = {
        confirmAnswer,
        centerTimestamp,
        index: this.state.imageCount - 1,//even if there is no image at this text, it's okay
      }
      this.setState({messagess})
      console.log("come on ", this.state.messagess)

    const allChats = this.state.allChats
    // if ( image != undefined) {
    //   console.log("there is image ", image)
    //   if(!allChats[[this.state.isBuyer]][[this.state.thread]][[_id]] || !allChats[[this.state.isBuyer]][[this.state.thread]][[_id]].uri){
    //     const uri = await this.downloadUrl(image,_id)
    //     console.log("uri ",uri)
    //     if(!allChats[[this.state.isBuyer]][[this.state.thread]][[_id]]){
    //       console.log("doesn't exist message ")
    //       allChats[[this.state.isBuyer]][[this.state.thread]][[_id]] = {uri}
    //     }else{
    //       allChats[[this.state.isBuyer]][[this.state.thread]][[_id]].uri = uri
    //     }
    //     console.log("thisMessage ",allChats[[this.state.isBuyer]][[this.state.thread]][[_id]])
    //     const promises = []
    //     promises.push(
    //       this.setState({allChats})
    //     )
    //     promises.push(
    //       AsyncStorage.setItem('allChats',JSON.stringify(allChats))
    //     )
    //     await Promise.all(promises)
    //   }
    //   const imageUris = this.state.imageUris;
    //   const imageCount = (this.state.imageCount += 1);
    //   imageUris.push({ url: allChats[[this.state.isBuyer]][[this.state.thread]][[_id]].uri });
    //   this.setState({ imageUris, imageCount });
    // }

    const message = {
      _id,
      timestamp,
      text,
      user,
      image,
    };

    if (!loadEarlier && user._id == firebase.auth().currentUser.uid) {
      // console.log("user._id ", user._id)
      // console.log("firebase.auth",firebase.auth().currentUser.uid)
      // console.log("readTime",readTime)
      // console.log("read", read)
      const readTimeStamp = readTime ? readTime : new Date().getTime();
      console.log("readTimeStamp ", readTimeStamp);
      this.setState({
        read,
        lastMessageId: _id,
        readTime: read ? this.displayTime(readTimeStamp) : "User Invalid",
        delivered: true,
        deliveredTime: this.displayTime(message.timestamp),
      });
    }
    if (text == "" && image == undefined && confirmAnswer == undefined) {
      this.setState((previousState) => {
        let opacities = previousState.opacities;
        opacities[[_id]] = {
          animatedValue: new Animated.Value(1),
          confirmedOpacity: new Animated.Value(0),
        };

        return { opacities };
      });
    }

    // console.log("opacities1",this.state.messagess)
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
          : this.historyObject.endIndex - 1;
      console.log(this.historyObject.startIndex);
      console.log("endIndex ", this.historyObject.endIndex);
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
      .on("child_added", (snapshot) => callback(this.parse(snapshot, false)));
  };

  onCheckOtherChatter = (callback) => {
    this.refCheckChatter()
      .child(this.state.otherChatterEmail)
      .on("value", (snapshot) => {
        console.log("NOT IN RHYTHM ", snapshot.val());
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
  send = (user, text) => {
    // for (let i = 0; i < messages.length; i++) {
    //   const { text, user } = messages[i];
    //   const message = {
    //     text,
    //     user,
    //     timestamp: this.timestamp(),
    //   };
    //   console.log("message in send")
    //   console.log(message)
    //   this.append(message);
    // }
    const message = {
      text: text,
      user: user,
      read: this.state.otherChatterOnline,
      timestamp: this.timestamp(),
    };

    this.setState({ text: "" });

    this.append(message);
  };

  sendSingleNotification = async ( text) => {
    console.log("sendSingle")
    const message = {
      to: this.state.otherChatterToken,
      sound: "default",
      title: this.state.chattingUser,
      body: text,
      data: {
        data: {
          thread : this.state.thread,
          name : this.state.chattingUser,
          otherChatterEmail : this.state.otherChatterEmail,
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
      .child(user.email.substring(0, end))
      .update({ [hasSentMessage]: true });
    this.ref()
      .push(message)
      .then(() => {
        this.setState({
          delivered: true,
          deliveredTime: this.displayTime(new Date().getTime()),
        });
        if(this.state.notificationsOn && this.state.otherChatterToken != ""){
          this.sendSingleNotification(this.whatIsMessage(message.image,message.text))
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
    this.setState({loading : true})
    const user = firebase.auth().currentUser;
    const end = user.email.indexOf(".com");
    const email = user.email.substring(0, end);
    const isBuyer =
      this.state.thread.substring(0, email.length) == email ? "buyer" : "seller"

    let allChats = await AsyncStorage.getItem('allChats')
    allChats = JSON.parse(allChats);
    if(!allChats){
      allChats = {[[isBuyer]] : {[[this.state.thread]] : {}}}
    }else if(!allChats[[isBuyer]]){
      let newObject  = {[[isBuyer]] : {[[this.state.thread]] : {}}}
      allChats = {...allChats,...newObject}
    }else if(!allChats[[isBuyer]][[this.state.thread]]){
      allChats[[isBuyer]] = {[[this.state.thread]] : {}}
    }
    console.log("allChats ",allChats)
    await this.setState({allChats,isBuyer})
    // firebase.storage().ref("/chats/@gmail/fakedafi2@gmailfakedafi@gmail/0405095287031324.jpg").getDownloadURL().then(() => {
    //   this.setState({profileImage : foundURL})
    //   console.log("found profile image")
    // }).catch((error) => {console.log("no profileeeeeeee image")})

    // //firebase.storage().ref("profilePics/@gmail/fakedafi@gmail/profilePic.jpg").once("value",(snapshot) => {console.log("snapshot",snapshot)})
    // await firebase.storage().ref(path).getDownloadURL().then(() => {
    //   this.setState({profileImage : foundURL})
    //   console.log("found profile image")
    // }).catch((error) => {console.log("no profile image")})

    if(this.state.historyOrderKey != ""){
      this.historyFinder();
    }else{

          this.refCheckChatter()
      .child(email + "/" + email + "/_hasSentMessage")
      .once("value", (snapshot) => {
        this.setState({ hasSentMessage: snapshot.val() });
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
          isBuyer+
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
        this.setState({ otherChatterToken: snapshot.val().expoToken, notificationsOn : snapshot.val()["notifications"].newMessages });
      });



      this.on((message) => {
        this.setState((previousState) => ({
          messages: GiftedChat.append(previousState.messages, message),
        }));
      });

      this.onCheckOtherChatter((otherChatterOnline) => {
        this.setState({
          read: otherChatterOnline[[this.state.otherChatterEmail]],
        });
        if (otherChatterOnline && !this.state.read) {
          console.log("NOOOO");
          this.ref()
            .child(key)
            .update({
              read: otherChatterOnline[[this.state.otherChatterEmail]],
              readTime: timestamp,
            });
        }
      });
    }
    this.setState({loading : false})
  }

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

  _start = (_id, answer) => {
    Animated.parallel([
      Animated.timing(this.state.opacities[[_id]].animatedValue, {
        toValue: 0,
        duration: 300,
      }),
      Animated.timing(this.state.opacities[_id].confirmedOpacity, {
        toValue: 1,
        duration: 300,
      }),
    ]).start();
    this.setState((previousState) => {
      let messagess = previousState.messagess;
      messagess[[_id]] = { confirmAnswer: answer };
      return { messagess };
    });
    this.updatedMessageConfirmAnswer(_id, answer);
  };

  initialConfirmMessage = (_id, confirmAnswer, timestamp) => {
    return (
      <View style={{ width: windowWidth - 80, height: 150 }}>
        <View style={{ alignItems: "center" }}>
          <Text>Confirm Order</Text>
        </View>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginHorizontal: 30,
          }}
        >
          <Animated.View
            style={{
              transform: [
                {
                  translateX: this.state.opacities[
                    [_id]
                  ].animatedValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [(windowWidth - 250) / 2, 0],
                  }),
                },
              ],
              opacity: this.state.opacities[[_id]].animatedValue,
            }}
          >
            <TouchableOpacity
              activeOpacity={0.5}
              style={styles.confirmButton}
              onPress={async () => {
                this._start(_id, false);
              }}
            >
              <Text>NO</Text>
            </TouchableOpacity>
          </Animated.View>
          <Animated.View
            style={{
              translateX: -(windowWidth - 315) / 2,
              opacity: this.state.opacities[[_id]].confirmedOpacity,
            }}
          >
            <View
              style={[
                styles.confirmButton,
                { backgroundColor: confirmAnswer ? "green" : "red" },
              ]}
            >
              <Text>Hi</Text>
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
                    outputRange: [
                      -((windowWidth - 150) / 2),
                      -(windowWidth - 250) / 2,
                    ],
                  }),
                },
              ],
              opacity: this.state.opacities[[_id]].animatedValue,
            }}
          >
            <TouchableOpacity
              activeOpacity={0.5}
              style={[styles.confirmButton, { backgroundColor: "green" }]}
              onPress={() => {
                this._start(_id, true);
              }}
            >
              <Text>YES</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    );
  };

  selectedConfirmMessage = (confirmAnswer, timestamp) => {
    return (
      <View
        style={{
          width: windowWidth - 80,
          height: 150,
          alignItems: "center",
          marginRight: 200,
        }}
      >
        <View style={{ alignItems: "center" }}>
          <Text>Confirm Order</Text>
        </View>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginHorizontal: 30,
          }}
        >
          <View
            style={{
              opacity: 1,
            }}
          >
            <View
              style={[
                styles.confirmButton,
                { backgroundColor: confirmAnswer ? "green" : "red" },
              ]}
            >
              <Text>Hioo</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  renderTime = (timestamp) => {
    return <Text>{this.displayTime(timestamp)}</Text>;
  };

  renderConfirm = (props) => {
    const message = props.currentMessage;
    const confirmAnswer =  this.state.messagess[[message._id]] ? this.state.messagess[[message._id]].confirmAnswer : undefined;
    if (message.text == "" && message.image == undefined) {
      if (confirmAnswer == undefined) {
        return this.initialConfirmMessage(
          message._id,
          confirmAnswer,
          message.timestamp
        );
      } else {
        return this.selectedConfirmMessage(confirmAnswer, message.timestamp);
      }
    }
  };

  renderNavigation = () => {
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
        <Text>{this.state.chattingUser}</Text>
        <TouchableOpacity
          onPress={() => {
            this.send(this.state.user, "");
          }}
        >
          <Text>Confirm Order</Text>
        </TouchableOpacity>
      </View>
    );
  };

  renderDelivered = () => {
    if (this.state.read && this.state.hasSentMessage) {
      return (
        <View style={{ alignItems: "flex-end", marginRight: 5 }}>
          <Text style={{fontSize:10,color:"gray"}}><Text style={{fontWeight:"bold"}}>Read</Text> {this.state.readTime}</Text>
        </View>
      );
    } else if (this.state.delivered && this.state.hasSentMessage) {
      return (
        <View style={{ alignItems: "flex-end", marginRight: 5 }}>
          <Text style={{fontSize:10,color:"gray"}}><Text style={{fontWeight:"bold"}}>Delivered</Text> {this.state.deliveredTime}</Text>
        </View>
      );
    } else {
      return null;
    }
  };

  onLoadingEarlier = async () => {
    // console.log("oldMessages",this.state.messages)
    console.log("------------------------------------");
    var originalCount = 1;
    await this.setState((previousState) => ({
      count: previousState.count + 20,
    }));
    var possible = true;
    var newMessages = [];
    const n = this.state.messages.length;
    //console.log("HI THERE",this.state.messages)
    const lastMessage = this.state.messages.slice(n - 1, n)[0];
    await this.ref()
      .limitToLast(this.state.count)
      .once("value", (snapshot) => {
        //console.log("lastMessage ", lastMessage)
        snapshot.forEach((premessage) => {
          // console.log("premessage ",premessage)
          if (originalCount <= 20 && possible) {
            const message = this.parse(premessage, true);
            console.log(message._id);
            console.log("last ", lastMessage._id);
            if (message._id != lastMessage._id) {
              console.log(this.state.messagess[[message._id]]);
              if (this.state.messagess[[message._id]] != undefined) {
                console.log("THERES ANOTHER");
                console.log(message._id);
                // setTimeout(() => {
                newMessages.push(message);
                // }, 20000);
                // } else {
                // newMessages.push(message);
              }
            } else {
              possible = false;
            }
            originalCount += 1;
          } else {
          }
        });
      });
    if (newMessages.length != 0) {
      // await newMessages.reverse().forEach((element) => {
      this.setState((previousState) => ({
        messages: GiftedChat.prepend(
          previousState.messages,
          newMessages.reverse()
        ),
      }));
      // });
      // this.setState({
      //   messages:newMessages.reverse()
      // })
      console.log("MESSAGES ", this.state.messages);
    }
  };

  onLoadHistory = (earlier) => {
    const amount = 20;
    if (earlier) {
      const newStart =
        this.historyObject.startIndex - amount >= 0
          ? this.historyObject.startIndex - amount
          : 0;
      if (newStart != this.historyObject.startIndex) {
        console.log();
        for (var i = newStart; i < this.historyObject.startIndex; i++) {
          this.historyObject.historyMessages[i] = this.parse(
            this.snapshot.child(this.historyObject.historyMessages[i]),
            true
          );
        }
        this.setState((previousState) => ({
          messages: GiftedChat.prepend(
            previousState.messages,
            this.historyObject.historyMessages
              .slice(newStart, this.historyObject.startIndex)
              .reverse()
          ),
        }));

        this.historyObject.startIndex = newStart;
      }
    } else {
      const newEnd =
        this.historyObject.endIndex + amount <
        this.historyObject.historyMessages.length
          ? this.historyObject.endIndex + amount
          : this.historyObject.historyMessages.length - 1;
      console.log("not earlier");
      if (newEnd != this.historyObject.endIndex) {
        for (var i = this.historyObject.endIndex + 1; i < newEnd; i++) {
          console.log("in loop", this.historyObject.historyMessages[i]);
          this.historyObject.historyMessages[i] = this.parse(
            this.snapshot.child(this.historyObject.historyMessages[i]),
            false
          );
        }
        console.log(
          "sliced ",
          this.historyObject.historyMessages
            .slice(this.historyObject.endIndex + 1, newEnd)
            .reverse()
        );
        this.setState((previousState) => ({
          messages: this.historyObject.historyMessages
            .slice(this.historyObject.startIndex, newEnd)
            .reverse(),
        }));
        this.historyObject.endIndex = newEnd;
      }
    }
  };

  isCloseToTop({ layoutMeasurement, contentOffset, contentSize }) {
    if (contentOffset.y < 10) {
      return false;
    }
    console.log(contentOffset);
    const paddingToTop = 80;
    console.log(
      "calculation ",
      contentSize.height - layoutMeasurement.height - paddingToTop
    );
    console.log("offset.y ", contentOffset.y);
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
    console.log("index ", this.state.messagess[[id]].index);
    console.log(this.displayTime(props.currentMessage.timestamp));
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

  render() {
    if (this.state.loading) {
      return <Loading navigation={this.props.navigation} />;
    }
    const thisClass = this;
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
              console.log("SCROLLED DOWN");
              await this.onLoadHistory(false);
            }
          },
        }}
      />
    );
    const model = (
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
          imageUris={this.state.imageUris}
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
          {model}
        </KeyboardAvoidingView>
      );
    } else {
      return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
          {thisClass.renderNavigation()}
          {mainContent}
          {model}
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
