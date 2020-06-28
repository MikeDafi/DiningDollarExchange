import React from 'react'
import {View,Text, StyleSheet,Button,TouchableOpacity,LayoutAnimation,AppRegistry,Vibration,Image,Dimensions} from 'react-native'
import * as firebase from 'firebase'
import BuyerHomeScreen from './BuyerHomeScreen'
import SellerHomeScreen from './SellerHomeScreen'
import Swiper from 'react-native-swiper/src'
import { Notifications } from 'expo';
import PopupOrder from './PopupOrder'
import { FontAwesome5,Ionicons } from '@expo/vector-icons'; 
const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;
import * as Permissions from 'expo-permissions';
import Constants from 'expo-constants';

export default class HomeScreen extends React.Component{
    state ={
        email: "",
        displayName:"",
        homepage: 0,
        rendered : false,
        popupVisible : false,
    }
    componentDidMount(){
        const{email,displayName} = firebase.auth().currentUser
        this.setState({email,displayName})
        const thisClass = this

        firebase.database().ref('/users/' + firebase.auth().currentUser.uid).child("page")
        .once('value', function (homepageSnapshot) {
            console.log(homepageSnapshot.val())
            thisClass.setState({homepage:homepageSnapshot.val(),rendered:true})
            console.log("in component mount ", thisClass.state.homepage)
        });

            this.registerForPushNotificationsAsync();
            this._notificationSubscription = Notifications.addListener(this._handleNotification);

    }

    uriToBlob = async (uri) => {
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
            xhr.open('GET', uri, true);
            
            xhr.send(null);
        });
    }

    uploadToFirebase = async (blob,path) => {
    return new Promise((resolve, reject)=>{
        var storageRef = firebase.storage().ref();
        let uid =  (firebase.auth().currentUser || {}).uid
        const start = this.state.email.indexOf("@")
        const end = this.state.email.indexOf(".com")
        const domain = this.state.email.substring(start,end)
        storageRef.child(`${path}.jpg`).put(blob, {
        contentType: 'image/jpeg'
        }).catch((error)=>{
        reject(error);
        });
    });
    }

    timestamp = () => {
        return firebase.database.ServerValue.TIMESTAMP;
    }

    _handleNotification = notification => {
        console.log("-------------------------------------")
        console.log("in notification", notification.data.data.orderNumber)
        const myUser = firebase.auth().currentUser.email.substring(0,firebase.auth().currentUser.email.length - 4)
        const start = myUser.indexOf("@")
        const domain = this.state.email.substring(start,firebase.auth().currentUser.email.length - 4)
        console.log("85")
        var hasDone = false

        firebase.database().ref("orders/"+domain + "/currentOrders/" + notification.data.data.orderNumber)
        .once("value",async (snapshot) => {
            //console.log("snapshot","orders/"+domain + "/currentOrders/" + notification.data.data.orderNumber)
            const order = snapshot.val()
            if(order.status == "searching" && !hasDone){
                hasDone = true
                firebase.database().ref("orders/"+domain + "/currentOrders/" + notification.data.data.orderNumber).update({status:"in-progress"})
                firebase.database().ref("users/" + domain +'/'+ myUser + '/chats/' + order.buyer + myUser + '/').set({
                    title : order.buyer
                })
                firebase.database().ref("users/" + domain +'/'+ order.buyer + '/chats/' + order.buyer + myUser + '/').set({
                    title : firebase.auth().currentUser.displayName
                })
                var storageRef = firebase.storage().ref();
                const path = "/chats/" +domain + "/" + order.buyer + myUser + "/chat";
                // console.log("path",path)
                const profileImagePath = "profilePics/" + domain + "/" + order.buyer + "/profilePic.jpg"
                // console.log("profileImagePath",profileImagePath)

                firebase.storage().ref().child(profileImagePath).getDownloadURL().then(onResolve, onReject);

                function onResolve(foundURL) {
                    this.setState({ profileImage: foundURL})
                }

                function onReject(error) {
                }
                console.log("order")
                const promises = []
               const orderImages = firebase.storage().ref('tempPhotos/' + domain + "/" + order.buyer);          
                for(var i = 0; i < notification.data.data.imageNames.length;i++){
                    // console.log("length ",notification.data.data.imageNames.length)
                    // console.log("orderImages ", 'tempPhotos/' + domain + "/" + order.buyer)
                    // console.log("befor",notification.data.data.imageNames[i] + ".jpg")
                    const name=  notification.data.data.imageNames[i] 
                    // console.log("orderImages ", 'tempPhotos/' + domain + "/" + order.buyer)
                    const image = orderImages.child(notification.data.data.imageNames[i] + ".jpg");
                    //console.log("BEFORE")
                    promises.push(this.takePhotoFromTemp(image,path,name,notification.data.data.uid,notification.data.data.displayName))
                }

                const responses = await Promise.all(promises)
                console.log("NEDDD")
            }

        })
    };

    takePhotoFromTemp = (image,path,name,uid,displayName) =>{
        image.getDownloadURL().then(  ( url) => {
            console.log("url ",url)
            this.uriToBlob(url).then( (blob) =>{
                this.uploadToFirebase(blob,path + name )
            // console.log("here i am", path + name)
            var message = {
                text:"",
                image:url,
                timestamp: this.timestamp(),
                user:{_id:uid, name: displayName}

            }
            if(this.state.profileImage){
                message.user.avatar = this.state.profileImage
            }
            // console.log("message", message)
                firebase.database().ref(path).push(message)
            })
        }).catch((error) =>{alert("ERROR getting photos")})
    }

    registerForPushNotificationsAsync = async () => {
        if (Platform.OS === 'android') {
            Notifications.createChannelAndroidAsync('default', {
                name: 'default',
                sound: true,
                priority: 'max',
                vibrate: [0, 250, 250, 250],
            });
        }
    };


    signOutUser = () => {
        firebase.auth().signOut()
    }

    nextButton = () => {
        return(
        <View style={[styles.nextButton,{backgroundColor: this.state.homepage == 1 ? "#FFE300" : "white",marginLeft:-5,width:(windowWidth/2) - 50}]}>
            <Text>
                SELLER
            </Text>
        </View>
        )
    }

    prevButton = () => {
        return(
        <View style={[styles.prevButton,{backgroundColor:this.state.homepage == 0 ? "#FFE300":"white",marginRight:-5,width:(windowWidth/2) - 60}]}>
            <Text>
                BUYER
            </Text>
        </View>
        )
    }

    homepageIndexChanged = (index) => {
        this.setState({homepage:index})
    }

    togglePopupVisibility = (value) => {
        this.setState({popupVisible : value})
    }

    // componentDidMount() {
    //     console.log("uid",firebase.auth().currentUser.uid)
    //     const images = firebase.storage().ref().child('profilePics');
    //     console.log("images",images)
    //     const image = images.child(firebase.auth().currentUser.uid + ".jpg");
    //     image.getDownloadURL().then((url) =>  this.setState({ avatar: url }));
    // }



    render(){
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
                                            this.togglePopupVisibility(true)
                                        }} 
                                        >
                    <FontAwesome5 name="user-friends" size={45} color="black" />
                        <Text> BUY NOW</Text>
                    </TouchableOpacity>

                </View>

