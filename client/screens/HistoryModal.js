import React from "react";
import Modal from "react-native-modal";
import { Col, Row, Grid } from "react-native-easy-grid";
import * as firebase from "firebase";
import Loading from "./LoadingScreen";
import LottieView from "lottie-react-native";

import {
  Animated,
  View,
  Text,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  TouchableWithoutFeedback,
  Switch,
  Keyboard,
} from "react-native";
const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;
export default class ProfileScreenModal extends React.Component {
  state = {
      animatedWidth: new Animated.Value(0),
      animatedHeight: new Animated.Value(0),
  };

  _startWidth = (widthVariable) => {
    console.log("oooooooooo");
    Animated.timing(widthVariable, {
      toValue: windowWidth - 50,
      duration: 400,
    }).start();
  };

  _startHeight = (heightVariable) => {
    console.log("oooooooooo");
    Animated.timing(heightVariable, {
      toValue: windowHeight - 200,
      duration: 400,
    }).start();
  };

  _close =  (heightVariable) => {
    console.log("iiiiii");
     Animated.timing(heightVariable, {
      toValue: 0,
      duration: 50,
    }).start();
  };

  render() {
    return (

      <Modal
        testID={"modal"}
        coverScreen={true}
        hasBackdrop={true}
        isVisible={this.props.popupVisible}
        animationInTiming={0.00000000000001}
        hideModalContentWhileAnimating={true}
        style={{
          alignItems: "center",
        }}
        onModalWillShow={()=> {this._startWidth(this.state.animatedWidth); this._startHeight(this.state.animatedHeight)}}
        onModalWillHide={() => {this._close(this.state.animatedWidth); this._close(this.state.animatedHeight)}}
        onBackdropPress={ () =>{
          this._close(this.state.animatedWidth); this._close(this.state.animatedHeight)
            this.props.togglePopupVisibility(false)
        }}
      >
        <Animated.View
          style={{
            backgroundColor: "white",
            height: this.state.animatedHeight,
            width: this.state.animatedWidth,
            borderRadius: 20,
          }}
        >
         
        </Animated.View>
      </Modal>
    );
  }
}
