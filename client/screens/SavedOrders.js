import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Animated,
  AsyncStorage,
  ImageBackground,
  TouchableWithoutFeedback,
} from "react-native";
import Modal from "react-native-modal";
import * as firebase from "firebase";
import { AntDesign, Ionicons, MaterialIcons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import { Col, Row, Grid } from "react-native-easy-grid";
import { LinearGradient } from "expo-linear-gradient";
import FillUpButton from "react-native-fill-up-button";
import PopupOrder from "./PopupOrder";
import SpecificSavedOrder from "./SpecificSavedOrder";
import Swiper from "react-native-swiper/src";
const windowWidth = Dimensions.get("window").width;
const windowHeight = Dimensions.get("window").height;
const cardHeight = 200;
const cardWidth = 160;
export default class SavedOrders extends React.Component {
  state = {
    newSavedOrders: [],
    // numbOfRows: [1],
    numbOfColumns: [1],
    loading: true,
    date: new Date(),
    popupVisible: false,
    disabled: 0,
    animatedHeight: new Animated.Value(0),
    animatedWidth: new Animated.Value(0),
    modanOn: false,
    showsButtons: true,
    newOrder: false,
    orderIndex: 0,
  };

  toggleShowSwiperButtons = (value) => {
    this.setState({ showsButtons: value });
  };

  togglePopupVisibility = (value) => {
    this.setState({ popupVisible: value });
  };
  exitSelectedOrderModal = () => {
    this.setState({ modalOn: false, newOrder: false });
    this._close(this.state.animatedWidth, 0, 200);
    this._close(this.state.animatedHeight, 0, 200);
  };

  async componentDidMount() {
    const user = firebase.auth().currentUser;
    const start = user.email.indexOf("@");
    const end = user.email.indexOf(".com");
    const domain = user.email.substring(start, end);
    const email = user.email.substring(0, end);
    let savedOrders = await AsyncStorage.getItem("savedOrders");
    savedOrders = JSON.parse(savedOrders);
    if (!savedOrders) {
      savedOrders = {};
    }
    const newSavedOrders = {};
    var numbOfItems = 1;
    const promises = [];
    const thisOrder = [];

    firebase
      .database()
      .ref("users/" + domain + "/" + email + "/savedOrders")
      .once("value", async (snapshot) => {
        const keys = Object.keys(snapshot.val() || {});
        // console.log("snapshot ", snapshot.val());
        const promises = [1];
        for (var key = 0; key < keys.length; key++) {
          const element = snapshot.val()[[keys[key]]];
          const actualKey = keys[key];
          newSavedOrders[[actualKey]] = { images: {}, thumbnail: {} };
          const thisOrder = newSavedOrders[[actualKey]];
          thisOrder.title = element.title;
          thisOrder.range = element.range;
          thisOrder.width = new Animated.Value(0);
          thisOrder.key = keys[key];
          thisOrder.timestamp = element.timePreference;
          thisOrder.lastUsed = this.displayTime(element.lastUsed);
          console.log("element.thumbnail ", element.thumbnail);
          console.log("from component didm mount ", savedOrders);
          //console.log("savedOrders[[actualKey]].thumbnail",savedOrders[[actualKey]].thumbnail)
          if (savedOrders[[actualKey]] && savedOrders[[actualKey]].thumbnail) {
            // console.log("element thumbnail ", element.thumbnail);
            // console.log(
            //   "savedOrders[[actualKey]].thumbnail ",
            //   savedOrders[[actualKey]].thumbnail
            // );
            if (
              savedOrders[[actualKey]].thumbnail.uri &&
              savedOrders[[actualKey]].thumbnail.url == element.thumbnail
            ) {
              console.log("exists savedOrders ");

              thisOrder.thumbnail.uri = savedOrders[[actualKey]].thumbnail.uri;
            } else {
              console.log("element.thumbnail ", element.thumbnail);
              this.deleteUri(savedOrders[[actualKey]].thumbnail.uri);
              // if(element.thumbnail != ""){
              if (element.thumbnail && element.thumbnail.length > 1) {
                promises.push(
                  (thisOrder.thumbnail.uri = await this.downloadUrl(
                    element.thumbnail,
                    actualKey,
                    "thumbnail"
                  ))
                );
              }
              // }
            }
          } else if (element.thumbnail && element.thumbnail.length > 1) {
            // console.log("get thumbnail", promises);

            promises.push(
              (thisOrder.thumbnail.uri = await this.downloadUrl(
                element.thumbnail,
                actualKey,
                "thumbnail"
              ))
            );
          }
          thisOrder.thumbnail.url = element.thumbnail;

          if (element.thumbnail && element.thumbnail.length > 1) {
            const { exists } = await FileSystem.getInfoAsync(
              thisOrder.thumbnail.uri,
              {}
            );
            if (!exists) {
              //in case we have a uri to a file that doesn't exist
              promises.push(
                (thisOrder.thumbnail.uri = await this.downloadUrl(
                  element.thumbnail,
                  actualKey,
                  "thumbnail"
                ))
              );
            }
          }

          console.log("about to images", thisOrder.thumbnail);
          const images = Object.values(element.images || {});
          const existsImages =
            savedOrders[[actualKey]] && savedOrders[[actualKey]].images
              ? true
              : false;
          // console.log("existingImages ", existsImages);
          // console.log("images ", element.images);
          for (var i = 0; i < images.length; i++) {
            console.log("existsImages ", existsImages);
            console.log(
              "savedOrders[[actualKey]].images[[images[i]]] ",
              savedOrders[[actualKey]]
            );
            if (existsImages && savedOrders[[actualKey]].images[[images[i]]]) {
              const { exists } = await FileSystem.getInfoAsync(
                savedOrders[[actualKey]].images[[images[i]]],
                {}
              );
              console.log("exists ", exists);
              if (exists) {
                thisOrder.images[[images[i]]] =
                  savedOrders[[actualKey]].images[[images[i]]];
              } else {
                //if we have a uri to a file that doesn't exist
                const endIndex = images[i].indexOf(".jpg");
                promises.push(
                  (thisOrder.images[[images[i]]] = await this.downloadUrl(
                    images[i],
                    actualKey,
                    images[i].substring(endIndex - 16, endIndex)
                  ))
                );
              }
            } else {
              const endIndex = images[i].indexOf(".jpg");
              promises.push(
                (thisOrder.images[[images[i]]] = await this.downloadUrl(
                  images[i],
                  actualKey,
                  images[i].substring(endIndex - 16, endIndex)
                ))
              );
            }
          }
        }
        await Promise.all(promises);
        // console.log("thisOrder ", thisOrder);
        numbOfItems = keys.length;
        // console.log("finished an order");

        var numbOfColumns = Math.floor(windowWidth / cardWidth);
        // var numbOfRows = Math.ceil(numbOfItems / numbOfColumns);

        this.setState({
          newSavedOrders: Object.values(newSavedOrders),
          numbOfColumns,
          // numbOfRows,
          loading: false,
        });
        var dummyKey = "";
        Object.keys(savedOrders).map((key) => {
          dummyKey = key;
          if (!newSavedOrders[[key]]) {
            this.deleteUri(savedOrders[[key]].thumbnail);
            Object.values(savedOrders[[key]].images).forEach((element) => {
              this.deleteUri(element);
            });
          } else {
            const thisSaved = savedOrders[[key]];
            const thisNew = newSavedOrders[[key]];
            Object.keys(savedOrders[[key]].images).map((imageKey) => {
              if (!thisNew.images[[imageKey]]) {
                this.deleteUri(savedOrders[[key]].images[[imageKey]]);
              }
            });
          }
        });

        AsyncStorage.setItem("savedOrders", JSON.stringify(newSavedOrders));
        // this.addSavedOrder(newSavedOrders[[dummyKey]],Object.values(newSavedOrders[[dummyKey]].images))
      });
  }

  deleteSavedOrder = async (index) => {
    console.log("index ", index);
    const user = firebase.auth().currentUser;
    const start = user.email.indexOf("@");
    const end = user.email.indexOf(".com");
    const domain = user.email.substring(start, end);
    const email = user.email.substring(0, end);
    var newSavedOrders = this.state.newSavedOrders;
    console.log("deleteSavedOrder ", newSavedOrders);
    const images = Object.keys(newSavedOrders[[index]].images || []);
    console.log("images ", images);
    for (var i = 0; i < images.length; i++) {
      var imageRef = firebase
        .storage()
        .ref(`/savedOrders/${domain}/${email}/${images[i]}.jpg`);
      // Delete the file
      imageRef
        .delete()
        .then(function () {})
        .catch(function (error) {
          console.log("OH no, delete image dosn't work");
        });
    }
    var imageRef = firebase
      .storage()
      .ref(
        `/savedOrders/${domain}/${email}/${
          newSavedOrders[[index]].thumbnail.url
        }.jpg`
      );
    // Delete the file
    imageRef
      .delete()
      .then(function () {})
      .catch(function (error) {
        console.log("OH no, delete image dosn't work");
      });
    this.deleteUri(newSavedOrders[[index]].thumbnail.uri);
    Object.values(newSavedOrders[[index]].images).forEach((element) => {
      this.deleteUri(element);
    });

    firebase
      .database()
      .ref("/users/" + domain + "/" + email + "/savedOrders/")
      .update({
        [[newSavedOrders[[index]].key]]: null,
      });
    newSavedOrders.splice(index, 1);
    console.log("newSavedOrders ", newSavedOrders);
    this.setState({ newSavedOrders });
    const savedOrders = {};
    for (var i = 0; i < newSavedOrders.length; i++) {
      savedOrders[[newSavedOrders[i].key]] = newSavedOrders[i];
    }
    AsyncStorage.setItem("savedOrders", JSON.stringify(savedOrders));
  };

  generateRandomString = () => {
    return Math.random().toString().substr(2, 20);
  };

  updateOrderFirebase = async (
    order,
    toDeleteImages,
    toAddImages,
    key,
    index
  ) => {
    let savedOrders = await AsyncStorage.getItem("savedOrders");
    savedOrders = JSON.parse(savedOrders);
    console.log("key ", key);
    console.log("index ", index);
    const thisOrder = this.state.newSavedOrders[[index]];
    const user = firebase.auth().currentUser;
    const start = user.email.indexOf("@");
    const end = user.email.indexOf(".com");
    const domain = user.email.substring(start, end);
    const email = user.email.substring(0, end);

    const imageKeys = Object.keys(this.state.newSavedOrders[[index]].images);
    const thisImages = this.state.newSavedOrders[[index]].images;
    console.log("toDeleteImages ", toDeleteImages);
    //Not going to delete from asyncstorage cause it's already done in componentdidmount
    for (var i = 0; i < toDeleteImages.length; i++) {
      const path = toDeleteImages[i];
      console.log("delete path", path);
      console.log("imageKeys ", imageKeys);
      for (var j = 0; j < imageKeys.length; j++) {
        console.log("thisImages[[imageKeys[j]]] ", thisImages[[imageKeys[j]]]);
        if (thisImages[[imageKeys[j]]] == path) {
          console.log("being deleted");
          thisImages[[imageKeys[j]]] = null;
          delete thisImages[[imageKeys[j]]];
          const endIndex = imageKeys[j].indexOf(".jpg");
          const name = imageKeys[j].substring(endIndex - 16, endIndex);
          console.log(
            "imageRef ",
            `/savedOrders/${domain}/${email}/${key}/${name}.jpg`
          );
          var imageRef = firebase
            .storage()
            .ref(`/savedOrders/${domain}/${email}/${key}/${name}.jpg`);
          // Delete the file
          imageRef
            .delete()
            .then(function () {})
            .catch(function (error) {
              console.log("OH no, delete image dosn't work");
            });
          break;
        }
      }
      this.deleteUri(path);
    }
    console.log("afterDelet ,", thisImages);
    console.log("kyyy", key);
    const uploadToFirebasePromises = [];
    const imageNames = [];
    const uriToBlobPromises = [];
    for (var i = 0; i < toAddImages.length; i++) {
      const nameKey = this.generateRandomString();
      imageNames.push({ uri: toAddImages[i], nameKey });
      const uri = toAddImages[i];
      const path = `/savedOrders/${domain}/${email}/${key}/${nameKey}.jpg`;
      uriToBlobPromises.push(
        this.uriToBlob(uri, i).then((blob) => {
          console.log("got the blob");
          uploadToFirebasePromises.push(this.uploadToFirebase(blob, path));
        })
      );
    }
    console.log("already there", uriToBlobPromises);
    await Promise.all(uriToBlobPromises).then(async () => {
      console.log("come on ", uploadToFirebasePromises);

      await Promise.all(uploadToFirebasePromises).then(async () => {
        const storagePromises = [];
        const imageUrls = Object.keys(thisImages);
        for (var i = 0; i < imageNames.length; i++) {
          const name = imageNames[i].nameKey;
          const uri = imageNames[i].uri;
          const path = `/savedOrders/${domain}/${email}/${key}/${name}.jpg`;
          console.log("getting url ", path);
          storagePromises.push(
            firebase
              .storage()
              .ref(path)
              .getDownloadURL()
              .then((foundURL) => {
                imageUrls.push(foundURL);
                console.log("uri ", uri);
                console.log("order.thumbnail ", order.thumbnail.uri);
                if (uri == order.thumbnail.uri) {
                  order.thumbnail.url = foundURL;
                } else {
                  thisImages[[foundURL]] = uri;
                }
              })
          );
        }
        await Promise.all(storagePromises);
        console.log("thisImages", thisImages);
        console.log("imageUrls ", imageUrls);
        const newSavedOrders = this.state.newSavedOrders;
        newSavedOrders[[index]].images = thisImages;
        newSavedOrders[[index]].timestamp = order.timestamp;
        newSavedOrders[[index]].range = order.range;
        newSavedOrders[[index]].title = order.title;
        if (order.thumbnail.uri != newSavedOrders[[index]].thumbnail.uri) {
          newSavedOrders[[index]].thumbnail = order.thumbnail;
        }

        this.setState({ newSavedOrders });
        // console.log("newOrderObject ", newSavedOrders)
        // console.log("keys ", key)
        firebase
          .database()
          .ref("users/" + domain + "/" + email + "/savedOrders/")
          .update({
            [[key]]: {
              images: imageUrls,
              range: newSavedOrders[[index]].range || null,
              timePreference: newSavedOrders[[index]].timestamp || null,
              title: newSavedOrders[[index]].title,
              thumbnail:
                newSavedOrders[[index]].thumbnail.url != ""
                  ? newSavedOrders[[index]].thumbnail.url
                  : null,
            },
          });
        const savedOrders = {};
        for (var i = 0; i < newSavedOrders.length; i++) {
          savedOrders[[newSavedOrders[i].key]] = newSavedOrders[i];
        }
        AsyncStorage.setItem("savedOrders", JSON.stringify(savedOrders));
      });
    });
  };

  addSavedOrder = async (newOrderObject, imageUris) => {
    this.setState({loading : true})
    const user = firebase.auth().currentUser;
    const start = user.email.indexOf("@");
    const end = user.email.indexOf(".com");
    const domain = user.email.substring(start, end);
    const email = user.email.substring(0, end);

    const key = this.generateRandomString();
    const uriToBlobPromises = [];
    const uploadToFirebasePromises = [];
    const storagePromises = [];
    const imageUrls = {};
    const imageNames = [];
    console.log("in add saved order");
    console.log("imageUris ", imageUris);
    for (var i = 0; i < imageUris.length; i++) {
      const nameKey = this.generateRandomString();
      imageNames.push(nameKey);
      const uri = imageUris[i];
      const path = `/savedOrders/${domain}/${email}/${key}/${nameKey}.jpg`;
      console.log("about to add ", imageUris[i]);
      uriToBlobPromises.push(
        this.uriToBlob(uri, i).then((blob) => {
          console.log("got the blob");
          uploadToFirebasePromises.push(this.uploadToFirebase(blob, path));
        })
      );
    }
    console.log("already there", uriToBlobPromises);
    await Promise.all(uriToBlobPromises).then(async () => {
      console.log("come on ", uploadToFirebasePromises);

      await Promise.all(uploadToFirebasePromises).then(async () => {
        console.log("in finished uploading");
        for (var i = 0; i < imageNames.length; i++) {
          const name = imageNames[i];
          const uri = imageUris[i];
          const path = `/savedOrders/${domain}/${email}/${key}/${name}.jpg`;
          console.log("getting url ", path);
          storagePromises.push(
            firebase
              .storage()
              .ref(path)
              .getDownloadURL()
              .then((foundURL) => {
                console.log("uri ", uri);
                console.log("thumbnail ", newOrderObject.thumbnail.uri);
                if (uri == newOrderObject.thumbnail.uri) {
                  newOrderObject.thumbnail.url = foundURL;
                } else {
                  imageUrls[[foundURL]] = uri;
                }
              })
          );
        }
        await Promise.all(storagePromises);
        console.log("imageUrls ", imageUrls);
        newOrderObject.images = imageUrls;
        newOrderObject.key = key;
        console.log("newOrderObject ", newOrderObject);
        console.log("keys ", key);
        const newSavedOrders = this.state.newSavedOrders;
        newSavedOrders.push(newOrderObject);
        this.setState({ newSavedOrders });
        console.log("newSavedOrders From Add ", newSavedOrders);
        firebase
          .database()
          .ref("users/" + domain + "/" + email + "/savedOrders/")
          .update({
            [[key]]: {
              images: Object.keys(newOrderObject.images || []),
              range: newOrderObject.range || null,
              timePreference: newOrderObject.timestamp || null,
              title: newOrderObject.title,
              thumbnail:
                newOrderObject.thumbnail.url.length > 1
                  ? newOrderObject.thumbnail.url
                  : null,
            },
          });
        const savedOrders = {};
        for (var i = 0; i < newSavedOrders.length; i++) {
          savedOrders[[newSavedOrders[i].key]] = newSavedOrders[i];
        }
        console.log("savedOrdes ", savedOrders);
        AsyncStorage.setItem("savedOrders", JSON.stringify(savedOrders));
      });
    });
    console.log("done");
    this.setState({loading : false})
    // savedOrders[[key]] = newOrderObject
    //     firebase
    // .database()
    // .ref("users/" + domain + "/" + email)
    // .update({
    //   savedOrders,
    // })
  };

  uriToBlob = async (uri) => {
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
      xhr.open("GET", uri, true);

      xhr.send(null);
    });
  };

  uploadToFirebase = async (blob, path) => {
    console.log("in upload");
    return firebase.storage().ref(`${path}`).put(blob, {
      contentType: "image/jpeg",
    });
  };

  deleteUri = async (path) => {
    console.log("path ", path);
    try {
      await FileSystem.deleteAsync(path, {});
    } catch (e) {
      console.log("ERROR deleting profile image in profile screen");
    }
  };

  downloadUrl = async (url, path, name) => {
    console.log("DOWNLOADINGGGGGGGGGGGGGGGGGGGGG");
    const callback = (downloadProgress) => {
      const progress =
        downloadProgress.totalBytesWritten /
        downloadProgress.totalBytesExpectedToWrite;
      // this.setState({
      //   downloadProgress: progress,
      // });
    };

    console.log("url ", url);
    await FileSystem.makeDirectoryAsync(
      FileSystem.documentDirectory + "savedOrders/" + path,
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
          "savedOrders/" +
          path +
          "/" +
          name +
          ".png",
        {},
        callback
      );
      console.log("Finished downloading to ", uri);
      return uri;
    } catch (e) {
      console.error(e);
    }
  };

  formatTimeStampForToday = (timestamp) => {
    const date = new Date();
    const hourMinuteDate = new Date(timestamp);
    const year = date.getFullYear();

    const month = date.getMonth();
    const day = date.getDate();
    const hour = hourMinuteDate.getHours();
    const minute = hourMinuteDate.getMinutes();
    var dateTimeStamp = new Date(year, month, day, hour, minute);
    if (dateTimeStamp.getTime() >= new Date().getTime()) {
      return dateTimeStamp.getTime();
    }
    return dateTimeStamp.getTime() + 86400000;
  };

  displayTime = (timestamp) => {
    if (timestamp > 1) {
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
      // console.log("getHours ", messageDate.getHours());
      var hour, minute, seconds;
      //2019 < 2020
      if (messageDate.getFullYear() == currentDate.getFullYear()) {
        if (messageDate.getMonth() == currentDate.getMonth()) {
          const difference = currentDate.getDate() - messageDate.getDate();
          if (difference < 7) {
            if (difference == 0) {
              hour = messageDate.getHours();
              var afterNoon = hour > 11 ? "PM" : "AM";
              hour =
                hour == 0 || hour == 12 ? "12" : hour > 12 ? hour - 12 : hour;

              minute = "0" + messageDate.getMinutes();
              var formattedTime =
                hour + ":" + minute.substr(-2) + " " + afterNoon;
              return formattedTime;
            } else if (difference == 1) {
              return "Yesterday";
            } else {
              return dayOfTheWeek[messageDate.getDay()];
            }
          }
        }
      }

      const month = messageDate.getMonth() + 1;
      const day = messageDate.getDate();
      const year = ("" + messageDate.getFullYear()).substr(-2);
      const formattedDate = month + "/" + day + "/" + year;
      return formattedDate;
    } else {
      return "";
    }
  };

  _start = (variableToChange, value, duration) => {
    console.log("oooooooooo");
    Animated.timing(variableToChange, {
      toValue: value,
      duration: duration,
    }).start();
  };

  _close = (variableToChange, value, duration) => {
    Animated.timing(variableToChange, {
      toValue: value,
      duration: duration,
    }).start();
  };

  render() {
    if (this.state.modalOn) {
      console.log("index modal ", this.state.indexModal);
      setTimeout(() => {
        if (this.state.indexModal != 0) {
          try {
            this._swiper.scrollBy(this.state.indexModal);
          } catch (e) {
            console.log("scrollby ", e);
          }
        }
      }, 1000);
    }
    var spaceLeftInRow = windowWidth - cardWidth;
    var nextAvailableIndex = 0;
    const items = ["REVIEW", "STATISTICS", "SCHEDULE", "SHARE"];
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => this.props.navigation.goBack(null)}>
            <AntDesign name="arrowleft" size={30} color="black" />
          </TouchableOpacity>
          <Text style={{ fontSize: 20 }}>Saved Orders</Text>
          <TouchableOpacity onPress={this.handleSignUp}>
            <Text style={{ fontSize: 20 }}>Finish</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={{ marginTop: this.state.loading ? 0 : 20 }}>
          <Grid style={{ width: windowWidth }}>
            {this.state.newSavedOrders.length == 0 && (
              <Row
                style={{
                  marginBottom: 20,
                  marginLeft:
                    (windowWidth -
                      (this.state.numbOfColumns * cardWidth +
                        this.state.numbOfColumns * 10)) /
                    2,
                }}
              >
                <Col style={styles.addItemContainer}>
                  <TouchableOpacity
                    onPress={() =>
                      this.setState({
                        indexModal: 0,
                        modalOn: true,
                        newOrder: true,
                      })
                    }
                    style={{alignItems:"center",justifyContent:"center"}}
                  >
                    <Ionicons name="md-add" size={100} color="black" />
                    <View style={{ marginTop: -15 }}>
                      <Text style={{ fontSize: 12 }}>Save Another Order!</Text>
                    </View>
                  </TouchableOpacity>
                </Col>
              </Row>
            )}
            {this.state.newSavedOrders.map((x, i) => {
              const whatsInRow = [];
              if (nextAvailableIndex == 0) {
                whatsInRow.push(-1);
              }

              if (nextAvailableIndex > i || i > nextAvailableIndex) {
                return;
              }

              for (
                var j = nextAvailableIndex;
                j < this.state.newSavedOrders.length;
                j++
              ) {
                console.log("ANTHONY ", this.state.newSavedOrders[j].width);
                if (spaceLeftInRow - cardWidth >= 0) {
                  nextAvailableIndex += 1;
                  spaceLeftInRow -= cardWidth;
                  whatsInRow.push(j);
                } else {
                  break;
                }
              }
              console.log("whatsInRow ", whatsInRow);
              console.log("currentIndex ", i);
              console.log("nextAvailableIndex ", nextAvailableIndex);
              spaceLeftInRow = windowWidth;
              console.log("i ", i);
              return (
                <Row
                  style={{
                    marginBottom: 20,
                    marginLeft:
                      (windowWidth -
                        (this.state.numbOfColumns * cardWidth +
                          this.state.numbOfColumns * 10)) /
                      2,
                  }}
                >
                  {whatsInRow.map((index) => {
                    const item = this.state.newSavedOrders[[index]];
                    if (index == -1) {
                      return (
                        <Col style={styles.addItemContainer}>
                          <TouchableOpacity
                            onPress={() =>
                              this.setState({
                                indexModal: 0,
                                modalOn: true,
                                newOrder: true,
                              })
                            }
                            style={{alignItems:"center",justifyContent:"center"}}
                          >
                            <Ionicons name="md-add" size={100} color="black" />
                            <View style={{ marginTop: -15 }}>
                              <Text style={{ fontSize: 12 }}>
                                Save Another Order!
                              </Text>
                            </View>
                          </TouchableOpacity>
                        </Col>
                      );
                    }
                    return (
                      <TouchableOpacity
                        onPress={() =>
                          this.setState({ modalOn: true, indexModal: index })
                        }
                        style={styles.itemContainer}
                      >
                        <ImageBackground
                          source={{
                            uri: this.state.newSavedOrders[[index]].thumbnail
                              .uri,
                          }}
                          imageStyle={{ borderRadius: 45 }}
                          style={{
                            height: cardHeight - 10,
                            resizeMode: "cover",
                          }}
                        >
                          <LinearGradient
                            // Background Linear Gradient
                            colors={[
                              "transparent",
                              "rgba(225,190,0,0.5)",
                              "#FFE300",
                            ]}
                            style={{
                              borderRadius: 40,
                              height: cardHeight - 10,
                              justifyContent: "flex-end",
                            }}
                          >
                            <Col
                              style={{ justifyContent: "flex-end", height: 90 }}
                            >
                              <Row
                                style={{
                                  height: 32,
                                  alignItems: "flex-end",
                                  justifyContent: "space-between",
                                  marginRight: 10,
                                }}
                              >
                                <Text
                                  style={{ fontSize: 30, fontWeight: "700" }}
                                  numberOfLines={1}
                                >
                                  {item.title}
                                </Text>
                                <Ionicons
                                  name="ios-arrow-forward"
                                  size={24}
                                  color="black"
                                />
                              </Row>
                              <Row
                                style={{
                                  alignItems: "flex-start",
                                  marginLeft: 9,
                                  marginRight: 10,
                                  height: 50,
                                }}
                              >
                                <Col>
                                  <View style={{ marginLeft: -3 }}>
                                    <Text
                                      style={{ fontSize: 15, color: "#4CBB17" }}
                                      numberOfLines={1}
                                    >
                                      $
                                      {item.range == undefined
                                        ? "N/A"
                                        : item.range}
                                    </Text>
                                  </View>
                                  <Text style={{ fontSize: 12, color: "gray" }}>
                                    {item.lastUsed}
                                  </Text>
                                </Col>
                                <TouchableWithoutFeedback
                                  onPressIn={() => {
                                    this._start(
                                      this.state.newSavedOrders[index].width,
                                      cardWidth,
                                      800
                                    );
                                  }}
                                  onPressOut={() => {
                                    if (
                                      cardWidth -
                                        this.state.newSavedOrders[
                                          index
                                        ].width.__getValue() <=
                                      10
                                    ) {
                                      this.setState({
                                        popupVisible: true,
                                        orderIndex: index,
                                      });
                                    }
                                    this._close(
                                      this.state.newSavedOrders[index].width,
                                      0
                                    );
                                  }}
                                >
                                  <View
                                    style={{
                                      width: 70,
                                      height: 40,
                                      borderRadius: 50,
                                      backgroundColor: "rgb(50,50,50)",
                                      justifyContent: "center",
                                      alignItems: "center",
                                    }}
                                  >
                                    <Text
                                      style={{
                                        fontSize: 17,
                                        color: "white",
                                        fontWeight: "bold",
                                      }}
                                    >
                                      Order
                                    </Text>
                                  </View>
                                </TouchableWithoutFeedback>
                              </Row>
                            </Col>
                            <Animated.View
                              style={{
                                position: "absolute",
                                backgroundColor: "white",
                                width: this.state.newSavedOrders[index].width,
                                height: 200,
                              }}
                              opacity={0.9}
                            ></Animated.View>
                          </LinearGradient>
                        </ImageBackground>
                      </TouchableOpacity>
                    );
                  })}
                </Row>
              );
            })}
          </Grid>
                  {this.state.loading && 
                <View style={{position:"absolute",backgroundColor:"rgba(177,177,177,0.5)",width:windowWidth,height:windowHeight,justifyContent: "center", alignItems: "center" }}>
          <Text>Loading...</Text>
          <ActivityIndicator size="large"></ActivityIndicator>
        </View>
        }
        </ScrollView>
        <PopupOrder
          navigation={this.props.navigation}
          popupVisible={this.state.popupVisible}
          fromSavedOrder={true}
          togglePopupVisibility={this.togglePopupVisibility}
          timestamp={this.formatTimeStampForToday(this.state.newSavedOrders[[this.state.orderIndex]] ?
            this.state.newSavedOrders[[this.state.orderIndex]].timestamp : 0
          )}
          imageNames={Object.values(this.state.newSavedOrders[[this.state.orderIndex]] ? 
            this.state.newSavedOrders[[this.state.orderIndex]].images : {}
          ).map((x, i) => i)}
          imageUris={Object.values(
            this.state.newSavedOrders[[this.state.orderIndex]] ?
            this.state.newSavedOrders[[this.state.orderIndex]].images : {}
          )}
          priceInputted={
            this.state.newSavedOrders[[this.state.orderIndex]] ? (
            isNaN(this.state.newSavedOrders[[this.state.orderIndex]].range)
              ? ""
              : this.state.newSavedOrders[[this.state.orderIndex]].range) : ""
          }
          rangeSelected={
            this.state.newSavedOrders[[this.state.orderIndex]] ? (
            !isNaN(this.state.newSavedOrders[[this.state.orderIndex]].range)
              ? ""
              : this.state.newSavedOrders[[this.state.orderIndex]].range) : ""
          }
        />
        <Modal
          testID={"modal"}
          coverScreen={true}
          hasBackdrop={true}
          isVisible={this.state.modalOn}
          animationInTiming={0.00000000000001}
          hideModalContentWhileAnimating={true}
          style={{
            alignItems: "center",
            justifyContent: "center",
          }}
          onModalWillShow={() => {
            this._start(this.state.animatedWidth, windowWidth, 400);
            this._start(this.state.animatedHeight, windowHeight, 400);
          }}
          onModalWillHide={() => {
            this._close(this.state.animatedWidth, 0, 200);
            this._close(this.state.animatedHeight, 0, 200);
          }}
          onBackdropPress={() => {
            this.setState({ modalOn: false });
            this._close(this.state.animatedWidth, 0, 200);
            this._close(this.state.animatedHeight, 0, 200);
            // this.props.togglePopupVisibility(false)
          }}
        >
          <Animated.View
            style={{
              overflow: "visible",
              height: this.state.animatedHeight,
              width: this.state.animatedWidth,
            }}
          >
            {/* <ScrollView
                      ref={(scrollView) => {
                        this.scrollView = scrollView;
                      }}
                      style={{ width: windowWidth }}
                      //pagingEnabled={true}
                      horizontal={true}
                      decelerationRate={0}
                      snapToOffsets={this.state.newSavedOrders.map(
                        (x, i) => i * (windowWidth - 60)
                      )}
                      snapToAlignment={"start"}
                      contentInset={{
                        top: 0,
                        left: 30,
                        bottom: 0,
                        right: 30,
                      }}
                    >

{this.state.newSavedOrders.map((element, index) => {
                return(
                  <View style={{flexDirection:"row",width:500,height:200,backgroundColor:index== 2 ? "blue" : "red"}}>
                <SpecificSavedOrder
                  rangeSelected={element.range || "N/A"}
                  elementKey={element.key}
                  index={index}
                  toggleShowSwiperButtons={this.toggleShowSwiperButtons}
                  exitSelectedOrderModal={this.exitSelectedOrderModal}
                  timestamp={element.timestamp}
                  imageUrls={element.images}
                  orderTitle={element.title}
                  updateOrderFirebase={this.updateOrderFirebase}
                  thumbnail={element.thumbnail.uri}
                />
                </View>
              )})}
                    </ScrollView> */}
            {this.state.newOrder ? (
              <SpecificSavedOrder
                newOrder={true}
                exitSelectedOrderModal={this.exitSelectedOrderModal}
                addSavedOrder={this.addSavedOrder}
              />
            ) : (
              <Swiper
                ref={(swiper) => {
                  this._swiper = swiper;
                }}
                bounce
                loop={false}
                showsButtons={this.state.showsButtons}
                onIndexChanged={this.setPage}
                style={{
                  overflow: "visible",
                  justifyContent: "center",
                  alignItems: "center",
                }}
                nextButton={
                  <Text style={{ fontSize: 75, color: "#007aff" }}>›</Text>
                }
                prevButton={
                  <Text style={{ fontSize: 75, color: "#007aff" }}>‹</Text>
                }
              >
                {this.state.newSavedOrders.map((element, index) => {
                  console.log("element.thumbnail", element.thumbnail);
                  return (
                    <View>
                      <SpecificSavedOrder
                        rangeSelected={element.range || "N/A"}
                        elementKey={element.key}
                        index={index}
                        toggleShowSwiperButtons={this.toggleShowSwiperButtons}
                        exitSelectedOrderModal={this.exitSelectedOrderModal}
                        timestamp={element.timestamp}
                        imageUrls={element.images}
                        orderTitle={element.title}
                        updateOrderFirebase={this.updateOrderFirebase}
                        deleteSavedOrder={this.deleteSavedOrder}
                        thumbnail={element.thumbnail.uri}
                      />
                    </View>
                  );
                })}
              </Swiper>
            )}
          </Animated.View>
        </Modal>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  addItemContainer: {
    backgroundColor: "#909090",
    borderStyle: "dashed",
    borderColor: "#5A5A5A",
    borderRadius: 45,
    borderWidth: 5,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 5,
    padding: 10,
    width: cardWidth,
    height: cardHeight,
  },
  itemContainer: {
    width: cardWidth,
    height: cardHeight,
    borderColor: "#FFE300",
    borderWidth: 5,
    borderRadius: 45,
    marginHorizontal: 5,
    backgroundColor: "#FFEB79",
  },
  submit: {
    width: 65,
    height: 45,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  yellowButton: {
    backgroundColor: "#FFDA00",
    borderWidth: 10,
    borderColor: "black",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    marginTop: 50,
    borderBottomWidth: 1,
    borderColor: "gray",
  },
  avatarPlaceholder: {
    width: 75,
    height: 75,
    borderRadius: 75,
    backgroundColor: "#E1E2E6",
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 60,
  },
});
