import React, { useState, useEffect } from 'react';
import {View,Text,StyleSheet,TouchableOpacity,FlatList } from "react-native"
import {Ionicons,MaterialIcons} from "@expo/vector-icons"
import { List, Divider } from 'react-native-paper';
import firebase from "../../config"
import Loading from './LoadingScreen';
import Modal from 'react-native-modal';
export default class MessageScreen extends React.Component{

  state = {
    threads : [],
    loading : true,
    page : 0,
    domain: ''
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

  componentDidMount(){
    const thisClass = this
    const user = firebase.auth().currentUser
    const start = user.email.indexOf("@")
    const end = user.email.indexOf(".edu")
    const domain = user.email.substring(start,end)
    console.log("currentUID")
    console.log( firebase.auth().currentUser.uid)
    console.log("reference",'/users/' + domain +'/'+ firebase.auth().currentUser.email.substring(0,firebase.auth().currentUser.email.length - 4) + '/chats/')
    firebase.database().ref('/users/' + domain +'/'+ firebase.auth().currentUser.email.substring(0,firebase.auth().currentUser.email.length - 4) + '/chats/')
    .once('value', function (chatsSnapshot) {
        console.log("chatsSnapshot",chatsSnapshot)
        var threadss = []
        var thread = {}
        chatsSnapshot.forEach(chat => {
            thread.chatId = chat.key
            thread.title = chat.val().title
            thread._id = 1
            threadss.push(thread)
            thread = {}
        });
        console.log("threads")
        console.log(threadss)
        thisClass.setState({
          threads: threadss,
          loading: false
        });  
    });
    firebase.database().ref('/users/' + firebase.auth().currentUser.uid).child("page")
    .once('value', function (pageSnapshot) {
        thisClass.setState({page:pageSnapshot.val()})

    });
  }
  

    render(){
      if(this.state.loading){
        return <Loading navigation={this.props.navigation}/>;
      }
      console.log("threadsssssssssss",this.state.threads)
      return(
        <View style={styles.container}>
          <FlatList
            data={this.state.threads}
            keyExtractor={(item) => item._id}
            ItemSeparatorComponent={() => <Divider />}
            renderItem={({ item }) => (
              <TouchableOpacity
              onPress={() => this.props.navigation.navigate('Room', { thread: item.chatId })}
              >
                <List.Item
                  key={item.title}
                  title={item.title}
                  description='Item description'
                  titleNumberOfLines={1}
                  titleStyle={styles.listTitle}
                  descriptionStyle={styles.listDescription}
                  descriptionNumberOfLines={1}
                />
              </TouchableOpacity>
            )}
          renderBubble={props => {
          const color = props.currentMessage.read ? '#0084ff' : '#389bff';
          return (
            <Bubble
              {...props}
              wrapperStyle={{ right: { backgroundColor: 'blue' } }}
            />
          );
        }}
          />
        </View>
          // <View style={styles.container}>
          //     <View style={styles.header}>
          //         <TouchableOpacity onPress={()=>{this.props.navigation.navigate("BuyModal")}}>
          //             <Ionicons name="ios-home" size={24}/>
          //         </TouchableOpacity>
          //         <Text>Messages</Text>
          //         <TouchableOpacity onPress={this.here}>
          //             <MaterialIcons name="error" size={24} color="black" />
          //         </TouchableOpacity>
          //     </View>
          //     <Text>Message Screen</Text>
          // </View>
      );
   }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f5f5f5',
    flex: 1,
  },
  listTitle: {
    fontSize: 22,
  },
  listDescription: {
    fontSize: 16,
  },
});