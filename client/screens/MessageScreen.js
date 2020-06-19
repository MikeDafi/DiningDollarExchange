import React, { useState, useEffect } from 'react';
import {View,Text,StyleSheet,TouchableOpacity,FlatList,LayoutAnimation,Dimensions } from "react-native"
import {Ionicons,FontAwesome5} from "@expo/vector-icons"
import { List, Divider } from 'react-native-paper';
import firebase from "../../config"
import Loading from './LoadingScreen';
import Modal from 'react-native-modal';
import PopupOrder from './PopupOrder'
import Swiper from 'react-native-swiper/src'
const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;
export default class MessageScreen extends React.Component{

  state = {
    threads : [],
    loading : true,
    page : 0,
    domain: '',
    homepage: 0,
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
    .once('value', function (homepageSnapshot) {
        console.log(homepageSnapshot.val())
        thisClass.setState({homepage:homepageSnapshot.val(),rendered:true})
        console.log("in component mount ", thisClass.state.homepage)
    });
    }
  

    render(){
      if(this.state.loading){
        return <Loading navigation={this.props.navigation}/>;
      }

      LayoutAnimation.easeInEaseOut()
      if(this.state.rendered && this.state.homepage != 0){
          this._swiper.scrollBy(1)
          this.setState({rendered : false})
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
                                      console.log(this.state.popupVisible)
                                      this.setState({popupVisible:true})
                                  }} 
                                  >
              <FontAwesome5 name="user-friends" size={45} color="black" />
                  <Text> BUY NOW</Text>
              </TouchableOpacity>

          </View>
          <Swiper ref={(swiper) => {this._swiper = swiper;}} 
                  loop={false}
                  onIndexChanged={this.homepageIndexChanged}>
                <View>
                  <FlatList
                    data={this.state.threads}
                    keyExtractor={(item) => item._id}
                    ItemSeparatorComponent={() => <Divider />}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                      onPress={() => this.props.navigation.navigate('Room', { thread: item.chatId, chattingUser: item.title })}
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
              <View></View>
          </Swiper>
          {this.state.popupVisible && <PopupOrder navigation={this.props.navigation} togglePopupVisibility={this.togglePopupVisibility}/>}
    </View>
    );
   }
}

const styles = StyleSheet.create({
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