import React from 'react'
import {View,Text, StyleSheet,TouchableOpacity,LayoutAnimation,AppRegistry} from 'react-native'
import * as firebase from 'firebase'
import BuyerHomeScreen from './BuyerHomeScreen'
import SellerHomeScreen from './SellerHomeScreen'
import Swiper from 'react-native-swiper/src'
export default class HomeScreen extends React.Component{
    state ={
        email: "",
        displayName:""
    }
    componentDidMount(){
        const{email,displayName} = firebase.auth().currentUser
        this.setState({email,displayName})
    }

    signOutUser = () => {
        firebase.auth().signOut()
    }

    getFireStore = () => {
        console.log(firebase.firestore())
    }


    render(){
        LayoutAnimation.easeInEaseOut()
        return(
            <Swiper showsButtons={true} >
                <View style={styles.container}>
                    <Text>Home Screen</Text>
                    <TouchableOpacity onPress={this.signOutUser}>
                        <Text>Logout</Text>
                    </TouchableOpacity>
                </View>
                <BuyerHomeScreen navigation={this.props.navigation}/>
                <SellerHomeScreen  navigation={this.props.navigation}/>
            </Swiper>
        )
    }
}

AppRegistry.registerComponent('myproject',() =>SwiperComponent)

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center"
    }
});