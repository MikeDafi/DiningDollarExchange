import React from "react";
import { View, Text, StyleSheet, Dimensions,TouchableOpacity } from "react-native";
import * as firebase from "firebase";
const windowWidth = Dimensions.get("window").width;
const windowHeight = Dimensions.get("window").height;
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
export default class QuickOrder extends React.Component {


  nextButton = () => {
    return (
      <View
        style={[
          styles.nextButton,
          {
            backgroundColor: this.props.homepage == 1 ? "#FFE300" : (this.props.blackBackground ? "white" :"black"),
            marginLeft: -5,
            width: windowWidth / 2 - 50,
          },
        ]}
      >
        <Text style={{color : (!this.props.blackBackground && this.props.homepage == 0 ? "white" : "black" )}}>SELLER</Text>
      </View>
    );
  };

  prevButton = () => {
    return (
      <View
        style={[
          styles.prevButton,
          {
            backgroundColor: this.props.homepage == 0 ? "#FFE300" : (this.props.blackBackground ? "white" :"black"),
            marginRight: -5,
            width: windowWidth / 2 - 60,
          },
        ]}
      >
        <Text style={{color:(!this.props.blackBackground && this.props.homepage == 1 ? "white" : "black" )}}>BUYER</Text>
      </View>
    );
  };

  render() {
    return (
<View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              this.props._swiper.scrollBy(this.props.homepage * -1);
              this.props.setHomePage(0);
            }}
          >
            {this.prevButton()}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              this.props._swiper.scrollBy((this.props.homepage + 1) % 2);
              this.props.setHomePage(1);
            }}
          >
            {this.nextButton()}
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              position: "absolute",
              left: windowWidth / 2 - 62,
              marginTop: 40,
              width: 120,
              height: 120,
              borderRadius: 120,
              backgroundColor: "white",
              justifyContent: "center",
              alignItems: "center",
              borderColor: "#FFE300",
              borderWidth: 10,
            }}
            onPress={() => {
              this.props.togglePopupVisibility(true);
            }}
          >
            <FontAwesome5 name="user-friends" size={45} color="black" />
            <Text> BUY NOW</Text>
          </TouchableOpacity>
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
header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 50,
  },
    nextButton: {
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  prevButton: {
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
});
