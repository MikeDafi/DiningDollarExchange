import Modal from 'react-native-modal';
import React,{ useCallback, useState } from 'react'
import { AntDesign } from '@expo/vector-icons'; 
import AwesomeButton from "react-native-really-awesome-button";
import {CameraRoll,View,Text, StyleSheet,ActivityIndicator,TouchableOpacity,LayoutAnimation,AppRegistry,Dimensions} from 'react-native'
const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;
import { ImageBrowser } from 'expo-multiple-media-imagepicker';
import UserPermissions from "../../utilities/UserPermissions"
import UploadImages from "./UploadImages"
import { Button } from 'react-native-elements';
import { Col, Row, Grid } from "react-native-easy-grid";
import * as firebase from 'firebase'
import Image from 'react-native-image-progress';
import SwipeButton from 'rn-swipe-button';
import arrowRight from './arrowRight.png';

// import * as admin from 'firebase-admin';
//   var firebaseConfig = {
//     credential: admin.credential.applicationDefault(),
//     apiKey: "AIzaSyDPi80ilddhtCh9wfPIxT5YLt8hLa1zZoM",
//     authDomain: "diningdollarreactnative.firebaseapp.com",
//     databaseURL: "https://diningdollarreactnative.firebaseio.com",
//     projectId: "diningdollarreactnative",
//     storageBucket: "diningdollarreactnative.appspot.com",
//     messagingSenderId: "529283379449",
//     appId: "1:529283379449:web:aaea13bb1526e3b182b228"
//   };
//  admin.initializeApp(firebaseConfig);


export default class PopupOrder extends React.Component{

    state={
        rangeSelected: '',
        imageNames:[],
        imageUris:[],
        numberOfPhotosSelected:0,
        uploadImagesVisible:false,
        findASellerClicked:false,
        rendered: false,
        rangeError: "",
        imageBrowser: true,
    }

