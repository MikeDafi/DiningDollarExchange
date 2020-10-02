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
import UserPermissions from "../../utilities/UserPermissions"
export default class HomeScreen extends React.Component {
  state = {
    email: "",
    displayName: "",
    page: 0,
    rendered: false,
    popupVisible: false,
  };

  async componentDidMount() {

    const { email, displayName } = firebase.auth().currentUser;
    this.setState({ email, displayName });
    const thisClass = this;

    const user = firebase.auth().currentUser;
    const start = (user || {}).email.indexOf("@");
    const end = (user || {}).email.indexOf(".edu");
    const domain = (user || {}).email.substring(start, end);
    const realEmail = (user || {}).email.substring(0, end);
    const token = await UserPermissions.getDeviceToken()
    firebase
      .database()
      .ref("/users/" + domain + "/" + realEmail + "/page")
      .once("value", function (pageSnapshot) {
        //1 console.log(pageSnapshot.val());
        thisClass.setState({
          page: pageSnapshot.val(),
          rendered: false,
        });
        //1 console.log("in component mount ", thisClass.state.page);
      });

    firebase.database().ref('users/' + domain +'/' + realEmail).update({
      expoToken : token == undefined ? null : token,
      active : true,
      // page: 0,
      // isBuyer:true,
      // isSeller:true,
      // name: firebase.auth().currentUser.displayName

    })

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
      const end = this.state.email.indexOf(".edu");
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
                  const user = firebase.auth().currentUser;
              const start = (user || {}).email.indexOf("@");
              const end = (user || {}).email.indexOf(".edu");
              const email = (user || {}).email.substring(0, end);
              const domain = (user || {}).email.substring(start, end);
    //1 console.log("-------------------------------------");
    if(notification.data.pendingOrders){
                  firebase
              .database()
              .ref("users/" + domain + "/" + realEmail + "/pendingOrders").once("value",(snapshot) => {
                if(snapshot.val()[[notification.data.orderNumber]] != undefined && 
                (snapshot.val()[[notification.data.orderNumber]]["status"] == "in-progress" || snapshot.val()[[notification.data.orderNumber]]["status"] == "completed")){
              const chatId = snapshot.val()[[notification.data.orderNumber]]["chatId"]

              const otherChatterEmail =
                chatId.substring(0, email.length) == email
                  ? chatId.substring(
                      email.length,
                      chatId.length
                    )
                  : chatId.substring(0, email.length);
              firebase
                .database()
                .ref("users/" + domain + "/" + otherChatterEmail)
                .once("value", (otherSnapshot) => {
                  this.props.navigation.navigate("Room", {
                    thread: chatId,
                    chattingUser: otherSnapshot.val().name,
                    otherChatterEmail: otherChatterEmail,
                  });
                });
                  }else{
                    this.props.navigation.navigate("PendingOrders")
                  }
              })
    }else if(notification.data.data.thread != undefined){
      this.props.navigation.navigate("Room", {
        thread: notification.data.data.thread,
        chattingUser: notification.data.data.name,
        otherChatterEmail: notification.data.data.otherChatterEmail,
      })
    }else{
      firebase.database().ref("orders/" + domain + "/currentOrders/").once("value",snapshot => {
        if(snapshot.val()[[notification.data.data.orderNumber]] == undefined){
          alert("The Order No Longer Exists")
        }else{
      this.props.navigation.navigate("SelectedOrderModal",{
        BuyerUid : notification.data.data.BuyerUid,
        orderNumber  : notification.data.data.orderNumber,
      })
        }
      })
    }
    // //1 console.log("in notification", notification.data.data.orderNumber);
    // const myUser = firebase
    //   .auth()
    //   .current(user || {}).email.substring(
    //     0,
    //     firebase.auth().currentUser.email.length - 4
    //   );
    // const start = myUser.indexOf("@");
    // const domain = this.state.email.substring(
    //   start,
    //   firebase.auth().currentUser.email.length - 4
    // );
    // //1 console.log("85");

    // firebase
    //   .database()
    //   .ref(
    //     "orders/" +
    //       domain +
    //       "/currentOrders/" +
    //       notification.data.data.orderNumber
    //   )
    //   .once("value", async (snapshot) => {
    //     ////1 console.log("snapshot","orders/"+domain + "/currentOrders/" + notification.data.data.orderNumber)
    //     const order = snapshot.val();
    //     if (order.status == "searching") {
    //       const name = "";
    //       firebase
    //         .database()
    //         .ref(
    //           "orders/" +
    //             domain +
    //             "/currentOrders/" +
    //             notification.data.data.orderNumber
    //         )
    //         .update({ status: "in-progress" });
    //       firebase
    //         .database()
    //         .ref(
    //           "users/" +
    //             domain +
    //             "/" +
    //             myUser +
    //             "/chats/seller/" +
    //             order.buyer +
    //             myUser +
    //             "/"
    //         )
    //         .set({
    //           timestamp: this.timestamp(),
    //           text: "Image",
    //         });
    //       firebase
    //         .database()
    //         .ref(
    //           "users/" +
    //             domain +
    //             "/" +
    //             order.buyer +
    //             "/chats/buyer/" +
    //             order.buyer +
    //             myUser +
    //             "/"
    //         )
    //         .set({
    //           timestamp: this.timestamp(),
    //           text: "Image",
    //         });
    //       const buyerSentMessage = order.buyer + "_hasSentMessage";
    //       firebase
    //         .database()
    //         .ref("/chats/" + domain + "/" + order.buyer + myUser)
    //         .update({ [buyerSentMessage]: true });

    //       var storageRef = firebase.storage().ref();
    //       const path =
    //         "/chats/" + domain + "/" + order.buyer + myUser + "/chat";
    //       // //1 console.log("path",path)
    //       const profileImagePath =
    //         "profilePics/" + domain + "/" + order.buyer + "/profilePic.jpg";
    //       // //1 console.log("profileImagePath",profileImagePath)

    //       // await firebase.storage().ref().child(profileImagePath).getDownloadURL().then((foundURL) => {
    //       //     this.setState({ profileImage: foundURL})
    //       // })
    //       //1 console.log("order");
    //       const promises = [];
    //       const orderImages = firebase
    //         .storage()
    //         .ref("tempPhotos/" + domain + "/" + order.buyer);
    //       for (var i = 0; i < notification.data.data.imageNames.length; i++) {
    //         // //1 console.log("length ",notification.data.data.imageNames.length)
    //         // //1 console.log("orderImages ", 'tempPhotos/' + domain + "/" + order.buyer)
    //         // //1 console.log("befor",notification.data.data.imageNames[i] + ".jpg")
    //         const name = notification.data.data.imageNames[i];
    //         // //1 console.log("orderImages ", 'tempPhotos/' + domain + "/" + order.buyer)
    //         const image = orderImages.child(
    //           notification.data.data.imageNames[i] + ".jpg"
    //         );
    //         ////1 console.log("BEFORE")
    //         promises.push(
    //           this.takePhotoFromTemp(
    //             image,
    //             path,
    //             name,
    //             notification.data.data.uid,
    //             name
    //           )
    //         );
    //       }

    //       const responses = await Promise.all(promises);
    //       //1 console.log("NEDDD");
    //     }
    //   });
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
            backgroundColor: this.state.page == 1 ? "#FFE300" : "white",
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
            backgroundColor: this.state.page == 0 ? "#FFE300" : "white",
            marginRight: -5,
            width: windowWidth / 2 - 60,
          },
        ]}
      >
        <Text>BUYER</Text>
      </View>
    );
  };

  setPage = (index) => {
    const user = firebase.auth().currentUser;
    const start = (user || {}).email.indexOf("@");
    const end = (user || {}).email.indexOf(".edu");
    const domain = (user || {}).email.substring(start, end);
    const email = (user || {}).email.substring(0, end);
    this.setState({ page: index });

    firebase
      .database()
      .ref("/users/" + domain + "/" + email)
      .update({ page: index });
  };

  togglePopupVisibility = (value) => {
    this.setState({ popupVisible: value });
    
  };
    setInfoModal = (buyer) => {
    if(buyer == 0){
      
      this.setState({buyerInfoVisible:true})
    }else{
      this.setState({sellerInfoVisible:true})
    }
  }

  // componentDidMount() {
  //     //1 console.log("uid",firebase.auth().currentUser.uid)
  //     const images = firebase.storage().ref().child('profilePics');
  //     //1 console.log("images",images)
  //     const image = images.child(firebase.auth().currentUser.uid + ".jpg");
  //     image.getDownloadURL().then((url) =>  this.setState({ avatar: url }));
  // }

