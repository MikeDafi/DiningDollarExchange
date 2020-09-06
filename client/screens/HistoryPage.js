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
  AsyncStorage,
  TextInput,
} from "react-native";
import { Ionicons, FontAwesome5, FontAwesome,AntDesign } from "@expo/vector-icons";
import { List, Divider } from "react-native-paper";
import firebase from "../../config";
import Loading from "./LoadingScreen";
import Swiper from "react-native-swiper/src";
import RatingUser from "./RatingUser"
import QuickOrder from "./QuickOrder";
const windowWidth = Dimensions.get("window").width;
const windowHeight = Dimensions.get("window").height;
import { Col, Row, Grid } from "react-native-easy-grid";
import DropDownPicker from 'react-native-dropdown-picker';
import * as FileSystem from 'expo-file-system';
export default class MessageScreen extends React.Component {
  state = {
    threadsBuyer: [],
    threadsSeller: [],
    loading: true,
    page: 0,
    domain: "",
    date: new Date(),
    popupVisible: false,
    clickedBuyer: [],
    clickedSeller: [],
    orderBy :"date",
    ascending: false,
  };

  setPage = (index) => {
    const user = firebase.auth().currentUser;
    const start = user.email.indexOf("@");
    const end = user.email.indexOf(".com");
    const domain = user.email.substring(start, end);
    const email = user.email.substring(0, end);
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
    const user = firebase.auth().currentUser;
    const start = user.email.indexOf("@");
    const end = user.email.indexOf(".com");
    const domain = user.email.substring(start, end);
    const email = user.email.substring(0, end);
    return firebase
      .database()
      .ref("/users/" + domain + "/" + email + "/historyOrders");
  };