{/* 
                <TouchableOpacity onPress={this.handlePickAvatar} style={styles.avatarPlaceholder}>
                    {this.state.avatar ? <Image source={{uri : this.state.avatar}} style={styles.avatar}/> :
                    <Octicons name="person" size= {50} color="#FFF" />} */}
                {/* </TouchableOpacity> */}
                <Swiper ref={(swiper) => {this._swiper = swiper;}} 
                        loop={false}
                        onIndexChanged={this.homepageIndexChanged}>
                    {/* <View style={styles.container}>
                        <Text>Home Screen</Text>
                        <TouchableOpacity onPress={this.signOutUser}>
                            <Text style={{color:"white"}}>Logout</Text>
                        </TouchableOpacity>
                    </View> */}
                    <BuyerHomeScreen navigation={this.props.navigation}/>
                    <SellerHomeScreen  navigation={this.props.navigation}/>
                </Swiper>

                {this.state.popupVisible && <PopupOrder navigation={this.props.navigation} togglePopupVisibility={this.togglePopupVisibility}/>}

            </View>
        )
    }
}

AppRegistry.registerComponent('myproject',() =>SwiperComponent)

const styles = StyleSheet.create({
    container: {
        flex:1,
        paddingTop:30,
        backgroundColor: "black",
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
    header:{
        flexDirection:"row",
        alignItems:"center",
        justifyContent:"space-between",
        marginTop:50,
    },
    avatarPlaceholder:{
        width:50,
        height:50,
        borderRadius:50,
        borderWidth:10,
        backgroundColor:"#E1E2E6",
        alignItems:"center",
    },
    // avatar:{
    //     position:"absolute",
    //     width:50,
    //     height:50,
    //     borderRadius:50,

    // },
});