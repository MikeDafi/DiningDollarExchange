import React from "react"
import {Animated,View,Text,StyleSheet,TouchableOpacity,ScrollView,Dimensions,TouchableWithoutFeedback,Switch} from "react-native"
const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;
import {FontAwesome,AntDesign} from "@expo/vector-icons"
import RatingUser from './RatingUser'
import * as firebase from 'firebase'
import Modal from 'react-native-modal';
import Image from 'react-native-image-progress';
import DropDownPicker from 'react-native-dropdown-picker';
import ProfileScreenModal from "./ProfileScreenModal"
import Loading from "./LoadingScreen"
import UserPermissions from "../../utilities/UserPermissions"
import * as ImagePicker from "expo-image-picker"
const clone = require('rfdc')()
export default class ProfileScreen extends React.Component {
  state = {
    imageUrl: "",
    generalCategory: [],
    accountCategory: [],
    buyerDropdown: new Animated.Value(0),
    sellerDropdown: new Animated.Value(0),
    buyerReminders: new Animated.Value(0),
    sellerReminders: new Animated.Value(0),
    beforeChanges: [],
    loading: true,
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
    console.log("oooooooooo");
    Animated.timing(heightVariable, {
      toValue: 150,
      duration: 50,
    }).start();
  };

  _close = (heightVariable) => {
    console.log("iiiiii");
    Animated.timing(heightVariable, {
      toValue: 0,
      duration: 50,
    }).start();
  };

