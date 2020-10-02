import React from "react";
import {
  Animated,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  TouchableWithoutFeedback,
  Switch,
  AsyncStorage,
} from "react-native";
const windowWidth = Dimensions.get("window").width;
const windowHeight = Dimensions.get("window").height;
import { FontAwesome, AntDesign,Entypo,Ionicons } from "@expo/vector-icons";
import RatingUser from "./RatingUser";
import * as firebase from "firebase";
import Modal from "react-native-modal";
import Image from "react-native-image-progress";
import DropDownPicker from "react-native-dropdown-picker";
import ProfileScreenModal from "./ProfileScreenModal";
import Loading from "./LoadingScreen";
import UserPermissions from "../../utilities/UserPermissions";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from 'expo-file-system';
const clone = require("rfdc")();
export default class ProfileScreen extends React.Component {
  state = {
    infoDialogIndex: 0,
    imageUri:"",
    tempUri:"",
    changedUrl: false,
    generalCategory: [],
    accountCategory: [],
    buyerDropdown: new Animated.Value(0),
    sellerDropdown: new Animated.Value(0),
    buyerReminders: new Animated.Value(0),
    sellerReminders: new Animated.Value(0),
    beforeChanges: [],
    loading: true,
    showDialog : false,
    notificationCategory: {},
    rating: 5,
    generalCategoryIndex: 0,
    accountCategoryIndex: 1,
    notificationCategoryIndex: 2,
    currentModalReference: [],
    modal: {
      title: "",
      field: "",
      visible: false,
    },
  };

  _start = (heightVariable) => {
    //1 console.log("oooooooooo");
    Animated.timing(heightVariable, {
      toValue: 150,
      duration: 50,
    }).start();
  };

  _close = (heightVariable) => {
    //1 console.log("iiiiii");
    Animated.timing(heightVariable, {
      toValue: 0,
      duration: 50,
    }).start();
  };

