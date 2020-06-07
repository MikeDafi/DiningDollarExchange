import React from 'react'
import {View,Text, StyleSheet,Button,TouchableOpacity,LayoutAnimation,AppRegistry,Image,Dimensions} from 'react-native'
import * as firebase from 'firebase'
import BuyerHomeScreen from './BuyerHomeScreen'
import SellerHomeScreen from './SellerHomeScreen'
import Swiper from 'react-native-swiper/src'
import PopupOrder from './PopupOrder'
import {Ionicons,MaterialCommunityIcons} from "@expo/vector-icons"
const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;


export default class HomeScreen extends React.Component{
    state ={
        email: "",
        displayName:"",
        homepage: 0,
        rendered : false,
        popupVisible : false
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

    }

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

    togglePopupVisibility = () => {
        this.setState({popupVisible : !this.state.popupVisible})
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
                        <TouchableOpacity   activeOpacity={1}
                                            onPress={()=>{
                                                // this.props.navigation.navigate("BuyModal")
                                                console.log(this.state.popupVisible)
                                                this.setState({popupVisible:true})
                                            }} 
                                            style={{borderWidth:10,
                                            width:60,
                                            height:120,
                                            borderColor:this.state.homepage == 0 ? "#FFE300":"white",
                                            borderTopLeftRadius:120,
                                            borderBottomLeftRadius:120,
                                            borderRightRadius:300,
                                            backgroundColor:"white"}}/>
                        <TouchableOpacity   
                                            onPress={()=>{
                                                // this.props.navigation.navigate("BuyModal")
                                                this.setState({popupVisible:true})
                                            }} 
                                            style={{borderWidth:10,
                                            width:60,
                                            height:120,
                                            borderColor:this.state.homepage == 1 ? "#FFE300":"white",
                                            borderTopRightRadius:120,
                                            borderBottomRightRadius:120,
                                            borderLeft:0,
                                            backgroundColor:"white"}}/>
                        <TouchableOpacity   
                                            onPress={()=>{
                                                // this.props.navigation.navigate("BuyModal")
                                                this.setState({popupVisible:true})
                                            }}
                                            style={{position:"absolute",top:20,left: (windowWidth/2) - 40 }}
                                             >
                            <MaterialCommunityIcons name="silverware-clean" size={80} color="black" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => {
                            this._swiper.scrollBy((this.state.homepage + 1) % 2)
                            this.setState({homepage : 1})}}>
                            {this.nextButton()}
                        </TouchableOpacity>

                </View>

{/* 
                <TouchableOpacity onPress={this.handlePickAvatar} style={styles.avatarPlaceholder}>
                    {this.state.avatar ? <Image source={{uri : this.state.avatar}} style={styles.avatar}/> :
                    <Octicons name="person" size= {50} color="#FFF" />} */}
                {/* </TouchableOpacity> */}
                <Swiper ref={(swiper) => {this._swiper = swiper;}} 
                        loop={false}
                        onIndexChanged={this.homehomepageIndexChanged}>
                    {/* <View style={styles.container}>
                        <Text>Home Screen</Text>
                        <TouchableOpacity onPress={this.signOutUser}>
                            <Text style={{color:"white"}}>Logout</Text>
                        </TouchableOpacity>
                    </View> */}
                    <BuyerHomeScreen navigation={this.props.navigation}/>
                    <SellerHomeScreen  navigation={this.props.navigation}/>
                </Swiper>

                {this.state.popupVisible && <PopupOrder togglePopupVisibility={this.togglePopupVisibility}/>}

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
        marginTop:20,
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