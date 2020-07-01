import React, { useState, useEffect } from 'react';
import {View,Text,StyleSheet,TouchableOpacity,FlatList,Image,LayoutAnimation,Dimensions,TouchableWithoutFeedback} from "react-native"
import {Ionicons,FontAwesome5,FontAwesome} from "@expo/vector-icons"
import { List, Divider } from 'react-native-paper';
import firebase from "../../config"
import Loading from './LoadingScreen';
import PopupOrder from './PopupOrder'
import Swiper from 'react-native-swiper/src'
const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;
import { Col, Row, Grid } from "react-native-easy-grid";
export default class MessageScreen extends React.Component{

  state = {
    threads : [],
    loading : true,
    page : 0,
    domain: '',
    homepage: 0,
    date: new Date(),
    popupVisible : false,
    clicked : []
  }
  

  // useEffect(() => {
  //   const unsubscribe = firebase.firestore()
  //     .collection('users')
  //     .onSnapshot((querySnapshot) => {
  //       const threads = querySnapshot.docs.map((documentSnapshot) => {
  //         return {
  //           _id: documentSnapshot.id,
  //           // give defaults
  //           name: '',
  //           ...documentSnapshot.data(),
  //         };
  //       });

  //       setThreads(threads);

  //       if (loading) {
  //         setLoading(false);
  //       }
  //     });

  //   /**
  //    * unsubscribe listener
  //    */
  //   return () => unsubscribe();
  // }, []);  

    homepageIndexChanged = (index) => {
      this.setState({homepage:index})
    }

    nextButton = () => {
        return(
        <View style={[styles.nextButton,{backgroundColor: this.state.homepage == 1 ? "#FFE300" : "black",marginLeft:-5,width:(windowWidth/2) - 50}]}>
            <Text style={{color:"white"}}>
                SELLER
            </Text>
        </View>
        )
    }

    prevButton = () => {
        return(
        <View style={[styles.prevButton,{backgroundColor:this.state.homepage == 0 ? "#FFE300":"black",marginRight:-5,width:(windowWidth/2) - 60}]}>
            <Text style={{color:"white"}}>
                BUYER
            </Text>
        </View>
        )
    }

    togglePopupVisibility = (value) => {
      this.setState({popupVisible : value})
    }


    async componentDidMount(){
      const user = firebase.auth().currentUser
      const start = user.email.indexOf("@")
      const end = user.email.indexOf(".com")
      const domain = user.email.substring(start,end)
      const email = user.email.substring(0,end)
      console.log("in message screen")
      console.log('/users/' + domain +'/'+ firebase.auth().currentUser.email.substring(0,firebase.auth().currentUser.email.length - 4) + '/chats/')
      await firebase.database().ref('/users/' + domain +'/'+ firebase.auth().currentUser.email.substring(0,firebase.auth().currentUser.email.length - 4) + '/chats/')
      .once('value', (chatsSnapshot) => {
          console.log("chatsSnapshot",chatsSnapshot)
          var threadss = []
          var thread = {}
          chatsSnapshot.forEach( async chat => {
              var otherChatterEmail
              console.log("chat" ,chat)
              if(chat.key.indexOf(email) == 0){
                otherChatterEmail = chat.key.substring(email.length,chat.key.length)
              }else{
                otherChatterEmail = chat.key.substring(0, chat.key.length - email.length)
              }
              console.log("otherChatterEmail",otherChatterEmail)
              const image = firebase.storage().ref().child("profilePics/" + domain + "/" + otherChatterEmail +"/profilePic.jpg")
              await image.getDownloadURL().then((foundURL) => {
                thread.avatar = foundURL
                console.log("foundOne")
              }).catch((error) => {console.log(error)})

              const chatPath = "chats/" + domain + "/" + chat.key + "/chat"
              console.log("thread.chatId = chat.key")
              thread.otherChatterEmail = otherChatterEmail
              thread.chatId = chat.key
              thread.title = chat.val().title
              await this.getLastMessageInfo(chatPath,thread)
              this.displayTime(thread)
              console.log(thread)
              threadss.push(thread)
              thread = {}
              this.sortThreads(threadss)
              this.setState({
                threads: threadss,
              });  
              console.log("threads",threadss)
              
            
          })
      })

      firebase.database().ref('/users/' + firebase.auth().currentUser.uid).child("page")
      .once('value',  (homepageSnapshot) => {
          // console.log(homepageSnapshot.val())
          this.setState({homepage:homepageSnapshot.val(),loading: false,rendered:true})
          // console.log("in component mount ", this.state.homepage)
      });
    }


