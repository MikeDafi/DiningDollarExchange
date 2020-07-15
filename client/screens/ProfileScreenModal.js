import React from "react";
import Modal from "react-native-modal";
import { Col, Row, Grid } from "react-native-easy-grid";
import * as firebase from "firebase";
import Loading from "./LoadingScreen";
import LottieView from 'lottie-react-native';
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
export default class ProfileScreenModal extends React.Component {
  state = {
    inTextInput: false,
    stillInTextInput: false,
    cancelHighlight: false,
    submitHighlight: false,
    firstTextInputError: "",
    password: {
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
      secondTextInputError: "",
      verified: false,
    },
  };

  //   textInput = (title) => {
  //       return(
  //         <Row style={{justifyContent:"center",height:65}}>

  //             <TextInput style={{backgroundColor:"white",
  //                                 marginHorizontal:10,
  //                                 borderRadius:4,
  //                                 padding:8,
  //                                 borderWidth:3,
  //                                 height:65,
  //                                 borderColor:"#FFDB0C",
  //                                 shadowColor: '#FFDB0C',
  //                                 shadowOffset:{
  //                                     width:0,
  //                                     height:6,
  //                                 },
  //                                 fontSize:20,
  //                                 shadowOpacity:0.39,
  //                                 shadowRadius:10,
  //                                 width:260}}
  //                     autoCapitalize="none"
  //                     secureTextEntry
  //                     onFocus={()=>this.setState({inTextInput: true})}
  //                     onEndEditing={()=> this.setState({inTextInput: false})}
  //                     onChangeText={field => this.props.setModal(this.props.modal.title,field,true)}
  //                     value={this.props.modal.field}/>
  //         </Row>
  //       )
  //   }

  newPasswordChecker = () => {
    var atLeastOneNumber = /^(?=.*\d).{1,}$/;
    var atLeastOneLowerCase = /^(?=.*[a-z]).{1,}$/;
    var atLeastOneUpperCase = /^(?=.*[A-Z]).{1,}$/;
    const password = this.state.password.newPassword;
    if (password.length == 0) {
      return "Password is empty";
    }
    if (!password.match(atLeastOneNumber)) {
      return "*Password must have at least one number*";
    } else if (!password.match(atLeastOneUpperCase)) {
      return "*Password must have at least one uppercase*";
    } else if (!password.match(atLeastOneLowerCase)) {
      return "*Password must have at least one lowercase*";
    } else if (!(password.length >= 8)) {
      return "*Password must be at least length 8*";
    } else {
      return "";
    }
  };

  confirmPasswordChecker = () => {
    if (
      this.state.password.confirmPassword != this.state.password.newPassword ||
      this.state.password.confirmPassword.length == 0
    ) {
      return "Doesn't Match";
    }
    return "";
  };

  textInput = (name, height) => {
    const title =
      name == "Old Password"
        ? "oldPassword"
        : name == "New Password"
        ? "newPassword"
        : name == "Confirm Password"
        ? "confirmPassword"
        : null;
    const value =
      name == null ? this.props.modal.field : this.state.password[[name]];
    const error =
      name == "Confirm Password"
        ? this.state.password.secondTextInputError
        : this.state.firstTextInputError;
    return (
      <Row style={{ height: height }}>
        <Col>
          <Text style={{ marginLeft: 20, marginTop: -20 }}>{name}</Text>
          <TextInput
            style={{
              backgroundColor: "white",
              marginHorizontal: 20,
              borderRadius: 4,
              padding: 8,
              borderWidth: 3,
              height: height,
              borderColor: "#FFDB0C",
              shadowColor: "#FFDB0C",
              shadowOffset: {
                width: 0,
                height: 6,
              },
              fontSize: 20,
              shadowOpacity: 0.39,
              shadowRadius: 10,
            }}
            autoCapitalize="none"
            secureTextEntry
            onSubmitEditing={Keyboard.dismiss}
            onFocus={() =>
              this.setState({ stillInTextInput: true, inTextInput: true })
            }
            onEndEditing={() => {
              this.setState({ stillInTextInput: false });
              console.log("im going stomach");
              setTimeout(() => {
                if (!this.state.stillInTextInput) {
                  this.setState({ inTextInput: false });
                }
              }, 100);
            }}
            onChangeText={(field) => {
              if (title != null) {
                const password = this.state.password;
                password[[title]] = field;
                this.setState({ password });
              } else {
                this.props.setModal(this.props.modal.title, field, true);
              }
            }}
            value={value}
          />
          <View style={{ alignItems: "center" }}>
            <Text style={{ color: "red" }}>
              {name == "New Password"
                ? this.newPasswordChecker()
                : name == "Confirm Password"
                ? this.confirmPasswordChecker()
                : error}
            </Text>
          </View>
        </Col>
      </Row>
    );
  };

  checkCredentials = async () => {
    var user = firebase.auth().currentUser;
    var credential = firebase.auth.EmailAuthProvider.credential(
      user.email, // references the user's email address
      this.state.password.oldPassword
    );

    await user
      .reauthenticateWithCredential(credential)
      .then(() => {
        // User re-authenticated.
        // user.updatePassword(self.newPassword)
        //     .then(function() {
        //         console.log("Password update successful!");
        //     })
        //     .catch(function(error) {
        //         console.log(
        //             "An error occurred while changing the password:",
        //             error
        //         );
        //     });
        const password = this.state.password;
        password["verified"] = true;
        this.setState({ password, firstTextInputError: "" });
        console.log("VERIFIED");
      })
      .catch((error) => {
        this.setState({ firstTextInputError: "Invalid Password" });
        // An error happened.
      });

    this.setState({ loading: false });
    console.log("DONE");
  };

