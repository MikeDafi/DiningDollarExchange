import Modal from "react-native-modal";
import React, { useCallback, useState } from "react";
import { AntDesign } from "@expo/vector-icons";
import AwesomeButton from "react-native-really-awesome-button";
import {
  CameraRoll,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  LayoutAnimation,
  AppRegistry,
  TextInput,
  Keyboard,
  Dimensions,
  KeyboardAvoidingView,
} from "react-native";
const windowWidth = Dimensions.get("window").width;
const windowHeight = Dimensions.get("window").height;
import { ImageBrowser } from "expo-multiple-media-imagepicker";
import UserPermissions from "../../utilities/UserPermissions";
import UploadImages from "./UploadImages";
import { Button } from "react-native-elements";
import { Col, Row, Grid } from "react-native-easy-grid";
import * as firebase from "firebase";
import Image from "react-native-image-progress";
import SwipeButton from "rn-swipe-button";
import arrowRight from "./arrowRight.png";
import DatePicker from "react-native-datepicker";

// import * as admin from 'firebase-admin';
//   var firebaseConfig = {
//     credential: admin.credential.applicationDefault(),
//     apiKey: "AIzaSyDPi80ilddhtCh9wfPIxT5YLt8hLa1zZoM",
//     authDomain: "diningdollarreactnative.firebaseapp.com",
//     databaseURL: "https://diningdollarreactnative.firebaseio.com",
//     projectId: "diningdollarreactnative",
//     storageBucket: "diningdollarreactnative.appspot.com",
//     messagingSenderId: "529283379449",
//     appId: "1:529283379449:web:aaea13bb1526e3b182b228"
//   };
//  admin.initializeApp(firebaseConfig);

export default class PopupOrder extends React.Component {
  state = {
    rangeSelected: "",
    imageNames: [],
    imageUris: [],
    numberOfPhotosSelected: 0,
    uploadImagesVisible: false,
    findASellerClicked: false,
    rendered: false,
    rangeError: "",
    imageBrowser: true,
    timeSelected: "",
    invalidTime: false,
    minDate: "",
    maxDate: "",
    date: "",
    dateTimeStamp: "",
    priceInputted: "",
  };

