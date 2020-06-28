import React, { useState } from 'react';
import {IconButton} from 'react-native-paper'
import { GiftedChat,Bubble,Composer,Day } from 'react-native-gifted-chat';
import {StyleSheet,Platform, View,Dimensions,Animated,ActivityIndicator,SafeAreaView,TouchableOpacity,Text} from 'react-native'
import firebase from "../../config"
import { Entypo,AntDesign } from '@expo/vector-icons'; 
import * as ImagePicker from "expo-image-picker"
const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;
export default class RoomScreen extends React.Component{

  constructor(props){
    super(props)
    const user = firebase.auth().currentUser
    const start = user.email.indexOf("@")
    const end = user.email.indexOf(".com")
    const domain = user.email.substring(start,end)
    const email = user.email.substring(0,end)

    const path = "profilePics/" + domain + "/" + email +"/profilePic.jpg"
  

    this.state = {
      messages : [],
      title : '',
      thread: (this.props.navigation.state.params || {}).thread,
      domain: domain,
      profileImage: null,
      refreshing:false,
      opacities:{},
      messagess:{},
      lastMessageId:"",
      read : false,
      delivered : false,
      count: 20,
      chattingUser: (this.props.navigation.state.params || {}).chattingUser,
      otherChatterEmail : (this.props.navigation.state.params || {}).otherChatterEmail,
      otherChatterOnline : false,
      user: {
        _id: firebase.auth().currentUser.uid, 
        name: firebase.auth().currentUser.displayName,
        avatar : null
      }
    }
  }

