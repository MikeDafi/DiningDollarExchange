import React from "react";
import { View, Text, StyleSheet, Dimensions,TouchableOpacity,TouchableWithoutFeedback } from "react-native";
import * as firebase from "firebase";
const windowWidth = Dimensions.get("window").width;
const windowHeight = Dimensions.get("window").height;
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
export default class QuickOrder extends React.Component {

  state={
    isClickedBuyNow : false,
  }

  nextButton = () => {
    return (
      <View
        style={[
          styles.nextButton,
          {
            backgroundColor: this.props.page == 1 ? "#FFE300" : (this.props.blackBackground ? "white" :"black"),
            marginLeft: -5,
            width: windowWidth / 2 - 50,
          },
        ]}
      >
        <Text style={{color : (!this.props.blackBackground && this.props.page == 0 ? "white" : "black" )}}>SELLER</Text>
      </View>
    );
  };

  prevButton = () => {
    return (
      <View
        style={[
          styles.prevButton,
          {
            backgroundColor: this.props.page == 0 ? "#FFE300" : (this.props.blackBackground ? "white" :"black"),
            marginRight: -5,
            width: windowWidth / 2 - 60,
          },
        ]}
      >
        <Text style={{color:(!this.props.blackBackground && this.props.page == 1 ? "white" : "black" )}}>BUYER</Text>
      </View>
    );
  };

  render() {
    return (
<View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              try{
              this.props._swiper.scrollBy(this.props.page * -1);
              }catch(e){}
              this.props.setPage(0);
            }}
          >
            {this.prevButton()}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              try{
              this.props._swiper.scrollBy((this.props.page + 1) % 2);
              }catch(e){}
              this.props.setPage(1);
            }}
          >
            {this.nextButton()}
          </TouchableOpacity>
          <TouchableWithoutFeedback

            onPressIn={() => this.setState({isClickedBuyNow:true})}
            onPressOut={() => this.setState({isClickedBuyNow:false})}
            onPress={() => {
              this.props.togglePopupVisibility(true);
            }}
          >
            <View
                        style={{
              position: "absolute",
              left: windowWidth / 2 - 62,
              marginTop: 40,
              width: 120,
              height: 120,
              borderRadius: 120,
              backgroundColor: this.state.isClickedBuyNow ? "#FFE300" : "white",
              justifyContent: "center",
              alignItems: "center",
              borderColor: !this.state.isClickedBuyNow ? "#FFE300" : (this.props.blackBackground ? "white" : "black"),
              borderWidth: 10,
            }}>
            <FontAwesome5 name="user-friends" size={45} color="black" />
            <Text> BUY NOW</Text>
            </View>
          </TouchableWithoutFeedback>
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