  sendSingleNotification = async (token, orderNumber) => {
    const user = firebase.auth().currentUser;
    const uid = user.uid;
    console.log("imgeNames", this.state.imageNames);
    console.log("order Number From Buyer ", orderNumber);
    const message = {
      to: token,
      sound: "default",
      title: "Be a Seller!",
      body: "Earn " + (this.state.rangeSelected == "" ? Math.ceil(parseInt(this.state.priceInputted) * 0.8): this.state.rangeSelected),
      data: {
        data: {
          orderNumber: orderNumber,
          BuyerUid: firebase.auth().currentUser.uid,
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

  sendAllNotifications = async (orderNumber) => {
    console.log("in all notifications");
    var user = firebase.auth().currentUser;
    console.log("orderNumber", orderNumber);
    const thisReference = this;
    const start = user.email.indexOf("@");
    const end = user.email.indexOf(".com");
    const domain = user.email.substring(start, end);
    const thisUserEmail = user.email.substring(0, end); //so we don't send notification to self
    firebase
      .database()
      .ref("users/" + domain + "/")
      .once("value", function (domainAccounts) {
        domainAccounts.forEach((user) => {
          var userInfo = user.val();
          if (user.key != thisUserEmail) {
            console.log("found notification");
            thisReference.sendSingleNotification(
              userInfo.expoToken,
              orderNumber
            );
          }
        });
      });
  };

  uriToBlob = async (text) => {
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

  uploadToFirebase = async (blob, name) => {
    console.log("in upload");
    const user = firebase.auth().currentUser;
    const start = user.email.indexOf("@");
    const end = user.email.indexOf(".com");
    const domain = user.email.substring(start, end);
    const email = user.email.substring(0, end);
    return firebase
      .storage()
      .ref(`/tempPhotos/${domain}/${email}/${name}.jpg`)
      .put(blob, {
        contentType: "image/jpeg",
      });
  };
  generateRandomString = () => {
    return Math.random().toString().substr(2, 20);
  };

  photoCallback = async (params) => {
    console.log("photoCallback");
    this.setState({ uploadImagesVisible: false });
    if (params == null) {
      return;
    }
    console.log("here ");
    var imageNames = [];
    var imageUris = [];
    await params.then(async (images) => {
      for (var i = 0; i < images.length; i++) {
        console.log("imageHappened");
        let name = this.generateRandomString();
        imageNames.push(name);
        imageUris.push(images[i].uri);
      }
    });
    console.log("imageNames", imageNames.length);
    this.setState({
      imageNames,
      imageUris,
      numberOfPhotosSelected: imageNames.length,
    });
  };

  findASeller = () => {
    this.setState({ findASellerClicked: true });
    if (this.state.rangeSelected == "" && this.state.priceInputted == "") {
      this.setState({ rangeError: "*Input Price or Select Range*" });
      return;
    }
    if (this.state.imageUris.length == 0) {
      return;
    }
    console.log("imageUris", this.state.imageUris);
    this.props.togglePopupVisibility(false);
    const user = firebase.auth().currentUser;
    const start = user.email.indexOf("@");
    const end = user.email.indexOf(".com");
    const domain = user.email.substring(start, end);
    const orders = firebase.database().ref("orders/" + domain);

    var orderNumberForNotification = 0;
    orders.once("value", async (orderSnapshot) => {
      var orderNumberNow = 0;
      var currentOrdersNow = {};

      if (orderSnapshot.val() != undefined || orderSnapshot.val() != null) {
        const values = orderSnapshot.val();
        orderNumberNow = values.orderNumber || 0;
        currentOrdersNow = values.currentOrders || {};
      }
      const uriToBlobPromises = [];
      const uploadToFirebasePromises = [];
      for (var i = 0; i < this.state.imageUris.length; i++) {
        console.log("uri", this.state.imageUris[i]);
        console.log("name", this.state.imageNames[i]);
        const uri = this.state.imageUris[i];
        const name = this.state.imageNames[i];
        uriToBlobPromises.push(
          this.uriToBlob(uri, i).then((blob) => {
            uploadToFirebasePromises.push(
              this.uploadToFirebase(blob, name).then(() => {
                console.log("Hi there");
              })
            );
          })
        );
      }

      Promise.all(uriToBlobPromises).then(() => {
        Promise.all(uploadToFirebasePromises).then(() => {
          console.log("time");
          console.log("in popup order");
          const newOrder = {
            buyer: user.email.substring(0, user.email.length - 4),
            status: "searching",
            rangeSelected: this.state.rangeSelected == "" ? this.state.priceInputted : this.state.rangeSelected,
            imageNames: this.state.imageNames,
            timeSelected: this.state.dateTimeStamp,
            buyerUid: firebase.auth().currentUser.uid,
          };
          currentOrdersNow[[orderNumberNow]] = newOrder;
          orderNumberForNotification = orderNumberNow;
          orderNumberNow += 1;
          orders.set({
            currentOrders: currentOrdersNow,
            orderNumber: orderNumberNow,
          });

          setTimeout(() => {
            this.sendAllNotifications(orderNumberForNotification);
          }, 1000);
          // setTimeout(() => {
          //     orders.child("currentOrders/" + orderNumberForNotification).once("value",(orderSnapshot)=>{
          //         orders.child("currentOrders/").update({[orderNumberForNotification]:null})
          //         const email = user.email.substring(0,end)
          //         // Create a reference to the file to delete
          //         console.log("mickey mouse",email)
          //         for(var i = 0; i < this.state.imageNames.length; i++){
          //             console.log("/tempPhotos/"+domain+"/"+email +"/"+this.state.imageNames[i] + ".jpg")
          //             var imageRef = firebase.storage().ref(`/tempPhotos/${domain}/${email}/${this.state.imageNames[i]}.jpg`);

          //             // Delete the file
          //             imageRef.delete().then(function() {

          //             }).catch(function(error) {
          //             // Uh-oh, an error occurred!
          //             });
          //         }
          //     })
          // }, 200000);
        });
      });
    });

    this.props.navigation.navigate("Home");
  };

  onOpenModal = () => {
    const date = new Date();
    const is28or30or31Days =
      date.getMonth() == 1
        ? 28
        : date.getMonth() <= 6
        ? date.getMonth() % 2 == 0
          ? 31
          : 30
        : date.getMonth() % 2 == 0
        ? 30
        : 31;
    console.log(is28or30or31Days);
    const weekFromNowDays =
      date.getDate() + 7 == is28or30or31Days
        ? is28or30or31Days
        : (date.getDate() + 7) % is28or30or31Days;
    const weekFromNowMonth =
      is28or30or31Days - 7 < 7
        ? date.getMonth()
        : date.getMonth() == 11
        ? 1
        : date.getMonth() + 1;
    const maxDate =
      weekFromNowMonth +
      "-" +
      weekFromNowDays +
      "-" +
      date.getHours() +
      "-" +
      date.getMinutes();
    const minDate =
      date.getMonth() +
      1 +
      "-" +
      date.getDate() +
      "-" +
      date.getHours() +
      "-" +
      date.getMinutes();
    this.setState({ minDate, maxDate });
  };

  rangeSelected = (value) => {
    this.setState({
      priceInputted: "",
      rangeError:
        (this.state.rangeSelected == value ? "" : value) == "" &&
        this.state.findASellerClicked
          ? "*Input Price of Select Range*"
          : "",
      rangeSelected: this.state.rangeSelected == value ? "" : value,
    });
  };

  render() {
    const firstColumnWidth = windowWidth / 4;
    const secondColumnWidth = windowWidth - firstColumnWidth;
    if (this.state.rendered && !this.props.popupVisible) {
      this.setState({
        rendered: false,
      });
    }

    if (this.props.popupVisible && !this.state.rendered) {
      this.onOpenModal();
      this.setState({
        rendered: true,
        rangeSelected: "",
        date: "",
        rangeError: "",
        imageNames: [],
        imageUris: [],
        numberOfPhotosSelected: 0,
        uploadImagesVisible: false,
        findASellerClicked: false,
      });
    }

    // const date = new Date()
    // const is28or30or31Days = date.getMonth() == 1 ? 28 :
    //                         (date.getMonth() <= 6 ? (date.getMonth() % 2 == 0 ? 31 : 30)
    //                          :   (date.getMonth() % 2 == 0 ? 30 : 31))
    // console.log(is28or30or31Days)
    // const weekFromNowDays = (date.getDate() + 7) == is28or30or31Days ? is28or30or31Days : (date.getDate() + 7) % is28or30or31Days
    // const weekFromNowMonth = is28or30or31Days - 7 < 7 ? date.getMonth() : (date.getMonth() == 11 ? 1 : date.getMonth() + 1 )
    // const fromNow = weekFromNowMonth  + "-" + weekFromNowDays + "-"+  date.getHours() + "-" + date.getMinutes()
    // console.log("fromNow ",fromNow)
    // console.log("now ", date.getMonth() + "-" + date.getDate() + "-" + date.getHours() + "-" +date.getMinutes())
    return (
      <View>
        <Modal
          testID={"modal"}
          coverScreen={true}
          hasBackdrop={true}
          isVisible={this.props.popupVisible}
          onBackdropPress={() => {
            this.props.togglePopupVisibility(false);
          }}
          animationIn="slideInLeft"
          animationInTiming={500}
          style={{
            justifyContent: this.state.inTextInput ? "center" : "flex-end",
            padding: 0,
            margin: 0,
          }}
        >
          <View style={styles.content}>
            <Grid>
              <Row style={styles.rowStyle}>
                <Col style={[styles.label, { width: firstColumnWidth }]}>
                  <TouchableOpacity
                    onPress={() => {
                      this.setState({
                        imageNames: [],
                        uploadImagesVisible: true,
                      });
                      UserPermissions.getCameraPermission();
                      UserPermissions.getDeviceToken();
                      // this.props.navigation.navigate("UploadImages",{photoCallb: this.photoCallback})
                    }}
                  >
                    <Text style={styles.text}>Select</Text>
                    <Text style={styles.text}>Images</Text>
                  </TouchableOpacity>
                </Col>
                {this.state.imageUris.length != 0 ? (
                  <Col style={{ flexDirection: "row" }}>
                    {this.state.imageUris.map((item, i) => {
                      if (i == 3) {
                        if (this.state.imageUris.length == 4) {
                          return (
                            <Image
                              style={[
                                styles.imageSelected,
                                { width: secondColumnWidth / 5 },
                              ]}
                              source={{ uri: item }}
                              key={i}
                            />
                          );
                        } else {
                          return (
                            <View key={i} style={{ flexDirection: "row" }}>
                              <Image
                                style={[
                                  styles.imageSelected,
                                  { width: secondColumnWidth / 5 },
                                ]}
                                source={{ uri: item }}
                              />
                              <View
                                style={[
                                  styles.imageSelected,
                                  {
                                    marginLeft: -(secondColumnWidth / 5) - 5,
                                    width: secondColumnWidth / 5,
                                    justifyContent: "center",
                                    alignItems: "center",
                                    backgroundColor: "rgba(162,162,162,0.7)",
                                  },
                                ]}
                              >
                                <Text style={{ fontSize: 20 }}>
                                  {this.state.imageUris.length - 4}+
                                </Text>
                              </View>
                            </View>
                          );
                        }
                      } else if (i <= 2) {
                        return (
                          <Image
                            style={[
                              styles.imageSelected,
                              { width: secondColumnWidth / 5 },
                            ]}
                            source={{ uri: item }}
                            key={i}
                          />
                        );
                      }
                    })}
                  </Col>
                ) : (
                  <Col
                    style={{
                      justifyContent: "center",
                      alignItems: "center",
                      marginLeft: -(secondColumnWidth / 4 - 50),
                    }}
                  >
                    <Text style={{ fontSize: 20, color: "gray" }}>
                      No Images Selected
                    </Text>
                    <Text
                      style={{
                        fontSize: 10,
                        color:
                          this.state.findASellerClicked &&
                          this.state.imageUris.length == 0
                            ? "black"
                            : "gray",
                        fontWeight:
                          this.state.findASellerClicked &&
                          this.state.imageUris.length == 0
                            ? "bold"
                            : "normal",
                      }}
                    >
                      *Select at Least One*
                    </Text>
                  </Col>
                )}
              </Row>
              <Row style={styles.rowStyle}>
                <Col style={[styles.label, { width: firstColumnWidth }]}>
                  <Text style={styles.text}>Price</Text>
                  <Text style={styles.text}>Range</Text>
                </Col>
                <Col style={{ width: secondColumnWidth / 4 }}>
                  <Row
                    style={{
                      width: secondColumnWidth / 4,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ fontSize: 20 }}>$</Text>
                    <TextInput
                      style={{
                        backgroundColor: "white",
                        borderRadius: 4,
                        padding: 8,
                        width: secondColumnWidth / 4,
                        borderWidth: 3,
                        height: 50,
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
                        this.setState({ inTextInput: true });
                      }}
                      onEndEditing={() => {
                        const amount = isNaN(this.state.priceInputted);
                        console.log("amount ", amount);
                        if (amount) {
                          this.setState({
                            rangeError: "Price is not a Number",
                          });
                        } else if (parseInt(this.state.priceInputted) < 1) {
                          this.setState({ rangeError: "Price too Small" });
                        } else if (parseInt(this.state.priceInputted) > 100) {
                          this.setState({ rangeError: "Price is too Big" });
                        } else {
                          this.setState({ rangeError: "" });
                        }
                        this.setState({
                          inTextInput: false,
                          rangeSelected: "",
                        });
                      }}
                      autoCapitalize="none"
                      onSubmitEditing={Keyboard.dismiss}
                      onChangeText={(field) => {
                        this.setState({ priceInputted: field });
                      }}
                      value={this.state.priceInputted}
                    />
                    <Text> or</Text>
                  </Row>
                </Col>
                <Col
                  style={{
                    height: 50,
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <TouchableOpacity
                    activeOpacity={0}
                    onPress={() => {
                      this.rangeSelected("1 to 5");
                      console.log("rangeSelected", this.state.rangeSelected);
                    }}
                    style={[
                      styles.rangeButton,
                      {
                        width: secondColumnWidth / 5,
                        borderBottomWidth:
                          this.state.rangeSelected == "1 to 5" ? 5 : 0,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        fontWeight:
                          this.state.rangeSelected == "1 to 5"
                            ? "bold"
                            : "normal",
                      }}
                    >
                      1 to 5
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0}
                    onPress={() => {
                      this.rangeSelected("5 to 10");
                      console.log("rangeSelected", this.state.rangeSelected);
                    }}
                    style={[
                      styles.rangeButton,
                      {
                        width: secondColumnWidth / 5,
                        borderBottomWidth:
                          this.state.rangeSelected == "5 to 10" ? 5 : 0,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        fontWeight:
                          this.state.rangeSelected == "5 to 10"
                            ? "bold"
                            : "normal",
                      }}
                    >
                      5 to 10
                    </Text>
                  </TouchableOpacity>
                </Col>
                <Col
                  style={{
                    height: 50,
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <TouchableOpacity
                    activeOpacity={0}
                    onPress={() => {
                      this.rangeSelected("10 to 15");
                      console.log("rangeSelected", this.state.rangeSelected);
                    }}
                    style={[
                      styles.rangeButton,
                      {
                        width: secondColumnWidth / 5,
                        borderBottomWidth:
                          this.state.rangeSelected == "10 to 15" ? 5 : 0,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        fontWeight:
                          this.state.rangeSelected == "10 to 15"
                            ? "bold"
                            : "normal",
                      }}
                    >
                      10 to 15
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0}
                    onPress={() => {
                      this.rangeSelected("15+");
                      console.log("rangeSelected", this.state.rangeSelected);
                    }}
                    style={[
                      styles.rangeButton,
                      {
                        width: secondColumnWidth / 5,
                        borderBottomWidth:
                          this.state.rangeSelected == "15+" ? 5 : 0,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        fontWeight:
                          this.state.rangeSelected == "15+" ? "bold" : "normal",
                      }}
                    >
                      15+
                    </Text>
                  </TouchableOpacity>
                </Col>
                <Text
                  style={{
                    position: "absolute",
                    left: firstColumnWidth + (secondColumnWidth/2) - 70,
                    bottom:3,
                    fontWeight: "bold",
                    fontSize: 10,
                  }}
                >
                  {this.state.rangeError}
                </Text>
              </Row>
              <Row style={styles.rowStyle}>
                <Col style={{ justifyContent: "center" }}>
                  <DatePicker
                    onOpenModal={this.onOpenModal}
                    style={{ width: 200 }}
                    is24Hour={false}
                    date={this.state.date}
                    mode="datetime"
                    placeholder="Select Date"
                    format={"MM/DD HH:mm A"}
                    minDate={this.state.minDate}
                    maxDate={this.state.maxDate}
                    confirmBtnText="Confirm"
                    cancelBtnText="Cancel"
                    customStyles={{
                      btnTextConfirm: {
                        fontWeight: "bold",
                        color: "#FFE300",
                      },
                      dateIcon: {
                        position: "absolute",
                        left: 0,
                        top: 4,
                        marginLeft: 0,
                      },
                      dateInput: {
                        marginLeft: 36,
                      },
                      // ... You can check the source to find the other keys.
                    }}
                    onDateChange={(date) => {
                      console.log("date ");
                      const year = new Date().getFullYear();
                      const array = date
                        .split(" ")
                        .join(",")
                        .split("/")
                        .join(",")
                        .split(":")
                        .join(",")
                        .split(",");
                      const month = parseInt(array[0]) - 1;
                      const day = parseInt(array[1]);
                      const hour =
                        array[4] == "AM"
                          ? array[2] == "12"
                            ? 12
                            : parseInt(array[2])
                          : array[2] != "12"
                          ? parseInt(array[2]) + 12
                          : 12;
                      const minute = array[3];
                      console.log("year ", year);
                      console.log("month ", month);
                      console.log("day ", day);
                      console.log("hour ", hour);
                      console.log("minute ", minute);
                      var dateTimeStamp = new Date(
                        year,
                        month,
                        day,
                        hour,
                        minute
                      );
                      dateTimeStamp = dateTimeStamp.getTime();
                      console.log("new Date ", new Date().getTime());
                      if (dateTimeStamp <= new Date().getTime()) {
                        this.setState({ invalidTime: true });
                      } else {
                        this.setState({ invalidTime: false });
                      }
                      console.log("dateTimeStamp ", dateTimeStamp);

                      this.setState({ date: date, dateTimeStamp });
                      console.log("date", date);
                    }}
                    getDateStr={(props) => {
                      console.log("props ", props);

                      const date = new Date(props);
                      const amOrPm = date.getHours() >= 12 ? "PM" : "AM";
                      const hour =
                        date.getHours() == 0
                          ? 0
                          : date.getHours() > 12
                          ? date.getHours() % 12
                          : date.getHours();
                      const day = date.getDate();
                      const month = date.getMonth() + 1;
                      const minute = date.getMinutes();
                      return (
                        month +
                        "/" +
                        day +
                        " " +
                        hour +
                        ":" +
                        minute +
                        " " +
                        amOrPm
                      );
                    }}
                    //   TouchableComponent={() => (
                    //         <Text>Time Expected</Text>
                    //   )}
                  />
                  {this.state.invalidTime && (
                    <Text
                      style={{
                        fontSize: 10,
                        color: "black",
                        fontWeight: "bold",
                      }}
                    >
                      *Invalid Time*
                    </Text>
                  )}
                </Col>
              </Row>
              <Row style={{ height: 58, justifyContent: "center" }}>
                <SwipeButton
                  width={windowWidth - 25}
                  swipeSuccessThreshold={100}
                  onSwipeSuccess={() => {
                    this.findASeller();
                  }}
                  onSwipeFail={() => console.log("onSwipeFail")}
                  thumbIconStyles={{
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                  thumbIconImageSource={arrowRight}
                  thumbIconBackgroundColor="white"
                  thumbIconBorderColor="black"
                  title={
                    this.state.imageUris.length == 0 ||
                    this.state.rangeSelected == ""
                      ? "*Complete Above*"
                      : "Swipe to Submit"
                  }
                  railBackgroundColor="white"
                  renderMessageImage={null}
                  railFillBorderColor="black"
                  railFillBackgroundColor="black"
                  disabled={
                    this.state.rangeSelected == "" ||
                    this.state.imageUris.length == 0
                      ? false
                      : false
                  }
                />
              </Row>
            </Grid>
            <TouchableOpacity
              onPress={() => {
                this.props.togglePopupVisibility(false);
                this.setState({ imageNames: [] });
              }}
              style={{ position: "absolute", left: windowWidth - 50, top: -50 }}
            >
              <AntDesign name="close" size={50} color="white" />
            </TouchableOpacity>
          </View>

          <UploadImages
            isVisible={this.state.uploadImagesVisible}
            photoCallb={this.photoCallback}
          />
        </Modal>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  rangeButton: {
    marginHorizontal: 5,
    justifyContent: "center",
    alignItems: "center",
    height: 20,
    borderColor: "black",
    backgroundColor: "white",
  },
  content: {
    backgroundColor: "white",
    borderRadius: 4,
    height: 300,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
  contentTitle: {
    fontSize: 20,
    marginBottom: 12,
  },
  label: {
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    color: "#008DB6",
  },
  imageSelected: {
    margin: 5,
    height: 50,
  },
  rowStyle: {
    height: 75,
    borderBottomWidth: 0.5,
    alignItems: "center",
  },
});
