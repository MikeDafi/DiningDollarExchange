import React from 'react'
import {ImageBackground,Keyboard,Platform,TouchableWithoutFeedback,KeyboardAvoidingView,Image,View,Vibration,Text, StyleSheet,TextInput,TouchableOpacity,LayoutAnimation} from 'react-native'
import * as firebase from 'firebase'
import { Notifications } from 'expo';
import * as Permissions from 'expo-permissions';
import Constants from 'expo-constants';
export default class LoginScreen extends React.Component{

    state = {
        email : "",
        password:"",
        errorMessage:  (this.props.navigation.state.params || {}).errorMessage,
        currentNavParams : {},
        token :  ''
    }

    getDeviceToken = async () => {
        if (Constants.isDevice) {
            const { status: existingStatus } = await Permissions.getAsync(Permissions.NOTIFICATIONS);
            let finalStatus = existingStatus;
            if (existingStatus !== 'granted') {
                const { status } = await Permissions.askAsync(Permissions.NOTIFICATIONS);
                finalStatus = status;
            }
            if (finalStatus !== 'granted') {
                alert('Failed to get push token for push notification!');
                return;
            }
            token = await Notifications.getExpoPushTokenAsync();
            console.log(token);
            this.setState({ token });
                return
        }
    }


    handleLogin = async () => {
        const {email,password} = this.state
        await this.getDeviceToken()
        console.log("woohoo")
        firebase.auth().signInWithEmailAndPassword(email,password).then(usercredentials =>{
            if(firebase.auth().currentUser.emailVerified){
                const user = firebase.auth().currentUser;
                                const start = user.email.indexOf("@")
                const end = user.email.indexOf(".edu")
                const domain = user.email.substring(start,end)
                console.log("domain ", domain)
                console.log("expoToken", this.state.token)
                firebase.database().ref('users/' + domain +'/' + this.state.email.substring(0,end)).set({
                    expoToken : this.state.token,
                    active : true,
                    page: 0,
                    isBuyer:true,
                    isSeller:true

                })
                this.props.navigation.navigate('Home')
            }else{
                firebase.auth().currentUser.sendEmailVerification()
                this.setState({errorMessage: "Verification email sent again"})
                firebase.auth().signOut()
            }
        })
        .catch(error => this.setState({errorMessage: error.message}));
    }
    render(){

        if(this.state.currentNavParams != this.props.navigation.state.params){
            this.setState({
                errorMessage : (this.props.navigation.state.params || {}).errorMessage,
                currentNavParams : this.props.navigation.state.params
            })
        }
        LayoutAnimation.easeInEaseOut()
        return(
            <View style={styles.container}>
                  <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ImageBackground source={require('./StartPage.png')} style={styles.image}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS == "ios" ? "padding" : "height"}
                        style={{flex : 1}}
                    >
                        <View style={styles.form}>
                            <View>
                                <Text style={styles.inputTitle}>Email Address</Text>
                                <TextInput style={styles.input} 
                                    autoCapitalize="none"
                                    onChangeText={email => this.setState({email})}
                                    value={this.state.email}/>
                            </View>
                            <View style={{marginTop:32}}>
                                <Text style={styles.inputTitle}>Password</Text>
                                <TextInput style={styles.input} 
                                    autoCapitalize="none"
                                    secureTextEntry
                                    onChangeText={password => this.setState({password})}
                                    value={this.state.password}/>
                            </View>
                            {this.state.errorMessage != null && 
                            <View style={styles.errorMessage}>
                                <Text style={styles.error}>{this.state.errorMessage}</Text>
                            </View>}
                            <TouchableOpacity onPress={this.handleLogin}>
                                <View style={styles.button}>
                                    <Text style={{fontSize:20}}>Sign In</Text>
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity style={{alignSelf:"center",marginTop:32}} onPress={() => this.props.navigation.navigate('Register')}>
                                <Text style={{color:"#414959", fontSize:13}}>
                                    New to DDE?
                                    <Text style={{fontWeight:"bold",color:"black"}} >Sign Up</Text>
                                </Text>
                            </TouchableOpacity>
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
        marginBottom:48,
        marginHorizontal:20,
        justifyContent: 'flex-end'
    },
    image: {
        flex: 1,
        resizeMode: "contain",
        width:'100%',
        height: '100%'
    },
    errorMessage:{
        marginTop:5,
        padding:5,
        alignItems:"center",
        justifyContent:"center",
        backgroundColor:"white",
        borderRadius:10,
    },
    error:{
        color:"black",
        fontSize:13,
        fontWeight:"600",
        textAlign:"center"
    },
    inputTitle:{
        color:"#8A8F9E",
        fontSize:10,
        marginLeft:20,
        textTransform:"uppercase"
    },
    input:{
        height:50,
        fontSize:15,
        color: 'white',
        textAlign:"center",
        backgroundColor:"black",
        borderRadius:30,
    },
    button:{
        marginTop: 10,
        marginHorizontal:40,
        backgroundColor:"white",
        borderRadius:20,
        borderColor: 'black', 
        borderWidth: 1,
        height:52,
        alignItems:"center",
        justifyContent:"center"
    }
});