import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Animated,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  LayoutAnimation,
  Dimensions,
  Platform,
  Keyboard,
  TextInput,
  ActivityIndicator,
  TouchableWithoutFeedback,
  AsyncStorage,
} from "react-native";
import { Ionicons, FontAwesome5, FontAwesome,EvilIcons,MaterialIcons,MaterialCommunityIcons } from "@expo/vector-icons";
import { List, Divider } from "react-native-paper";
import firebase from "../../config";
import Loading from "./LoadingScreen";
import PopupOrder from "./PopupOrder";
import Swiper from "react-native-swiper/src";
import QuickOrder from "./QuickOrder";
const windowWidth = Dimensions.get("window").width;
const windowHeight = Dimensions.get("window").height;
const clone = require('rfdc')()
import * as FileSystem from 'expo-file-system';
import { Col, Row, Grid } from "react-native-easy-grid";
export default class MessageScreen extends React.Component {

  state = {
    threadsBuyer: [],
    threadsSeller: [],
    loading: true,
    page: 0,
    date: new Date(),
    popupVisible: false,
    searchInputFocus:false,
    searchInputValue:new Animated.Value(windowWidth - 30),
    textInputValue : new Animated.Value(windowWidth - 100),
    textSearchInput : "",
    openedSearch:false,
    clearSearch : false,
    searchPressIn: new Animated.Value(0),
    clickedBuyer: [],
    clickedSeller: [],
    scrollY: new Animated.Value(0),
    loadingBuyer : true,
    loadingSeller : true,
  }

  setPage = (index) => {
    const user = firebase.auth().currentUser || {};
    const start = (user.email || "").indexOf("@");
    const end = (user.email || "").indexOf(".com");
    const domain = (user.email || "").substring(start, end);
    const email = (user.email || "").substring(0, end);
    this.getUpdatedList(this.state.textSearchInput)
    this.setState({ page: index });

    firebase
      .database()
      .ref("/users/" + domain + "/" + email)
      .update({ page: index });
  };

  togglePopupVisibility = (value) => {
    this.setState({ popupVisible: value });
  };

  ref = () => {
    const user = firebase.auth().currentUser || {};
    const email = (user.email || "")
    const start = (user.email || "").indexOf("@");
    const end = (user.email || "").indexOf(".com");
    const domain = (user.email || "").substring(start, end);
    return firebase
      .database()
      .ref(
        "/users/" +
          domain +
          "/" +
            email.substring(
              0,
              email.length - 4
            ) +
          "/chats/"
      );
  };