infoModal = () =>{
    return(
      <View style={{width:windowWidth,height:windowHeight,justifyContent:"center",alignItems:"center",backgroundColor:"rgba(0,0,0,0.8)",position:"absolute"}}>
        <View style={{width:windowWidth - 50,height:300,backgroundColor: "white",borderRadius:50,justifyContent:'space-between'}}>
              <View style={{alignItems:"center"}}>
              <Text style={{fontSize:20,fontWeight:"bold"}}>{this.state.buyerInfoVisible ? "What Buyer Means?" : "What Seller Means"}</Text>   
              </View>
            <View style={{alignItems:"center"}}>
              {this.state.buyerInfoVisible ?
                <View style={{marginTop:5}}>
                <Text style={{fontSize:17}}>As Buyer, you pay 80% of any food you want in cash.</Text>
                <Text style={{fontSize:13}}>1. Make a "Buy Now" Request with images of Order</Text>
                <Text style={{fontSize:13}}>2. Seller will Accept and Confirm Order in your Messages.</Text>
                <Text style={{fontSize:13}}>3. Pay Seller 80% of actual price. Go pick up your food!</Text>
                </View>
              :
              
                <View style={{marginTop:5}}>
                <Text style={{fontSize:17}}>As Seller, You pay for the Buyer's meal. Buyer pays you 80% back. Better than 50% by UCSD's rate.</Text>
                <Text style={{fontSize:13}}>1. Accept an order in Seller Home Screen</Text>
                <Text style={{fontSize:13}}>2. Prepare to buy Order on Triton2Go then Confirm Order Price with Buyer in Messages.</Text>
                <Text style={{fontSize:13}}>3. Wait for Buyer to Pay you, then purchase Meal</Text>
                </View>
              }
            </View>
                              <TouchableOpacity
            onPress={() => this.setState({ buyerInfoVisible: false,sellerInfoVisible:false })}
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
    )
  }


  render() {
    LayoutAnimation.easeInEaseOut();
    if (!this.state.rendered) {
      this.setState({ rendered: true });
      if (this.state.page != 0) {
        try{
        this._swiper.scrollBy(1);
        }catch(e){
          //1 console.log("homescreen" , e)
        }
      }
    }

    return (
      <View style={styles.container}>
        <QuickOrder
          showWarning={true}
          _swiper={this._swiper}
          blackBackground={true}
          setPage={this.setPage}
          page={this.state.page}
          setInfoModal={this.setInfoModal}
          togglePopupVisibility={this.togglePopupVisibility}
        />

        <Swiper
          ref={(swiper) => {
            this._swiper = swiper;
          }}
          loop={false}
          bounces
          horizontal
          onIndexChanged={this.setPage}
          containerStyle={{flexDirection:"row"}}
          style={{flexDirection:"row"}}
        >
          <BuyerHomeScreen navigation={this.props.navigation} />
          <View style={{marginTop:70}}>
          <SellerHomeScreen navigation={this.props.navigation} />
          </View>
        </Swiper>

        <PopupOrder
          navigation={this.props.navigation}
          popupVisible={this.state.popupVisible}
          togglePopupVisibility={this.togglePopupVisibility}
        />
        {(this.state.buyerInfoVisible || this.state.sellerInfoVisible) && this.infoModal()}
      
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
