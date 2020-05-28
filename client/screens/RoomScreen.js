import React, { useState } from 'react';
import {IconButton} from 'react-native-paper'
import { GiftedChat,Bubble } from 'react-native-gifted-chat';
import {StyleSheet,Platform, View,ActivityIndicator,SafeAreaView} from 'react-native'
import firebase from "../../config"
export default class RoomScreen extends React.Component{

  state = {
    messages : [],
    title : '',
    thread: (this.props.navigation.state.params || {}).thread
  }


  renderBubble = (props) => {
    return (
      // Step 3: return the component
      <Bubble
        {...props}
        wrapperStyle={{
          right: {
            // Here is the color change
            backgroundColor: '#6646ee'
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

  userId = () => {
    return firebase.auth().currentUser.uid
  }

  ref = () =>{

    return firebase.database().ref('/chats/' + this.state.thread);
  }

  timestamp = () => {
    return firebase.database.ServerValue.TIMESTAMP;
  }

  

  parse = snapshot => {
    const { timestamp: numberStamp, text, user } = snapshot.val();
    const { key: _id } = snapshot;
    const timestamp = new Date(numberStamp);
    const message = {
      _id,
      timestamp,
      text,
      user,
    };
    console.log("message")
    console.log(message)
    return message;
  };

  on = callback =>
    this.ref().limitToLast(20).on('child_added', snapshot => callback(this.parse(snapshot)));

  // send the message to the Backend
  send = messages => {
    for (let i = 0; i < messages.length; i++) {
      const { text, user } = messages[i];
      const message = {
        text,
        user,
        timestamp: this.timestamp(),
      };
      console.log("message in send")
      console.log(message)
      this.append(message);
    }
  };

  append = message => this.ref().push(message);


  componentDidMount() {
    console.log(this.props.navigation)
    console.log("thread")
    console.log(this.state.thread)
    this.on(message =>{
      console.log("in mount")
      console.log(message)
      this.setState(previousState => ({
        messages: GiftedChat.append(previousState.messages, message),
      }))
    });
  }

  render(){
    console.log("firebase current user")
    console.log(firebase.database)
    const mainContent = (
      <GiftedChat
        messages={this.state.messages}
        onSend={this.send}
        user={{ _id: firebase.auth().currentUser.uid, name: 'User Test' }}
        renderBubble={this.renderBubble}
        placeholder='Type your message here...'
        showUserAvatar
        alwaysShowSend
        renderLoading={this.renderLoading}
        scrollToBottomComponent={this.scrollToBottomComponent}
      />
    );
    if (Platform.OS === 'android') {
      return (
      <KeyboardAvoidingView style={{flex: 1}} behavior="padding"  keyboardVerticalOffset={80} enabled>
           {mainContent} 
      </KeyboardAvoidingView>
    );
    } else {
      return (<SafeAreaView style={{flex: 1}}>
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
  }
});