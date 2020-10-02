import React from "react";
import {
  ImageBackground,
  Keyboard,
  Platform,
  Dimensions,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Image,
  View,
  Vibration,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  LayoutAnimation,
} from "react-native";
import * as firebase from "firebase";
import { Notifications } from "expo";
import * as Permissions from "expo-permissions";
import Constants from "expo-constants";
import UserPermissions from "../../utilities/UserPermissions";
import * as FileSystem from "expo-file-system";
import LottieView from "lottie-react-native";

import Loading from "./LoadingScreen";
const windowWidth = Dimensions.get("window").width;
const windowHeight = Dimensions.get("window").height;
export default class LoginScreen extends React.Component {
  state = {
    email: "",
    password: "",
    errorMessage: (this.props.navigation.state.params || {}).errorMessage,
    currentNavParams: {},
    passwordReset: false,
    loading:false,
    token: "",
  };

  handleLogin = async () => {
    if (this.state.passwordReset) {
      var auth = firebase.auth();
      auth
        .sendPasswordResetEmail(this.state.email)
        .then(() => {
          this.setState({
            passwordReset: false,
            errorMessage: "If an A password reset email has been sent",
          });
        })
        .catch((error) => {
          console.log("error ", error);
          this.setState({ errorMessage: error.toString().substring(6) });
        });
      return;
    }
    this.setState({loading:true})
    const { email, password } = this.state;
    const token = await UserPermissions.getDeviceToken();
    firebase
      .auth()
      .signInWithEmailAndPassword(email, password)
      .then(async (usercredentials) => {
        if (firebase.auth().currentUser.emailVerified) {
          await FileSystem.makeDirectoryAsync(
            FileSystem.documentDirectory + "accountObject/",
            { intermediates: true }
          );
          await FileSystem.makeDirectoryAsync(
            FileSystem.documentDirectory + "profileImage/",
            { intermediates: true }
          );
          const user = firebase.auth().currentUser;
          const start = (user || {}).email.indexOf("@");
          const end = (user || {}).email.indexOf(".edu");
          const domain = (user || {}).email.substring(start, end);
          firebase
            .database()
            .ref("users/" + domain + "/" + this.state.email.substring(0, end))
            .update({
              expoToken: token == undefined ? null : token,
              active: true,
              // page: 0,
              // isBuyer:true,
              // isSeller:true,
              name: firebase.auth().currentUser.displayName,
            });
          UserPermissions.getCameraPermission();
          this.props.navigation.navigate("Tutorial");
        } else {
          firebase.auth().currentUser.sendEmailVerification();
          this.setState({ errorMessage: "Verification email sent again" });
          firebase.auth().signOut();
        }
        this.setState({loading:false})
      })
      .catch((error) => this.setState({ loading:false,errorMessage: error.message }));
  };
  render() {
    if (this.state.currentNavParams != this.props.navigation.state.params) {
      this.setState({
        errorMessage: (this.props.navigation.state.params || {}).errorMessage,
        currentNavParams: this.props.navigation.state.params,
      });
    }
    LayoutAnimation.easeInEaseOut();
    return (
      <View style={styles.container}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ImageBackground
            source={require("../assets/yellowGradient.jpg")}
            style={styles.image}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS == "ios" ? "padding" : "height"}
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                width: windowWidth,
                height: windowHeight,
              }}
            >
              <View>
                <View
                  style={{
                    justifyContent: "center",
                    alignItems: "center",
                    marginTop: 150,
                    marginBottom: 10,
                    shadowColor: "black",
                    shadowOffset: { width: 0, height: 10 },
                    shadowRadius: 10,
                    shadowOpacity: 1,
                    overflow: "visible",
                  }}
                >
                  <Image
                    source={require("../assets/AppIconSquare1.png")}
                    style={{
                      width: 125,
                      height: 125,
                      borderRadius: 25,
                      overflow: "hidden",
                    }}
                  />
                </View>
                <Text
                  style={{
                    fontSize: 27,
                    fontWeight: "800",
                    textAlign: "center",
                    fontFamily: "Marker Felt",
                  }}
                >
                  Dining Dollar Exchange
                </Text>
              </View>
              <View style={styles.form}>
                <View>
                  <Text style={styles.inputTitle}>Email Address</Text>
                  <TextInput
                    style={styles.input}
                    autoCapitalize="none"
                    onChangeText={(email) => this.setState({ email })}
                    value={this.state.email}
                  />
                </View>
                {!this.state.passwordReset && (
                  <View style={{ marginTop: 32 }}>
                    <Text style={styles.inputTitle}>Password</Text>
                    <TextInput
                      style={styles.input}
                      autoCapitalize="none"
                      secureTextEntry
                      onChangeText={(password) => this.setState({ password })}
                      value={this.state.password}
                    />
                  </View>
                )}
                {this.state.errorMessage != null && (
                  <View style={styles.errorMessage}>
                    <Text style={styles.error}>{this.state.errorMessage}</Text>
                  </View>
                )}

                <TouchableOpacity onPress={this.handleLogin} disabled={this.state.loading}>
                  <View style={styles.button}>
                                              {this.state.loading ?
                                                      <>
        <LottieView
          style={{
            width: 100,
            position:"absolute",
            height: 100,
            marginLeft:-2,
            marginTop:2,
          }}
          source={require("../assets/whiteLoadingCircle.json")}
          autoPlay
        />
                <Image style={{width:45,height:45,top:-3,left:0}} source={require("../assets/Coin.png")}/>

        </>
                                              :
                    <Text
                      adjustsFontSizeToFit={true}
                      numberOfLines={1}
                      style={{
                        fontSize: 23,
                        fontWeight: "800",
                        fontFamily: "Kailasa",
                      }}
                    >
                      {this.state.passwordReset ? "RESET PASSWORD" : "SIGN IN"}
                    </Text>}
                  </View>
                </TouchableOpacity>
                {this.state.passwordReset ? (
                  <TouchableOpacity
                    style={{ alignSelf: "center", marginTop: 32 }}
                    onPress={() => this.setState({ passwordReset: false })}
                  >
                    <Text
                      style={{
                        color: "#414959",
                        fontSize: 17,
                        textDecorationLine: "underline",
                      }}
                    >
                      Go Back To Login
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <>
                    <TouchableOpacity
                      style={{ alignSelf: "center", marginTop: 32 }}
                      onPress={() => this.props.navigation.navigate("Register")}
                    >
                      <Text style={{ color: "#414959", fontSize: 13 }}>
                        New to DDE?
                        <Text style={{ fontWeight: "bold", color: "black" }}>
                          Sign Up
                        </Text>
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{ alignSelf: "center", marginTop: 2 }}
                      onPress={() => this.setState({ passwordReset: true })}
                    >
                      <Text
                        style={{
                          color: "#414959",
                          fontSize: 13,
                          textDecorationLine: "underline",
                        }}
                      >
                        Forgot Password
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </KeyboardAvoidingView>
          </ImageBackground>
        </TouchableWithoutFeedback>
        {/* {this.state.loading && 
        <View style={{position:"absolute",width:"100%",height:"100%"}} opacity={0.5}>
        <Loading />
        </View>} */}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  form: {
    width: windowWidth - 50,
    marginBottom: 48,
    marginTop: 30,
    marginHorizontal: 20,
    justifyContent: "flex-end",
  },
  image: {
    flex: 1,
    resizeMode: "contain",
    width: "100%",
    height: "100%",
  },
  errorMessage: {
    marginTop: 5,
    padding: 5,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  error: {
    color: "black",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  inputTitle: {
    color: "#8A8F9E",
    fontSize: 10,
    marginLeft: 20,
    textTransform: "uppercase",
  },
  input: {
    height: 50,
    fontSize: 20,
    color: "white",
    textAlign: "center",
    backgroundColor: "black",
    borderRadius: 30,
  },
  button: {
    overflow:"hidden",
    marginTop: 10,
    marginHorizontal: 40,
    backgroundColor: "white",
    borderRadius: 20,
    borderColor: "#8A8F9E",
    borderWidth: 2,
    height: 52,
    paddingTop: 6,
    alignItems: "center",
    justifyContent: "center",
  },
});
