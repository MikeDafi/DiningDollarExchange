import React from 'react'
import {View,Image,Text,AsyncStorage, Platform,TouchableWithoutFeedback,ImageBackground,KeyboardAvoidingView,Keyboard,StyleSheet,TextInput,TouchableOpacity,LayoutAnimation} from 'react-native'
import * as firebase from 'firebase'
import {Ionicons,Octicons} from "@expo/vector-icons"
import { AntDesign } from '@expo/vector-icons'; 
import { Notifications } from 'expo';
import * as ImagePicker from "expo-image-picker"
import UserPermissions from "../../utilities/UserPermissions"
import uuid from 'uuid/v4'; // Import UUID to generate UUID
export default class RegisterScreen extends React.Component{

    state = {
        name: "",
        email : "",
        password:"",
        avatar:null,
        emailError:"",
        passwordError:"",
        nameError:"",
    }


    handlePickAvatar = async () =>{
        UserPermissions.getCameraPermission()
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            // allowEditing:true,
            // aspect:[4,3]
        });

        if(!result.cancelled){
            this.setState({avatar:result.uri})
        }
    }

    uriToBlob = (uri) => {
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

    uploadToFirebase = (blob) => {
    return new Promise((resolve, reject)=>{
        var storageRef = firebase.storage().ref();
        const start = this.state.email.indexOf("@")
        const end = this.state.email.indexOf(".com")
        const domain = this.state.email.substring(start,end)
        const email = this.stat.email.substring(0,end)
        storageRef.child(`/profilePics/${domain}/${email}/profilePic.jpg`).put(blob, {
        contentType: 'image/jpeg'
        }).catch((error)=>{
        reject(error);
        });
    });
    }

    handleSignUp = async () => {
        const {email,password} = this.state
        this.handleEmail(this.state.email)
        this.handlePassword(this.state.password)
        this.handleName(this.state.name)
        console.log(this.state.emailError)
        console.log("in signupp")
        // if(this.state.emailError != "" || this.state.passwordError != "" || this.state.nameError != ""){
        //     return
        // }
        console.log("in sign up")
        var user = firebase.auth().currentUser;
        firebase.auth().createUserWithEmailAndPassword(email,password)
        .then(userCredentials =>{
            console.log("in create user")
            var user = firebase.auth().currentUser;
            user.updateEmail(this.state.email)
            this.uriToBlob(this.state.avatar).then((blob) =>{
                this.uploadToFirebase(blob)
            })

            // firebase.database().ref('userNotifications1').push({
            //     expoToken : true
            //     active : false
            // })
            user.sendEmailVerification()
            this.props.navigation.navigate("Login",{errorMessage : "A verification email has been sent"})
            user.updateProfile({
                displayName:this.state.name
            })
        })
        .catch(error => {this.setState({emailError: "*Email already in use, Go to Login*"})})

    }

    handleEmail = (email) =>{
        this.setState({email: email})
        if(email.length == 0){
            this.setState({emailError : "*Email is empty"})
        // }else if(!email.endsWith(".com") || !email.includes("@")){
        //     this.setState({emailError : "*Email isn't a valid school email*"})
        }else{
            this.setState({emailError : ""})
        }
    }

    handleName = (name) => {
        this.setState({name: name})
        if(name.length == 0){
            this.setState({nameError : "*Name is empty*"})
        }else{
            this.setState({nameError:""})
        }
    }

    handlePassword = (password) =>{
        var atLeastOneNumber = /^(?=.*\d).{6,}$/;
        var atLeastOneLowerCase = /^(?=.*[a-z]).{6,}$/;
        var atLeastOneUpperCase = /^(?=.*[A-Z]).{6,}$/;
        this.setState({password: password})
        if(password.length == 0){
            this.setState({passwordError : "Password is empty"})            
        }
        if(!password.match(atLeastOneNumber)){
            this.setState({passwordError : "*Password must have at least one number*"})
        }else if(!password.match(atLeastOneUpperCase)){
            this.setState({passwordError : "*Password must have at least one uppercase*"})
        }else if(!password.match(atLeastOneLowerCase)){
            this.setState({passwordError : "*Password must have at least one lowercase*"})
        }else if(!password.length >= 6){
            this.setState({passwordError : "*Password must be at least length 6*"})
        }else{
            this.setState({passwordError : ""})
        }
    }

    render(){
        LayoutAnimation.easeInEaseOut()
        return(
            <View style={styles.container}>
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <ImageBackground source={require('./SignUpPage.png')} style={styles.image}>
                        <KeyboardAvoidingView
                        behavior={Platform.OS == "ios" ? "padding" : "height"}
                        style={{flex : 1}}
                        >
                            <View style={styles.header}>
                                <TouchableOpacity onPress={() => this.props.navigation.goBack(null)}>
                                    <AntDesign name="arrowleft" size={30} color="white" />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={this.handleSignUp}>
                                    <Text style={styles.headerNext}>Next</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={{alignItems:"center",justifyContent:"flex-end",marginBottom:80}}>
                            <TouchableOpacity style={styles.avatarPlaceholder} onPress={this.handlePickAvatar}>
                                {this.state.avatar ? <Image source={{uri : this.state.avatar}} style={styles.avatar}/> :
                                <Octicons name="person" size= {50} color="#FFF" />}
                            </TouchableOpacity>
                            </View>
                            <View style={styles.form}>
                                <View>
                                    <Text style={styles.inputTitle}>Full Name</Text>
                                    <TextInput style={styles.input} 
                                        autoCapitalize="none"
                                        onChangeText={name => this.handleName(name)}
                                        value={this.state.name}/>
                                </View>
                                {this.state.nameError != "" && 
                                <View style={styles.errorMessage}>
                                    <Text style={styles.error}>{this.state.nameError}</Text>
                                </View>}
                                <View  style={{marginTop: this.state.nameError != ""? 0: 20}}>
                                    <Text style={styles.inputTitle}>Email Address</Text>
                                    <TextInput style={styles.input} 
                                        autoCapitalize="none"
                                        onChangeText={email => this.handleEmail(email)}
                                        value={this.state.email}/>
                                </View>
                                {this.state.emailError != "" && 
                                <View style={styles.errorMessage}>
                                    <Text style={styles.error}>{this.state.emailError}</Text>
                                </View>}
                                <View  style={{marginTop: this.state.emailError != ""? 0: 20,marginBottom: this.state.passwordError != ""? 0: 20}}>
                                    <Text style={styles.inputTitle}>Password</Text>
                                    <TextInput style={styles.input} 
                                        autoCapitalize="none"
                                        secureTextEntry
                                        onChangeText={password => this.handlePassword(password)}
                                        value={this.state.password}/>
                                </View>
                                {this.state.passwordError != "" && 
                                <View style={styles.errorMessage}>
                                    <Text style={styles.error}>{this.state.passwordError}</Text>
                                </View>}
                            </View>
                        </KeyboardAvoidingView>
                    </ImageBackground>
                </TouchableWithoutFeedback>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center"
    },
    form:{
        flex:1,
        marginBottom:150,
        marginHorizontal:30,
        justifyContent:'flex-end',
    },
    image: {
        flex: 1,
        resizeMode: "contain",
        width:'100%',
        height: '100%'
    },
    errorMessage:{
        height:15,
        alignItems:"center",
        justifyContent:"center",
        marginHorizontal:10,
        marginTop:5
    },
    error:{
        color:"white",
        fontSize:13,
        fontWeight:"600",
        textAlign:"center"
    },
    inputTitle:{
        color:"#8A8F9E",
        fontSize:14,
        marginLeft:15,
        textTransform:"uppercase"
    },
    input:{
        backgroundColor:"white",
        borderRadius:20,
        height:50,
        fontSize:15,
        marginBottom:5,
        color:"#161F3D"
    },
    button:{
        marginTop: 30,
        marginRight:10,
        backgroundColor:"white",
        borderRadius:4,
        height:30,
        width:70,
        justifyContent:"center"
    },
    headerNext:{
        fontWeight:"bold",
        fontSize:18,
        marginTop:5,
        color:"white"
    },
    header:{
        flex:1,
        flexDirection:"row",
        justifyContent:"space-between",
        marginHorizontal:10,
        marginTop:30
    },
    avatar:{
        position:"absolute",
        width:100,
        height:100,
        borderRadius:50,
    },
    avatarPlaceholder:{
        width:100,
        height:100,
        borderRadius:50,
        backgroundColor:"#E1E2E6",
        alignItems:"center",
        justifyContent:"center",
    }
});