  renderBubble = (props) => {
    return (
      // Step 3: return the component
      <Bubble
        {...props}
        wrapperStyle={{
          right: {
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
    if(params == null ){
      return
    }
    params.then(async (images) =>{
      for(var i = 0; i < images.length;i++){
        this.uriToBlob(images[i].uri).then(async(blob) =>{
          console.log("oh man")
          this.uploadToFirebase(blob )
         await firebase.storage().ref(`/chats/${this.state.domain}/${this.state.thread}/${this.state.name}.jpg`).child().getDownloadURL().then(onResolve, onReject);

          function onResolve(foundURL) {
              this.setState({ name: foundURL})
          }

          function onReject(error) {
              console.log(error.code);
          }
          console.log("here i am")
          var message = {
              text:"",
              image:name,
              read : this.state.otherChatterOnline,
              timestamp: this.timestamp(),
              user:{_id:notification.data.data.uid, name: notification.data.data.displayName}

          }
          if(thisClass.state.profileImage){
              message.user.avatar = thisClass.state.profileImage
          }
          console.log("message", message)
          this.append(message);
        })
      }
    })
  }

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


uploadToFirebase = (blob) => {
    const user = firebase.auth().currentUser
    const start = user.email.indexOf("@")
    const end = user.email.indexOf(".com")
    const domain = user.email.substring(start,end)
    const email = user.email.substring(0,end)
    const name = this.generateRandomString()
    this.setState({name})
    return new Promise((resolve, reject)=>{
        console.log(`/tempPhotos/${domain}/${email}/${name}.jpg`)
        firebase.storage().ref(`/chats/${this.state.domain}/${this.state.thread}/${name}.jpg`).put(blob, {
        contentType: 'image/jpeg'
        }).catch((error)=>{
        reject(error);
        });
    });
  }

 renderComposer = props => {
    return (
      <View style={{flexDirection: 'row',borderBottomWidth:0.5,borderTopWidth:0.2}}>
        <TouchableOpacity style={{paddingHorizontal: 10,justifyContent:"flex-end"}} onPress={()=>this.props.navigation.navigate("UploadImages",{photoCallb: this.photoCallback})}>
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


  parse = snapshot => {
    const { timestamp: numberStamp, text, user,image,confirmAnswer,read} = snapshot.val();
    const { key: _id } = snapshot;
    const timestamp = new Date(numberStamp);
    const message = {
      _id,
      timestamp,
      text,
      user,
      image,
    };
    if(text == "" && image == undefined && confirmAnswer == undefined){
      this.setState(previousState => {
          let opacities = previousState.opacities;  
          opacities[[_id]] = {animatedValue: new Animated.Value(1),confirmedOpacity:new Animated.Value(0)};                                      

          return { opacities }; 
      });
    }
    this.setState(previousState => {
        let messagess = previousState.messagess;  
        messagess[[_id]] = {confirmAnswer:confirmAnswer,read:read} 
        return { messagess }; 
    });
    // console.log("opacities1",this.state.messagess)
    return message;
  };

  on = callback => {
    this.ref().limitToLast(this.state.count).on('child_added', snapshot => callback(this.parse(snapshot)));
  }
  onCheckOtherChatter = callback => {
    this.refCheckChatter().child(this.state.otherChatterEmail).on("value",snapshot => callback(snapshot.val()))
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
    this.append(message)
  };

  append = message => {
    this.setState({delivered : false})
    this.ref().push(message)
  }


  async componentDidMount() {
    const user = firebase.auth().currentUser
    const end = user.email.indexOf(".com")
    const email = user.email.substring(0,end)
    const path = "profilePics/" + this.state.domain + "/" + email +"/profilePic.jpg"
    await firebase.storage().ref().child(path).getDownloadURL().then(onResolve, onReject);

    function onResolve(foundURL) {
        this.setState({profileImage : foundURL})
    }

    function onReject(error) {
        console.log(error.code);
    }
    await this.ref().limitToLast(1).once("value",(snapshot) =>{
      this.setState({lastMessageId : snapshot.key})
    })
    await this.refCheckChatter().update({[email] :true})

    this.on(message =>{
      // const messagess = this.state.messagess
      // messagess[[message._id]].delivered = true
              setTimeout(() => {
                this.setState(previousState => ({
        messages: GiftedChat.append(previousState.messages, message),
        // lastMessageId : message._id,
        // messagess : messagess,
        delivered : true
      }))
        }, 5000);
      // this.ref().child(message._id).update({delivered : true})
    });
    this.onCheckOtherChatter( otherChatterOnline => {
      console.log("otherChatterOnline ", otherChatterOnline)
      this.setState({otherChatterOnline})
      if(otherChatterOnline){
        var key = ""
        this.ref().limitToLast(1).once("value",(snapshot) => {
        snapshot.forEach(message => {
          key = message.key
          console.log("KEY",key)
          this.ref().child(key).update({read : otherChatterOnline})
        })
        this.setState({read : otherChatterOnline})
        })
      }
    })
  }

  componentWillUnmount (){
    this.ref().off()
    this.refCheckChatter().off()
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

  initialConfirmMessage = (_id,confirmAnswer) => {
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

  selectedConfirmMessage = (confirmAnswer) => {
    return(
      <View style={{width:windowWidth - 80,height:150,alignItems:"center"}}>
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

  renderConfirm =  (props) =>{
    const message = props.currentMessage
    const confirmAnswer = this.state.messagess[[message._id]].confirmAnswer
    if(message.text == "" && message.image == undefined){
      if(confirmAnswer == undefined){
        return this.initialConfirmMessage(message._id,confirmAnswer);
      }else{
       return this.selectedConfirmMessage(confirmAnswer)
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

  renderDelivered = (props) => {

    if(this.state.read){
      return <Text>Read</Text>
    }else if(this.state.delivered){
      return <Text>Delivered</Text>
    }else{
      return <Text>Not Read</Text>
    }

  }

  onLoadingEarlier = async () => {
    var originalCount = 1
    await this.setState(previousState => ({
      count : previousState.count + 20
    }))
    var possible = true
    var newMessages = []
    const n = this.state.messages.length
    this.on(message =>{
      if(originalCount <= 20 && possible){
      
        if(message._id != this.state.messages.slice(n - 1,n)[0]._id){
         newMessages.push(message)
        }else{
          possible = false
        }
        originalCount += 1
      }else{
      }
    });
    if(newMessages.length != 0){
      newMessages.reverse().forEach(element => {
        this.setState(previousState => ({
          messages: GiftedChat.prepend(previousState.messages, element),
        }))
      });
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
        renderDay={this.renderDay}
        renderLoadEarlier={this.renderLoadEarlier}
        loadEarlier={this.state.refreshing}
        isLoadingEarlier={this.state.refreshing}
        messages={this.state.messages}
        renderComposer={this.renderComposer}
        onSend={this.send}
        isCustomViewButton={true}
        renderCustomView={this.renderConfirm}
        renderSend={null}
        renderChatFooter={this.renderDelivered}
        user={this.state.user}
        // renderBubble={this.renderBubble}
        placeholder='Type your message here...'
        showUserAvatar={true}
        showAvatarForEveryMessage={true}
        renderLoading={this.renderLoading}
        scrollToBottomComponent={this.scrollToBottomComponent}
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