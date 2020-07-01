import React, { useState } from 'react';
import {IconButton} from 'react-native-paper'
import { GiftedChat,Bubble,Composer,Day } from 'react-native-gifted-chat';
import {StyleSheet,Platform, View,Dimensions,Animated,ActivityIndicator,SafeAreaView,TouchableOpacity,Text} from 'react-native'
import firebase from "../../config"
import { Entypo,AntDesign } from '@expo/vector-icons'; 
import UploadImages from "./UploadImages"
import * as ImagePicker from "expo-image-picker"
const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;
export default class RoomScreen extends React.Component{

  constructor(props){
    super(props)
    this.user = firebase.auth().currentUser
    this.userId = this.user.uid
    const start = this.user.email.indexOf("@")
    const end = this.user.email.indexOf(".com")
    const domain = this.user.email.substring(start,end)
    const email = this.user.email.substring(0,end)
    this.earlierMessage = ""

    const path = "profilePics/" + domain + "/" + email +"/profilePic.jpg"
  

    this.state = {
      messages : [],
      title : '',
      thread: (this.props.navigation.state.params || {}).thread,
      domain: domain,
      refreshing:false,
      opacities:{},
      messagess:{},
      lastMessageId:"",
      hasSentMessage: false,
      read : false,
      text : "",
      delivered : false,
      date : new Date(),
      uploadImagesVisible : false,
      count: 20,
      chattingUser: (this.props.navigation.state.params || {}).chattingUser,
      otherChatterEmail : (this.props.navigation.state.params || {}).otherChatterEmail,
      otherChatterOnline : false,
      user: {
        _id: firebase.auth().currentUser.uid, 
      }
    }
  }

  worthPuttingCenterTimestamp = (currentTimestamp) => {
    if( this.earlierMessage == ""){
      this.earlierMessage = currentTimestamp
      return null
    }else{
      const old = this.earlierMessage
      this.earlierMessage = currentTimestamp
      if(this.earlierMessage - old >= 3600){

        return (
          <View style={{alignItems:"center", marginVertical:10}}>
            <Text style={{fontSize:11, color:"gray"}}>{this.displayTime(currentTimestamp)}</Text>
          </View>
        )
      }
      return null
    }
  }



  renderBubble = (props) => {
    const currentTimestamp = props.currentMessage.timestamp
    const userId = props.currentMessage.user._id
        console.log("MESSAGE ",props.currentMessage)
    return (
      <View style={{flex:1}}>
        {this.worthPuttingCenterTimestamp(currentTimestamp)}
        <View style={{flexDirection:"row",justifyContent:"space-between",alignItems:"center"}}>
          {userId == this.userId &&  <View>
            <Text style={{fontSize:10, color:"gray",marginLeft:5}}>{this.displayActualTime(currentTimestamp)}</Text>
          </View>}
          <View>
            <Bubble
              {...props}
              wrapperStyle={{
                right: {
                  paddingHorizontal:3,
                  paddingVertical:1,
                  // Here is the color change
                  backgroundColor: '#1273de'
                }
              }}
              textStyle={{
                right: {
                  color: '#fff'
                }
              }}
            />

          </View>
          {userId != this.userId && <View>
            <Text style={{fontSize:10, color:"gray",marginRight:5}}>{this.displayActualTime(currentTimestamp)}</Text>
          </View>}
        </View>
        <View style={{alignItems:"flex-end",justifyContent:"center"}}>
            {this.state.lastMessageId == props.currentMessage._id && 
            this.renderDelivered()}
        </View>
      </View>
    );
  }

  scrollToBottomComponent =()=> {
    return (
      <View style={styles.bottomComponentContainer}>
        <IconButton icon='chevron-double-down' size={36} color='#6646ee' />
      </View>
    );
  }

