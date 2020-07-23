import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Button,
  TouchableOpacity,
  LayoutAnimation,
  AppRegistry,
  Vibration,
  Image,
  Dimensions,
} from "react-native";
import * as firebase from "firebase";
import BuyerHomeScreen from "./BuyerHomeScreen";
import SellerHomeScreen from "./SellerHomeScreen";
import Swiper from "react-native-swiper/src";
import { Notifications } from "expo";
import PopupOrder from "./PopupOrder";
import QuickOrder from "./QuickOrder";
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
const windowWidth = Dimensions.get("window").width;
const windowHeight = Dimensions.get("window").height;
import * as Permissions from "expo-permissions";
import Constants from "expo-constants";

export default class HomeScreen extends React.Component {
  state = {
    email: "",
    displayName: "",
    homepage: 0,
    rendered: false,
    popupVisible: false,
  };

  componentDidMount() {
    const { email, displayName } = firebase.auth().currentUser;
    this.setState({ email, displayName });
    const thisClass = this;

    const user = firebase.auth().currentUser;
    const start = user.email.indexOf("@");
    const end = user.email.indexOf(".com");
    const domain = user.email.substring(start, end);
    const realEmail = user.email.substring(0, end);

    firebase
      .database()
      .ref("/users/" + domain + "/" + realEmail + "/page")
      .once("value", function (homepageSnapshot) {
        console.log(homepageSnapshot.val());
        thisClass.setState({
          homepage: homepageSnapshot.val(),
          rendered: false,
        });
        console.log("in component mount ", thisClass.state.homepage);
      });

    this.registerForPushNotificationsAsync();
    this._notificationSubscription = Notifications.addListener(
      this._handleNotification
    );
  }

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
    return new Promise((resolve, reject) => {
      var storageRef = firebase.storage().ref();
      let uid = (firebase.auth().currentUser || {}).uid;
      const start = this.state.email.indexOf("@");
      const end = this.state.email.indexOf(".com");
      const domain = this.state.email.substring(start, end);
      storageRef
        .child(`${path}.jpg`)
        .put(blob, {
          contentType: "image/jpeg",
        })
        .catch((error) => {
          reject(error);
        });
    });
  };

  timestamp = () => {
    return firebase.database.ServerValue.TIMESTAMP;
  };

  _handleNotification = (notification) => {
    console.log("-------------------------------------");
    console.log("in notification", notification.data.data.orderNumber);
    const myUser = firebase
      .auth()
      .currentUser.email.substring(
        0,
        firebase.auth().currentUser.email.length - 4
      );
    const start = myUser.indexOf("@");
    const domain = this.state.email.substring(
      start,
      firebase.auth().currentUser.email.length - 4
    );
    console.log("85");

    firebase
      .database()
      .ref(
        "orders/" +
          domain +
          "/currentOrders/" +
          notification.data.data.orderNumber
      )
      .once("value", async (snapshot) => {
        //console.log("snapshot","orders/"+domain + "/currentOrders/" + notification.data.data.orderNumber)
        const order = snapshot.val();
        if (order.status == "searching") {
          const name = "";
          firebase
            .database()
            .ref(
              "orders/" +
                domain +
                "/currentOrders/" +
                notification.data.data.orderNumber
            )
            .update({ status: "in-progress" });
          firebase
            .database()
            .ref(
              "users/" +
                domain +
                "/" +
                myUser +
                "/chats/seller/" +
                order.buyer +
                myUser +
                "/"
            )
            .set({
              timestamp: this.timestamp(),
              text: "Image",
            });
          firebase
            .database()
            .ref(
              "users/" +
                domain +
                "/" +
                order.buyer +
                "/chats/buyer/" +
                order.buyer +
                myUser +
                "/"
            )
            .set({
              timestamp: this.timestamp(),
              text: "image",
            });
          const buyerSentMessage = order.buyer + "_hasSentMessage";
          firebase
            .database()
            .ref("/chats/" + domain + "/" + order.buyer + myUser)
            .update({ [buyerSentMessage]: true });

          var storageRef = firebase.storage().ref();
          const path =
            "/chats/" + domain + "/" + order.buyer + myUser + "/chat";
          // console.log("path",path)
          const profileImagePath =
            "profilePics/" + domain + "/" + order.buyer + "/profilePic.jpg";
          // console.log("profileImagePath",profileImagePath)

          // await firebase.storage().ref().child(profileImagePath).getDownloadURL().then((foundURL) => {
          //     this.setState({ profileImage: foundURL})
          // })
          console.log("order");
          const promises = [];
          const orderImages = firebase
            .storage()
            .ref("tempPhotos/" + domain + "/" + order.buyer);
          for (var i = 0; i < notification.data.data.imageNames.length; i++) {
            // console.log("length ",notification.data.data.imageNames.length)
            // console.log("orderImages ", 'tempPhotos/' + domain + "/" + order.buyer)
            // console.log("befor",notification.data.data.imageNames[i] + ".jpg")
            const name = notification.data.data.imageNames[i];
            // console.log("orderImages ", 'tempPhotos/' + domain + "/" + order.buyer)
            const image = orderImages.child(
              notification.data.data.imageNames[i] + ".jpg"
            );
            //console.log("BEFORE")
            promises.push(
              this.takePhotoFromTemp(
                image,
                path,
                name,
                notification.data.data.uid,
                name
              )
            );
          }

          const responses = await Promise.all(promises);
          console.log("NEDDD");
        }
      });
  };

  takePhotoFromTemp = (image, path, name, uid, name1) => {
    image
      .getDownloadURL()
      .then((url) => {
        console.log("url ", url);
        this.uriToBlob(url).then((blob) => {
          this.uploadToFirebase(blob, path + name1);
          // console.log("here i am", path + name)
          var message = {
            text: "",
            image: url,
            timestamp: this.timestamp(),
            user: { _id: uid, name: name1 },
          };
          // console.log("message", message)
          firebase.database().ref(path).push(message);
        });
      })
      .catch((error) => {
        console.log(error);
      });
  };

  registerForPushNotificationsAsync = async () => {
    if (Platform.OS === "android") {
      Notifications.createChannelAndroidAsync("default", {
        name: "default",
        sound: true,
        priority: "max",
        vibrate: [0, 250, 250, 250],
      });
    }
  };

  nextButton = () => {
    return (
      <View
        style={[
          styles.nextButton,
          {
            backgroundColor: this.state.homepage == 1 ? "#FFE300" : "white",
            marginLeft: -5,
            width: windowWidth / 2 - 50,
          },
        ]}
      >
        <Text>SELLER</Text>
      </View>
    );
  };

  prevButton = () => {
    return (
      <View
        style={[
          styles.prevButton,
          {
            backgroundColor: this.state.homepage == 0 ? "#FFE300" : "white",
            marginRight: -5,
            width: windowWidth / 2 - 60,
          },
        ]}
      >
        <Text>BUYER</Text>
      </View>
    );
  };

  homepageIndexChanged = (index) => {
    const user = firebase.auth().currentUser;
    const start = user.email.indexOf("@");
    const end = user.email.indexOf(".com");
    const domain = user.email.substring(start, end);
    const email = user.email.substring(0, end);
    this.setState({ homepage: index });

    firebase
      .database()
      .ref("/users/" + domain + "/" + email)
      .update({ page: index });
  };

  togglePopupVisibility = (value) => {
    this.setState({ popupVisible: value });
  };

  // componentDidMount() {
  //     console.log("uid",firebase.auth().currentUser.uid)
  //     const images = firebase.storage().ref().child('profilePics');
  //     console.log("images",images)
  //     const image = images.child(firebase.auth().currentUser.uid + ".jpg");
  //     image.getDownloadURL().then((url) =>  this.setState({ avatar: url }));
  // }

  setHomePage = (value) => {
    this.setState({ homepage: value });
  };

  render() {
    LayoutAnimation.easeInEaseOut();
    if (!this.state.rendered) {
      this.setState({ rendered: true });
      if (this.state.homepage != 0) {
        this._swiper.scrollBy(1);
      }
    }
    return (
      <View style={styles.container}>
        <QuickOrder
          _swiper={this._swiper}
          blackBackground={true}
          setHomePage={this.setHomePage}
          homepage={this.state.homepage}
          togglePopupVisibility={this.togglePopupVisibility}
        />

        <Swiper
          ref={(swiper) => {
            this._swiper = swiper;
          }}
          loop={false}
          onIndexChanged={this.homepageIndexChanged}
        >
          <BuyerHomeScreen navigation={this.props.navigation} />
          <SellerHomeScreen navigation={this.props.navigation} />
        </Swiper>

        <PopupOrder
          navigation={this.props.navigation}
          popupVisible={this.state.popupVisible}
          togglePopupVisibility={this.togglePopupVisibility}
        />
      </View>
    );
  }
}

AppRegistry.registerComponent("myproject", () => SwiperComponent);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 30,
    backgroundColor: "black",
  },
  nextButton: {
    width: 150,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  prevButton: {
    width: 150,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    backgroundColor: "white",
    justifyContent: "flex-end",
    alignItems: "center",
    borderRadius: 4,
    height: 300,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
  contentTitle: {
    fontSize: 20,
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 50,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 50,
    borderWidth: 10,
    backgroundColor: "#E1E2E6",
    alignItems: "center",
  },
  // avatar:{
  //     position:"absolute",
  //     width:50,
  //     height:50,
  //     borderRadius:50,

  // },
});