  packagePassword = () => {
    return (
      <>
        {this.textInput("New Password", 50)}
        <View style={{ height: 2 }} />
        {this.textInput("Confirm Password", 50)}
      </>
    );
  };

  setCredentials = () => {
    var user = firebase.auth().currentUser;
    const password = this.state.password
    user
      .updatePassword(this.state.password.newPassword)
      .then(() => {
        password["changed"] = true
        this.setState({ loading: false, password });
        console.log(this.state.password)
      })
      .catch((error) => {
        password["changed"] = false
        this.setState({ loading: false, password });
      });
  };

  resultMessage = (message) => {
      return(
          <Row style={{justifyContent:"center",alignItems:"flex-end"}}>
            {this.state.password.changed ? 
              <LottieView source={require('./checkMarkAnimation.json')} autoPlay /> :
              <LottieView source={require('./xMarkAnimation.json')} autoPlay />
            }
            <Text>{this.state.password.changed ? "Successfully Changed" : "Unsuccessful. Try Again"}</Text>
          </Row>
      )
  }

  resetState = () => {
    const inTextInput = false
    const stillInTextInput = false
    const cancelHighlight = false
    const submitHighlight =  false
    const firstTextInputError = ""
    const password = {
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
      secondTextInputError: "",
      verified: false,
    }
    this.setState({inTextInput,stillInTextInput,cancelHighlight,submitHighlight,firstTextInputError,password})

  }

  render() {
     
    return (
      <Modal
        testID={"modal"}
        coverScreen={true}
        hasBackdrop={true}
        isVisible={this.props.modal.visible}
        onBackdropPress={() => {
          this.resetState()
          this.props.setModal(
            this.props.modal.title,
            this.props.modal.field,
            false
          );
        }}
        animationIn="slideInLeft"
        animationInTiming={500}
        style={{
          justifyContent: this.state.inTextInput ? "flex-start" : "center",
          alignItems: "center",
          marginTop: this.state.inTextInput ? 100 : 0,
        }}
      >
        <View
          style={{
            backgroundColor: "white",
            width: 300,
            height: 300,
            borderRadius: 20,
          }}
        >
          <Grid style={{ justifyContent: "space-between" }}>
            <Row
              style={{
                justifyContent: "center",
                marginTop: 10,
                height: 50,
                borderBottomWidth: 1,
                borderColor: "#C5C5C5",
              }}
            >
              <Text style={{ fontSize: 30 }}>{this.props.modal.title}</Text>
            </Row>
            {this.state.loading ? (
              <Loading />
            ) : this.props.modal.title == "Change Password" ? (
              !this.state.password.verified ? (
                this.textInput("Old Password", 65)
              ) : (
                this.state.password.changed == undefined ?
                  this.packagePassword() :
                  this.resultMessage()
              )
            ) : (
              this.textInput("Name", 65)
            )}

            <Row style={{ alignItems: "flex-end", height: 50 }}>
              <TouchableWithoutFeedback
                onPressIn={() => this.setState({ cancelHighlight: true })}
                onPressOut={() => this.setState({ cancelHighlight: false })}
                onPress={() => {
                  this.resetState()
                  this.props.setModal(
                    this.props.modal.title,
                    this.props.modal.field,
                    false
                  );
                }}
              >
                <Col
                  style={{
                    height: 50,
                    backgroundColor: this.state.cancelHighlight
                      ? "#C5C5C5"
                      : "white",
                    justifyContent: "center",
                    borderBottomLeftRadius: 20,
                    borderTopWidth: 2,
                    borderRightWidth: 2,
                    borderColor: "black",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontSize: 20 }}>{this.state.password.changed != undefined ? "Exit" :"Cancel"}</Text>
                </Col>
              </TouchableWithoutFeedback>
              <TouchableWithoutFeedback
                onPressIn={() => this.setState({ submitHighlight: true })}
                onPressOut={() => this.setState({ submitHighlight: false })}
                onPress={() => {
                  this.setState({ submitHighlight: false });
                  Keyboard.dismiss();
                  this.setState({ inTextInput: false });
                  if (this.props.modal.title == "Change Password") {
                    if (this.state.password.verified) {
                      if (
                        this.state.firstTextInputError == "" &&
                        (this.state.secondTextInputError == "" || this.state.secondTextInputError == undefined)
                      ) {
                        if(this.state.password.changed != undefined){
                          this.resetState()
                        }else{
                          this.setState({loading:true})
                          this.setCredentials();
                        }
                      }
                      console.log("first ", this.state.firstTextInputError)
                      console.log("second ", this.state.secondTextInputError)
                    } else if (this.state.password.oldPassword != "") {
                      this.setState({ loading: true });
                      this.checkCredentials();
                    } else {
                      this.setState({
                        firstTextInputError: "No Password Inputted",
                      });
                    }
                  } else {
                    this.props.setModal(
                      this.props.modal.title,
                      this.props.modal.field,
                      false
                    );
                    this.props.submitModal();
                  }
                }}
              >
                <Col
                  style={{
                    height: 50,
                    backgroundColor: this.state.submitHighlight
                      ? "#C5C5C5"
                      : "white",
                    justifyContent: "center",
                    borderTopWidth: 2,
                    borderBottomRightRadius: 20,
                    borderLefttWidth: 2,
                    borderColor: "black",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontSize: 20 }}>
                    {this.props.modal.title == "Change Password" &&
                    !this.state.password.verified
                      ? "Next" : (this.state.password.changed != undefined ? "Try Again"
                      : "Save")}
                  </Text>
                </Col>
              </TouchableWithoutFeedback>
            </Row>
          </Grid>
        </View>
      </Modal>
    );
  }
}
