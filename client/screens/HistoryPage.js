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
import { Ionicons, FontAwesome5, FontAwesome,Entypo } from "@expo/vector-icons";
import { List, Divider } from "react-native-paper";
import firebase from "../../config";
import Loading from "./LoadingScreen";
import PopupOrder from "./PopupOrder";
import Swiper from "react-native-swiper/src";
import RatingUser from "./RatingUser"
import QuickOrder from "./QuickOrder";
const windowWidth = Dimensions.get("window").width;
const windowHeight = Dimensions.get("window").height;
import { Col, Row, Grid } from "react-native-easy-grid";
import DropDownPicker from 'react-native-dropdown-picker';
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
    orderBy :"date",
    ascending: false,
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
    const email = user.email.substring(0, end);
    return firebase
      .database()
      .ref("/users/" + domain + "/" + email + "/orders");
  };



  merge = (left,right,orderBy,ascending) => {
    let resultArray = [], leftIndex = 0, rightIndex = 0;
      console.log("----------")
    // We will concatenate values into the resultArray in order
    while (leftIndex < left.length && rightIndex < right.length) {
      console.log("leftIndex ", left[leftIndex][[orderBy]] )
      console.log("rightIndex ", right[rightIndex][[orderBy]])
      console.log("order ", orderBy)
      console.log("ascending ", ascending)

      const leftOperand = left[leftIndex][[orderBy]]
      const rightOperand = right[rightIndex][[orderBy]]
      const result = ascending ? (leftOperand < rightOperand) : (leftOperand >=rightOperand)

      if (result) {
        resultArray.push(left[leftIndex]);
        leftIndex++; // move left array cursor
      } else {
        resultArray.push(right[rightIndex]);
        rightIndex++; // move right array cursor
      }
    }

    // We need to concat here because there will be one element remaining
    // from either left OR the right
    return resultArray
            .concat(left.slice(leftIndex))
            .concat(right.slice(rightIndex));
  }

  mergeSort =(unsortedArray,orderBy,ascending) =>{
    if (unsortedArray.length <= 1) {
      return unsortedArray;
    }
    // In order to divide the array in half, we need to figure out the middle
    const middle = Math.floor(unsortedArray.length / 2);

    // This is where we will be dividing the array into left and right
    const left = unsortedArray.slice(0, middle);
    const right = unsortedArray.slice(middle);
    console.log("left ", left);
    console.log("right ",right)
    // Using recursion to combine the left and right
    return this.merge(
      this.mergeSort(left,orderBy,ascending), this.mergeSort(right,orderBy,ascending),orderBy,ascending
    );
  }

  keepUpdatedList = async (isBuyer) => {
    const buyer = isBuyer ? "buyer" : "seller";
    const user = firebase.auth().currentUser;
    const start = user.email.indexOf("@");
    const end = user.email.indexOf(".com");
    const domain = user.email.substring(start, end);
    const email = user.email.substring(0, end);


    await this.ref()
      .child(buyer)
      .orderByChild("timestamp")
      .on("value", async (ordersSnapshot) => {
        var threadss = [];
        var count = 0;
        var thread = {};
        const promises = [];
        ordersSnapshot.forEach((chat) => {
          var otherChatterEmail;
          // console.log("chat", chat);
          if (chat.val().chatId.indexOf(email) == 0) {
            otherChatterEmail = chat
              .val()
              .chatId.substring(email.length, chat.val().chatId.length);
          } else {
            otherChatterEmail = chat
              .val()
              .chatId.substring(0, chat.val().chatId.length - email.length);
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
                threadss[realCount].name = snapshot.val().name;
              })
          );
          const chatPath = "chats/" + domain + "/" + chat.chatId + "/chat";

          thread.otherChatterEmail = otherChatterEmail;
          thread.chatId = chat.val().chatId;
          thread.date = chat.val().timestamp;
          thread.price = chat.val().price;
          thread.title = chat.val().title;
          thread.rating= chat.val().rating;
          thread.key = chat.key;
          if(thread.rating == undefined){
            thread.daysLeftToReview = this.daysLeftToReview(thread.date)
          }
          this.displayTime(thread);

          threadss.push(thread);
          thread = {};
          // this.sortThreads(threadss)
          // this.setState({
          //   threads: threadss,
          // });
          count += 1;
        });
        const length = threadss.length - 1
        for(var i = 0; i < threadss.length;i++){
          threadss[length - i].index = i
        }


        threadss = this.mergeSort(threadss,"price",true)

        const responses = await Promise.all(promises);
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

  daysLeftToReview(timestamp){

    var messageDate = new Date(timestamp);
    var currentDate = this.state.date;
    const dayInSeconds = 51840000
    var difference = currentDate.getTime() - messageDate.getTime();
    if(difference <= 362880000 ){
      count = 7
      while(difference >= 0 ){
        difference -= dayInSeconds;
        count -= 1;
      }
      return count + " Days Left To Review"
    }
    return null
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
    var messageDate = new Date(thread.date);
    var currentDate = this.state.date;

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

  setRating = (buyer,key,index,rating) => {
    if(buyer){
      const threadsBuyer = this.state.threadsBuyer
      if(rating ==  threadsBuyer[[index]].rating){
         threadsBuyer[[index]].rating = null;
      }else{
        threadsBuyer[[index]].rating = rating
      }
      this.setState({threadsBuyer})
      setTimeout(() => {
        if(rating == this.state.threadsBuyer[[index]].rating){
          this.ref().child("buyer").child(key).update({rating})
          threadsBuyer[[index]].daysLeftToReview = null
          this.setState({threadsBuyer})
          console.log("in rating")
        }
      },5000)

      // console.log("threadsBuyer ", this.state.threadsBuyer)
      // console.log("index ", index)

    }else{
      const threadsBuyer = this.state.threadsSeller
      threadsSeller[[index]].rating = rating
      this.setState({threadsSeller})
      this.ref().child("buyer").child(key).update({rating})
    }
  }

  formatSorter = () => {
    var orderBy = this.state.orderBy.charAt(0).toUpperCase() + this.state.orderBy.slice(1)
    switch(orderBy){
      case "Price":
        orderBy += (this.state.ascending ? " (Low to High)" : " (High to Low)")
        break;
      case "Date":
        orderBy += (this.state.ascending ? " (Newest)" : " (Oldest)")
        break;
      default:
        orderBy += (this.state.asecnding ? " (A to Z)" : " (Z to A)")
    }
    
    return orderBy;
  }

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
        <View style={{marginTop:50,marginHorizontal:20,alignItems:"center",flexDirection:"row",justifyContent:"space-between"}}>
          <View style={{flexDirection:"column"}}>
            <TouchableOpacity activeOpacity={0.6} onPress={() => this.setState({orderBy:"name"})}>
              <Text style={{fontWeight:this.state.orderBy == "name" ? "bold" : "normal"}}>Name</Text>
            </TouchableOpacity>
            {this.state.orderBy == "name" ? <View style={{flexDirection:"row"}}>
              <TouchableOpacity activeOpacity={0.3} onPress={() => this.setState({ascending:false})}>
                <Entypo name="arrow-bold-up" size={24} color="black" />
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.3} onPress={() => this.setState({ascending:true})}>
                <Entypo name="arrow-bold-down" size={24} color="black" />
              </TouchableOpacity>
            </View> : null}
          </View>
          <Text style={{fontWeight:this.state.orderBy == "title" ? "bold" : "normal"}}>Title</Text>
          <View>
            <Text style={{fontWeight:this.state.orderBy == "price" ? "bold" : "normal"}}>Price/</Text>
            <Text style={{fontWeight:this.state.orderBy == "date" ? "bold" : "normal"}}>Date</Text>
          </View>
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
            {this.state.threadsBuyer.length > 0 ? (
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
                          chattingUser: item.name,
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
                          style={
                            { width: (1 * windowWidth) / 4,
                            flexDirection:"col",
                            justifyContent:"center",
                            alignItems:"center",
                            paddingHorizontal:5,
                            height:80 }}
                        >
                          <View style={[styles.avatar]}>
                            {item.avatar ? (
                              <Image
                                source={{ url: item.avatar }}
                                style={styles.avatar}
                              />
                            ) : (
                              <FontAwesome
                                name="user"
                                size={50}
                                color="black"
                              />
                            )}
                          </View>
                            <Text numberOfLines={1} style={{fontSize:13}}>{item.name}</Text>
                        </View>
                        <View
                          style={{flexDirection:"column",justifyContent:"space-between",
                                  width:windowWidth/2, height:80}}>
                          <View style={{justifyContent:"center",alignItems:"center"}}>    
                          <Text numberOfLines={1} style={{fontSize:20}}>{item.title}</Text>
                          </View>
                            <View style={{justifyContent:"flex-end",alignItems:"center",marginBottom:5}}>
                            {item.rating != undefined && item.daysLeftToReview == null ? 
                                <Text style={styles.daysLeft}> You rated a {item.rating}</Text> :
                                (item.daysLeftToReview ? (
                                  <>
                                    <RatingUser starSize={30} 
                                                selected={(rating) => this.setRating(true,item.key,item.index,rating)}
                                                halfStarEnabled={true}
                                                starCount={item.rating}/>
                                    <Text style={styles.daysLeft}>{item.daysLeftToReview}</Text>
                                  </>) : 
                                  <Text style={styles.daysLeft}>Can No Longer Review</Text>)}
                            </View>
                        </View>
                        <View
                          style={{
                            justifyContent: "center",
                            alignItems: "center",
                            width: windowWidth / 4,
                          }}
                        >
                          <Text style={{color:"green",fontSize:25}}>${item.price}</Text>
                          <Text>{item.formattedTime}</Text>
                        </View>
                      </View>
                    </TouchableWithoutFeedback>
                  );
                }}
              />
            ) : (
              <Text>No History</Text>
            )}
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
                        chattingUser: item.name,
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
                        style={{ width: (3 * windowWidth) / 4,
                            height: 80,
                            flexDirection:"column" }}
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
                          <Text style={{ fontSize: 20 }}>{item.name}</Text>
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
        <View style={{marginTop:40,position:"absolute",top:60,right:5}}>
          <View style={{flexDirection:"column",alignItems:"flex-end"}}>
            <Text>Sort By</Text>
            <DropDownPicker
              // onOpen={() => {
              //   this._start(this.state.sellerDropdown);
              // }}
              // onClose={() => {
              //   this._close(this.state.sellerDropdown);
              // }}
              style={{
                  borderTopLeftRadius: 20, borderTopRightRadius: 20,
                  borderBottomLeftRadius: 20, borderBottomRightRadius: 20
              }}
              items={[
                {label: "Price (High to Low)", value:"price0"},
                { label: "Price (Low to High)", value: "price1" },
                { label: "Date (Most Recent)", value: "date1" },
                {label: "Date (Oldest)", value: "date0"},
                { label: "Title (A to Z)", value: "title1" },
                { label: "Title (Z to A)", value: "title0" },
                { label: "Name (A to Z)", value: "name1" },
                { label: "Name (Z to A)", value: "name0" },
              ]}
              multipleText="%d items have been selected."
              placeholder={this.formatSorter()}
              arrowStyle={{alignItems:"center",justifyContent:"center",height:30}}
              containerStyle={{ height: 30, width: 125 }}
              onChangeItem={async (item) =>{
                const orderBy = item.value.slice(0,-1)
                const ascending = (item.value.slice(-1) == "1" ? true : false)
                if(orderBy != this.state.orderBy || this.state.ascending != ascending ){
                  const isBuyer = this.state.page ? "threadsSeller": "threadsBuyer"
                  
                  const arr = this.mergeSort(this.state[[isBuyer]],orderBy,ascending)
                  this.setState({[isBuyer] : arr})
                }
                this.setState({orderBy,ascending})
              }}
            />
          </View>
        </View>
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
  daysLeft : {
    fontSize:11,
    color:"gray"
  },
  chatRow: {
    flex: 1,
    flexDirection: "row",
    height: 80,
    alignItems: "center",
  },
  avatar: {
    borderRadius: 55,
    width: 55,
    height: 55,
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