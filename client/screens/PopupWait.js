import Modal from 'react-native-modal';
import React,{ useCallback, useState } from 'react'
import { AntDesign } from '@expo/vector-icons'; 
import AwesomeButton from "react-native-really-awesome-button";
import {CameraRoll,ActivityIndicator,View,Text, StyleSheet,TouchableOpacity,LayoutAnimation,AppRegistry,Image,Dimensions} from 'react-native'
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
        opened: true
    }





    render(){
        const thisOrder = this
        const widthSwitchBar = (windowWidth - 50)/4
        const moneyRanges = ["0 - 5","5 - 10","10-15","15+"]
        const emptyStayComponent = <Text style={styles.emptyStay}>Empty =(</Text>;
        const noCameraPermissionComponent = <Text style={styles.emptyStay}>No access to camera</Text>;
        
        return(
            <View>{this.state.opened ? 
                <Modal
                    testID={'modal'}
                    coverScreen={true}
                    hasBackdrop={true}
                    isVisible={true}
                    onBackdropPress={() =>  this.setState({opened : false})}
                    animationIn="slideInLeft"
                    animationOut="slideOutRight"
                    style={{justifyContent:"center",alignItems:"center"}}>
                    <View style={styles.content}>
                        <TouchableOpacity onPress={() => {this.props.togglePopupVisibility()}} >
                            <AntDesign name="close" size={40} color="black" />
                        </TouchableOpacity>
                        <Text>Wait for a notification, when someone has accepted the order.</Text>
                        <TouchableOpacity onPress={() => this.setState({opened : false})}>
                            OK
                        </TouchableOpacity>
                    </View>
                </Modal> : null}
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