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
    console.log("currentUID")
    console.log( firebase.auth().currentUser.uid)
    firebase.database().ref('/users/' + firebase.auth().currentUser.uid + '/chats/')
    .once('value', function (chatsSnapshot) {
        var threadss = []
        var thread = {}
        chatsSnapshot.forEach(chat => {
            var element = chat.val()
            thread.chatId = element.chatId
            thread.title = element.title
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
                  title={item.title}
                  description='Item description'
                  titleNumberOfLines={1}
                  titleStyle={styles.listTitle}
                  descriptionStyle={styles.listDescription}
                  descriptionNumberOfLines={1}
                />
              </TouchableOpacity>
            )}
          />
                <Modal
                    testID={'modal'}
                    isVisible={false}
                    animationIn="slideInLeft"
                    animationOut="slideOutRight">
                </Modal>
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