  merge = (left,right,orderBy,ascending) => {
    let resultArray = [], leftIndex = 0, rightIndex = 0;
      //1 console.log("----------")
    // We will concatenate values into the resultArray in order
    while (leftIndex < left.length && rightIndex < right.length) {
      //1 console.log("leftIndex ", left[leftIndex][[orderBy]] )
      //1 console.log("rightIndex ", right[rightIndex][[orderBy]])
      //1 console.log("order ", orderBy)
      //1 console.log("ascending ", ascending)

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
    //1 console.log("left ", left);
    //1 console.log("right ",right)
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

    let historyOrders = await AsyncStorage.getItem('otherChattersProfileImages')
    historyOrders = JSON.parse(historyOrders);
    //1 console.log("before history ", historyOrders)
    if(!historyOrders){
      historyOrders = {}
    }
    await this.ref()
      .child(buyer)
      .on("value", async (ordersSnapshot) => {
        var threadss = [];
        var count = 0;
        var thread = {};
        const promises = [];
        ordersSnapshot.forEach((chat) => {
          var otherChatterEmail;
        
           //1 console.log("CHATTTTTTTTTTTTTTTTTTTTT", chat);
          if (chat.val().chatId.indexOf(email) == 0) {
            otherChatterEmail = chat
              .val()
              .chatId.substring(email.length, chat.val().chatId.length);
          } else {
            otherChatterEmail = chat
              .val()
              .chatId.substring(0, chat.val().chatId.length - email.length);
          }
          //1 console.log("otherChatterEmail", otherChatterEmail);

          const realCount = count;
          promises.push(
            firebase.database().ref("users/" + domain + "/" + otherChatterEmail).once("value",async (snapshot) => {
            threadss[realCount].name = snapshot.val().name
             //1 console.log("historyOrders",historyOrders)
             //1 console.log("otherChatterEmail ", otherChatterEmail)
             //1 console.log("profileImageUrl ",snapshot.val().profileImageUrl)
              if(snapshot.val().profileImageUrl){
                if(historyOrders[[otherChatterEmail]] == undefined || !historyOrders[[otherChatterEmail]].uri || historyOrders[[otherChatterEmail]].url != snapshot.val().profileImageUrl){
                  //1 console.log("trying to download")
                    if(!historyOrders[[otherChatterEmail]] && !historyOrders[[otherChatterEmail]].uri){
                      //1 console.log("delete")
                      this.deleteUri(historyOrders[[otherChatterEmail]].uri)
                    }
                  try{
                    //1 console.log("start downloading")
                    const uri = await this.downloadUrl(snapshot.val().profileImageUrl,otherChatterEmail)
                    const newProfileObject = {uri,url : snapshot.val().profileImageUrl}
                    historyOrders[[otherChatterEmail]] = newProfileObject
                    //1 console.log("WOOOHOOO",historyOrders[[otherChatterEmail]])
                    //1 console.log("uri ", uri)
                    threadss[realCount].avatar = historyOrders[[otherChatterEmail]].uri
                    AsyncStorage.setItem("otherChattersProfileImages", JSON.stringify(historyOrders))
                  }catch(e){
                      //1 console.log(e)
                  }
                }else{
                  //1 console.log("already defined")
                  //1 console.log(historyOrders[[otherChatterEmail]])
                  threadss[realCount].avatar = historyOrders[[otherChatterEmail]].uri
                }
              }
            })
          );

          const chatPath = "chats/" + domain + "/" + chat.chatId + "/chat";

          thread.otherChatterEmail = otherChatterEmail;
          thread.chatId = chat.val().chatId;
          thread.date = chat.val().timestamp;
          thread.price = chat.val().price;
          thread.title = chat.val().title;
          thread.rating= chat.val().rating;
          thread.historyOrderKey = chat.val().historyOrderKey
          thread.editing = false
          thread.key = chat.key;
          if(thread.rating == undefined){
            thread.daysLeftToReview = this.daysLeftToReview(thread.date)
          }
          this.displayTime(thread);
          //1 console.log("thread ",thread)
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
        //1 console.log("threadssss",threadss)
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

  deleteUri = async(path) => {
    try{
      await FileSystem.deleteAsync(path, {})
    }catch(e){
      //1 console.log("ERROR deleting profile image in profile screen")
    }
    
  }

  downloadUrl = async (url,name) => {
    //1 console.log("in download url")
    const callback = downloadProgress => {
    const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
    // this.setState({
    //   downloadProgress: progress,
    // });
  }

   //1 console.log("url ", url)
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
      //1 console.log('Finished downloading to ', uri);
      return uri;
    } catch (e) {
      console.error(e);
    }


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
  }

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
      .once("value", (pageSnapshot) => {
        this.setState({
          page: pageSnapshot.val(),
          loading: false,
          rendered: true,
        });
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

  setRating = (buyer,key,index,rating) => {
        const user = firebase.auth().currentUser;
    const start = user.email.indexOf("@");
    const end = user.email.indexOf(".com");
    const domain = user.email.substring(start, end);
    const email = user.email.substring(0, end);
    const thread = buyer ? this.state.threadsBuyer : this.state.threadsSeller
      if(rating ==  thread[[index]].rating){
         thread[[index]].rating = null;
      }else{
        thread[[index]].rating = rating
      }
      this.setState({[(buyer ? "threadsBuyer" : "threadsSeller")] : thread})
      setTimeout(() => {
        const threadNew = buyer ? this.state.threadsBuyer : this.state.threadsSeller
        if(rating == threadNew[[index]].rating){
          this.ref().child(buyer ? "buyer" : "seller").child(key).update({rating})
          threadNew[[index]].daysLeftToReview = null
          this.setState({[(buyer ? "threadsBuyer" : "threadsSeller")] : thread})
          //1 console.log("in rating")
                var otherChatterEmail = ""
              if (thread[[index]]["chatId"].indexOf(email) == 0) {
            otherChatterEmail = thread[[index]]["chatId"].substring(email.length, thread[[index]]["chatId"].length);
          } else {
            otherChatterEmail = thread[[index]]["chatId"].substring(0, thread[[index]]["chatId"].length - email.length);
          }
      firebase.database().ref("users/" + domain + "/" + otherChatterEmail).once("value",snapshot => {
        var ratingFraction = snapshot.val().ratingFraction || ""
        var numerator = 0,denominator = 0;
        if(ratingFraction != ""){
        const slash = ratingFraction.indexOf("/")
        numerator = ratingFraction.substring(0,slash)
        denominator = ratingFraction.substring(slash + 1,ratingFraction.length)
        numerator = parseInt(numerator)
        denominator = parseInt(denominator)
        }
        numerator += rating
        denominator += 5
        const newRating = (numerator / denominator) * 5
        firebase.database().ref("users/" + domain + "/" + otherChatterEmail).update({
          ratingFraction : numerator + "/" + denominator,
          starRating : newRating
        })
      })
        }
      },5000)
        
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
      if (this.state.page != 0) {
        setTimeout(() => {
          try{
          this._swiper.scrollBy(1);
          }catch(e){
            //1 console.log("history page scroll by" ,e)
          }
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
        <View style={{marginTop:50,marginHorizontal:10,height:20,alignItems:"center",flexDirection:"row",justifyContent:"space-between"}}>

          <TouchableOpacity activeOpacity={0.6} onPress={() => {
            const ascending = this.state.orderBy == "name" ? !this.state.ascending : false
            this.setState({orderBy:"name",ascending});
            const isBuyer = this.state.page ? "threadsSeller": "threadsBuyer"
            const arr = this.mergeSort(this.state[[isBuyer]],"name",ascending)
            this.setState({[isBuyer] : arr})  
          
          }}
          style={{width:90}}
          >
          <View style={{flexDirection:"row",alignItems:"center"}}>
              <Text style={{fontWeight:this.state.orderBy == "name" ? "bold" : "normal",fontSize:15}}>Name</Text>
            {this.state.orderBy == "name" ? 
            <View style={{alignItems:"center",paddingHorizontal:3}}>
              {this.state.ascending ? 
              <AntDesign name="caretdown" size={15} color="black" /> :
              <View style={{paddingTop:3}}>
              <AntDesign name="caretup" size={15} color="black" />
              </View>
              }
            </View> : null}
          </View>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.6} onPress={() => {
            const ascending = this.state.orderBy == "title" ? !this.state.ascending : false
            this.setState({orderBy:"title",ascending});
            const isBuyer = this.state.page ? "threadsSeller": "threadsBuyer"
            const arr = this.mergeSort(this.state[[isBuyer]],"title",ascending)
            this.setState({[isBuyer] : arr})  
          
          }}>
          <View style={{flexDirection:"row",alignItems:"center",width:35}}>
              <Text style={{fontSize:15,fontWeight:this.state.orderBy == "title" ? "bold" : "normal"}}>Title</Text>
            {this.state.orderBy == "title" ? 
            <View style={{alignItems:"center",paddingHorizontal:3}}>
              {this.state.ascending ? 
              <AntDesign name="caretdown" size={15} color="black" /> :
              <View style={{paddingTop:3}}>
              <AntDesign name="caretup" size={15} color="black" />
              </View>
              }
            </View> : null}
          </View>
        </TouchableOpacity>
        {/* <View> */}
          <View style={{flexDirection:"row",alignItems:"center",justifyContent:"flex-end",width:90}}>
            {this.state.orderBy == "price" || this.state.orderBy == "date" ? 
            <View style={{alignItems:"center",paddingHorizontal:3}}>
              <TouchableOpacity activeOpacity={0.6} onPress={() => this.setState({ascending: !this.state.ascending})}>
                {this.state.ascending ? 
                <AntDesign name="caretdown" size={15} color="black" /> :
                <View style={{paddingTop:3}}>
                <AntDesign name="caretup" size={15} color="black" />
                </View>
                }
              </TouchableOpacity>
            </View> : null}
            <View style={{flexDirection:"row"}}>
              <TouchableOpacity activeOpacity={0.6} onPress={() => {
                const ascending = this.state.orderBy == "price" ? !this.state.ascending : false
                this.setState({orderBy:"price",ascending});
                const isBuyer = this.state.page ? "threadsSeller": "threadsBuyer"
                const arr = this.mergeSort(this.state[[isBuyer]],"price",ascending)
                this.setState({[isBuyer] : arr})  
              
              }}>
                <Text style={{fontSize:15,fontWeight:this.state.orderBy == "price" ? "bold" : "normal"}}>Price</Text>
              </TouchableOpacity>
              <Text style={{fontSize:15}}>/</Text>
              <TouchableOpacity activeOpacity={0.6} onPress={() => {
                const ascending = this.state.orderBy == "date" ? !this.state.ascending : false
                this.setState({orderBy:"date",ascending});
                const isBuyer = this.state.page ? "threadsSeller": "threadsBuyer"
                const arr = this.mergeSort(this.state[[isBuyer]],"date",ascending)
                this.setState({[isBuyer] : arr})  
              
              }}>
                <Text style={{fontSize:15,fontWeight:this.state.orderBy == "date" ? "bold" : "normal"}}>Date</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <Swiper
          ref={(swiper) => {
            this._swiper = swiper;
          }}
          loop={false}
          onIndexChanged={this.setPage}
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
                          historyOrderKey : item.historyOrderKey,
                        })
                        // this.setState({popupVisible:true})
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
                                                    {item.editing ?
                                                    <>
                          <TouchableOpacity onPress={() => {
                            const threadsBuyer = this.state.threadsBuyer
                            threadsBuyer[index].editing = false
                            threadsBuyer[index].title = threadsBuyer[index].oldTitle
                            threadsBuyer[index].oldTitle = ""
                            this.setState({threadsBuyer})
                          }}>
                          <AntDesign name="close" size={15} color="black" /> 
                          </TouchableOpacity>
                                                <TextInput
                        style={{
                          backgroundColor: "white",
                          borderRadius: 4,
                          padding: 8,
                          borderWidth: 3,
                          height: 50,
                          borderColor: "#FFDB0C",
                          shadowColor: "#FFDB0C",
                          shadowOffset: {
                            width: 0,
                            height: 6,
                          },
                          fontSize: 40,
                          shadowOpacity: 0.39,
                          shadowRadius: 10,
                        }}
                        onChangeText={(field) => {
                          const threadsBuyer = this.state.threadsBuyer
                          threadsBuyer[index].title = field
                          this.setState({ threadsBuyer });
                        }}
                        value={item.title}
                      />
                          <TouchableOpacity onPress={() => {
                            const threadsBuyer = this.state.threadsBuyer
                            threadsBuyer[index].editing = false
                            threadsBuyer[index].oldTitle = ""
                            this.setState({threadsBuyer})
                            this.ref().child("buyer").child(threadsBuyer[index].key).update({
                              title : threadsBuyer[index].title
                            })
                          }}>
                          <AntDesign name="check" size={20} color="black" /> 
                          </TouchableOpacity>
                          </>
                          : 
                          <>
                          <Text numberOfLines={1} style={{fontSize:20}}>{item.title}</Text>
                          <TouchableOpacity onPress={() => {
                            const threadsBuyer = this.state.threadsBuyer
                            threadsBuyer[index].editing = true
                            threadsBuyer[index].oldTitle = threadsBuyer[index].title
                            this.setState({threadsBuyer})
                          }}>
                          <AntDesign name="edit" size={15} color="black" />
                          </TouchableOpacity>
                          </>}
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
              <View style={{height: windowHeight - 300,justifyContent:"center",alignItems:"center"}}>
                <Text style={{color:"gray",fontSize:20}}>
                  No Buyer History
                </Text>
              </View>
            )}
          </View>
                    <View style={{ height: windowHeight - 300 }}>
            <Divider />
            {this.state.threadsSeller.length > 0 ? (
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
                          historyOrderKey : item.historyOrderKey,
                        })
                        // this.setState({popupVisible:true})
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
                          style={{flexDirection:"column",justifyContent:"space-around",
                                  width:windowWidth/2, height:80}}>
                          <View style={{justifyContent:"center",alignItems:"center",flexDirection:"row"}}>    
                                                                              {item.editing ?
                                                    <>
                          <TouchableOpacity onPress={() => {
                            const threadsSeller = this.state.threadsSeller
                            threadsSeller[index].editing = false
                            threadsSeller[index].title = threadsSeller[index].oldTitle
                            threadsSeller[index].oldTitle = ""
                            this.setState({threadsSeller})
                          }}>
                          <AntDesign name="close" size={30} color="black" /> 
                          </TouchableOpacity>
                          <View style={{width: (windowWidth/2) - 50}}>
                                                <TextInput
                        style={{
                          backgroundColor: "white",
                          borderRadius: 4,
                          paddingHorizontal: 8,
                          borderWidth: 3,
                          height: 40,
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
                        onChangeText={(field) => {
                          const threadsSeller = this.state.threadsSeller
                          threadsSeller[index].title = field
                          this.setState({ threadsSeller });
                        }}
                        value={item.title}
                      />
                      </View>
                          <TouchableOpacity onPress={() => {
                            const threadsSeller = this.state.threadsSeller
                            threadsSeller[index].editing = false
                            threadsSeller[index].oldTitle = ""
                            this.setState({threadsSeller})
                            this.ref().child("seller").child(threadsSeller[index].key).update({
                              title : threadsSeller[index].title
                            })
                          }}>
                          <AntDesign name="check" size={30} color="black" /> 
                          </TouchableOpacity>
                          </>
                          : 
                          <>
                          <Text numberOfLines={1} style={{fontSize:20}}>{item.title}</Text>
                          <TouchableOpacity onPress={() => {
                            const threadsSeller = this.state.threadsSeller
                            threadsSeller[index].editing = true
                            threadsSeller[index].oldTitle = threadsSeller[index].title
                            this.setState({threadsSeller})
                          }}>
                          <AntDesign name="edit" size={20} color="black" />
                          </TouchableOpacity>
                          </>}
                          </View>
                            <View style={{justifyContent:"flex-end",alignItems:"center",marginBottom:5}}>
                            {item.rating != undefined && item.daysLeftToReview == null ? 
                                <Text style={styles.daysLeft}> You rated a {item.rating}</Text> :
                                (item.daysLeftToReview ? (
                                  <>
                                    <RatingUser starSize={30} 
                                                selected={(rating) => this.setRating(false,item.key,item.index,rating)}
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
              <View style={{height: windowHeight - 300,justifyContent:"center",alignItems:"center"}}>
                <Text style={{color:"gray",fontSize:20}}>
                  No Seller History
                </Text>
              </View>
            )}
          </View>
        </Swiper>
        {/* <View style={{marginTop:40,position:"absolute",top:60,right:5}}>
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
        </View> */}
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
