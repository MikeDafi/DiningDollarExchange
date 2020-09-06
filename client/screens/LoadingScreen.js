import React from "react";
import { View, Text, StyleSheet, ActivityIndicator,Image } from "react-native";
import * as firebase from "firebase";
import LottieView from "lottie-react-native";

export default class LoadingScreen extends React.Component {
  componentDidMount() {
    if (this.props.navigation) {
      firebase.auth().onAuthStateChanged((user) => {
        this.props.navigation.navigate(
          user && user.emailVerified ? "App" : "Auth"
        );
      });
    }
  }
  render() {
    return (
      <View style={styles.container}>
        <View style={{justifyContent:"center",alignItems:"center",width:200,height:200}}>
        <LottieView
          style={{
            width: 200,
            height: 200,
            marginLeft:-2,
          }}
          source={require("../assets/loadingCircle.json")}
          autoPlay
        />
        {/* <View style={{backgroundColor:"blue",height:200,width:20,justifyContent:"center",alignItems:"center"}}/> */}
        <Image style={{width:90,height:90,top:47,left:57,position:"absolute"}} source={require("../assets/Coin.png")}/>
      </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:"#F1F2F3",
    justifyContent: "center",
    alignItems: "center",
  },
});