  renderLoading = () => {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color='#6646ee' />
      </View>
    );
  }

  photoCallback = (params) =>{
    this.setState({uploadImagesVisible: false})
    if(params == null ){
      return
    }

    const uriToBlobPromises = []
    const uploadToFirebasePromises = []
    params.then(async (images) =>{
      for(var i = 0; i < images.length;i++){
        console.log("in for loop")
        const name = this.generateRandomString()
        this.uriToBlob(images[i].uri).then((blob) =>{
          console.log("in uritoblob")
            this.uploadToFirebase(blob,name)
            .then((snapshot) => {
              console.log("in snapshot")

                snapshot.ref.getDownloadURL().then(url => {
                  var message = {
                    text:"",
                    image:name,
                    read : this.state.otherChatterOnline,
                    timestamp: this.timestamp(),
                    user:{_id:firebase.auth().currentUser.uid}
                  }

                  console.log("message", message)
                  this.append(message);
                })
                console.log("Hi there")
              })
          })
      }
    })
  }


    // Promise.all(uriToBlobPromises).then(() => {
    // Promise.all(uploadToFirebasePromises).then(() => {
    //   params.then(async (images) =>{
    //     for(var i = 0; i < images.length;i++){
    //         console.log("imageHappened")
    //         let name = this.generateRandomString();
    //         await firebase.storage().ref(`/chats/${this.state.domain}/${this.state.thread}/${name}.jpg`).getDownloadURL().then((foundURL) =>{
    //           let name = foundURL
    //           var message = {
    //             text:"",
    //             image:name,
    //             read : this.state.otherChatterOnline,
    //             timestamp: this.timestamp(),
    //             user:{_id:notification.data.data.uid}
    //           }

    //           console.log("message", message)
    //           this.append(message);

    //         }).catch((error) => console.log(error))
    //     }
    // })
    // params.then(async (images) =>{
    //   for(var i = 0; i < images.length;i++){
    //     this.uriToBlob(images[i].uri).then(async(blob) =>{
    //       console.log("oh man")
    //       this.uploadToFirebase(blob )
    //      await firebase.storage().ref(`/chats/${this.state.domain}/${this.state.thread}/${this.state.name}.jpg`).getDownloadURL().then(onResolve, onReject);

    //       function onResolve(foundURL) {
    //           this.setState({ name: foundURL})
    //       }

    //       function onReject(error) {
    //           console.log(error.code);
    //       }
    //       console.log("here i am")
    //       var message = {
    //           text:"",
    //           image:name,
    //           read : this.state.otherChatterOnline,
    //           timestamp: this.timestamp(),
    //           user:{_id:notification.data.data.uid}

    //       }
    //       if(thisClass.state.profileImage){
    //           message.user.avatar = thisClass.state.profileImage
    //       }
    //       console.log("message", message)
    //       this.append(message);
    //     })
    //   }
    // })
  //}

  uriToBlob = (text) => {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = function() {
        // return the blob
        resolve(xhr.response);
        };
        
        xhr.onerror = function() {
        // something went wrong
        reject(new Error('uriToBlob failed'));
        };
        // this helps us get a blob
        xhr.responseType = 'blob';
        xhr.open('GET', text, true);
        
        xhr.send(null);
    });
  }

  generateRandomString = () =>{
      return Math.random().toString().substr(2, 20)
  }