  handlePickAvatar = async () => {
    UserPermissions.getCameraPermission();
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Image,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });
      if (!result.cancelled) {
        this.setState({ tempUri:this.state.imageUri,imageUri: result.uri, changedUrl: true });
      }

      //1 console.log(result);
    } catch (E) {
      //1 console.log(E);
    }
  };

  async componentDidMount() {
    var email = firebase.auth().currentUser.email;
    const start = email.indexOf("@");
    const end = email.indexOf(".edu");
    var domain = email.substring(start + 1, end);
    const realDomain = email.substring(start, end);
    email = email.substring(0, end);
    domain = domain.toUpperCase();
    const generalCategory = [
      {
        title: "Name",
        field: firebase.auth().currentUser.displayName,
        inEditMode: false,
      },
      {
        title: "Email",
        field: firebase.auth().currentUser.email,
      },
      {
        title: "School",
        field: domain,
      },
    ];

    this.setState({ generalCategory });
    const accountCategory = [
      {
        title: "Change Password",
        inEditMode: false,
      },
      {
        title:"Payment Options",
        inEditMode:false,
      },
      // {
      //   title: "Are you a Buyer?",
      //   isBuyer: {},
      // },
      // {
      //   title: "Are you a Seller?",
      //   isSeller: {},
      // },
    ];

    const notificationCategory = {
      notifications: true,
      newMessages: true,
      buyer: {
        buyerNotification: true,
        reminders: 0,
      },
      seller: {
        sellerNotification: true,
        scheduled: true,
        reminders: 0,
        ranges:15,
      },
    };

    this.setState({ accountCategory, notificationCategory });
    const image = firebase
      .storage()
      .ref()
      .child("profilePics/" + realDomain + "/" + email + "/profilePic.jpg");
    const promises = [];
    var profileImageUrl = ""
    let profileObject = await AsyncStorage.getItem('profileObject')
    profileObject = JSON.parse(profileObject);


    promises.push(
      firebase
        .database()
        .ref("users/" + realDomain + "/" + email)
        .once("value", (snapshot) => {
          const accountCategory = this.state.accountCategory;
          // accountCategory[2].isBuyer = snapshot.val().isBuyer;
          // //1 console.log(snapshot.val());
          // accountCategory[3].isSeller = {
          //   searching: snapshot.val().isSeller.searching,
          //   ranges: this.convertToArray(snapshot.val().isSeller.ranges),
          // };
          if(snapshot.val().profileImageUrl){
            profileImageUrl = snapshot.val().profileImageUrl
          }else{
            promises.push(
              image
                .getDownloadURL()
                .then((foundURL) => {
                                  profileImageUrl = foundURL
                  firebase
                    .database()
                    .ref("users/" + realDomain + "/" + email).update({profileImageUrl: foundURL})
                                //1 console.log("done finding")
                })
                .catch((error) => {
                  //1 console.log(error);
                })

            );
          }
          const notifications = snapshot.val().notifications;
          notificationCategory.buyer = (notifications || {}).buyer || {};
          notificationCategory.seller = (notifications || {}).seller || {};
          notificationCategory.newMessages = (notifications || {}).newMessages || {};
          notificationCategory.notifications = (notifications || {}).notifications || {};
          this.setState({
            accountCategory,
            notificationCategory,
            rating: snapshot.val().starRating,
          });

          // //1 console.log("notification ", accountCategory);
        })
    );

    const responses = await Promise.all(promises);
    this.setState({
      beforeChanges: clone([
        this.state.generalCategory,
        this.state.accountCategory,
        this.state.notificationCategory,
      ]),
      loading: false,
    });
    //1 console.log("profileImageUrl ", profileImageUrl)
    //1 console.log("profileObject" , profileObject)

    if(!profileObject || profileObject.uri == undefined || profileImageUrl != profileObject.url ){//compare urls
      //1 console.log("trying to download")
      if(profileObject && !profileObject.uri){
        //1 console.log("delete")
        await this.deleteUri(profileObject.uri)
      }
      try{
      const uri = profileImageUrl == "" ? "" : await this.downloadUrl(profileImageUrl,"profileImage")
      const newProfileObject = {uri,url : profileImageUrl}
      await AsyncStorage.setItem("profileObject", JSON.stringify(newProfileObject))
        .then( ()=>{
        //1 console.log("It was saved successfully")
        } )
        .catch( ()=>{
        //1 console.log("There was an error saving the product")
        } )
      this.setState({imageUri : uri})
      }catch(e){
        //1 console.log("big error")
      }
    }else{
      //1 console.log("the same url",profileObject.uri)
      this.setState({imageUri : profileObject.uri})
    }
  }

  updatingFields = () => {
    //1 console.log(windowWidth);
    return (
      <View
        style={{
          position: "absolute",
          width: windowWidth,
          height: 80,
          paddingTop: 10,
          paddingHorizontal: 25,
          top: 0,
          left: 0,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <TouchableOpacity
          onPress={() =>{
            this.setState({
              generalCategory: this.state.beforeChanges[
                this.state.generalCategoryIndex
              ],
              accountCategory: this.state.beforeChanges[
                this.state.accountCategoryIndex
              ],
              notificationCategory: this.state.beforeChanges[
                this.state.notificationCategoryIndex
              ],
            })
            if(this.state.tempUri != "" && this.state.tempUri != this.state.imageUri){
              this.setState({imageUri:this.state.tempUri,tempUri:""})
            }
          }}
        >
          <Text style={{ color: "white", fontSize: 18 }}>Cancel</Text>
        </TouchableOpacity>
        <Text style={{ color: "white", fontSize: 18 }}>Edit Profile</Text>
        <TouchableOpacity onPress={() => this.saveToFirebase()}>
          <Text style={{ color: "white", fontSize: 18 }}>Save</Text>
        </TouchableOpacity>
      </View>
    );
  };

  saveToFirebase = () => {
    var user = firebase.auth().currentUser;
    var email = firebase.auth().currentUser.email;
    const start = email.indexOf("@");
    const end = email.indexOf(".edu");
    var domain = email.substring(start + 1, end);
    const realDomain = email.substring(start, end);
    email = email.substring(0, end);
    domain = domain.toUpperCase();
    // firebase.database().ref("users/" + realDomain + "/" + email + "/pendingOrders").once("value", snapshot => {
    //   const orderKeys = Object.keys(snapshot.val() || {})
    //   for(var i = 0; i < orderKeys.length; i++){
    //     const order = snapshot.val()[[orderKeys[i]]]
    //     for(var j = 0; j < order.scheduledIds.length;j++){
    //       if(order.scheduledIds[j].reminderTime)
    //     }
    //   }
    // })
    firebase
      .database()
      .ref("users/" + realDomain + "/" + email)
      .update({
        // isBuyer: this.state.accountCategory[2].isBuyer,
        // isSeller: this.state.accountCategory[3].isSeller,
        notifications: this.state.notificationCategory,
        name: this.state.generalCategory[0].field,
      }).catch(() => {
          this.setState({savedSuccessfully:false})      
      })

    if (this.state.changedUrl) {
      if(this.state.imageUri != ""){
        //1 console.log("changed url")
        this.uriToBlob(this.state.imageUri).then((blob) => {
          //1 console.log("this.state.imageUri ", this.state.imageUri)
          this.uploadToFirebase(blob)
        }).catch(() => {
          this.setState({savedSuccessfully:false})
        })
      }else{
      var imageRef = firebase
        .storage()
        .ref(`/profilePics/${realDomain}/${email}/profilePic.jpg`)
      // Delete the file
      imageRef
        .delete()
        .then(function () {})
        .catch(function (error) {
          //1 console.log("OH no, delete image dosn't work");
        });
      firebase
        .database()
        .ref("users/" + realDomain + "/" + email).update({profileImageUrl: null})
      }
    }

    user.updateProfile({
      displayName: this.state.generalCategory[0].field,
    }).catch(() => {
      this.setState({savedSuccessfully : false})
    })

    this.setState({
      changedUrl: false,
      savedSuccessfully : this.state.savedSuccessfully == false ? false : true,
      beforeChanges: clone([
        this.state.generalCategory,
        this.state.accountCategory,
        this.state.notificationCategory,
      ]),
    });
  };

  uriToBlob = (uri) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = function () {
        // return the blob
        resolve(xhr.response);
      };

      xhr.onerror = function () {
        // something went wrong
        reject(new Error("uriToBlob failed"));
      };
      // this helps us get a blob
      xhr.responseType = "blob";
      xhr.open("GET", uri, true);

      xhr.send(null);
    });
  };

  uploadToFirebase = (blob) => {
    return new Promise((resolve, reject) => {
      var storageRef = firebase.storage().ref();
      const user = firebase.auth().currentUser;
      const start = user.email.indexOf("@");
      const end = user.email.indexOf(".edu");
      const domain = user.email.substring(start, end);
      const email = user.email.substring(0, end);
      storageRef
        .child(`/profilePics/${domain}/${email}/profilePic.jpg`)
        .put(blob, {
          contentType: "image/jpeg",
        }).then(() => {
          //1 console.log("image")
 const image = firebase
          .storage()
          .ref()
          .child("profilePics/" + domain + "/" + email + "/profilePic.jpg");
          image
            .getDownloadURL()
            .then((foundURL) => {
              //1 console.log("foundUrl")
              firebase
                .database()
                .ref("users/" + domain + "/" + email).update({profileImageUrl: foundURL})
        })
        })
        .catch((error) => {
          this.setState({savedSuccessfully : false})
        });
    });
  };

  uploadAndStars = () => {
    return (
      <View style={styles.uploadAndStars}>
        {/* <View
          style={{
            width: windowWidth,
            paddingHorizontal: 25,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <TouchableOpacity
            onPress={() =>
              this.setState({
                changedUrl: false,
                generalCategory: this.state.beforeChanges[
                  this.state.generalCategoryIndex
                ],
                accountCategory: this.state.beforeChanges[
                  this.state.accountCategoryIndex
                ],
                notificationCategory: this.state.beforeChanges[
                  this.state.notificationCategoryIndex
                ],
              })
            }
          >
            <Text style={{ color: "white", fontSize: 18 }}>Cancel</Text>
          </TouchableOpacity>
          <Text style={{ color: "white", fontSize: 18 }}>Edit Profile</Text>
          <TouchableOpacity onPress={() => this.saveToFirebase()}>
            <Text style={{ color: "white", fontSize: 18 }}>Save</Text>
          </TouchableOpacity>
        </View> */}
        <View style={{justifyContent:"space-around",width:windowWidth,marginHorizontal:20,flexDirection:"row"}}>
          <TouchableOpacity
            onPress={() =>{
                        if(this.state.tempUri != "" && this.state.tempUri != this.state.imageUri){
              this.setState({imageUri:this.state.tempUri,tempUri:""})
            }
              this.setState({
                changedUrl: false,
                generalCategory: this.state.beforeChanges[
                  this.state.generalCategoryIndex
                ],
                accountCategory: this.state.beforeChanges[
                  this.state.accountCategoryIndex
                ],
                notificationCategory: this.state.beforeChanges[
                  this.state.notificationCategoryIndex
                ],
              })
            }}
          >
            <Text style={{ color: "white", fontSize: 18 }}>Cancel</Text>
          </TouchableOpacity>
        <View style={styles.profileImage}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => this.handlePickAvatar()}
          >
            {this.state.imageUri ? (
              <Image
                source={{ url: this.state.imageUri }}
                threshold={0}
                style={{
                  width: 120,
                  height: 120,
                  margin: 0,
                  padding: 0,
                }}
                imageStyle={{ borderRadius: 120 }}
              />
            ) : (
              <View style={{ justifyContent: "center", alignItems: "center" }}>
                <FontAwesome
                  style={{ marginTop: -10 }}
                  name="user"
                  size={80}
                  color="black"
                />
                <Text>Upload Photo</Text>
              </View>
            )}
          </TouchableOpacity>
          <View style={{position:"absolute",bottom:0,left:-10}}>
            <TouchableOpacity onPress={() => this.setState({changedUrl:true,tempUri:this.state.imageUri,imageUri:""})}>
                      <FontAwesome name="trash-o" size={40} color="red" />
                      </TouchableOpacity>
                      </View>
          </View>
          <TouchableOpacity onPress={() => {this.setState({savedSuccessfully : undefined,showDialog:true});this.saveToFirebase()}}>
            <Text style={{ color: "white", fontSize: 18 }}>Save</Text>
          </TouchableOpacity>
        </View>

        <RatingUser
          starSize={45}
          starCount={this.state.rating || 0}
          disabled={true}
          selected={(rating) => this.onStarRatingPress(rating)}
        />
        <Text style={{ fontSize: 15, color: "white" }}>
          {(this.state.rating || "").toString().substring(0,4)}
        </Text>
      </View>
    );
  };

  convertToNumber = (array) => {
    if (typeof array == "boolean") {
      return array;
    }
    var total = 0;
    array.forEach((element) => {
      total += element;
    });

    return total;
  };

  setEditMode = async (category, index, title, field) => {
    //1 console.log("values ", index + " " + title + " " + field);
    //1 console.log("category ", category);
    if (category == 0) {
      const generalCategory = this.state.generalCategory;
      generalCategory[index][[title]] = field;
      this.setState({ generalCategory });
      ////1 console.log(this.state.generalCategory)
    } else if (category == 1) {
      var accountCategory = this.state.accountCategory;
      if (index < 2) {
        accountCategory[index][[title]] = field;
      }
      // else{
      //   const innerCategory = index == 2 ? "isBuyer" : "isSeller";
      //   accountCategory[index][innerCategory][[title]] = field;
      // }
      this.setState({ accountCategory });
    } else if (category == 2) {
      var notificationCategory = this.state.notificationCategory;
      if (index == 1000) {
        notificationCategory[title] = field;
      } else {
        notificationCategory[[index]][[title]] = field;
      }

      this.setState({ notificationCategory });
    }
  };

  setModal = (title, field, visible) => {
    const modal = {
      title,
      field,
      visible,
    };
    this.setState({ modal });
  };

  submitModal = () => {
    var updatedCategory;
    const categoryIndex = this.state.currentModalReference[0];
    const itemIndex = this.state.currentModalReference[1];
    if (categoryIndex == 0) {
      updatedCategory = this.state.generalCategory;
      if (itemIndex == 0) {
        //NAME
        if (this.state.modal.field == "") {
          this.state.modal.error = "Type a Valid Name";
        }
      }
    } else if (categoryIndex == 1) {
    }

    updatedCategory[itemIndex].field = this.state.modal.field;
    if (categoryIndex == 0) {
      this.setState({ generalCategory: updatedCategory });
    } else if (categoryIndex == 1) {
      this.setState({ accountCategory: updatedCategory });
    }
  };

  saveResult = () => (
    <View style={{position:"absolute",width:windowWidth,height:windowHeight,justifyContent:"center",alignItems:"center",backgroundColor: 'rgba(0,0,0,0.8)'}}>
        <View style={{
          width:windowWidth-100,
          height:200,
          flexDirection:"column",
          justifyContent:"space-between",
          backgroundColor:"white",
          borderRadius:20
        }}>
          <View style={{
            height:30,
            alignItems:"center",
            justifyContent:"center",
          }}>
                      <Text style={{fontSize:20}}>
            {this.state.infoDialogIndex == 0 ?
          "Scheduling"
            :(this.state.infoDialogIndex == 1 ?
          "Reminder"
            :(this.state.infoDialogIndex == 2 ?
              "Range"
            :
            "Save Result"
            ))}
            {" "}Info</Text>
          </View>
          <View style={{
              alignItems:"center",
              marginHorizontal:10,
              justifyContent:"center",
              height:100,}}>
            {this.state.savedSuccessfully == undefined ? 
            <>
                    {this.state.infoDialogIndex == 0 ?
                    <>
                      <Text>Recieve New Order Notifications to Scheduled Orders(+1 Day Ahead)</Text>
                    </>
                    : (this.state.infoDialogIndex == 1 ?
                                        <>
<Text>Recieve Order Reminders when your Order is Reaching its Expected Completion</Text>
                    </>
                    :(this.state.infoDialogIndex == 2 ?
                                        <>
                      <Text style={{fontSize:17,textAlign:"center"}}>What Cost Preferences you have to new Order Notifications</Text>
                    </>
                    :
                    <>
                    <Loading/>
                    <Text>Saving...</Text>
                    </>
                    ))}
                    </>
            :
            <Text style={{fontSize:15,justifyContent:"center"}}>
              {this.state.savedSuccessfully ? "Successfully Saved" : "Unsuccessful"}
            </Text>
            } 
          </View>
          <TouchableOpacity onPress={() => {
          this.setState({showDialog : false})
          }}>
            <View style={{
                alignItems:"center",
                justifyContent:"center",
                borderTopWidth:0.2,
                height:50,
                borderColor:"gray"}}>
              <Text>Dismiss</Text>
            </View>
          </TouchableOpacity>
        </View>
        </View>
  )

  general = () => {
    return (
      <View style={{ width: windowWidth, marginBottom: 15 }}>
        <View
          style={{
            borderBottomWidth: 1,
            borderColor: "#C5C5C5",
            marginHorizontal: 25,
          }}
        >
          <Text style={{ fontSize: 25 }}>General</Text>
        </View>
        <View style={{ marginHorizontal: 35 }}>
          {this.state.generalCategory.map((item, i) => {
            return (
              <View
                key={i}
                style={{
                  backgroundColor: item.inEditMode ? "#A9A9A9" : "white",
                }}
              >
                <TouchableWithoutFeedback
                  style={{ flexDirection: "row" }}
                  disabled={item.inEditMode == undefined}
                  onPressIn={() => {
                    if (item.inEditMode != undefined) {
                      this.setEditMode(
                        this.state.generalCategoryIndex,
                        i,
                        "inEditMode",
                        true
                      );
                    }
                  }}
                  onPressOut={() => {
                    if (item.inEditMode != undefined) {
                      this.setEditMode(
                        this.state.generalCategoryIndex,
                        i,
                        "inEditMode",
                        false
                      );
                    }
                  }}
                  onPress={() => {
                    if (item.inEditMode != undefined) {
                      this.setEditMode(
                        this.state.generalCategoryIndex,
                        i,
                        item.title,
                        true
                      );
                      this.setModal(item.title, item.field, true);
                      this.setState({
                        currentModalReference: [
                          this.state.generalCategoryIndex,
                          i,
                        ],
                      });
                    }
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      marginVertical: 10,
                      justifyContent: "space-between",
                    }}
                  >
                    <Text style={{ fontSize: 17 }}>{item.title}</Text>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 17,
                          color:
                            item.inEditMode == undefined ? "#A9A9A9" : "black",
                        }}
                      >
                        {item.field}
                      </Text>
                      {item.inEditMode != undefined && (
                        <AntDesign name="edit" size={15} color="black" />
                      )}
                    </View>
                  </View>
                </TouchableWithoutFeedback>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  convertToArray = (number) => {
    const array = [];
    var binary = 64;
    while (binary >= 1) {
      if (number >= binary) {
        number -= binary;
        array.push(binary);
      }
      binary = binary / 2;
    }
    return array;
  };

  account = () => {
    return (
      <View style={{ width: windowWidth, marginBottom: 15 }}>
        {this.state.accountCategory.length > 0 && (
          <>
            <View
              style={{
                borderBottomWidth: 1,
                borderColor: "#C5C5C5",
                marginHorizontal: 25,
              }}
            >
              <Text style={{ fontSize: 25 }}>Account</Text>
            </View>
            <View style={{ marginHorizontal: 35 }}>
              <View
                style={{
                  backgroundColor: this.state.accountCategory[0].inEditMode
                    ? "#A9A9A9"
                    : "white",
                }}
              >
                <TouchableWithoutFeedback
                  style={{ flexDirection: "row" }}
                  onPressIn={() =>
                    this.setEditMode(
                      this.state.accountCategoryIndex,
                      0,
                      "inEditMode",
                      true
                    )
                  }
                  onPressOut={() =>
                    this.setEditMode(
                      this.state.accountCategoryIndex,
                      0,
                      "inEditMode",
                      false
                    )
                  }
                  onPress={() => {
                    this.setModal(
                      this.state.accountCategory[0].title,
                      "",
                      true
                    );
                  }}
                >
                  <View style={{ flexDirection: "row", marginVertical: 10 }}>
                    <Text style={{ fontSize: 17 }}>
                      {this.state.accountCategory[0].title}
                    </Text>
                  </View>
                </TouchableWithoutFeedback>
              </View>

                            <View
                style={{
                  backgroundColor: this.state.accountCategory[1].inEditMode
                    ? "#A9A9A9"
                    : "white",
                }}
              >
                <TouchableWithoutFeedback
                  style={{ flexDirection: "row" }}
                  onPressIn={() =>
                    this.setEditMode(
                      this.state.accountCategoryIndex,
                      1,
                      "inEditMode",
                      true
                    )
                  }
                  onPressOut={() =>
                    this.setEditMode(
                      this.state.accountCategoryIndex,
                      1,
                      "inEditMode",
                      false
                    )
                  }
                  onPress={() => {
                     this.props.navigation.navigate("PaymentOptions", {});
                  }}
                >
                  <View style={{ flexDirection: "row", marginVertical: 10,alignItems:"center",justifyContent:"space-between" }}>
                    <Text style={{ fontSize: 17 }}>
                      {this.state.accountCategory[1].title}
                    </Text>
                    <Ionicons name="ios-arrow-forward" size={24} color="gray" />
                  </View>
                </TouchableWithoutFeedback>
              </View>
              {/* <View>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginVertical: 10,
                  }}
                >
                  <Text style={{ fontSize: 20 }}>
                    {this.state.accountCategory[2].title}
                  </Text>
                  <Switch
                    trackColor={{ false: "#DAD9D7", true: "#FFDA00" }}
                    thumbColor={"white"}
                    ios_backgroundColor="#E9E8E7"
                    onValueChange={(value) => {
                      this.setEditMode(1, 2, "searching", value);
                    }}
                    value={this.state.accountCategory[2].isBuyer.searching}
                  />
                </View>
              </View>
              <View>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginVertical: 10,
                  }}
                >
                  <Text style={{ fontSize: 20 }}>
                    {this.state.accountCategory[3].title}
                  </Text>
                  <Switch
                    trackColor={{ false: "#DAD9D7", true: "#FFDA00" }}
                    thumbColor={"white"}
                    ios_backgroundColor="#E9E8E7"
                    onValueChange={(value) => {
                      this.setEditMode(1, 3, "searching", value);
                      this.setEditMode(1, 3, "ranges", []);
                    }}
                    value={this.state.accountCategory[3].isSeller.searching}
                  />
                </View>

              </View> */}
            </View>
          </>
        )}
      </View>
    );
  };

  notificationToggle = () => {
    const value = this.state.notificationCategory.notifications;
    return (
      <View
        style={{
          flexDirection: "row",
        }}
      >
        <TouchableWithoutFeedback
          onPress={() => this.setEditMode(2, 1000, "notifications", false)}
        >
          <View
            style={{
              backgroundColor: !value ? "#FFDA00" : "black",
              alignItems: "center",
              justifyContent: "center",
              borderTopLeftRadius: 20,
              borderBottomLeftRadius: 20,
              width: 50,
              height: 30,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "bold",
                color: !value ? "black" : "white",
              }}
            >
              OFF
            </Text>
          </View>
        </TouchableWithoutFeedback>

        <TouchableWithoutFeedback
          onPress={() => this.setEditMode(2, 1000, "notifications", true)}
        >
          <View
            style={{
              backgroundColor: value ? "#FFDA00" : "black",
              alignItems: "center",
              justifyContent: "center",
              borderTopRightRadius: 20,
              borderBottomRightRadius: 20,
              paddingRight: 2,
              width: 50,
              height: 30,
            }}
          >
            <Text
              style={{
                fontWeight: "bold",
                fontSize: 17,
                color: value ? "black" : "white",
              }}
            >
              ON
            </Text>
          </View>
        </TouchableWithoutFeedback>
      </View>
    );
  };

  notifications = () => {
    return (
      <View style={{ width: windowWidth, marginBottom: 15 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            paddingBottom: 5,
            borderBottomWidth: 1,
            borderColor: "#C5C5C5",
            marginHorizontal: 25,
          }}
        >
          <Text style={{ fontSize: 25 }}>Notifications</Text>
          {this.notificationToggle()}
        </View>

        {this.state.notificationCategory.notifications && (
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 10,
              marginHorizontal: 35,
            }}
          >
            <Text style={{ fontSize: 20, color: "gray" }}>New Messages</Text>
            <Switch
              trackColor={{ false: "#DAD9D7", true: "#FFDA00" }}
              thumbColor={"white"}
              ios_backgroundColor="#E9E8E7"
              onValueChange={(value) =>
                this.setEditMode(
                  this.state.notificationCategoryIndex,
                  1000,
                  "newMessages",
                  value
                )
              }
              value={this.state.notificationCategory.newMessages}
            />
          </View>
        )}

        {this.state.notificationCategory.notifications && (
          <View
            style={{
              marginTop: 10,
              borderRadius: 4,
              paddingHorizontal: 8,
              paddingVertical: 10,
              borderWidth: 3,
              borderColor: "#E6E6E6",
              shadowColor: "#E6E6E6",
              shadowOffset: {
                width: 0,
                height: 2,
              },
              shadowOpacity: 0.19,
              shadowRadius: 10,
              marginHorizontal: 35,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingLeft: 10,
              }}
            >
              <Text style={{ fontSize: 22, color: "gray" }}>Buyer</Text>
              <Switch
                trackColor={{ false: "#DAD9D7", true: "#FFDA00" }}
                thumbColor={"white"}
                ios_backgroundColor="#E9E8E7"
                onValueChange={(value) =>
                  this.setEditMode(
                    this.state.notificationCategoryIndex,
                    "buyer",
                    "buyerNotification",
                    value
                  )
                }
                value={this.state.notificationCategory.buyer.buyerNotification}
              />
            </View>

            {this.state.notificationCategory.buyer.buyerNotification && (
              <Animated.View
                style={{
                  flexDirection: "row",
                  marginTop: 10,
                  marginBottom: this.state.buyerReminders,
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingLeft: 30,
                }}
              >
                  <TouchableOpacity onPress={() => this.setState({showDialog:true,savedSuccessfully:undefined,infoDialogIndex:1})}>
                  <Entypo name="info-with-circle" size={15} color="black" />
                  </TouchableOpacity>
                <Text style={{ fontSize: 17 }}>Reminders</Text>

                <DropDownPicker
                  onOpen={() => {
                    this._start(this.state.buyerReminders);
                  }}
                  onClose={() => {
                    this._close(this.state.buyerReminders);
                  }}
                  items={[
                      { label: "5 minutes", value: 64 },
                      { label: "15 minutes", value: 32 },
                      { label: "30 minutes", value: 16 },
                      { label: "1 hour", value: 8 },
                      { label: "5 hours", value: 4 },
                      { label: "12 hours", value: 2 },
                      { label: "1 day", value: 1 },
                  ]}
                  multiple={true}
                  multipleText="%d items have been selected."
                  placeholder="Select a Reminder"
                  min={0}
                  max={7}
                  defaultValue={this.convertToArray(this.state.notificationCategory.buyer.reminders)}
                  containerStyle={{ height: 40, width: windowWidth - 230 }}
                  onChangeItem={(item) =>
                    this.setEditMode(
                      this.state.notificationCategoryIndex,
                      "buyer",
                      "reminders",
                      this.convertToNumber(item)
                    )
                  }
                />
              </Animated.View>
            )}
          </View>
        )}

        {this.state.notificationCategory.notifications && (
          <View
            style={{
              marginTop: 10,
              borderRadius: 4,
              paddingHorizontal: 8,
              paddingVertical: 10,
              borderWidth: 3,
              borderColor: "#E6E6E6",
              shadowColor: "#E6E6E6",
              shadowOffset: {
                width: 0,
                height: 2,
              },
              shadowOpacity: 0.19,
              shadowRadius: 10,
              marginHorizontal: 35,
            }}
          >
            {this.state.notificationCategory.notifications && (
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingLeft: 10,
                }}
              >
                <Text style={{ fontSize: 22, color: "gray" }}>Seller</Text>
                <Switch
                  trackColor={{ false: "#DAD9D7", true: "#FFDA00" }}
                  thumbColor={"white"}
                  ios_backgroundColor="#E9E8E7"
                  onValueChange={(value) =>
                    this.setEditMode(
                      this.state.notificationCategoryIndex,
                      "seller",
                      "sellerNotification",
                      value
                    )
                  }
                  value={
                    this.state.notificationCategory.seller.sellerNotification
                  }
                />
              </View>
            )}

            {this.state.notificationCategory.seller.sellerNotification && (
              <View style={{ marginVertical: 10, paddingLeft: 30 }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <View style={{flexDirection:"row",alignItems:"center"}}>
                  <TouchableOpacity onPress={() => this.setState({showDialog:true,savedSuccessfully:undefined,infoDialogIndex:0})}>
                  <Entypo name="info-with-circle" size={15} color="black" />
                  </TouchableOpacity>
                  <Text style={{ fontSize: 17 }}>Scheduled</Text>
                  </View>
                  <Switch
                    trackColor={{ false: "#DAD9D7", true: "#FFDA00" }}
                    thumbColor={"white"}
                    ios_backgroundColor="#E9E8E7"
                    onValueChange={(value) =>
                      this.setEditMode(
                        this.state.notificationCategoryIndex,
                        "seller",
                        "scheduled",
                        value
                      )
                    }
                    value={this.state.notificationCategory.seller.scheduled}
                  />
                </View>
                <Animated.View
                  style={{
                    marginVertical: 10,
                    flexDirection: "row",
                    marginBottom: this.state.sellerReminders,
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <View style={{flexDirection:"row",alignItems:"center"}}>
                  <TouchableOpacity onPress={() => this.setState({showDialog:true,savedSuccessfully:undefined,infoDialogIndex:1})}>
                  <Entypo name="info-with-circle" size={15} color="black" />
                  </TouchableOpacity>
                  <Text style={{ fontSize: 17 }}>Reminders</Text>
                  </View>
                  <DropDownPicker
                    onOpen={() => {
                      this._start(this.state.sellerReminders);
                    }}
                    onClose={() => {
                      this._close(this.state.sellerReminders);
                    }}
                    items={[
                      { label: "5 minutes", value: 64 },
                      { label: "15 minutes", value: 32 },
                      { label: "30 minutes", value: 16 },
                      { label: "1 hour", value: 8 },
                      { label: "5 hours", value: 4 },
                      { label: "12 hours", value: 2 },
                      { label: "1 day", value: 1 },
                    ]}
                    multiple={true}
                    multipleText="%d items have been selected."
                    placeholder="Select a Reminder"
                    min={0}
                    max={7}
                    defaultValue={
                      this.convertToArray(this.state.notificationCategory.seller.reminders)
                    }
                    containerStyle={{ height: 40, width: windowWidth - 230}}
                    onChangeItem={(item) =>{
                      //1 console.log("item ",item)
                      this.setEditMode(2, "seller", "reminders", this.convertToNumber(item))
                    }}
                  />
                </Animated.View>
                <Animated.View
                  style={{
                    marginVertical: 10,
                    flexDirection: "row",
                    marginBottom: this.state.sellerDropdown,
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <View style={{flexDirection:"row",alignItems:"center"}}>
                  <TouchableOpacity onPress={() => this.setState({showDialog:true,savedSuccessfully:undefined,infoDialogIndex:2})}>
                  <Entypo name="info-with-circle" size={15} color="black" />
                  </TouchableOpacity>
                  <Text style={{ fontSize: 17 }}>Ranges</Text>
                  </View>
                    <DropDownPicker
                      onOpen={() => {
                        this._start(this.state.sellerDropdown);
                      }}
                      onClose={() => {
                        this._close(this.state.sellerDropdown);
                      }}
                      items={[
                        { label: "1 to 5", value: 8 },
                        { label: "5 to 10", value: 4 },
                        { label: "10 to 15", value: 2 },
                        { label: "15+", value: 1 },
                      ]}
                      multiple={true}
                      multipleText="%d items have been selected."
                      placeholder="Select at Least One"
                      min={1}
                      max={4}
                      defaultValue={
                        this.convertToArray(this.state.notificationCategory.seller.ranges)
                      }
                    containerStyle={{ height: 40, width: windowWidth - 230 }}
                      onChangeItem={(item) =>
                        this.setEditMode(2, "seller", "ranges", this.convertToNumber(item))
                      }
                    />
                  </Animated.View>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  signOutHelper = () => {
    const user = firebase.auth().currentUser;
    const start = user.email.indexOf("@");
    const end = user.email.indexOf(".edu");
    const domain = user.email.substring(start, end);
    const realEmail = user.email.substring(0, end);
    this.setLoading(true);
    firebase
      .database()
      .ref("users/" + domain + "/" + realEmail)
      .update({
        expoToken: null,
        active: false,
      });
    firebase.auth().signOut();
  };


  deleteAndSignOut = () => {
    return (
      <View
        style={{
          flexDirection: "row",
          marginHorizontal: 35,
          alignItems: "center",
          justifyContent: "space-between",
          height: 50,
        }}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => this.setModal("Delete Account", "", true)}
        >
          <View
            style={{
              flexDirection: "row",
              borderRadius: 10,
              height: 50,
              width: windowWidth / 2 - 37,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#FF7376",
            }}
          >
            <Text
              style={{ fontWeight: "bold", fontSize: 18, color: "#3A3535" }}
            >
              Delete Account
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => this.signOutHelper()}
        >
          <View
            style={{
              flexDirection: "row",
              borderRadius: 10,
              height: 50,
              width: windowWidth / 2 - 37,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#DADADA",
            }}
          >
            <Text style={{ fontWeight: "bold", fontSize: 20, color: "white" }}>
              Sign Out
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  setLoading = (value) => {
    this.setState({ loading: value });
  };

  deleteUri = async(path) => {
    try{
      await FileSystem.deleteAsync(path, {})
    }catch(e){
      //1 console.log("ERROR deleting profile image in profile screen")
    }
  }

  downloadUrl = async (url,name) => {
    const callback = downloadProgress => {
    const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
    // this.setState({
    //   downloadProgress: progress,
    // });
  }

  //1 console.log("url ", url)
  await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory +"profileImage/",{intermediates:true})
  const downloadResumable = FileSystem.createDownloadResumable(
      url,
      FileSystem.documentDirectory  + "profileImage/" + name + ".png",
      {},
      callback
    )

    try {
      const { uri } = await downloadResumable.downloadAsync();
      //1 console.log('Finished downloading to ', uri);
      return uri;
    } catch (e) {
      console.error(e);
    }


    // try {
    //   await downloadResumable.pauseAsync();
    //   //1 console.log('Paused download operation, saving for future retrieval');
    //   AsyncStorage.setItem('pausedDownload', JSON.stringify(downloadResumable.savable()));
    // } catch (e) {
    //   console.error(e);
    // }

    // try {
    //   const { uri } = await downloadResumable.resumeAsync();
    //   //1 console.log('Finished downloading to ', uri);
    //   this.setState({imageUrl :uri})
    // } catch (e) {
    //   console.error(e);
    // }

    //To resume a download across app restarts, assuming the the DownloadResumable.savable() object was stored:
    // const downloadSnapshotJson = await AsyncStorage.getItem('pausedDownload');
    // const downloadSnapshot = JSON.parse(downloadSnapshotJson);
    // const downloadResumable = new FileSystem.DownloadResumable(
    //   downloadSnapshot.url,
    //   downloadSnapshot.fileUri,
    //   downloadSnapshot.options,
    //   callback,
    //   downloadSnapshot.resumeData
    // );

    // try {
    //   const { uri } = await downloadResumable.resumeAsync();
    //   //1 console.log('Finished downloading to ', uri);
    // } catch (e) {
    //   console.error(e);
    // }
  }

  render() {
    if (this.state.loading) {
      return <Loading navigation={this.props.navigation} />;
    }
    return (
      <View style={styles.container}>
        <ScrollView>

          {this.uploadAndStars()}
          {this.general()}
          {this.account()}
          {this.notifications()}
          {this.deleteAndSignOut()}
        </ScrollView>
        {/* {this.updatingFields()} */}
                {this.state.showDialog &&
        this.saveResult()}
        <ProfileScreenModal
          submitModal={this.submitModal}
          modal={this.state.modal}
          setModal={this.setModal}
          setLoading={this.setLoading}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
  },
  uploadAndStars: {
    justifyContent: "flex-end",
    alignItems: "center",
    width: windowWidth,
    height: 250,
    paddingBottom: 20,
    backgroundColor: "black",
  },
  profileImage: {
    justifyContent: "center",
    alignItems: "center",
    width: 130,
    height: 130,
    borderRadius: 130,
    backgroundColor: "white",
  },
});
