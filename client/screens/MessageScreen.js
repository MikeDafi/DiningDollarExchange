import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  LayoutAnimation,
  Dimensions,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons, FontAwesome5, FontAwesome } from "@expo/vector-icons";
import { List, Divider } from "react-native-paper";
import firebase from "../../config";
import Loading from "./LoadingScreen";
import PopupOrder from "./PopupOrder";
import Swiper from "react-native-swiper/src";
import QuickOrder from "./QuickOrder";
const windowWidth = Dimensions.get("window").width;
const windowHeight = Dimensions.get("window").height;
import { Col, Row, Grid } from "react-native-easy-grid";
export default class MessageScreen extends React.Component {
  state = {
    threadsBuyer: [],
    threadsSeller: [],
    loading: true,
    page: 0,
    domain: "",
    homepage: 0,
    date: new Date(),
    popupVisible: false,
    clickedBuyer: [],
    clickedSeller: [],
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

  setHomePage = (value) => {
    this.setState({ homepage: value });
  };

  ref = () => {
    const user = firebase.auth().currentUser;
    const start = user.email.indexOf("@");
    const end = user.email.indexOf(".com");
    const domain = user.email.substring(start, end);
    return firebase
      .database()
      .ref(
        "/users/" +
          domain +
          "/" +
          firebase
            .auth()
            .currentUser.email.substring(
              0,
              firebase.auth().currentUser.email.length - 4
            ) +
          "/chats/"
      );
  };

  keepUpdatedList = async (isBuyer) => {
    const buyer = isBuyer ? "buyer" : "seller";
    const user = firebase.auth().currentUser;
    const start = user.email.indexOf("@");
    const end = user.email.indexOf(".com");
    const domain = user.email.substring(start, end);
    const email = user.email.substring(0, end);
    console.log("in message screen");
    console.log(
      "/users/" +
        domain +
        "/" +
        firebase
          .auth()
          .currentUser.email.substring(
            0,
            firebase.auth().currentUser.email.length - 4
          ) +
        "/chats/"
    );
    await this.ref()
      .child(buyer)
      .orderByChild("timestamp")
      .on("value", async (chatsSnapshot) => {
        console.log("chatsSnapshot", chatsSnapshot);
        var threadss = [];
        var count = 0;
        var thread = {};
        const promises = [];
        chatsSnapshot.forEach((chat) => {
          var otherChatterEmail;
          console.log("chat", chat);
          if (chat.key.indexOf(email) == 0) {
            otherChatterEmail = chat.key.substring(
              email.length,
              chat.key.length
            );
          } else {
            otherChatterEmail = chat.key.substring(
              0,
              chat.key.length - email.length
            );
          }
          console.log("otherChatterEmail", otherChatterEmail);
          const image = firebase
            .storage()
            .ref()
            .child(
              "profilePics/" +
                domain +
                "/" +
                otherChatterEmail +
                "/profilePic.jpg"
            );
          const realCount = count;
          promises.push(
            image
              .getDownloadURL()
              .then((foundURL) => {
                threadss[realCount].avatar = foundURL;
              })
              .catch((error) => {
                console.log(error);
              })
          );

          var name = "";
          promises.push(
            firebase
              .database()
              .ref("users/" + domain + "/" + otherChatterEmail)
              .once("value", (snapshot) => {
                console.log("snapshot.val()", snapshot.val().name);
                threadss[realCount].title = snapshot.val().name;
              })
          );
          const chatPath = "chats/" + domain + "/" + chat.key + "/chat";
          console.log("thread.chatId = chat.key");
          thread.otherChatterEmail = otherChatterEmail;
          thread.chatId = chat.key;
          thread.timestamp = chat.val().timestamp;
          thread.text = chat.val().text;
          this.displayTime(thread);
          console.log(thread);
          threadss.push(thread);
          thread = {};
          // this.sortThreads(threadss)
          // this.setState({
          //   threads: threadss,
          // });
          count += 1;
        });
        console.log("promises ready");
        const responses = await Promise.all(promises);
        console.log("after response");
        console.log("threads", threadss);
        if (isBuyer) {
          this.setState({
            threadsBuyer: threadss.reverse(),
          });
        } else {
          this.setState({
            threadsSeller: threadss.reverse(),
          });
        }
      });
  };

  async componentDidMount() {
    this.keepUpdatedList(true);
    this.keepUpdatedList(false);
    const user = firebase.auth().currentUser;
    const start = user.email.indexOf("@");
    const end = user.email.indexOf(".com");
    const domain = user.email.substring(start, end);
    const realEmail = user.email.substring(0, end);

    firebase
      .database()
      .ref("/users/" + domain + "/" + realEmail + "/page")
      .once("value", (homepageSnapshot) => {
        // console.log(homepageSnapshot.val())
        this.setState({
          homepage: homepageSnapshot.val(),
          loading: false,
          rendered: true,
        });
        // console.log("in component mount ", this.state.homepage)
      });
  }

  componentWillUnmount() {
    this.ref().child("buyer").off();
    this.ref().child("seller").off();
  }

  displayTime = (thread) => {
    const dayOfTheWeek = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    var messageDate = new Date(thread.timestamp);
    var currentDate = this.state.date;
    console.log("getHours ", messageDate.getHours());
    var hour, minute, seconds;
    //2019 < 2020
    if (messageDate.getFullYear() == currentDate.getFullYear()) {
      if (messageDate.getMonth() == currentDate.getMonth()) {
        const difference = currentDate.getDate() - messageDate.getDate();
        if (difference < 7) {
          if (difference == 0) {
            hour = messageDate.getHours();
            var afterNoon = hour % 12 > 0 ? "PM" : "AM";
            hour = hour % 12;

            minute = "0" + messageDate.getMinutes();
            var formattedTime =
              hour + ":" + minute.substr(-2) + " " + afterNoon;
            thread.formattedTime = formattedTime;
          } else if (difference == 1) {
            thread.formattedTime = "Yesterday";
          } else {
            thread.formattedTime = dayOfTheWeek[messageDate.getDay()];
          }
          return;
        }
      }
    }

    const month = messageDate.getMonth() + 1;
    const day = messageDate.getDate();
    const year = ("" + messageDate.getFullYear()).substr(-2);
    const formattedDate = month + "/" + day + "/" + year;
    thread.formattedTime = formattedDate;
  };

  render() {
    if (this.state.loading) {
      return <Loading navigation={this.props.navigation} />;
    }

    LayoutAnimation.easeInEaseOut();
    if (this.state.rendered) {
      this.setState({
        rendered: false,
        clickedBuyer: Array(this.state.threadsBuyer.length).fill(false),
        clickedSeller: Array(this.state.threadsSeller.length).fill(false),
      });
      if (this.state.homepage != 0) {
        setTimeout(() => {
          this._swiper.scrollBy(1);
        }, 100);
      }
    }
    return (
      <View style={styles.container}>
        <QuickOrder
          _swiper={this._swiper}
          blackBackground={false}
          setHomePage={this.setHomePage}
          homepage={this.state.homepage}
          togglePopupVisibility={this.togglePopupVisibility}
        />
        <View>
          <Text style={{ fontSize: 50, fontWeight: "bold" }}>Chats</Text>
        </View>
        <Swiper
          ref={(swiper) => {
            this._swiper = swiper;
          }}
          loop={false}
          onIndexChanged={this.homepageIndexChanged}
        >
          <View style={{ height: windowHeight - 300 }}>
            <Divider />
            <FlatList
              data={this.state.threadsBuyer}
              keyExtractor={(item) => item._id}
              ItemSeparatorComponent={() => <Divider />}
              renderItem={({ item, index }) => {
                return (
                  <TouchableWithoutFeedback
                    onPressIn={() => {
                      var clickedBuyer = this.state.clickedBuyer;
                      clickedBuyer[index] = true;
                      this.setState({ clickedBuyer });
                    }}
                    onPressOut={() => {
                      var clickedBuyer = this.state.clickedBuyer;
                      clickedBuyer[index] = false;
                      this.setState({ clickedBuyer });
                    }}
                    onPress={() =>
                      this.props.navigation.navigate("Room", {
                        thread: item.chatId,
                        chattingUser: item.title,
                        otherChatterEmail: item.otherChatterEmail,
                      })
                    }
                  >
                    <View
                      style={[
                        styles.chatRow,
                        {
                          backgroundColor: this.state.clickedBuyer[index]
                            ? "#A9A9A9"
                            : "white",
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.chatRow,
                          { width: (3 * windowWidth) / 4 },
                        ]}
                      >
                        <View style={[styles.avatar, { marginLeft: 20 }]}>
                          {item.avatar ? (
                            <Image
                              source={{ url: item.avatar }}
                              style={styles.avatar}
                            />
                          ) : (
                            <FontAwesome name="user" size={50} color="black" />
                          )}
                        </View>
                        <View
                          style={{ flexDirection: "column", marginLeft: 5 }}
                        >
                          <Text style={{ fontSize: 20 }}>{item.title}</Text>
                          <Text style={{ fontSize: 15, color: "gray" }}>
                            {item.text}
                          </Text>
                        </View>
                      </View>
                      <View
                        style={{
                          justifyContent: "center",
                          alignItems: "center",
                          width: windowWidth / 4,
                        }}
                      >
                        <Text>{item.formattedTime}</Text>
                      </View>
                    </View>
                  </TouchableWithoutFeedback>
                );
              }}
            />
          </View>
          <View style={{ height: windowHeight - 300 }}>
            <Divider />
            <FlatList
              data={this.state.threadsSeller}
              keyExtractor={(item) => item._id}
              ItemSeparatorComponent={() => <Divider />}
              renderItem={({ item, index }) => {
                return (
                  <TouchableWithoutFeedback
                    onPressIn={() => {
                      var clickedSeller = this.state.clickedSeller;
                      clickedSeller[index] = true;
                      this.setState({ clickedSeller });
                    }}
                    onPressOut={() => {
                      var clickedSeller = this.state.clickedSeller;
                      clickedSeller[index] = false;
                      this.setState({ clickedSeller });
                    }}
                    onPress={() =>
                      this.props.navigation.navigate("Room", {
                        thread: item.chatId,
                        chattingUser: item.title,
                        otherChatterEmail: item.otherChatterEmail,
                      })
                    }
                  >
                    <View
                      style={[
                        styles.chatRow,
                        {
                          backgroundColor: this.state.clickedSeller[index]
                            ? "#A9A9A9"
                            : "white",
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.chatRow,
                          { width: (3 * windowWidth) / 4 },
                        ]}
                      >
                        <View style={[styles.avatar, { marginLeft: 20 }]}>
                          {item.avatar ? (
                            <Image
                              source={{ url: item.avatar }}
                              style={styles.avatar}
                            />
                          ) : (
                            <FontAwesome name="user" size={50} color="black" />
                          )}
                        </View>
                        <View
                          style={{ flexDirection: "column", marginLeft: 5 }}
                        >
                          <Text style={{ fontSize: 20 }}>{item.title}</Text>
                          <Text style={{ fontSize: 15, color: "gray" }}>
                            {item.text}
                          </Text>
                        </View>
                      </View>
                      <View
                        style={{
                          justifyContent: "center",
                          alignItems: "center",
                          width: windowWidth / 4,
                        }}
                      >
                        <Text>{item.formattedTime}</Text>
                      </View>
                    </View>
                  </TouchableWithoutFeedback>
                );
              }}
            />
          </View>
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

const styles = StyleSheet.create({
  chatRow: {
    flex: 1,
    flexDirection: "row",
    height: 80,
    alignItems: "center",
  },
  avatar: {
    borderRadius: 60,
    width: 60,
    height: 60,
    borderColor: "black",
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    flex: 1,
    paddingTop: 30,
    backgroundColor: "white",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 50,
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
  listTitle: {
    fontSize: 22,
  },
  listDescription: {
    fontSize: 16,
  },
});

{
  /* <List.Item
                          key={item.title}
                          title={item.title}
                          description='Item description'
                          titleNumberOfLines={1}
                          right={() => {<Text>HI</Text>}}
                          titleStyle={styles.listTitle}
                          descriptionStyle={styles.listDescription}
                          descriptionNumberOfLines={1}
                        /> */
}