    sendSingleNotification = async (token,orderNumber) => {
        var user = firebase.auth().currentUser
        const displayName = user.displayName
        const uid = user.uid
        console.log("imgeNames",this.state.imageNames)
        const message = {
            to: token,
            sound: 'default',
            title: 'Be a Seller!',
            body: 'Earn ' + this.state.rangeSelected,
            data: { data: {orderNumber :orderNumber,
                           displayName :displayName,
                           uid         :uid,
                           imageNames  :this.state.imageNames}},
            _displayInForeground: true,
        };
        const response = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Accept-encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
        },
            body: JSON.stringify(message),
        });
    };

    sendAllNotifications = async(orderNumber) => {
        console.log("in all notifications")
        var user = firebase.auth().currentUser
        console.log("orderNumber",orderNumber)
        const thisReference = this
        const start = user.email.indexOf("@")
        const end = user.email.indexOf(".com")
        const domain = user.email.substring(start,end)
        const thisUserEmail = user.email.substring(0,end) //so we don't send notification to self
        firebase.database().ref('users/' + domain +'/')
        .once('value', function (domainAccounts) {
            domainAccounts.forEach( user =>{
                var userInfo = user.val()
                if(user.key != thisUserEmail){
                    console.log("found notification")
                    thisReference.sendSingleNotification(userInfo.expoToken,orderNumber)
                }
            })
        });
    }

    uriToBlob = async (text) => {
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

    uploadToFirebase = async (blob,name) => {
        console.log("in upload")
        const user = firebase.auth().currentUser
        const start = user.email.indexOf("@")
        const end = user.email.indexOf(".com")
        const domain = user.email.substring(start,end)
        const email = user.email.substring(0,end)
        firebase.storage().ref(`/tempPhotos/${domain}/${email}/${name}.jpg`).put(blob, {
        contentType: 'image/jpeg'
        })
    }
    generateRandomString = () =>{
        return Math.random().toString().substr(2, 20)
    }

    photoCallback =  async (params) =>{
        console.log("photoCallback")
        this.setState({uploadImagesVisible:false})
        if(params == null ){
            return
        }
        console.log("here ")
        var imageNames = []
        var imageUris = []
        await params.then(async (images) =>{
            for(var i = 0; i < images.length;i++){
                console.log("imageHappened")
                let name = this.generateRandomString();
                imageNames.push(name)
                imageUris.push(images[i].uri)
            }
        })
        console.log("imageNames",imageNames.length)
        this.setState({imageNames,imageUris,numberOfPhotosSelected:imageNames.length})
    }


    findASeller = () => {
        this.setState({findASellerClicked:true})
        if(this.state.rangeSelected == ""){
            this.setState({rangeError:"*Select One*"})
            return
        }
        if(this.state.imageUris.length == 0){
            return
        }
        console.log("imageUris",this.state.imageUris)
        this.props.togglePopupVisibility(false);
        const user = firebase.auth().currentUser
        const start = user.email.indexOf("@")
        const end = user.email.indexOf(".com")
        const domain = user.email.substring(start,end)
        const orders = firebase.database().ref("orders/" + domain )

        var orderNumberForNotification = 0
        orders.once("value",async (orderSnapshot)=>{
            var orderNumberNow = 0;
            var currentOrdersNow = {};

            if(orderSnapshot.val() != undefined || orderSnapshot.val() != null){
                const values = orderSnapshot.val()
                orderNumberNow = values.orderNumber || 0
                currentOrdersNow = values.currentOrders || {}
            }
            const uriToBlobPromises = []
            const uploadToFirebasePromises = []
            for(var i = 0; i < this.state.imageUris.length;i++){
                console.log("uri",this.state.imageUris[i])
                console.log("name",this.state.imageNames[i])
                const uri = this.state.imageUris[i]
                const name = this.state.imageNames[i]
                uriToBlobPromises.push(this.uriToBlob(uri,i).then((blob) =>{
                    uploadToFirebasePromises.push(this.uploadToFirebase(blob,name).then(() => {
                        console.log("Hi there")
                    }))
                })
                )
            }


            Promise.all(uriToBlobPromises).then(() => {
                Promise.all(uploadToFirebasePromises).then(() => {
                    console.log("time")
                    console.log("in popup order")
                    const newOrder = {
                        buyer : user.email.substring(0, user.email.length - 4),
                        status: "searching"
                    }
                    currentOrdersNow[[orderNumberNow]] = newOrder
                    orderNumberForNotification = orderNumberNow
                    orderNumberNow += 1
                    orders.set({currentOrders:currentOrdersNow,orderNumber:orderNumberNow})
                    

                    this.sendAllNotifications(orderNumberForNotification);
                    setTimeout(() => {
                        orders.child("currentOrders/" + orderNumberForNotification).once("value",(orderSnapshot)=>{
                            if(orderSnapshot.val().status == "searching"){
                                orders.child("currentOrders/").update({[orderNumberForNotification]:null})
                                const email = user.email.substring(0,end)
                                // Create a reference to the file to delete
                                console.log("mickey mouse",email)
                                for(var i = 0; i < this.state.imageNames.length; i++){
                                    console.log("/tempPhotos/"+domain+"/"+email +"/"+this.state.imageNames[i] + ".jpg")
                                    var imageRef = firebase.storage().ref(`/tempPhotos/${domain}/${email}/${this.state.imageNames[i]}.jpg`);

                                    // Delete the file
                                    imageRef.delete().then(function() {
                                    
                                    }).catch(function(error) {
                                    // Uh-oh, an error occurred!
                                    });
                                }
                            }
                        })
                    }, 200000);
                })

                
            })
        })

        this.props.navigation.navigate("Home")
    }

    componentDidMount(){
        console.log("rendered")
    }

    rangeSelected = (value) => {
        this.setState({ rangeError : (((this.state.rangeSelected == value ? "" : value) == "") && this.state.findASellerClicked) ? "*Select One*" : "",
                    rangeSelected : this.state.rangeSelected == value ? "" : value,
        })
    }

    render(){
        const firstColumnWidth = windowWidth/4
        const secondColumnWidth = windowWidth - firstColumnWidth
        if(this.state.rendered && !this.props.popupVisible){
            this.setState({
                rendered : false
            })
        }
       
        if(this.props.popupVisible && !this.state.rendered){
            this.setState({
                rendered : true,
                rangeSelected: '',
                rangeError:"",
                imageNames:[],
                imageUris:[],
                numberOfPhotosSelected:0,
                uploadImagesVisible:false,
                findASellerClicked:false,
            })
        }

        return(
            <View>
                <Modal
                    testID={'modal'}
                    coverScreen={true}
                    hasBackdrop={true}
                    isVisible={this.props.popupVisible}
                    onBackdropPress={() => {this.props.togglePopupVisibility(false);}}
                    animationIn="slideInLeft"
                    animationInTiming={500}
                    style={{justifyContent:"flex-end",padding:0,margin:0}}>
                    <View style={styles.content}>
                        <Grid>
                            <Row style={styles.rowStyle}>
                                <Col style={[styles.label,{width:firstColumnWidth}]}>
                                <TouchableOpacity onPress={ async () => {
                                    this.setState({imageNames:[],uploadImagesVisible:true});
                                    // this.props.navigation.navigate("UploadImages",{photoCallb: this.photoCallback})
                                    }} 
                                >
                                    <Text style={styles.text}>Select</Text>
                                    <Text style={styles.text}>Images</Text>
                                </TouchableOpacity>
                                </Col>
                                {this.state.imageUris.length != 0 ? 
                                <Col style={{flexDirection:"row"}}>
                                    {this.state.imageUris.map((item,i) =>{
                                            if(i == 3){
                                                if(this.state.imageUris.length == 4){
                                                    return(
                                                        <Image
                                                            style={[styles.imageSelected,{width:secondColumnWidth/5}]}
                                                            source={{uri:item}}
                                                            key={i}                                               
                                                        />
                                                    )
                                                }else{

                                                    return(
                                                        <View style={{flexDirection:"row"}}>
                                                            <Image
                                                                style={[styles.imageSelected,{width:secondColumnWidth/5}]}
                                                                source={{uri:item}}
                                                                key={i}                                               
                                                            />
                                                            <View style={[styles.imageSelected,{marginLeft: -(secondColumnWidth/5) - 5,width:secondColumnWidth/5,justifyContent:"center",alignItems:"center",backgroundColor: 'rgba(162,162,162,0.7)'}]} >
                                                                <Text style={{fontSize:20}}>{this.state.imageUris.length - 4}+</Text>
                                                            </View>
                                                        </View>
                                                    )
                                                }
                                            }else if(i <= 2){
                                                
                                                return(
                                                    <Image
                                                        style={[styles.imageSelected,{width:secondColumnWidth/5}]}
                                                        source={{uri:item}}
                                                        key={i}                                               
                                                    />
                                                )
                                            }
                                        }) 
                                    }
                                </Col> :
                                <Col style={{justifyContent:"center",alignItems:"center",marginLeft:-(secondColumnWidth/4 - 50)}}>
                                    <Text style={{fontSize:20,color:"gray"}}>No Images Selected</Text>
                                    <Text style={{fontSize:10,color:this.state.findASellerClicked && this.state.imageUris.length == 0 ?"black" : "gray",fontWeight:this.state.findASellerClicked && this.state.imageUris.length == 0 ? "bold" : "normal"}}>*Select at Least One*</Text>
                                </Col>
                                }
                            </Row>
                            <Row style={styles.rowStyle}>
                                <Col style={[styles.label,{width:firstColumnWidth}]}>
                                    <Text style={styles.text}>Price</Text>
                                    <Text style={styles.text}>Range</Text>
                                </Col>
                                <Col style={{flexDirection:"row"}}>
                                <Text style={{position:"absolute",left:firstColumnWidth,top:30,fontWeight:"bold",fontSize:10}}>{this.state.rangeError}</Text>
                                    <TouchableOpacity   activeOpacity={0}
                                                        onPress={()=>{
                                                           this.rangeSelected("0 to 5")
                                                           console.log("rangeSelected",this.state.rangeSelected)
                                                        }} 
                                                          style={[styles.rangeButton,{width:secondColumnWidth/5,borderBottomWidth:this.state.rangeSelected == "0 to 5" ? 5 : 0}]}>
                                        <Text style={{fontWeight: this.state.rangeSelected == "0 to 5" ?'bold': 'normal'}}>0 to 5</Text>
                                    </TouchableOpacity>
                                    
                                    <TouchableOpacity   activeOpacity={0}
                                                        onPress={()=>{
                                                           this.rangeSelected("5 to 10")
                                                           console.log("rangeSelected",this.state.rangeSelected)
                                                        }} 
                                                          style={[styles.rangeButton,{width:secondColumnWidth/5,borderBottomWidth:this.state.rangeSelected == "5 to 10" ? 5 : 0}]}>
                                        <Text style={{fontWeight: this.state.rangeSelected == "5 to 10" ?'bold': 'normal'}}>5 to 10</Text>
                                    </TouchableOpacity>
                                    
                                    <TouchableOpacity   activeOpacity={0}
                                                        onPress={()=>{
                                                           this.rangeSelected("10 to 15")
                                                           console.log("rangeSelected",this.state.rangeSelected)
                                                        }} 
                                                          style={[styles.rangeButton,{width:secondColumnWidth/5,borderBottomWidth:this.state.rangeSelected == "10 to 15" ? 5 : 0}]}>
                                        <Text style={{fontWeight: this.state.rangeSelected == "10 to 15" ?'bold': 'normal'}}>10 to 15</Text>
                                    </TouchableOpacity>
                                    
                                    <TouchableOpacity   activeOpacity={0}
                                                        onPress={()=>{
                                                           this.rangeSelected("15+")
                                                           console.log("rangeSelected",this.state.rangeSelected)
                                                        }} 
                                                          style={[styles.rangeButton,{width:secondColumnWidth/5,borderBottomWidth:this.state.rangeSelected == "15+" ? 5 : 0}]}>
                                        <Text style={{fontWeight: this.state.rangeSelected == "15+" ?'bold': 'normal'}}>15+</Text>
                                    </TouchableOpacity>
                                </Col>
                            </Row>
                            <Row style={{height:58,justifyContent:"center"}}>
                                <SwipeButton 
                                    width={windowWidth - 25}
                                    swipeSuccessThreshold={100}
                                    onSwipeSuccess={() =>  {this.findASeller()}}
                                    onSwipeFail={() => console.log("onSwipeFail")}
                                    thumbIconStyles={{justifyContent:"center",alignItems:"center"}}
                                    thumbIconImageSource={arrowRight}
                                    thumbIconBackgroundColor="white"
                                    thumbIconBorderColor="black"
                                    title={this.state.imageUris.length == 0 || this.state.rangeSelected == "" ? "*Complete Above*" : "Swipe to Submit"}
                                    railBackgroundColor="white"
                                    railFillBorderColor="black"
                                    railFillBackgroundColor="black"
                                    disabled={this.state.rangeSelected == "" || this.state.imageUris.length == 0 ? true : false}
                                />
                            </Row>
                        </Grid>
                        <TouchableOpacity onPress={() => {
                            this.props.togglePopupVisibility(false);
                            this.setState({imageNames:[]})
                            }} 
                            style={{position:"absolute",left:windowWidth - 50,top:-50}}
                        >
                            <AntDesign name="close" size={50} color="white" />
                        </TouchableOpacity>
                    </View>

                    <UploadImages isVisible={this.state.uploadImagesVisible} photoCallb={this.photoCallback}/>
                </Modal>
            </View> 
        )
    }
}

const styles = StyleSheet.create({
    rangeButton : {
        marginHorizontal:5,
        justifyContent:"center",
        alignItems:"center",
        height:20,
        borderColor: "black",
        backgroundColor:"white"
    },
    content: {
        backgroundColor: 'white',
        borderRadius: 4,
        height:300,
        borderColor: 'rgba(0, 0, 0, 0.1)',
    },
    contentTitle: {
        fontSize: 20,
        marginBottom: 12,
    },
    label: {
        padding:20,
        justifyContent:"center",
        alignItems:"center",
    },
    text:{
        color:"#008DB6"
    },
    imageSelected:{
        margin:5,
        height:50
    },
    rowStyle:{
        height:75,
        borderBottomWidth:0.5,
        alignItems:"center"
    }
});