uploadToFirebase = (blob,name) => {
    const user = firebase.auth().currentUser
    const start = user.email.indexOf("@")
    const end = user.email.indexOf(".com")
    const domain = user.email.substring(start,end)
    const email = user.email.substring(0,end)
    this.setState({name})
    firebase.storage().ref(`/chats/${this.state.domain}/${this.state.thread}/${name}.jpg`).put(blob, {
        contentType: 'image/jpeg'
    })
  }

 renderComposer = props => {
    return (
      <View style={{flexDirection: 'row',borderBottomWidth:0.5,borderTopWidth:0.2}}>
        <TouchableOpacity style={{paddingHorizontal: 10,justifyContent:"flex-end"}} onPress={()=>this.setState({uploadImagesVisible:true})}>
          <UploadImages isVisible={this.state.uploadImagesVisible} photoCallb={this.photoCallback}/>
          <Entypo name="camera" size={30} color="black" />
        </TouchableOpacity>
        <View style={{alignItems:"flex-end",flexDirection:"row",justifyContent:"center",width:windowWidth -50}}>
          <Composer {...props} />
          <TouchableOpacity style={{marginRight:5,marginBottom:10}} onPress={() => this.send(props.user,props.text)}>
            <Text style={{color:"#0A9CBF",fontSize:20}}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  } 

  userId = () => {
    return firebase.auth().currentUser.uid
  }

  ref = () =>{
    return firebase.database().ref('/chats/' + this.state.domain + '/' + this.state.thread + "/chat");
  }

  refCheckChatter = ()=> {
    return firebase.database().ref('/chats/' + this.state.domain + '/' + this.state.thread + "/");
  }


  timestamp = () => {
    return firebase.database.ServerValue.TIMESTAMP;
  }

  displayActualTime = (timestamp) => {
    var messageDate = new Date(timestamp);
    var hour, minute,seconds
    hour = messageDate.getHours()
    var afterNoon = (hour % 12) > 0 ? "PM" : "AM"
    hour = hour % 12

    minute = "0" + messageDate.getMinutes()
    return (hour + ':' + minute.substr(-2) + " " + afterNoon)
  }

  displayTime = (timestamp) => {
    // console.log("-----------------Display Time----------")
    // console.log("current",this.state.date)
    // console.log("timestamp",timestamp)
    const dayOfTheWeek = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]
    var messageDate = new Date(timestamp);
    var currentDate = this.state.date
    //console.log("getHours ",messageDate.getHours())
    var hour, minute,seconds
    hour = messageDate.getHours()
    var afterNoon = (hour % 12) > 0 ? "PM" : "AM"
    hour = hour % 12

    minute = "0" + messageDate.getMinutes()
    const time = (hour + ':' + minute.substr(-2) + " " + afterNoon)
    if(messageDate.getFullYear() == currentDate.getFullYear()){
      if(messageDate.getMonth() == currentDate.getMonth()){
        const difference = currentDate.getDate() - messageDate.getDate()
        if(difference < 7){
          if(difference == 0){

            return "Today " + time
          }else if(difference == 1){
            return "Yesterday " + time
          }else{
            return dayOfTheWeek[messageDate.getDay()] +" " + time
          }
        }
      }
    }

    const month = messageDate.getMonth() + 1
    const day = messageDate.getDate()
    const year = ("" + messageDate.getFullYear()).substr(-2)
    return(month + "/" + day + "/" + year + " " + time)


  }

  parse = (snapshot,loadEarlier) => {
    var { timestamp, text, user,image,confirmAnswer,read,readTime} = snapshot.val()
    const { key: _id } = snapshot;
    // const timestamp = new Date(timestamp);
    const message = {
      _id,
      timestamp,
      text,
      user,
      image,
    };
    if(!loadEarlier && user._id == firebase.auth().currentUser.uid){
      // console.log("user._id ", user._id)
      // console.log("firebase.auth",firebase.auth().currentUser.uid)
      // console.log("readTime",readTime)
      // console.log("read", read)
      const readTimeStamp = readTime ? readTime : new Date().getTime()
      this.setState({read,
                    lastMessageId : _id,
                    readTime: read ? this.displayTime(readTimeStamp) : 0,
                    delivered : true,
                    deliveredTime : this.displayTime(message.timestamp)})
    }
    if(text == "" && image == undefined && confirmAnswer == undefined){
        this.setState(previousState => {
            let opacities = previousState.opacities;  
            opacities[[_id]] = {animatedValue: new Animated.Value(1),confirmedOpacity:new Animated.Value(0)};                                      

            return { opacities }; 
        });
    }
    this.setState(previousState => {
        let messagess = previousState.messagess;  
        messagess[[_id]] = {confirmAnswer:confirmAnswer} 
        return { messagess }; 
    });
    
    // console.log("opacities1",this.state.messagess)
    return message;
  };

  on = callback => {
    this.ref().limitToLast(this.state.count).on('child_added', snapshot => callback(this.parse(snapshot,false)));
  }
  onCheckOtherChatter = callback => {

    this.refCheckChatter().child(this.state.otherChatterEmail).on("value",snapshot => {

      this.setState({otherChatterOnline : snapshot.val()[[this.state.otherChatterEmail]]})
      if(snapshot.val()[[this.state.otherChatterEmail]]){
        callback(snapshot.val())
      }
      })

  }
  // send the message to the Backend
  send = (user,text) => {
    // for (let i = 0; i < messages.length; i++) {
    //   const { text, user } = messages[i];
    //   const message = {
    //     text,
    //     user,
    //     timestamp: this.timestamp(),
    //   };
    //   console.log("message in send")
    //   console.log(message)
    //   this.append(message);
    // }
    const message = {
      text : text,
      user : user,
      read : this.state.otherChatterOnline,
      timestamp : this.timestamp()
    }

    this.setState({text : ""})

    this.append(message)
  };

  append = message => {
    const user = firebase.auth().currentUser
    const end = user.email.indexOf(".com")
    const hasSentMessage = user.email.substring(0,end) + "_hasSentMessage"
    this.setState({delivered : false,read : false,hasSentMessage: true})
    this.refCheckChatter().child(user.email.substring(0,end)).update({[hasSentMessage] : true})
    this.ref().push(message).then(() => {
      this.setState({delivered: true,
                    deliveredTime: this.displayTime(new Date().getTime())});
      setTimeout(() => {
        this.setState({read : this.state.otherChatterOnline})
      },500)
    })
  }


  async componentDidMount() {
    const user = firebase.auth().currentUser
    const end = user.email.indexOf(".com")
    const email = user.email.substring(0,end)
    const path = "profilePics/" + this.state.domain + "/" + email +"/profilePic.jpg"
    console.log("path",path)

    this.refCheckChatter().child(email + "/" + email + "_hasSentMessage").once("value",(snapshot)=> {
      this.setState({hasSentMessage: snapshot.val()})
    })
    
    this.refCheckChatter().child(email).update({[email] :true})
    // firebase.storage().ref("/chats/@gmail/fakedafi2@gmailfakedafi@gmail/0405095287031324.jpg").getDownloadURL().then(() => {
    //   this.setState({profileImage : foundURL})
    //   console.log("found profile image")
    // }).catch((error) => {console.log("no profileeeeeeee image")})

    // //firebase.storage().ref("profilePics/@gmail/fakedafi@gmail/profilePic.jpg").once("value",(snapshot) => {console.log("snapshot",snapshot)})
    // await firebase.storage().ref(path).getDownloadURL().then(() => {
    //   this.setState({profileImage : foundURL})
    //   console.log("found profile image")
    // }).catch((error) => {console.log("no profile image")})

    this.on(message =>{
      this.setState(previousState => ({
        messages: GiftedChat.append(previousState.messages, message)
      }))
    });

    this.onCheckOtherChatter( otherChatterOnline => {
      this.setState({read : otherChatterOnline[[this.state.otherChatterEmail]]})
      if(otherChatterOnline && !this.state.read){
            console.log("NOOOO")
            this.ref().child(key).update({read : otherChatterOnline[[this.state.otherChatterEmail]],
                                          readTime: timestamp})
      }
    })
  }

  componentWillUnmount (){
    const user = firebase.auth().currentUser
    const end = user.email.indexOf(".com")
    const email = user.email.substring(0,end)
    this.ref().off()
    this.refCheckChatter().child(this.state.otherChatterEmail).off()
    this.refCheckChatter().child(email).update({[email] : false})
  }

  updatedMessageConfirmAnswer = (_id,answer) => {
     this.ref().child(_id).update({confirmAnswer : answer})
  }

  _start = (_id,answer) => {
    Animated.parallel([
      Animated.timing(this.state.opacities[[_id]].animatedValue, {
        toValue: 0,
        duration: 300
      }),
      Animated.timing(this.state.opacities[_id].confirmedOpacity, {
        toValue: 1,
        duration: 300
      }),
    ]).start()
    this.setState(previousState => {
      let messagess = previousState.messagess;  
      messagess[[_id]] = {confirmAnswer:answer} 
      return { messagess }; 
    });
    this.updatedMessageConfirmAnswer(_id,answer)
  };

  initialConfirmMessage = (_id,confirmAnswer,timestamp) => {
    return(
      <View style={{width:windowWidth - 80,height:150}}>
        <View style={{alignItems:"center"}}>
          <Text>Confirm Order</Text>
        </View>
        <View style={{flexDirection:'row',justifyContent:"space-between",marginHorizontal:30}}>
          <Animated.View
            style={{
              transform: [
                {
                  translateX: this.state.opacities[[_id]].animatedValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [(windowWidth - 250)/2, 0]
                  })
                }
              ],
              opacity: this.state.opacities[[_id]].animatedValue
              }}
          >
            <TouchableOpacity activeOpacity={0.5} 
                                style={styles.confirmButton}
                                onPress={async () => { this._start(_id,false)}}>
              <Text>NO</Text>
            </TouchableOpacity>
          </Animated.View>
          <Animated.View
            style={{
              translateX: -(windowWidth - 315)/2,
              opacity: this.state.opacities[[_id]].confirmedOpacity
              }}
          >
            <View 
                style={[styles.confirmButton,{backgroundColor: confirmAnswer ? "green" : "red"}]}
            >
              <Text>Hi</Text>
            </View>
          </Animated.View>
          <Animated.View
            style={{
              transform: [
                {
                  translateX: this.state.opacities[[_id]].animatedValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-((windowWidth - 150)/2), -(windowWidth - 250)/2]
                  })
                }
              ],
              opacity: this.state.opacities[[_id]].animatedValue
              }}
          >
            <TouchableOpacity activeOpacity={0.5} 
                                style={[styles.confirmButton,{backgroundColor:"green"}]}
                                onPress={() => { this._start(_id,true)}}>
              <Text>YES</Text>
            </TouchableOpacity>
          </Animated.View>

        </View>
      </View>
    )
  }

  selectedConfirmMessage = (confirmAnswer,timestamp) => {
    return(
      <View style={{width:windowWidth - 80,height:150,alignItems:"center",marginRight:200}}>
        <View style={{alignItems:"center"}}>
          <Text>Confirm Order</Text>
        </View>
        <View style={{flexDirection:'row',justifyContent:"space-between",marginHorizontal:30}}>
          <View
            style={{
                opacity: 1,
              }}
          >
            <View style={[styles.confirmButton,
                        {backgroundColor:confirmAnswer ? "green" : "red"}]}>
              <Text>Hioo</Text>
            </View>
          </View>
        </View>
      </View>
    )
  }

  renderTime = (timestamp) => {
    return (<Text>{this.displayTime(timestamp)}</Text>)
  }

  renderConfirm =  (props) =>{
    const message = props.currentMessage
    const confirmAnswer = this.state.messagess[[message._id]].confirmAnswer
    if(message.text == "" && message.image == undefined){
      if(confirmAnswer == undefined){
        return this.initialConfirmMessage(message._id,confirmAnswer,message.timestamp);
      }else{
       return this.selectedConfirmMessage(confirmAnswer,message.timestamp)
      }
    }
  }

  renderNavigation = () => {
    return (
      <View style={{height: 50,
                    backgroundColor:"white",        
                    flexDirection:"row",
                    alignItems:"center",
                    justifyContent:"space-between",
                    marginHorizontal:10,
                    }}>
        <TouchableOpacity onPress={() => this.props.navigation.goBack(null)}>
          <AntDesign name="arrowleft" size={30} color="black" />
        </TouchableOpacity>
        <Text>{this.state.chattingUser}</Text>
        <TouchableOpacity onPress={() => {
            this.send(this.state.user,"")
        }}>
          <Text>Confirm Order</Text>
        </TouchableOpacity>
      </View>
    )
  }

  renderDelivered = () => {

    if(this.state.read && this.state.hasSentMessage){
      return (      
        <View style={{alignItems:"flex-end",marginRight:10}}>
          <Text>Read {this.state.readTime}</Text>
        </View>
      )
    }else if(this.state.delivered && this.state.hasSentMessage){
      return (      
        <View style={{alignItems:"flex-end",marginRight:10}}>
          <Text>Delivered {this.state.deliveredTime}</Text>
        </View>
      )
    }else{
      return null
    }

  }

  onLoadingEarlier = async () => {
    console.log("------------------------------------")
    var originalCount = 1
    await this.setState(previousState => ({
      count : previousState.count + 10
    }))
    var possible = true
    var newMessages = []
    const n = this.state.messages.length
    //console.log("HI THERE",this.state.messages)
    const lastMessage = this.state.messages.slice(n - 1,n)[0]
    await this.ref().limitToLast(this.state.count).once("value",snapshot =>{
                  //console.log("lastMessage ", lastMessage)
      snapshot.forEach((premessage) => {
          // console.log("premessage ",premessage)
          const message = this.parse(premessage,true)
          if(originalCount <= 10 && possible){
            console.log(message)
            if(message._id != lastMessage._id){
              if(!this.state.messagess[[message._id]]){
                console.log("THERES ANOTHER")
                console.log(message._id)
                setTimeout(()=>{ newMessages.push(message)},20000)
              }else{
              newMessages.push(message)
              }
            }else{
              possible = false
            }
            originalCount += 1
          }else{
          }
      })

    });
    if(newMessages.length != 0){
      await newMessages.reverse().forEach(element => {
        this.setState(previousState => ({
          messages: GiftedChat.prepend(previousState.messages, element),
        }))
      });
      console.log("MESSAGES ",this.state.messages)
    }

  }

  isCloseToTop({ layoutMeasurement, contentOffset, contentSize }) {
    const paddingToTop = 80;
    return contentSize.height - layoutMeasurement.height - paddingToTop <= contentOffset.y;
  }

  renderLoadEarlier = () => {
    return(
      <View style={{flex:1,justifyContent:"center"}}>
        <ActivityIndicator size="large" color="blue" />
      </View>
    )
  }

  renderDay = () => {
    return <Day textStyle={{color: 'red'}}/>
  }

  render(){
    const thisClass = this
    const mainContent = (

      <GiftedChat

        renderLoadEarlier={this.renderLoadEarlier}
        loadEarlier={this.state.refreshing}
        isLoadingEarlier={this.state.refreshing}
        messages={this.state.messages}
        renderComposer={this.renderComposer}
        onSend={this.send}
        renderCustomView={this.renderConfirm}
        renderSend={null}
        user={this.state.user}
        isCustomViewBottom={true}
        renderAvatar={null}
        renderBubble={this.renderBubble}
        onInputTextChanged={(text) => this.setState({text})}
        text={this.state.text}
        placeholder='Type your message here...'
        showAvatarForEveryMessage={false}
        renderLoading={this.renderLoading}
        scrollToBottomComponent={this.scrollToBottomComponent}
        listViewProps={{
          scrollEventThrottle: 400,
          onScroll: async({ nativeEvent }) => {
            if (this.isCloseToTop(nativeEvent)) {
              await this.setState({refreshing: true});
              await this.onLoadingEarlier();
              setTimeout(() => {this.setState({refreshing: false})}, 1000)
            
            }
          }
        }}
      />
    );
    if (Platform.OS === 'android') {
      return (
      <KeyboardAvoidingView style={{backgroundColor:"white"}} behavior="padding"  keyboardVerticalOffset={80} enabled>
           {thisClass.renderNavigation()}
           {mainContent} 
      </KeyboardAvoidingView>
    );
    } else {
      return (<SafeAreaView style={{flex: 1,backgroundColor:"white"}}>
        {thisClass.renderNavigation()}
        {mainContent}
      </SafeAreaView>)
    } 
  }
}

const styles = StyleSheet.create({
  // rest remains same
  bottomComponentContainer: {
    justifyContent: 'center',
    alignItems: 'center'

  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  confirmButton : {
    width:100,
    height:100,
    borderRadius:100,
    borderWidth:3,
    justifyContent:"center",
    alignItems:"center",
    borderColor:"white",
    backgroundColor:"red",
    color:"white"
  }
});