  keepUpdatedList = async (isBuyer) => {
    const buyer = isBuyer ? "buyer" : "seller";
    const user = firebase.auth().currentUser || {};
    const start = (user.email || "").indexOf("@");
    const end = (user.email || "").indexOf(".com");
    const domain = (user.email || "").substring(start, end);
    const email = (user.email || "").substring(0, end);
    
    if(isBuyer){
      this.setState({loadingBuyer : true})
    }else{
      this.setState({loadingSeller : true})
    }

    let otherChattersObject = await AsyncStorage.getItem('otherChattersProfileImages')
    otherChattersObject = JSON.parse(otherChattersObject);
    console.log("before other ", otherChattersObject)
    if(!otherChattersObject){
      otherChattersObject = {}
    }
    await this.ref()
      .child(buyer)
      .orderByChild("timestamp")
      .on("value", async (chatsSnapshot) => {
        // console.log("chatsSnapshot", chatsSnapshot);
        var threadss = [];
        var count = 0;
        var thread = {};
        const promises = [];
        chatsSnapshot.forEach((chat) => {
          var otherChatterEmail;
          // console.log("chat", chat);
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
          const realCount = count
          promises.push(
            firebase.database().ref("users/" + domain + "/" + otherChatterEmail).once("value",async (snapshot) => {
            // console.log("otherChatterEmail", otherChatterEmail);
             console.log("CODE RED",otherChattersObject)
             console.log("otherChatterEmail ", otherChatterEmail)
              if(snapshot.val().profileImageUrl){
                if(otherChattersObject[[otherChatterEmail]] == undefined || !otherChattersObject[[otherChatterEmail]].uri || otherChattersObject[[otherChatterEmail]].url != snapshot.val().profileImageUrl){
                  console.log("trying to download")
                    if(!otherChattersObject[[otherChatterEmail]] && !otherChattersObject[[otherChatterEmail]].uri){
                      console.log("delete")
                      this.deleteUri(otherChattersObject[[otherChatterEmail]].uri)
                    }
                  try{
                    const uri = await this.downloadUrl(snapshot.val().profileImageUrl,otherChatterEmail)
                    const newProfileObject = {uri,url : snapshot.val().profileImageUrl}
                    otherChattersObject[[otherChatterEmail]] = newProfileObject
                    console.log("WOOOHOOO",otherChattersObject[[otherChatterEmail]])
                    console.log("uri ", uri)
                    threadss[realCount].avatar = otherChattersObject[[otherChatterEmail]].uri
                    AsyncStorage.setItem("otherChattersProfileImages", JSON.stringify(otherChattersObject))
                  }catch(e){
                      console.log("big error")
                  }
                }else{
                  console.log("already defined")
                  console.log(otherChattersObject[[otherChatterEmail]])
                  threadss[realCount].avatar = otherChattersObject[[otherChatterEmail]].uri
                }
              }
            })
          );

          var name = "";
          promises.push(
            firebase
              .database()
              .ref("users/" + domain + "/" + otherChatterEmail)
              .once("value", (snapshot) => {
                // console.log("snapshot.val()", snapshot.val().name);
                threadss[realCount].title = snapshot.val().name;
              })
          );
          const chatPath = "chats/" + domain + "/" + chat.key + "/chat";
          // console.log("thread.chatId = chat.key");
          thread.otherChatterEmail = otherChatterEmail;
          thread.chatId = chat.key;
          thread.timestamp = chat.val().timestamp;
          thread.text = chat.val().text;
          thread.read = chat.val().read;
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
            console.log("after other ", otherChattersObject)
        // await AsyncStorage.setItem("otherChattersProfileImages", JSON.stringify(otherChattersObject))
        //   .then( ()=>{
        //   console.log("It was saved successfully")
        //   } )
        //   .catch( ()=>{
        //   console.log("There was an error saving the product")
        //   } )
        // console.log("after response");
        // console.log("threads", threadss);
        if (isBuyer) {
          this.setState({
            loadingBuyer : false,
            threadsBuyer: threadss.reverse(),
          });
        } else {
          this.setState({
            loadingSeller : false,
            threadsSeller: threadss.reverse(),
          });
        }
      });
  };

  async componentDidMount() {
    this.keepUpdatedList(true);
    this.keepUpdatedList(false);
    const user = firebase.auth().currentUser || {};
    const start = (user.email || "").indexOf("@");
    const end = (user.email || "").indexOf(".com");
    const domain = (user.email || "").substring(start, end);
    const realEmail = (user.email || "").substring(0, end);

    firebase
      .database()
      .ref("/users/" + domain + "/" + realEmail + "/page")
      .once("value", (pageSnapshot) => {
        this.setState({
          page: pageSnapshot.val(),
          loading: false,
          rendered: true,
        });
      });
  }

  deleteUri = async(path) => {
    try{
      await FileSystem.deleteAsync(path, {})
    }catch(e){
      console.log("ERROR deleting profile image in profile screen")
    }
    
  }

  downloadUrl = async (url,name) => {
    const callback = downloadProgress => {
    const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
    // this.setState({
    //   downloadProgress: progress,
    // });
    }

   console.log("url ", url)
   await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory +"otherChattersProfileImages/",{intermediates:true})
  // const downloadResumable = FileSystem.createDownloadResumable(
  //     url,
  //     FileSystem.documentDirectory  + name + ".png",
  //     {},
  //     callback
  //   )

    try {
      const { uri } = await FileSystem.downloadAsync(
              url,
      FileSystem.documentDirectory  + "otherChattersProfileImages/" + name + ".png",
      {},
      callback
      );
      console.log('Finished downloading to ', uri);
      return uri;
    } catch (e) {
      console.error(e);
    }


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
    // console.log("getHours ", messageDate.getHours());
    var hour, minute, seconds;
    //2019 < 2020
    if (messageDate.getFullYear() == currentDate.getFullYear()) {
      if (messageDate.getMonth() == currentDate.getMonth()) {
        const difference = currentDate.getDate() - messageDate.getDate();
        if (difference < 7) {
          if (difference == 0) {
            hour = messageDate.getHours();
            var afterNoon = hour  > 11 ? "PM" : "AM";
            hour = hour == 0 || hour == 12 ? "12" : (hour > 12 ? hour - 12 : hour)

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

    _start = (variable,result) => {
    // console.log("oooooooooo");
    Animated.timing(variable, {
      toValue: result,
      duration: 100,
    }).start();
  };

    _close = (variable,result) => {
    // console.log("oooooooooo");
    Animated.timing(variable, {
      toValue: result,
      duration: 100,
    }).start();
  };

  getUpdatedList = async (textUnedited) => {
    const user = firebase.auth().currentUser || {};
    const start = (user.email || "").indexOf("@");
    const end = (user.email || "").indexOf(".com");
    const domain = (user.email || "").substring(start, end);
    const email = (user.email || "").substring(0, end);
    
    setTimeout(async () => {

      if(this.state.textSearchInput == textUnedited){
        const text = textUnedited.toLowerCase();
        if(this.state.page == 0){
          this.setState({loadingBuyer : true})
          // console.log("page 0",text.length)
          if(this.state.beforeBuyerSearchList == undefined){
            await this.setState({beforeBuyerSearchList : this.state.threadsBuyer})
          }else if(text.length == 0){
            // console.log("text empty",this.state.beforeBuyerSearchList)
            await this.setState({threadsBuyer:this.state.beforeBuyerSearchList,loadingBuyer:false})
            return;
          }
        }else{
          this.setState({loadingSeller : true})
          if(this.state.beforeSellerSearchList == undefined){
            await this.setState({beforeSellerSearchList : this.state.threadsSeller})
          }else if(text.length == 0){
            console.log("beforeSellerSearchList ")
            await this.setState({threadsSeller:this.state.beforeSellerSearchList,loadingSeller:false})
            return
          }
        }

        if(text.length == 0){
          this.setState({loadingBuyer:false,loadingSeller:false,beforeBuyerSearchList:undefined,beforeSellerSearchList:undefined})
          return
        }

        var currentArray = this.state.page == 0 ? clone(this.state.beforeBuyerSearchList) : clone(this.state.beforeSellerSearchList)
        const currentArrayLength = currentArray.length
        var currentArray = Object.assign({},currentArray);
        // console.log("page ",this.state.page)
        const promises = []
        for(var i = 0; i < currentArrayLength; i++){
          var path = "/chats/" + domain + "/" 
          if(this.state.page == 0){
            path += email + currentArray[[i]].otherChatterEmail
          }else{
            path += currentArray[[i]].otherChatterEmail + email
          }
          //console.log("path ", path)
          
          const index = i
          promises.push(
            firebase.database().ref(path).once("value",(snapshot) => {
              var foundRecentText = false
              snapshot.forEach((messages) =>{
                const objectMessages = messages.val()
                Object.keys(objectMessages).reverse().forEach((message) =>{
                  if(objectMessages[[message]].text != undefined && objectMessages[[message]].text.toLowerCase().includes(text)){
                    // console.log("index ", message)
                    currentArray[[index]].text = objectMessages[[message]].text;
                    currentArray[[index]].timestamp = objectMessages[[message]].timestamp
                    currentArray[[index]].key = message
                    this.displayTime(currentArray[[index]])
                    foundRecentText = true
                    //console.log("mind control",currentArray[[index]])
                  }
                })
              })
              if(!foundRecentText){
                delete currentArray[[index]]
              }

            })
          )
        }
        const responses = await Promise.all(promises);
        currentArray = Object.values(currentArray).sort(function(a, b) {
          return b["timestamp"] - a["timestamp"];
        });
        if(this.state.page == 0){
          await this.setState({threadsBuyer : currentArray,loadingBuyer : false})
        }else{
          await this.setState({threadsSeller : currentArray,loadingSeller:false})
        }
      }
    }, 2000);
  }

  makeTextBold = (text,thisPage) => {
    if(this.state.page == thisPage){
    var position = text == undefined ? 0 : text.toLowerCase().indexOf(this.state.textSearchInput.toLowerCase())
    // console.log("position ", position)
    // console.log("text ", text)
    var beginning = position == 0  ? "" : (text || "").substring(0,position - 1)
    var middle = (text || "").substring(position,this.state.textSearchInput.length +position)
    var end = position == (beginning.length + middle.length) == (text || "").length ? "" : (text ||  "").substring(position + this.state.textSearchInput.length)
    // console.log("position " + position + " beginning " + beginning + " middle " + middle + " end " + end)
    return(
      <View style={{flexDirection:"row"}}>
        <Text style={{ fontSize: 15, color: "gray"}} numberOfLines={1} >
          {beginning}
          <Text style={{fontWeight:"800",color:"black"}}>{middle}</Text>
          {end}
        </Text>
      </View>
    )
    }else{
      return (<Text style={{ fontSize: 15, color: "gray"}} numberOfLines={1} >
          {beginning}
          </Text>
      )
    }
  }



  searchComponent = () => {
    if(!this.state.openedSearch){return null}
    return(
      <Animated.View style={{height:this.state.searchPressIn,flexDirection:"row",alignItems:"center",padding:15}}>
         <Animated.View style={{flexDirection:"row",
                      alignItems:"center",
                      height:40,
                      width:this.state.searchInputValue,
                      borderRadius:15,
                      backgroundColor:"#E8E8E8"}}>
          <View style={{marginHorizontal:5}}>
            <EvilIcons name="search" size={24} color="black" />
          </View>
            <Animated.View style={{width:this.state.textInputValue}}>
            <TextInput 
                onEndEditing={() => {
                    if(this.state.searchInputFocus){
                        this.setState({searchInputFocus : false}); 
                        this._close(this.state.searchInputValue,windowWidth - 30)
                        this._close(this.state.textInputValue,windowWidth - 100)
                    }
                }}
                onFocus={() => {this.setState({searchInputFocus : true});this._start(this.state.searchInputValue,windowWidth - 100);this._start(this.state.textInputValue,windowWidth - 170)}}
                style={{fontSize:18,
                    width:this.state.searchInputValue ? windowWidth - 170 : windowWidth - 100,
                    height:40}}
                value={this.state.textSearchInput}
                onChangeText={async (text) => {this.setState({textSearchInput : text});this.getUpdatedList(text)}}
                numberOfLines={1} 
                placeholder="Search"/>
            </Animated.View>
          <TouchableWithoutFeedback 
            onPressIn={() => {this.setState({clearSearch : true,textSearchInput: ""});this.getUpdatedList("")}}
            onPressOut={() => this.setState({clearSearch : false})}
            onPress={() => {this.setState({clearSearch : false,textSearchInput:""});this.getUpdatedList("")}}>
            <View style={{borderRadius:50}}>
            <MaterialIcons name="cancel" size={24} color={this.state.clearSearch ? "black" : "gray"} />
            </View>
          </TouchableWithoutFeedback>
        </Animated.View>
        <TouchableOpacity onPress={() => 
                        {Keyboard.dismiss();
                        this.setState({searchInputFocus : false,textSearchInput : ""});    
                        this.getUpdatedList("")                    
                        this._close(this.state.searchInputValue,windowWidth - 30)
                        this._close(this.state.textInputValue,windowWidth - 100)}}>
          <View style={{paddingLeft:this.state.searchInputFocus ? 7 : 15}}>
            <Text style={{color:"#0182FF",fontSize:20}}>Cancel</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    )
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
      if (this.state.page != 0) {
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
          setPage={this.setPage}
          page={this.state.page}
          togglePopupVisibility={this.togglePopupVisibility}
        />
        <View style={{flexDirection:"row",alignItems:"center",justifyContent:"space-between"}}>
          <Text style={{ fontSize: 50, fontWeight: "bold" }}>Chats</Text>
          <TouchableWithoutFeedback
            // onPressOut={() => this._close()}
            onPress={() => {this.setState({openedSearch:!this.state.openedSearch,textSearchInput : "",searchInputFocus : false});
                           this.state.openedSearch ? (this._close(this.state.searchPressIn,0),this.getUpdatedList("")) :this._start(this.state.searchPressIn,65);
                           this._close(this.state.searchInputValue,windowWidth - 30)
                           this._close(this.state.textInputValue,windowWidth - 100) }}>
            <View style={{
                  marginRight:(windowWidth/2 - 100)/2,
                  borderRadius:40,
                  width:40,
                  height:40,
                  justifyContent:"center",
                  alignItems:"center",
                  backgroundColor:this.state.openedSearch ? "#BCBFBE" : "#EAEAEA"}}>  
              <EvilIcons name="search" size={40} color={this.state.openedSearch ? "black" : "#676767"} />
            </View>
          </TouchableWithoutFeedback>
        </View>
        {this.searchComponent()}
        <Swiper
          ref={(swiper) => {
            this._swiper = swiper;
          }}
          loop={false}
          onIndexChanged={this.setPage}
        >
          {this.state.threadsBuyer.length > 0 ? (
          <View style={{ height: windowHeight - 300 }}>
            <Divider />
            {this.state.loadingBuyer ? 
            <ActivityIndicator size="large"></ActivityIndicator> :
            <FlatList
              data={this.state.threadsBuyer}
              keyExtractor={(item) => item._id}
              ItemSeparatorComponent={() => <Divider />}
              renderItem={({ item, index }) => {
                return (
                  <TouchableWithoutFeedback
                    key={index}
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
                    onPress={() =>{
                      if(this.state.textSearchInput != ""){
                        this.props.navigation.navigate("Room", {
                          thread: item.chatId,
                          chattingUser: item.title,
                          otherChatterEmail: item.otherChatterEmail,
                          historyOrderKey: item.key
                        })
                      }
                      this.props.navigation.navigate("Room", {
                        thread: item.chatId,
                        chattingUser: item.title,
                        otherChatterEmail: item.otherChatterEmail,
                      })
                    }}
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
                        {!item.read &&
                        <View>
                          <MaterialCommunityIcons name="checkbox-blank-circle" size={15} color="#03A9F4" />
                        </View>}
                        <View style={[styles.avatar, { marginLeft: !item.read ? 5 : 20}]}>
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
                          {/* {console.log(this.state.threadsBuyer)} */}
                          {this.makeTextBold(item.text,0)}

                        </View>
                      </View>
                      <View
                        style={{
                          justifyContent: "flex-end",
                          alignItems: "center",
                          width: windowWidth / 4,
                          flexDirection:"row"
                        }}
                      >
                        <Text style={{fontSize:15,color:"gray"}}>{item.formattedTime}</Text>
                      </View>
                      <View style={{marginTop:3}}>
                        <EvilIcons name="chevron-right" size={28} color="gray" />
                      </View>
                    </View>
                  </TouchableWithoutFeedback>
                );
              }}
            />}
          </View> ) : (
              <View style={{height: windowHeight - 300,justifyContent:"center",alignItems:"center"}}>
                <Text style={{color:"gray",fontSize:20}}>
                  No Buyer Messages
                </Text>
              </View>
          )}
          {this.state.threadsSeller.length > 0 ? (
          <View style={{ height: windowHeight - 300 }}>
            <Divider />
            {this.state.loadingSeller ? 
            <ActivityIndicator size="large"></ActivityIndicator> : 
            <FlatList
              data={this.state.threadsSeller}
              keyExtractor={(item) => item._id}
              ItemSeparatorComponent={() => <Divider />}
              renderItem={({ item, index }) => {
                return (
                  <TouchableWithoutFeedback
                  key={index}
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
                        {!item.read &&
                        <View>
                          <MaterialCommunityIcons name="checkbox-blank-circle" size={15} color="#03A9F4" />
                        </View>}
                        <View style={[styles.avatar, { marginLeft: !item.read ? 5 : 20}]}>
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
                          {this.makeTextBold(item.text,1)}
                        </View>
                      </View>
                      <View
                        style={{
                          justifyContent: "center",
                          alignItems: "center",
                          width: windowWidth / 4,
                          flexDirection:"row"
                        }}
                      >
                        <Text style={{fontSize:15,color:"gray"}}>{item.formattedTime}</Text>
                        <View style={{marginTop:3}}>
                          <EvilIcons name="chevron-right" size={28} color="gray" />
                        </View>
                      </View>
                    </View>
                  </TouchableWithoutFeedback>
                );
              }}
            />}
          </View> ) : (
              <View style={{height: windowHeight - 300,justifyContent:"center",alignItems:"center"}}>
                <Text style={{color:"gray",fontSize:20}}>
                  No Seller Messages
                </Text>
              </View>
          )}
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
