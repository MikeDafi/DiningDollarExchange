import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  AsyncStorage,
  Dimensions,
} from "react-native";
import * as firebase from "firebase";
// import {  FontAwesome } from "@expo/vector-icons";
import { FlatGrid } from "react-native-super-grid";
import FontAwesome from 'react-native-vector-icons/FontAwesome'
import AwesomeButton from "react-native-really-awesome-button";
import LottieView from "lottie-react-native";
import RatingUser from "./RatingUser";
const windowWidth = Dimensions.get("window").width;
const windowHeight = Dimensions.get("window").height;
import * as FileSystem from "expo-file-system";
import { Col, Row, Grid } from "react-native-easy-grid";
    const cardHeight = (windowHeight - 280) / 2;
    const cardWidth = (windowWidth - 20) / 2;
export default class BuyerHomeScreen extends React.Component {
  state = {
    currentFont: 20,
    clickedStars: false,
    starCount: 0,
    reviewAccount: {},
  };

  onStarRatingPress(rating) {
    const reviewAccount = this.state.reviewAccount
    if(rating == reviewAccount.starRating){
      reviewAccount.starRating = 0
      this.setState({clickedStars:false,reviewAccount})
    }else{
    reviewAccount.starRating = rating
      this.setState({clickedStars:true,reviewAccount})
  }
  }

  componentDidMount() {
    const user = firebase.auth().currentUser;
    const start = (user || {}).email.indexOf("@");
    const end = (user || {}).email.indexOf(".com");
    const domain = (user || {}).email.substring(start, end);
    const email = (user || {}).email.substring(0, end);
    var reviewAccount = {};
    firebase
      .database()
      .ref("users/" + domain + "/" + email + "/historyOrders")
      .on("value", (snapshot) => {
        reviewAccount = {};
        var buyer = 0
        while(buyer <= 1){
        const historyOrders = Object.keys((snapshot.val() || {})[buyer == 0 ? "buyer" : "seller"] || {}).reverse();
        const thread = (snapshot.val() || {})[buyer == 0 ? "buyer" : "seller"] 
        //1 console.log("historyOrders ", historyOrders)
        for (var i = 0; i < historyOrders.length; i++) {
          const daysLeftToReview = this.daysLeftToReview(
            thread[[historyOrders[i]]].timestamp
          );
          //1 console.log("daysLeft ",daysLeftToReview)
          //1 console.log("rating ",  thread[[historyOrders[i]]].rating)
          if (daysLeftToReview == null || thread[[historyOrders[i]]].rating != undefined) {
            break;
          } else {
            //1 console.log("here")
            reviewAccount = {
              chatId:  thread[[historyOrders[i]]].chatId,
              daysLeftToReview,
              key : historyOrders[i]
            };
          }
        }
        buyer += 1
        }



        //1 console.log("review Account ", reviewAccount)
        if (reviewAccount["chatId"] != undefined) {
          var otherChatterEmail = "";
          if (reviewAccount["chatId"].indexOf(email) == 0) {
            otherChatterEmail = reviewAccount["chatId"].substring(
              email.length,
              reviewAccount["chatId"].length
            );
          } else {
            otherChatterEmail = reviewAccount["chatId"].substring(
              0,
              reviewAccount["chatId"].length - email.length
            );
          }
          reviewAccount.otherChatterEmail = otherChatterEmail
          firebase
            .database()
            .ref("users/" + domain + "/" + otherChatterEmail)
            .once("value", async (snapshot) => {
              reviewAccount.name = snapshot.val().name;
              reviewAccount.starRating = 0
              let otherChattersProfileImages = await AsyncStorage.getItem(
                "otherChattersProfileImages"
              );
              otherChattersProfileImages = JSON.parse(
                otherChattersProfileImages
              );
              //1 console.log("before history ", otherChattersProfileImages);
              if (!otherChattersProfileImages) {
                otherChattersProfileImages = {};
              }

              if (snapshot.val().profileImageUrl) {
                if (
                  otherChattersProfileImages[[otherChatterEmail]] ==
                    undefined ||
                  !otherChattersProfileImages[[otherChatterEmail]].uri ||
                  otherChattersProfileImages[[otherChatterEmail]].url !=
                    snapshot.val().profileImageUrl
                ) {
                  if (
                    !otherChattersProfileImages[[otherChatterEmail]] &&
                    !otherChattersProfileImages[[otherChatterEmail]].uri
                  ) {
                    this.deleteUri(
                      otherChattersProfileImages[[otherChatterEmail]].uri
                    );
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
                    otherChattersProfileImages[
                      [otherChatterEmail]
                    ] = newProfileObject;
                    reviewAccount.imageUri =
                      otherChattersProfileImages[[otherChatterEmail]].uri;
                    AsyncStorage.setItem(
                      "otherChattersProfileImages",
                      JSON.stringify(otherChattersProfileImages)
                    );
                  } catch (e) {
                    //1 console.log(e);
                  }
                } else {
                  //1 console.log("already defined");
                  reviewAccount.imageUri =
                    otherChattersProfileImages[[otherChatterEmail]].uri;
                }
              }
              this.setState({reviewAccount})
            });
        }
      });
  }

