import React, { useState } from 'react';
import {IconButton} from 'react-native-paper'
import { GiftedChat,Bubble,Composer } from 'react-native-gifted-chat';
import {StyleSheet,Platform, View,Dimensions,Animated,ActivityIndicator,SafeAreaView,TouchableOpacity,Text} from 'react-native'
import firebase from "../../config"
import { Entypo,AntDesign } from '@expo/vector-icons'; 
import * as ImagePicker from "expo-image-picker"
import UserPermissions from "../../utilities/UserPermissions"
const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;
export default class RoomScreen extends React.Component{

  state = {
    messages : [],
    title : '',
    thread: (this.props.navigation.state.params || {}).thread,
    domain: '',
    profileImage: null,
    customView: false,
    opacities:{},
    messagess:{},
    chattingUser: (this.props.navigation.state.params || {}).chattingUser,
  }

  componentDidMount(){
    const user = firebase.auth().currentUser
    const start = user.email.indexOf("@")
    const end = user.email.indexOf(".edu")
    const images = firebase.storage().ref().child('profilePics');
    const image = images.child(firebase.auth().currentUser.uid + ".jpg");
    image.getDownloadURL().then((url) =>  this.setState({ profileImage: url,domain :user.email.substring(start,end) }));
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

  handleAddPicture = async(user) => {
    this.setState({customView : true})
    UserPermissions.getCameraPermission()
    let result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    // allowEditing:true,
    // aspect:[4,3]
    });

    if(!result.cancelled){
      const message = {
        image : result.uri,
        user : user,
        timestamp: this.timestamp(),
      };
      this.append(message);
    }
  }

 renderComposer = props => {

  return (
    <View style={{flexDirection: 'row',borderBottomWidth:0.5,borderTopWidth:0.2}}>
      <TouchableOpacity style={{paddingHorizontal: 10,justifyContent:"flex-end"}} onPress={()=>this.handleAddPicture(props.user)}>
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

    return firebase.database().ref('/chats/' + this.state.domain + '/' + this.state.thread);
  }

  timestamp = () => {
    return firebase.database.ServerValue.TIMESTAMP;
  }

  add

  parse = snapshot => {
    const { timestamp: numberStamp, text, user,image,confirmAnswer} = snapshot.val();
    const { key: _id } = snapshot;
    const timestamp = new Date(numberStamp);
    const message = {
      _id,
      timestamp,
      text,
      user,
      image,
    };
    if(text == "" && image == undefined){
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

  on = callback =>
    this.ref().limitToLast(20).on('child_added', snapshot => callback(this.parse(snapshot)));

  // send the message to the Backend
  send = (user,text) => {
    console.log("IN SEND",this.state.profileImage)
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
      timestamp : this.timestamp()
    }
    this.append(message)
  };

  append = message => this.ref().push(message);


  componentDidMount() {
    this.on(message =>{
      this.setState(previousState => ({
        messages: GiftedChat.append(previousState.messages, message),
      }))
    });
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
    const confirmAnswer = this.state.messagess[message._id].confirmAnswer
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
            const message = {
              text : "",
              animatedValue: 1,
              confirmedOpacity:0,
              user : { _id: firebase.auth().currentUser.uid, name: firebase.auth().currentUser.displayName,avatar : this.state.profileImage},
              timestamp : this.timestamp()
            }
            this.append(message)
            
        }}>
          <Text>Confirm Order</Text>
        </TouchableOpacity>
      </View>
    )
  }

  render(){
    const thisClass = this
    const mainContent = (

      <GiftedChat
        messages={this.state.messages}
        renderComposer={this.renderComposer}
        onSend={this.send}
        isCustomViewButton={true}
        renderCustomView={this.renderConfirm}
        renderSend={null}
        user={{ _id: firebase.auth().currentUser.uid, name: firebase.auth().currentUser.displayName,avatar : this.state.profileImage}}
        renderBubble={this.renderBubble}
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