    handlePickAvatar = async () =>{
      UserPermissions.getCameraPermission()
      let result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          // allowEditing:true,
          // aspect:[4,3]
      });

      if(!result.cancelled){
          this.setState({imageUrl:result.uri})
      }
    }

  async componentDidMount() {
    var email = firebase.auth().currentUser.email;
    const start = email.indexOf("@");
    const end = email.indexOf(".com");
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
        title: "Buyer",
        isBuyer: {},
      },
      {
        title: "Seller",
        isSeller: {},
      },
    ];

    const notificationCategory = {
      notifications: true,
      newMessages: true,
      buyer: {
        buyerNotification: true,
        reminders: [],
      },
      seller: {
        sellerNotification: true,
        scheduled: true,
        reminders: [],
      },
    };

    this.setState({ accountCategory, notificationCategory });
    var imageUrl = "";
    const image = firebase
      .storage()
      .ref()
      .child("profilePics/" + realDomain + "/" + email + "/profilePic.jpg");
    const promises = [];
    promises.push(
      image
        .getDownloadURL()
        .then((foundURL) => {
          this.setState({ imageUrl: foundURL });
        })
        .catch((error) => {
          console.log(error);
        })
    );

    promises.push(
      firebase
        .database()
        .ref("users/" + realDomain + "/" + email)
        .once("value", (snapshot) => {
          const accountCategory = this.state.accountCategory;
          accountCategory[1].isBuyer = snapshot.val().isBuyer;
          console.log(snapshot.val());
          accountCategory[2].isSeller = {
            searching: snapshot.val().isSeller.searching,
            ranges: this.convertToArray(snapshot.val().isSeller.ranges),
          };

          console.log(accountCategory);
          const notifications = snapshot.val().notifications;
          notificationCategory.buyer = notifications.buyer;
          notificationCategory.seller = notifications.seller;
          notificationCategory.newMessages = notifications.newMessages;
          notificationCategory.notifications = notifications.notifications;
          this.setState({
            accountCategory,
            notificationCategory,
            rating: snapshot.val().starRating,
          });

          console.log("notification ", accountCategory);
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
  }

  updatingFields = () => {
    console.log(windowWidth);
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
          onPress={() =>
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
          }
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
    const end = email.indexOf(".com");
    var domain = email.substring(start + 1, end);
    const realDomain = email.substring(start, end);
    email = email.substring(0, end);
    domain = domain.toUpperCase();
    firebase
      .database()
      .ref("users/" + realDomain + "/" + email)
      .update({
        isBuyer: this.state.accountCategory[1].isBuyer,
        isSeller: this.state.accountCategory[2].isSeller,
        notifications: this.state.notificationCategory,
        name: this.state.generalCategory[0].field,
      });

    user.updateProfile({
      displayName: this.state.generalCategory[0].field,
    });

    this.setState({
      beforeChanges: clone([
        this.state.generalCategory,
        this.state.accountCategory,
        this.state.notificationCategory,
      ]),
    });
  };

  uploadAndStars = () => {
    return (
      <View style={styles.uploadAndStars}>
        <View style={styles.profileImage}>
        <TouchableOpacity activeOpacity={0.7}
        onPress={() => this.handlePickAvatar()}>
          {this.state.imageUrl ? (
            <Image
              source={{ url: this.state.imageUrl }}
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
        </View>
        <RatingUser
          starSize={45}
          starCount={this.state.rating}
          disabled={true}
          selected={(rating) => this.onStarRatingPress(rating)}
        />
        <Text style={{ fontSize: 10, color: "white" }}>
          {this.state.rating}
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
    console.log("values ", index + " " + title + " " + field);
    console.log("category ", category);
    if (category == 0) {
      const generalCategory = this.state.generalCategory;
      generalCategory[index][[title]] = field;
      this.setState({ generalCategory });
      //console.log(this.state.generalCategory)
    } else if (category == 1) {
      var accountCategory = this.state.accountCategory;
      if (index == 0) {
        accountCategory[index][[title]] = field;
      } else {
        const innerCategory = index == 1 ? "isBuyer" : "isSeller";
        accountCategory[index][innerCategory][[title]] = field;
      }
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
    var binary = 8;
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
                    {this.state.accountCategory[1].title}
                  </Text>
                  <Switch
                    trackColor={{ false: "#DAD9D7", true: "#FFDA00" }}
                    thumbColor={"white"}
                    ios_backgroundColor="#E9E8E7"
                    onValueChange={(value) => {
                      this.setEditMode(1, 1, "searching", value);
                    }}
                    value={this.state.accountCategory[1].isBuyer.searching}
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
                    {this.state.accountCategory[2].title}
                  </Text>
                  <Switch
                    trackColor={{ false: "#DAD9D7", true: "#FFDA00" }}
                    thumbColor={"white"}
                    ios_backgroundColor="#E9E8E7"
                    onValueChange={(value) => {
                      this.setEditMode(1, 2, "searching", value);
                      this.setEditMode(1, 2, "ranges", []);
                    }}
                    value={this.state.accountCategory[2].isSeller.searching}
                  />
                </View>
                {this.state.accountCategory[2].isSeller.searching && (
                  <Animated.View
                    style={{
                      flexDirection: "row",
                      marginBottom: this.state.sellerDropdown,
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingLeft: 30,
                    }}
                  >
                    <Text style={{ fontSize: 20 }}>Range</Text>
                    <DropDownPicker
                      onOpen={() => {
                        this._start(this.state.sellerDropdown);
                      }}
                      onClose={() => {
                        this._close(this.state.sellerDropdown);
                      }}
                      items={[
                        { label: "0 to 5", value: 8 },
                        { label: "5 to 10", value: 4 },
                        { label: "10 to 15", value: 2 },
                        { label: "15+", value: 1 },
                      ]}
                      multiple={true}
                      multipleText="%d items have been selected."
                      placeholder="Select at Least One"
                      min={0}
                      max={4}
                      defaultValue={
                        this.state.accountCategory[2].isSeller.ranges
                      }
                      containerStyle={{ height: 40, width: 200 }}
                      onChangeItem={(item) =>
                        this.setEditMode(1, 2, "ranges", item)
                      }
                    />
                  </Animated.View>
                )}
              </View>
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
                  paddingLeft: 40,
                }}
              >
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
                  max={4}
                  defaultValue={this.state.notificationCategory.buyerReminders}
                  containerStyle={{ height: 40, width: 150 }}
                  onChangeItem={(item) =>
                    this.setEditMode(
                      this.state.notificationCategoryIndex,
                      "buyer",
                      "reminders",
                      item
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
              <View style={{ marginVertical: 10, paddingLeft: 40 }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontSize: 17 }}>Scheduled</Text>
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
                    marginBottom: this.state.buyerReminders,
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontSize: 17 }}>Reminders</Text>
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
                    max={4}
                    defaultValue={
                      this.state.notificationCategory.sellerReminders
                    }
                    containerStyle={{ height: 40, width: 150 }}
                    onChangeItem={(item) =>
                      this.setEditMode(2, "seller", "reminders", item)
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

  deleteAndSignOut = () => {
    return(
    <View style={{flexDirection:"row",marginHorizontal:35,alignItems:"center",justifyContent:"space-between",height:50}}>
              <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => this.setModal("Delete Account", "", true)}
        >
      <View style={{ flexDirection:"row",borderRadius: 10, height: 50,width:(windowWidth/2) - 37,alignItems:"center",justifyContent:"center",backgroundColor: "#FF7376" }}>
        <Text style={{fontWeight:"bold",fontSize:18,color:"#3A3535"}}>Delete Account</Text>

      </View>
              </TouchableOpacity>
              <TouchableOpacity
            activeOpacity={0.7}
            onPress={() =>  {firebase.auth().signOut(); this.setLoading(true)}}
        >
      <View style={{ flexDirection:"row",borderRadius: 10, height: 50,width:(windowWidth/2) - 37,alignItems:"center",justifyContent:"center",backgroundColor: "#DADADA" }}>
        <Text style={{fontWeight:"bold",fontSize:20,color:"white"}}>Sign Out</Text>

      </View>
              </TouchableOpacity>
    </View>
    )
  };

  setLoading = (value) => {
    this.setState({loading : value})
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
        {this.updatingFields()}
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

const styles= StyleSheet.create({
    container:{
        flex:1,
        alignItems:"center",
        justifyContent:"center",
        backgroundColor:"white",
    },
    uploadAndStars:{
        justifyContent:"flex-end", 
        alignItems:"center",
        width:windowWidth,
        height:windowHeight/3,
        paddingBottom:20,
        backgroundColor:"black"
    },
    profileImage:{
        justifyContent:"center", 
        alignItems:"center",
        width:130,
        height:130,
        borderRadius:130,
        backgroundColor:"white"
    }
})