  deleteUri = async (path) => {
    try {
      await FileSystem.deleteAsync(path, {});
    } catch (e) {
      //1 console.log("ERROR deleting profile image in profile screen");
    }
  };

  downloadUrl = async (url, name) => {
    //1 console.log("in download url");
    const callback = (downloadProgress) => {
      const progress =
        downloadProgress.totalBytesWritten /
        downloadProgress.totalBytesExpectedToWrite;
      // this.setState({
      //   downloadProgress: progress,
      // });
    };

    //1 console.log("url ", url);
    await FileSystem.makeDirectoryAsync(
      FileSystem.documentDirectory + "otherChattersProfileImages/",
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
          "otherChattersProfileImages/" +
          name +
          ".png",
        {},
        callback
      );
      //1 console.log("Finished downloading to ", uri);
      return uri;
    } catch (e) {
      console.error(e);
    }
  };

  daysLeftToReview(timestamp) {
    var messageDate = new Date(timestamp);
    var currentDate = new Date();
    const dayInSeconds = 51840000;
    var difference = currentDate.getTime() - messageDate.getTime();
    if (difference <= 362880000) {
      count = 7;
      while (difference >= 0) {
        difference -= dayInSeconds;
        count -= 1;
      }
      return count + " Days Left To Review";
    }
    return null;
  }

  reviewView = () => {
    //1 console.log("REVIEW ", this.state.reviewAccount)
    if(!this.state.reviewAccount.hasOwnProperty("chatId")){
      return(
      <View
        style={[styles.itemContainer, { height: (windowHeight - 280) / 2 }]}
      > 
      <Grid>
        <View style={{ alignItems: "center" }}>
          <Text style={{ fontSize: 20, fontWeight: "bold" }}>Review</Text>
        </View>
        <Row style={{justifyContent:"center",alignItems:"center"}}>
          <Text style={{ fontSize: 20, color: "gray",textAlign:"center" }}>No Available Orders To Reviews</Text>
        </Row>
        </Grid>
        </View>)
    }
    return (
      <View
        style={[styles.itemContainer, { height: (windowHeight - 280) / 2 }]}
      >
        <View style={{ alignItems: "center" }}>
          <Text style={{ fontSize: 20, fontWeight: "bold" }}>Review</Text>
          <RatingUser
            disabled={false}
            starSize={37}
            marginHorizontal={-3}
            starCount={this.state.reviewAccount.starRating || 0}
            selected={(rating) => this.onStarRatingPress(rating)}
          />
          <View style={styles.avatarPlaceholder}>
              <Image
                source={{ uri: this.state.reviewAccount.imageUri }}
                threshold={0}
                style={styles.avatar}
              />
            {/* <Image source={{uri : this.state.avatar}} style={styles.avatar}/>                        */}
          </View>
          <Text
            //currentFont={this.state.currentFont}
            //setState={(number) => this.setState({currentFont:number})}
            adjustsFontSizeToFit
            style={{ fontSize: this.state.currentFont }}
            onTextLayout={(e) => {
              const { lines } = e.nativeEvent;
              if (lines.length > 1) {
                this.setState({ currentFont: this.state.currentFont - 1 });
              }
            }}
          >
            {this.state.reviewAccount.name}
          </Text>
          <Text style={{ fontSize: 10 }}>{this.state.reviewAccount.daysLeftToReview}</Text>
        </View>
        <View style={{ flex: 1, justifyContent: "flex-end", marginBottom: 20 }}>
          <TouchableOpacity
            style={[
              styles.submit,
              { backgroundColor: this.state.clickedStars ? "black" : "gray" },
            ]}
            disabled={!this.state.clickedStars}
            onPress={() => this.setRating()}
          >
            <Text style={{ color: "yellow" }}>Submit</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };


  setRating = () => {
        const user = firebase.auth().currentUser;
    const start = (user || {}).email.indexOf("@");
    const end = (user || {}).email.indexOf(".com");
    const domain = (user || {}).email.substring(start, end);
    const email = (user || {}).email.substring(0, end);

      this.ref().child(buyer ? "buyer" : "seller").child(this.state.reviewAccount.key).update({rating : this.state.reviewAccount.starRating})
      firebase.database().ref("users/" + domain + "/" + this.state.reviewAccount.otherChatterEmail).once("value",snapshot => {
        var ratingFraction = snapshot.val().ratingFraction || ""
        var numerator = 0,denominator = 0;
        if(ratingFraction != ""){
        const slash = ratingFraction.indexOf("/")
        numerator = ratingFraction.substring(0,slash)
        denominator = ratingFraction.substring(slash + 1,ratingFraction.length)
        numerator = parseInt(numerator)
        denominator = parseInt(denominator)
        }
        numerator += this.state.reviewAccount.rating
        denominator += 5
        const newRating = (numerator / denominator) * 5
        firebase.database().ref("users/" + domain + "/" + this.state.reviewAccount.otherChatterEmail).update({
          ratingFraction : numerator + "/" + denominator,
          starRating : newRating
        })
      })
        
  }

  savedOrdersView = () => {
    return (
      <TouchableOpacity
        style={[
          styles.itemContainer,
          { height: (windowHeight - 280) / 2, alignItems: "center" },
        ]}
        onPress={() => {
          this.props.navigation.navigate("SavedOrders", {});
        }}
      >
        <Text style={{ fontSize: 20, fontWeight: "bold" }}>Saved Orders</Text>
        <Image
          source={require("../assets/savedOrdersIcon.png")}
          resizeMode="contain"
          style={{
            width: cardHeight > cardWidth ? cardWidth : cardHeight,
            height: cardHeight > cardWidth ? cardWidth : cardHeight,
          }}
        />
      </TouchableOpacity>
    );
  };

  scheduleView = () => {
    return (
      <View
        style={[
          styles.itemContainer,
          {
            height: (windowHeight - 280) / 2,
            justifyContent: "flex-end",
            alignItems: "center",
          },
        ]}
      >
        <FontAwesome name="bar-chart" size={150} color="black" />
        <Text style={{ fontSize: 20, fontWeight: "bold" }}>To be Built...</Text>
      </View>
    );
  };
  pendingOrdersView = () => {
    return (
      <TouchableOpacity
        style={[
          styles.itemContainer,
          {
            height: (windowHeight - 280) / 2,
            justifyContent: "flex-end",
            alignItems: "center",
          },
        ]}
        onPress={() => {
          this.props.navigation.navigate("PendingOrders", {});
        }}
      >

        {/* <LottieView
          style={{
            width: cardHeight > cardWidth ? cardWidth : cardHeight,
            height: cardHeight > cardWidth ? cardWidth : cardHeight,
            position: "absolute",
            marginTop: -3,
          }}
          source={require("../assets/hourGlass.json")}
          autoPlay
        /> */}
        <Text style={{ fontSize: 20, fontWeight: "bold" }}>Pending Orders</Text>
      </TouchableOpacity>
    );
  };

  render() {
    const items = ["REVIEW", "STATISTICS", "SCHEDULE", "SHARE"];

    return (
      <View style={styles.container}>
        {/* <FlatGrid
                    itemDimension={130}
                    data={items}
                    style={styles.gridView}
                    // staticDimension={300}
                    // fixed
                    // spacing={20}
                    renderItem={this.renderItem}
                /> */}
        <View
          style={{
            width: windowWidth,
            height: windowHeight - 280,
            marginTop: 50,
          }}
        >
          <Grid style={{ width: windowWidth }}>
            <Row style={{ marginBottom: 20 }} size={50}>
              <Col size={50}>{this.reviewView()}</Col>
              <Col size={50}>{this.savedOrdersView()}</Col>
            </Row>
            <Row size={50}>
              <Col size={50}>{this.scheduleView()}</Col>
              <Col size={50}>{this.pendingOrdersView()}</Col>
            </Row>
          </Grid>
        </View>
        <AwesomeButton
          style={{
            position: "absolute",
            left: windowWidth / 2 - 90,
            top: windowHeight / 2 - 180,
          }}
          onPress={() =>     this.props.navigation.navigate("Tutorial")}
          width={180}
          height={180}
          ripple={true}
          borderColor="black"
          borderWidth={16}
          raiseLevel={7}
          borderRadius={180}
          backgroundColor="#FFDA00"
          backgroundShadow="#B79D07"
          backgroundDarker="#B79D07"
          textSize={30}
          textColor="black"
        >
          Show Tutorial
        </AwesomeButton>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  itemContainer: {
    borderRadius: 45,
    marginHorizontal: 5,
    padding: 10,
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
    paddingHorizontal: 12,
    marginRight: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#D8D9D8",
    backgroundColor: "#FFDA00",
    marginTop: 20,
  },
  avatarPlaceholder: {
    width: 75,
    height: 75,
    borderRadius: 75,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 70,
  },
});