    displayTime = (thread) => {

      const dayOfTheWeek = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]
      var messageDate = new Date(thread.timestamp);
      var currentDate = this.state.date
      console.log("getHours ",messageDate.getHours())
      var hour, minute,seconds
      //2019 < 2020
      if(messageDate.getFullYear() == currentDate.getFullYear()){
        if(messageDate.getMonth() == currentDate.getMonth()){
          const difference = currentDate.getDate() - messageDate.getDate()
          if(difference < 7){
            if(difference == 0){
              hour = messageDate.getHours()
              var afterNoon = (hour % 12) > 0 ? "PM" : "AM"
              hour = hour % 12

              minute = "0" + messageDate.getMinutes()
              var formattedTime = hour + ':' + minute.substr(-2) + " " + afterNoon
              thread.formattedTime = formattedTime
            }else if(difference == 1){
              thread.formattedTime = "Yesterday"
            }else{
              thread.formattedTime = dayOfTheWeek[messageDate.getDay()]
            }
            return
          }
        }
      }

      const month = messageDate.getMonth() + 1
      const day = messageDate.getDate()
      const year = ("" + messageDate.getFullYear()).substr(-2)
      const formattedDate = month + "/" + day + "/" + year
      thread.formattedTime = formattedDate


    }

    sortThreads = (threads) => {
      for(var i = 0; i < threads.length; i += 1){
        console.log("before",threads[i].timestamp)
      }
      threads.sort(function(a, b){return a.timestamp-b.timestamp});
      for(var i = 0; i < threads.length; i += 1){
        console.log("after",threads[i].timestamp)
      }   
      this.setState({threads}) 
    }

    getLastMessageInfo = async (chatPath,thread) => {
      await firebase.database().ref(chatPath).limitToLast(1).once("value",(snapshot) => {
        snapshot.forEach((chat) => {
          const message = chat.val()
          console.log("message",message)
          if(message.readTime != undefined && message.readTime > message.timestamp){
            thread.timestamp = message.readTime
          }else{
            thread.timestamp = message.timestamp
          }
          thread.read = message.read
          if(message.text == undefined || message.text == ""){
            if(message.image == undefined){
              thread.text = "Confirmation Order"
            }else{
              thread.text = "Image"
            }
          }else{
            thread.text = message.text
          }
        })
      })
      console.log("time in")
    }
  

    render(){
      if(this.state.loading){
        return <Loading navigation={this.props.navigation}/>;
      }

      LayoutAnimation.easeInEaseOut()
      if(this.state.rendered && this.state.homepage != 0){
        setTimeout(() => {
          this._swiper.scrollBy(1)
          this.setState({rendered : false,
                         clicked:Array(this.state.threads.length).fill(false)})
        }, 100);
      }
      return(
      <View style={styles.container}>
          <View style={styles.header}>
              <TouchableOpacity onPress={ () => {
                  this._swiper.scrollBy(this.state.homepage * -1)
                  this.setState({homepage : 0})}}>
                  {this.prevButton()}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => {
                  this._swiper.scrollBy((this.state.homepage + 1) % 2)
                  this.setState({homepage : 1})}}>
                  {this.nextButton()}
              </TouchableOpacity>
              <TouchableOpacity style={{
                                  position:"absolute",
                                  left: (windowWidth/2) - 62,
                                  marginTop:40,
                                  width:120,
                                  height:120,
                                  borderRadius:120,
                                  backgroundColor:"white",
                                  justifyContent:"center",
                                  alignItems:"center",
                                  borderColor:"#FFE300",
                                  borderWidth:10
                                  }}
                                  onPress={()=>{
                                      // this.props.navigation.navigate("BuyModal")
                                      this.togglePopupVisibility(true)
                                  }} 
                                  >
              <FontAwesome5 name="user-friends" size={45} color="black" />
                  <Text> BUY NOW</Text>
              </TouchableOpacity>

          </View>
          <View>
            <Text style={{fontSize:50,fontWeight:"bold"}}>Chats</Text>
          </View>
          <Swiper ref={(swiper) => {this._swiper = swiper;}} 
                  loop={false}
                  onIndexChanged={this.homepageIndexChanged}>
                <View style={{height:windowHeight - 300}}>
                  <Divider/>
                  <FlatList
                    data={this.state.threads}
                    keyExtractor={(item) => item._id}
                    ItemSeparatorComponent={() => <Divider />}
                    renderItem={({ item,index }) => {
                      return(
                      <TouchableWithoutFeedback
                      onPressIn={()=> {
                        var clicked = this.state.clicked
                        clicked[index] = true
                        this.setState({clicked})
                      }}
                      onPressOut={() => {
                        var clicked = this.state.clicked
                        clicked[index] = false
                        this.setState({clicked})
                      }}
                      onPress={() => this.props.navigation.navigate('Room', { thread: item.chatId, chattingUser: item.title,otherChatterEmail : item.otherChatterEmail })}
                      >
                        <View style={[styles.chatRow,{backgroundColor : this.state.clicked[index] ? "#A9A9A9" : "white"}]}>
                          <View style={[styles.chatRow,{width:(3 * windowWidth/4)}]}>
                            <View style={[styles.avatar,{marginLeft:20}]}>
                              {item.avatar ? <Image source={{url : item.avatar}} style={styles.avatar}/> :
                              <FontAwesome name="user" size={50} color="black" />}
                            </View>
                            <View style={{flexDirection:"column",marginLeft:5}}>
                              <Text style={{fontSize:20}}>{item.title}</Text>
                              <Text style={{fontSize:15,color:"gray"}}>{item.text}</Text>
                            </View>
                          </View>
                          <View style={{justifyContent:"center",alignItems:"center",width:windowWidth/4}}>
                            <Text>{item.formattedTime}</Text>
                          </View>
                        </View>

                      </TouchableWithoutFeedback>
                    )}}
                  />
              </View>
              <View></View>
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
  chatRow:{
    flex:1,
    flexDirection:"row",
    height:80,
    alignItems:"center",
  },
  avatar:{
    borderRadius:60, 
    width:60,
    height:60, 
    borderColor:"black",
    borderWidth:1,
    alignItems:"center",
    justifyContent:"center",
  },
  container: {
    flex:1,
    paddingTop:30,
    backgroundColor: "white",
  },
header:{
    flexDirection:"row",
    alignItems:"center",
    justifyContent:"space-between",
    marginTop:50,
  },
  nextButton:{
    width:150,
    height:20,
    justifyContent: 'center',
    alignItems:'center',
  },
  prevButton:{
    width:150,
    height:20,
    justifyContent: 'center',
    alignItems:'center',
  },
  content: {
    backgroundColor: 'white',
    justifyContent: 'flex-end',
    alignItems: 'center',
    borderRadius: 4,
    height:300,
    borderColor: 'rgba(0, 0, 0, 0.1)',
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

                        {/* <List.Item
                          key={item.title}
                          title={item.title}
                          description='Item description'
                          titleNumberOfLines={1}
                          right={() => {<Text>HI</Text>}}
                          titleStyle={styles.listTitle}
                          descriptionStyle={styles.listDescription}
                          descriptionNumberOfLines={1}
                        /> */}