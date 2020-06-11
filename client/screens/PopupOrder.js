import Modal from 'react-native-modal';
import React,{ useCallback, useState } from 'react'
import { AntDesign } from '@expo/vector-icons'; 
import AwesomeButton from "react-native-really-awesome-button";
import {CameraRoll,View,Text, StyleSheet,TouchableOpacity,LayoutAnimation,AppRegistry,Image,Dimensions} from 'react-native'
const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;
import { ImageBrowser } from 'expo-multiple-media-imagepicker';
import UserPermissions from "../../utilities/UserPermissions"
import { Button } from 'react-native-elements';
import * as firebase from 'firebase'
 
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
        uploadedImages: [],
        rangeSelected: ''
    }


    componentDidMount(){
        UserPermissions.getCameraPermission()
    }

    sendSingleNotification = async (token) => {
        console.log("token",token)
        const message = {
            to: token,
            sound: 'default',
            title: 'Be a Seller!',
            body: 'Earn ' + rangeSelected,
            data: { data: 'goes here' },
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

    sendAllNotifications = async() => {
        var user = firebase.auth().currentUser
        const thisReference = this
        const start = user.email.indexOf("@")
        const end = user.email.indexOf(".edu")
        const domain = user.email.substring(start,end)
        const thisUserEmail = user.email.substring(0,end) //so we don't send notification to self
        firebase.database().ref('userNotifications/' + domain +'/')
        .once('value', function (domainAccounts) {
            domainAccounts.forEach(async user =>{
                var userInfo = user.val()
                console.log(user.key)
                if(user.key != thisUserEmail){
                    console.log(userInfo)
                    console.log("expoToken",userInfo.expoToken)
                    thisReference.sendSingleNotification(userInfo.expoToken)
                }
            })
        });
    }


    photoCallback = (params) =>{
        if(params == null ){
            console.log("nothing")
            return
        } 
        console.log("in photocallbac")

        this.sendAllNotifications(); 

        // params.then((data) =>{
        //     console.log(data)
        // })
        this.props.navigation.navigate("Home")
    }

    rangeClicked = (range) =>{
        this.setState({
            rangeSelected : this.state.rangeSelected == range ? "" : range
        })
    }


    render(){
        const thisOrder = this
        const widthSwitchBar = (windowWidth - 50)/4
        const moneyRanges = ["0 - 5","5 - 10","10-15","15+"]
        const emptyStayComponent = <Text style={styles.emptyStay}>Empty =(</Text>;
        const noCameraPermissionComponent = <Text style={styles.emptyStay}>No access to camera</Text>;
        return(
            <View>
                <Modal
                    testID={'modal'}
                    coverScreen={true}
                    hasBackdrop={true}
                    isVisible={true}
                    onBackdropPress={() => this.props.togglePopupVisibility()}
                    animationIn="slideInLeft"
                    animationOut="slideOutRight"
                    style={{justifyContent:"flex-end",padding:0,margin:0}}>
                    <View style={styles.content}>
                        <TouchableOpacity onPress={() => {this.props.togglePopupVisibility()}} >
                            <AntDesign name="close" size={40} color="black" />
                        </TouchableOpacity>
                        <View style={{alignItems: 'center',}}>
                            <AwesomeButton 
                                width={windowWidth - 50}
                                height={50} 
                                borderColor="gray"
                                backgroundColor="#D6D6D6"
                                backgroundShadow="#737373"
                                backgroundDarker="#464646"
                                            >
                                <TouchableOpacity onPress={() => {this.props.togglePopupVisibility();this.props.navigation.navigate("UploadImages",{photoCallb: this.photoCallback,togglePopupVisibility:this.props.togglePopupVisibility})}} style={{flex:1,flexDirection:"row",justifyContent:'space-evenly'}}>
                                    <AntDesign name="upload" size={24} color="black" />
                                    <Text style={{fontSize:20}}>Upload Photos</Text>
                                </TouchableOpacity>
                            </AwesomeButton>
                        </View>
                        <Text>How Much?</Text>
                        <View style={{justifyContent:"center",alignItems: 'center',flex:1,flexDirection:"row"}}>

                            <TouchableOpacity   activeOpacity={0}
                                                onPress={()=>{
                                                    this.rangeClicked("0 to 5")
                                                }} 
                                                style={{borderWidth:3,
                                                width:widthSwitchBar,
                                                justifyContent:"center",
                                                alignItems:"center",
                                                height:50,
                                                borderColor: "#ffff0a",
                                                borderTopLeftRadius:20,
                                                borderBottomLeftRadius:20,
                                                backgroundColor:this.state.rangeSelected == "0 to 5" ? "#ffff0a" : "white"}}>
                                <Text>0 to 5</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity   activeOpacity={0}
                                                onPress={()=>{
                                                    this.rangeClicked("5 to 10")
                                                }} 
                                                style={{borderWidth:3,
                                                width:widthSwitchBar,
                                                justifyContent:"center",
                                                alignItems:"center",
                                                height:50,
                                                borderColor: "#ffff0a",
                                                backgroundColor:this.state.rangeSelected == "5 to 10" ? "#ffff0a" : "white"}}>
                                <Text>5 to 10</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity   activeOpacity={0}
                                                onPress={()=>{
                                                    this.rangeClicked("10 to 15")
                                                }} 
                                                style={{borderWidth:3,
                                                width:widthSwitchBar,
                                                justifyContent:"center",
                                                alignItems:"center",
                                                height:50,
                                                borderColor: "#ffff0a",
                                                backgroundColor:this.state.rangeSelected == "10 to 15" ? "#ffff0a" : "white"}}>
                                <Text>10 to 15</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity   activeOpacity={0}
                                                onPress={()=>{
                                                    this.rangeClicked("15+")
                                                }} 
                                                style={{borderWidth:3,
                                                width:widthSwitchBar,
                                                justifyContent:"center",
                                                alignItems:"center",
                                                height:50,
                                                borderColor: "#ffff0a",
                                                borderTopRightRadius:20,
                                                borderBottomRightRadius:20,
                                                backgroundColor:this.state.rangeSelected == "15+" ? "#ffff0a" : "white"}}>
                                <Text>15+</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={{flex:1,flexDirection:"row",justifyContent:"flex-end",alignItems:"center",marginRight:10,marginBottom:10}}>
                            <TouchableOpacity disabled={this.state.rangeSelected == '' ? true : false} onPress={() => {this.props.togglePopupVisibility();this.props.navigation.navigate("UploadImages",{photoCallb: this.photoCallback,togglePopupVisibility:this.props.togglePopupVisibility})}} style={{borderRadius:10,backgroundColor: "#0E89FF",padding:10}}>
                                <Text>Find A Seller!</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </View> 
        )
    }
}

const styles = StyleSheet.create({

    content: {
        backgroundColor: 'white',
        borderRadius: 4,
        height:300,
        borderColor: 'rgba(0, 0, 0, 0.1)',
    },
    contentTitle: {
        fontSize: 20,
        marginBottom: 12,
    }
});