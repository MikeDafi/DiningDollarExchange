import React from "react";
import Modal from "react-native-modal";
import { Col, Row, Grid } from "react-native-easy-grid";
import * as firebase from "firebase";
import Loading from "./LoadingScreen";
import LottieView from "lottie-react-native";
import {
  FontAwesome,
  MaterialIcons,
  Entypo,
  AntDesign,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import RatingUser from "./RatingUser";
import Dialog, {
  DialogFooter,
  DialogButton,
  DialogContent,
} from "react-native-popup-dialog";
import * as ImagePicker from "expo-image-picker";
import Swiper from "react-native-swiper/src";
import DropDownPicker from "react-native-dropdown-picker";
import arrowRight from "../assets/arrowRight.png";
import DatePicker from "react-native-datepicker";
import ImageViewer from "react-native-image-zoom-viewer";
import * as FileSystem from "expo-file-system";
import UploadImages from "./UploadImages";
import {
  Animated,
  Image,
  AsyncStorage,
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
  ActivityIndicator,
  Keyboard,
} from "react-native";
import UserPermissions from "../../utilities/UserPermissions";

const windowWidth = Dimensions.get("window").width;
const windowHeight = Dimensions.get("window").height;
const clone = require("rfdc")();
export default class SpecificSavedOrder extends React.Component {
  state = {
    searching: true,
    uploadImagesVisible: false,
    deleteHighlight: new Animated.Value(0),
    isDeleting: false,
    orderHighlight: new Animated.Value(0),
    saveHighlight: new Animated.Value(0),
    rangeSelected: this.props.rangeSelected || "",
    timePreference: "",
    amOrPm: "",
    dateTimeStamp: this.props.timestamp || "",
    newThumbnail: false,
    orderTitle: this.props.orderTitle || "",
    editing: this.props.newOrder,
    imageNames: [],
    thumbnail: this.props.thumbnail || "",
    imageUrls: Object.values(this.props.imageUrls || []).map((x) => {
      return { url: x };
    }),
    beforeEditing: {},
    possibleProfitVisible: false,
    carouselHeight: 0,
    cancelHighlight: false,
    toDeleteImages: [],
    toAddImages: [],
    modalOn: true,
    imageIndex: 0,
    showImageViewer: false,
    hasSaved: true,
    newOrder: this.props.newOrder,
  };

  handlePickAvatar = async () => {
    UserPermissions.getCameraPermission();
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Image,
        allowsEditing: true,
        aspect: [4, 3],
      });
      if (!result.cancelled) {
        const toDeleteImages = this.state.toDeleteImages;
        if (
          this.state.thumbnail &&
          this.state.thumbnail.length > 1 &&
          hasSaved &&
          !this.state.newOrder
        ) {
          toDeleteImages.push(this.state.thumbnail);
        }
        this.setState({
          thumbnail: result.uri,
          newThumbnail: true,
          hasSaved: false,
          toDeleteImages,
        });
      }

      //1 console.log(result);
    } catch (E) {
      //1 console.log(E);
    }
  };

  photoCallback = async (params) => {
    //1 console.log("photoCallback");
    this.setState({ uploadImagesVisible: false });
    if (params == null) {
      return;
    }
    //1 console.log("here ");
    const imageUrls = this.state.imageUrls;
    const toAddImages = this.state.toAddImages;
    await params.then(async (images) => {
      for (var i = 0; i < images.length; i++) {
        imageUrls.push({ url: images[i].uri });
        toAddImages.push(images[i].uri);
      }
    });
    console.log("imageUrls ",imageUrls.length)
    this.setState({
      imageUrls,
      toAddImages,
    });
  };

  timestamp = () => {
    return firebase.database.ServerValue.TIMESTAMP;
  };
  _start = (variableToChange, value, duration) => {
    //1 console.log("oooooooooo");
    Animated.timing(variableToChange, {
      toValue: value,
      duration: duration,
    }).start();
  };

  _close = (variableToChange, value, duration) => {
    Animated.timing(variableToChange, {
      toValue: value,
      duration: duration,
    }).start();
  };

  modalImages = () => {
    return (
      <Modal
        testID={"modal"}
        isVisible={this.state.showImageViewer}
        onBackdropPress={() => {
          this.setState({ showImageViewer: false });
            if(this.props.toggleShowSwiperButtons){
              this.props.toggleShowSwiperButtons(true);
            }
        }}
        animationIn="slideInUp"
        animationInTiming={500}
        style={{ width: windowWidth, height: windowHeight, margin: 0 }}
      >
        <ImageViewer
          index={this.state.imageIndex}
          imageUrls={this.state.imageUrls}
          enableSwipeDown
                    saveToLocalByLongPress={false}
          onSwipeDown={() => {
            this.setState({ showImageViewer: false });
            if(this.props.toggleShowSwiperButtons){
              this.props.toggleShowSwiperButtons(true);
            }
          }}
        />
        <View style={{ position: "absolute", left: windowWidth - 50, top: 30 }}>
          <TouchableOpacity
            onPress={() => {
              this.setState({ showImageViewer: false });
              if(this.props.toggleShowSwiperButtons){
                this.props.toggleShowSwiperButtons(true);
              }
            }}
          >
            <AntDesign name="close" size={35} color="white" />
          </TouchableOpacity>
        </View>
      </Modal>
    );
  };

  componentDidMount() {
    this.formatTime(this.props.timestamp);

  }

  formatTime = (timestamp) => {
    if (timestamp && timestamp > 1) {
      const orderDate = new Date(parseInt(timestamp));

      const AM = orderDate.getHours() < 12 ? true : false;
        const hour = orderDate.getHours() <= 12 ? (orderDate.getHours() == 0 ? 12 : orderDate.getHours())  : orderDate.getHours() - 12
      const minute = "0" + orderDate.getMinutes();
      const time = hour + ":" + minute.substr(-2);
      // const date = orderDate.getDay() + '/' + (orderDate.getMonth() + 1)
      this.setState({
        timePreference: time,
        timestamp,
        amOrPm: AM ? "am" : "pm",
      });
    } else {
      this.setState({ timePreference: "N/A", amOrPm: null });
    }
  };

  acceptedOrderError = () => {
    return (
      <View
        style={{
          position: "absolute",
          width: windowWidth,
          height: windowHeight,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "rgba(0,0,0,0.8)",
        }}
      >
        <View
          style={{
            width: 250,
            height: 200,
            flexDirection: "column",
            justifyContent: "space-between",
            backgroundColor: "white",
            borderRadius: 20,
          }}
        >
          <View
            style={{
              height: 30,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 20 }}>Order Error</Text>
          </View>
          <View
            style={{
              alignItems: "center",
              marginHorizontal: 10,
              justifyContent: "center",
              height: 100,
            }}
          >
            <Text style={{ fontSize: 15, justifyContent: "center" }}>
              Someone Has Already Accepted the Order.
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              //   this.setState({acceptedOrderVisible : false})
              //   this._close(this.state.animatedWidth);
              //   this._close(this.state.animatedHeight)
              //   this.props.navigation.goBack();
            }}
          >
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                borderTopWidth: 0.2,
                height: 50,
                borderColor: "gray",
              }}
            >
              <Text>Dismiss</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  generateRandomString = () => {
    return Math.random().toString().substr(2, 20);
  };

  possibleProfit = () => {
    return (
      <View
        style={{
          position: "absolute",
          width: windowWidth,
          height: windowHeight,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "rgba(0,0,0,0.8)",
        }}
      >
        <View
          style={{
            width: 250,
            height: 200,
            flexDirection: "column",
            justifyContent: "space-between",
            backgroundColor: "white",
            borderRadius: 20,
          }}
        >
          <View
            style={{
              height: 30,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 20 }}>Possible Profit</Text>
          </View>
          <View
            style={{
              alignItems: "center",
              marginHorizontal: 10,
              justifyContent: "center",
              height: 100,
            }}
          >
            <Text style={{ fontSize: 15 }}>
              <Text>You Pay </Text>
              <Text style={{ fontWeight: "700" }}>80%</Text>
              <Text> in </Text>
              <Text style={{ color: "green" }}>Cash</Text>
              {(this.state.rangeSelected || "").includes("to") ? (
                <Text>
                  <Text>. For a "{this.state.rangeSelected}" range, the </Text>
                  <Text style={{ fontWeight: "bold" }}> minimum </Text>
                  <Text> price you will pay is </Text>
                </Text>
              ) : (this.state.rangeSelected || "").includes("+") ? (
                <Text>
                  <Text>. For a "{this.state.rangeSelected}" range, the </Text>
                  <Text style={{ fontWeight: "bold" }}> minimum </Text>
                  <Text> price you will pay is </Text>
                </Text>
              ) : (
                <Text>
                  <Text>
                    . For a price of ${this.state.rangeSelected}, the{" "}
                  </Text>
                  <Text> price you pay is </Text>
                </Text>
              )}
            </Text>
            {(this.state.rangeSelected || "").includes("to") ? (
              <Text
                style={{ fontWeight: "700", color: "#4CBB17", fontSize: 18 }}
              >
                {parseInt(
                  this.state.rangeSelected.substring(0, 2).split(" ").join("")
                ) * 0.8}{" "}
                Dollars
              </Text>
            ) : (this.state.rangeSelected || "").includes("+") ? (
              <Text
                style={{ fontWeight: "700", color: "#4CBB17", fontSize: 18 }}
              >
                12 Dollars
              </Text>
            ) : (
              <Text
                style={{ fontWeight: "700", color: "#4CBB17", fontSize: 18 }}
              >
                {isNaN(this.state.rangeSelected)
                  ? "N/A"
                  : Math.ceil(parseInt(this.state.rangeSelected) * 0.8)}{" "}
                Dollars
              </Text>
            )}
          </View>
          <TouchableOpacity
            onPress={() => this.setState({ possibleProfitVisible: false })}
          >
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                borderTopWidth: 0.2,
                height: 50,
                borderColor: "gray",
              }}
            >
              <Text>Dismiss</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  deleteConfirmation = () => {
    return (
      <View
        style={{
          position: "absolute",
          width: windowWidth,
          height: windowHeight,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "rgba(0,0,0,0.6)",
        }}
        // onPress={() => this.setState({isDeleting:false})}
      >
        <View
          style={{
            width: 250,
            height: 200,
            flexDirection: "column",
            justifyContent: "space-between",
            backgroundColor: "white",
            borderRadius: 20,
          }}
        >
          <View
            style={{
              height: 30,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 20 }}>Delete Confirmation</Text>
          </View>
          <View
            style={{
              alignItems: "center",
              marginHorizontal: 15,
              justifyContent: "center",
              height: 100,
            }}
          >
            <Text style={{ fontSize: 15 }}>
              Are you sure you want to Delete this order?
            </Text>
          </View>
          <View style={{ flexDirection: "row" }}>
            <TouchableOpacity
              onPress={() =>
                this.setState({
                  isDeleting: true,
                })
              }
            >
              <View
                style={{
                  alignItems: "center",
                  justifyContent: "center",
                  borderTopWidth: 0.3,
                  borderRightWidth: 0.2,
                  height: 50,
                  width: 125,
                  borderColor: "gray",
                }}
              >
                <Text>Cancel</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                this.setState({ isDeleting: false });
                this.props.deleteSavedOrder(this.props.index);
                this.props.exitSelectedOrderModal();
              }}
            >
              <View
                style={{
                  alignItems: "center",
                  justifyContent: "center",
                  borderTopWidth: 0.3,
                  height: 50,
                  width: 125,
                  borderColor: "gray",
                }}
              >
                <Text style={{ color: "red" }}>Delete</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  datePicker = () => {
    return (
      <DatePicker
        onOpenModal={this.onOpenModal}
        style={{ width: 200 }}
        is24Hour={false}
        date={this.state.date}
        mode="datetime"
        placeholder="Select Date"
        mode={"time"}
        confirmBtnText="Confirm"
        cancelBtnText="Cancel"
        style={{
          width: 300,
          height: 300,
          backgroundColor: "rgba(0,0,0,0)",
        }}
        customStyles={{
          btnTextConfirm: {
            fontWeight: "bold",
            color: "#FFE300",
          },
          dateIcon: {
            position: "absolute",
            left: 0,
            top: 4,
            marginLeft: 0,
          },
          dateInput: {
            marginLeft: 36,
          },
          // ... You can check the source to find the other keys.
        }}
        showIcon={false}
        onDateChange={(date) => {
          //1 console.log("date ", date);
          var dateTimeStamp = new Date(date);
          dateTimeStamp = dateTimeStamp.getTime();
          this.formatTime(dateTimeStamp);
          this.setState({ dateTimeStamp });
        }}
        getDateStr={(props) => {
          //1 console.log("props ", props);

          return props;
        }}
        hideText={true}
        TouchableComponent={TouchableOpacity}
      />
    );
  };

  render() {
    const firstRowHeight = (windowHeight - 100) / 8;
    const firstRowPadding = 8;
    const secondRowHeight = (windowHeight - 100) / 10;
    const modalWidth = windowWidth - 50;
    const modalHeight = windowHeight * 0.8;
    const left = (windowWidth - modalWidth) / 2;
    const top = (windowHeight - modalHeight) / 2;
    const itemsCount = 50;
    return (
      <>
        {!this.state.showImageViewer ? (
          <View
            style={{
              position: "absolute",
              top,
              left,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "white",
              height: modalHeight,
              width: modalWidth,
              borderRadius: 20,
            }}
          >
            {this.state.modalOn && (
              <Grid>
                <Row
                  style={{
                    width: modalWidth,
                    height: firstRowHeight,
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                    justifyContent: "flex-start",
                    alignItems: "flex-start",
                    paddingTop: firstRowPadding,
                    paddingHorizontal: firstRowPadding,
                  }}
                >
                  <Col style={{ width: firstRowHeight - firstRowPadding }}>
                    <TouchableOpacity
                      disabled={!this.state.editing}
                      onPress={() => this.handlePickAvatar()}
                    >
                      <View
                        style={[
                          {
                            borderRadius: firstRowHeight - firstRowPadding,
                            height: firstRowHeight - firstRowPadding,
                            borderColor: "black",
                            borderWidth: 1,
                            alignItems: "center",
                            justifyContent: "center",
                          },
                          this.state.editing ? styles.glowBorder : null,
                        ]}
                      >
                        {this.state.thumbnail &&
                        this.state.thumbnail.length > 1 ? (
                          <Image
                            source={{ url: this.state.thumbnail }}
                            style={{
                              borderRadius: firstRowHeight - firstRowPadding,
                              width: firstRowHeight - firstRowPadding,
                              height: firstRowHeight - firstRowPadding,
                              borderColor: "black",
                              borderWidth: 1,
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          />
                        ) : (
                          <>
                            <MaterialCommunityIcons
                              name="food"
                              size={40}
                              color="black"
                            />
                            <Text 
                              adjustsFontSizeToFit={true}
                              numberOfLines={1}
                            >Thumbnail</Text>
                          </>
                        )}
                      </View>
                    </TouchableOpacity>
                    {this.state.editing && (
                      <View
                        style={{
                          position: "absolute",
                          backgroundColor: "white",
                          borderRadius: 90,
                          right: 0,
                          bottom: 0,
                        }}
                      >
                        <TouchableOpacity
                          onPress={() => {
                            const toDeleteImages = this.state.toDeleteImages;
                            if (
                              this.state.thumbnail &&
                              this.state.thumbnail.length > 1 &&
                              !this.state.newThumbnail &&
                              !this.props.newOrder
                            ) {
                              toDeleteImages.push(this.state.thumbnail);
                            }
                            this.setState({
                              newThumbnail: true,
                              thumbnail: "",
                              toDeleteImages,
                            });
                          }}
                        >
                          <AntDesign
                            name="delete"
                            backgroundColor="blue"
                            size={20}
                            color="red"
                          />
                        </TouchableOpacity>
                      </View>
                    )}
                  </Col>
                  <Col
                    style={{
                      height: firstRowHeight - firstRowPadding,
                      paddingTop: 5,
                      paddingLeft: 5,
                      justifyContent: "center",
                    }}
                  >
                    {this.state.editing ? (
                      <TextInput
                        style={{
                          backgroundColor: "white",
                          borderRadius: 4,
                          padding: 8,
                          borderWidth: 3,
                          height: firstRowHeight - firstRowPadding - 20,
                          borderColor: "#FFDB0C",
                          shadowColor: "#FFDB0C",
                          shadowOffset: {
                            width: 0,
                            height: 6,
                          },
                          fontSize: 40,
                          shadowOpacity: 0.39,
                          shadowRadius: 10,
                        }}
                        onChangeText={(field) => {
                          this.setState({ orderTitle: field });
                        }}
                        value={this.state.orderTitle}
                      />
                    ) : (
                      <Text numberOfLines={1} style={{ fontSize: 40 }}>
                        {this.state.orderTitle}
                      </Text>
                    )}
                    {/* <Row style={{alignItems:"flex-start"}}>
                <Text style={{fontSize:20,color:"gray"}}>{this.state.buyerStarRating}</Text>
                <MaterialIcons name="star" size={24} color="#FFE300" />
              </Row> */}
                  </Col>
                </Row>
                <Row
                  style={{
                    borderColor: "gray",
                    height: secondRowHeight,
                    borderBottomWidth: 0.3,
                    marginHorizontal: 10,
                  }}
                >
                  <Col
                    style={{
                      paddingLeft:this.state.editing ? 18 : 0,
                      alignItems:"center",
                      justifyContent: "center",
                    }}
                  >
                    <View
                      style={{ alignItems: "center", justifyContent: "center" }}
                    >
                      {this.state.editing ? (
                        <TextInput
                          style={{
                            backgroundColor: "white",
                            borderRadius: 4,
                            paddingHorizontal: 4,
                            paddingVertical: 4,
                            borderWidth: 3,
                            height: secondRowHeight - 30,
                            borderColor: "#FFDB0C",
                            shadowColor: "#FFDB0C",
                            shadowOffset: {
                              width: 0,
                              height: 6,
                            },
                            fontSize:
                              this.state.rangeSelected == "5 to 10"
                                ? 22
                                : this.state.rangeSelected == "10 to 15"
                                ? 20
                                : 27,
                            fontWeight: "600",
                            color: "#4cBB17",
                            shadowOpacity: 0.39,
                            shadowRadius: 10,
                          }}
                          onFocus={() => {
                            this.setState({ rangeSelected: "" });
                          }}
                          onEndEditing={() => {
                            if (isNaN(this.state.rangeSelected)) {
                              this.setState({ rangeSelected: "N/A" });
                            }
                          }}
                          onChangeText={(field) => {
                            if (parseInt(field) < 1) {
                              this.setState({ rangeSelected: "1" });
                            } else if (parseInt(field) > 100) {
                              this.setState({ rangeSelected: "100" });
                            } else {
                              this.setState({ rangeSelected: field });
                            }
                          }}
                          value={this.state.rangeSelected}
                        />
                      ) : (
                        <Text
                          style={{
                            fontSize:
                              this.state.rangeSelected == "5 to 10"
                                ? 22
                                : this.state.rangeSelected == "10 to 15"
                                ? 20
                                : 27,
                            fontWeight: "600",
                            color: "#4cBB17",
                          }}
                        >
                          ${this.state.rangeSelected}
                        </Text>
                      )}
                      <Text style={{ fontSize: 9, color: "gray" }}>
                        Actual Price
                      </Text>
                    </View>
                  </Col>
                  <Col
                    style={[
                      {
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                      },
                      this.state.editing ? styles.glowBorder : null,
                    ]}
                  >
                    <View
                      style={{ flexDirection: "row", justifyContent: "center" }}
                    >
                      <Text style={{ fontSize: 27, fontWeight: "300" }}>
                        {this.state.timePreference}
                      </Text>
                      <View>
                        <Text>{this.state.amOrPm}</Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 9, color: "gray" }}>
                      Time Preference
                    </Text>
                    <View style={{ position: "absolute" }}>
                      {this.state.editing && this.datePicker()}
                    </View>
                    {this.state.editing && (
                      <View
                        style={{
                          position: "absolute",
                          backgroundColor: "white",
                          borderRadius: 90,
                          right: 0,
                          bottom: 0,
                        }}
                      >
                        <TouchableOpacity
                          onPress={() => {
                            this.setState({
                              timePreference: "N/A",
                              amOrPm: null,
                              dateTimeStamp: "",
                            });
                          }}
                        >
                          <AntDesign
                            name="delete"
                            backgroundColor="blue"
                            size={20}
                            color="red"
                          />
                        </TouchableOpacity>
                      </View>
                    )}
                  </Col>
                  <Col
                    style={{
                      justifyContent: "flex-start",
                      alignItems: "center",
                    }}
                  >
                    <LottieView
                      style={{
                        width: 65,
                        height: 65,
                        position: "absolute",
                        marginTop: -3,
                      }}
                      source={require("../assets/yellowCircle.json")}
                      autoPlay
                    />

                    <Text style={{ marginTop: 7 }}>
                      <Text style={{ marginLeft: 3, fontSize: 10 }}>$</Text>
                      <Text style={{ fontSize: 26, fontWeight: "700" }}>
                        {(this.state.rangeSelected || "").includes("+")
                          ? 12
                          : (this.state.rangeSelected || "").includes("to")
                          ? parseInt(
                              this.state.rangeSelected
                                .substring(0, 2)
                                .split(" ")
                                .join("")
                            ) * 0.8
                          : !isNaN(this.state.rangeSelected)
                          ? Math.ceil(parseInt(this.state.rangeSelected) * 0.8)
                          : "N/A"}
                      </Text>
                    </Text>
                    <TouchableOpacity
                      style={{ flexDirection: "row", marginTop: 6 }}
                      onPress={() =>
                        this.setState({ possibleProfitVisible: true })
                      }
                    >
                      <Text style={{ fontSize: 9, color: "gray" }}>
                        Price You Pay!
                      </Text>
                      <View style={{ marginLeft: 3, marginTop: -2 }}>
                        <Entypo
                          name="info-with-circle"
                          size={12}
                          color="black"
                        />
                      </View>
                    </TouchableOpacity>
                  </Col>
                </Row>
                <Row>
                  <View
                    style={{ alignItems: "center",justifyContent:"center",width:modalWidth }}
                    onLayout={(event) => {
                      var { x, y, width, height } = event.nativeEvent.layout;
                      this.setState({ carouselHeight: height });
                    }}
                  >
                                        {this.state.imageUrls.length > 0 ?
                    <ScrollView
                      ref={(scrollView) => {
                        this.scrollView = scrollView;
                      }}
                      style={{ width: modalWidth }}
                      contentContainerStyle={{ alignItems: "center" }}
                      //pagingEnabled={true}
                      horizontal={true}
                      decelerationRate={0}
                      snapToOffsets={(this.state.imageUrls || []).map(
                        (x, i) => i * (modalWidth - 60)
                      )}
                      snapToAlignment={"start"}
                      contentInset={{
                        top: 0,
                        left: 30,
                        bottom: 0,
                        right: 30,
                      }}
                    > 
                      {(this.state.imageUrls || []).map((x, i) => (
                        // <View
                        //   onLayout={(event) => {
                        //     var {x, y, width, height} = event.nativeEvent.layout;
                        //     this.setState({carouselHeight : height})
                        //   }}
                        //   style={{margin:25,width:modalWidth ,alignItems:"center",justifyContent:"center",backgroundColor:"gray",backgroundOpacity:0.5,borderRadius:20}}>
                        //   {/* // source={{ url: item }}/> */}
                        //   <Image style={{resizeMode:"contain",width:modalWidth-30,height:this.state.carouselHeight-30}} source={require('./StartPage.png')}/>
                        // </View>
                        <View
                          key={i}
                          style={[
                            styles.view,
                            {
                              overflow: "hidden",
                              height: this.state.carouselHeight - 60,
                              alignItems: "center",
                              justifyContent: "center",
                              width: modalWidth - 100,
                              backgroundColor: "rgba(252,220,0,1)",
                            },
                          ]}
                        >
                          <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => {
                              console.log("imageUrl " , this.state.imageUrls)
                              if(this.props.toggleShowSwiperButtons){
                                this.props.toggleShowSwiperButtons(false);
                              }
                              this.setState({
                                showImageViewer: true,
                                imageIndex: i,
                              });
                            }}
                          >
                            <Image
                              key={i}
                              style={{
                                resizeMode: "contain",
                                width: modalWidth - 100,
                                height: this.state.carouselHeight - 100,
                              }}
                              source={{ uri: x.url }}
                            />
                          </TouchableOpacity>
                          <View
                            style={{ position: "absolute", right: 5, top: 5 }}
                          >
                            {this.state.editing && (
                              <TouchableOpacity
                                onPress={() => {
                                  const imageUrls = this.state.imageUrls;
                                  const toDeleteImages = this.state
                                    .toDeleteImages;
                                  const toAddImages = this.state.toAddImages;
                                  var wasAddingUri = false
                                  for (var j = 0; j < toAddImages.length; j++) {
                                    if (toAddImages[j] == imageUrls[i].url) {
                                      toAddImages.splice(j, 1);
                                      wasAddingUri = true
                                      break
                                    }
                                  }
                                  if(!wasAddingUri){
                                    toDeleteImages.push(imageUrls[i].url);
                                  }
                                  imageUrls.splice(i, 1);
                                  this.setState({
                                    imageUrls,
                                    toDeleteImages,
                                    toAddImages,
                                  });
                                }}
                              >
                                <AntDesign
                                  name="delete"
                                  size={30}
                                  color="red"
                                />
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                      ))}
                      
                    </ScrollView> : 
                      <TouchableOpacity 
                      disabled={!this.state.editing}
                                              onPress={() => {
                          this.setState({ uploadImagesVisible: true });
                        }}
                      style={{justifyContent:"center",alignItems:"center"}}>
                        <Text style={{fontSize:25,color:"gray",textDecorationLine: "underline"}}>Upload Images</Text>
                        <Text style={{fontSize:25,color:"gray",textDecorationLine: "underline"}}>of Your Order</Text>

                      </TouchableOpacity>
                    }
                  </View>
                  {this.state.editing && (
                    <View style={{ position: "absolute", left: 2, top: 2 }}>
                      <TouchableOpacity
                        onPress={() => {
                          this.setState({ uploadImagesVisible: true });
                        }}
                      >
                        <MaterialIcons
                          name="add-a-photo"
                          size={30}
                          color="black"
                        />
                      </TouchableOpacity>
                    </View>
                  )}
                </Row>
                <Row
                  style={{
                    overflow: "hidden",
                    height: 60,
                    borderTopWidth: 2,
                    borderBottomLeftRadius: 20,
                    borderBottomRightRadius: 20,
                  }}
                >
                  {this.state.editing ? (
                    <>
                      {!this.state.newOrder && (
                        <TouchableWithoutFeedback
                          onPressIn={() =>
                            this._start(
                              this.state.deleteHighlight,
                              modalWidth / 3,
                              800
                            )
                          }
                          onPressOut={() => {
                            if (
                              modalWidth / 3 -
                                this.state.deleteHighlight.__getValue() <=
                              10
                            ) {
                              this.setState({ isDeleting: true });
            if(this.props.toggleShowSwiperButtons){
              this.props.toggleShowSwiperButtons(true);
            }
                            }
                            this._close(this.state.deleteHighlight, 0);
                          }}
                          // onPress={() => {
                          //   this.setState({ editing: false });
                          // }}
                        >
                          <Col
                            style={{
                              backgroundColor: "white",
                              justifyContent: "center",
                              borderBottomLeftRadius: 20,
                              borderTopColor: "black",
                              borderRightColor: "gray",
                              borderRightWidth: 1,
                              alignItems: "center",
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 20,
                                textDecorationLine: "underline",
                                color: "#FD7070",
                              }}
                            >
                              Delete
                            </Text>
                          </Col>
                        </TouchableWithoutFeedback>
                      )}
                      <TouchableWithoutFeedback
                        onPressIn={() =>
                          this.setState({ cancelHighlight: true })
                        }
                        onPressOut={() =>
                          this.setState({ cancelHighlight: false })
                        }
                        onPress={() => {
                          if(this.state.newOrder){
                              this.props.exitSelectedOrderModal();
                          }else{
                          //1 console.log(
                          //1   "beforeEditing ",
                          //1   this.state.beforeEditing
                          //1 );
                          this.setState({
                            editing: false,
                            thumbnail: this.state.beforeEditing["thumbnail"],
                            timePreference: this.state.beforeEditing[
                              "timePreference"
                            ],
                            imageUrls: this.state.beforeEditing["imageUrls"],
                            rangeSelected: this.state.beforeEditing[
                              "rangeSelected"
                            ],
                            orderTitle: this.state.beforeEditing["orderTitle"],
                            dateTimeStamp: this.state.beforeEditing[
                              "dateTimeStamp"
                            ],
                            amOrPm: this.state.beforeEditing["amOrPm"],
                            toDeleteImages: [],
                            toAddImages: [],
                            newThumbnail: false,
                            beforeEditing: {},
                            hasSaved: true,
                          });}
                        }}
                      >
                        <Col
                          style={{
                            backgroundColor: this.state.cancelHighlight
                              ? "#C5C5C5"
                              : "white",
                            justifyContent: "center",
                            borderRightColor: "gray",
                            borderTopColor: "black",
                            borderRightWidth: 1,
                            alignItems: "center",
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 20,
                              color: "black",
                            }}
                          >
                            Cancel
                          </Text>
                        </Col>
                      </TouchableWithoutFeedback>
                      <TouchableWithoutFeedback
                        onPressIn={() =>
                          this._start(
                            this.state.saveHighlight,
                            this.state.newOrder
                              ? modalWidth / 2
                              : modalWidth / 3,
                            800
                          )
                        }
                        onPressOut={() => {
                          if (
                            modalWidth / 3 -
                              this.state.saveHighlight.__getValue() <=
                            10
                          ) {
                            if (!this.state.newOrder) {
                              const toAddImages = this.state.toAddImages;
                              if (
                                this.state.newThumbnail &&
                                this.state.thumbnail &&
                                this.state.thumbnail.length > 1
                              ) {
                                toAddImages.push(this.state.thumbnail);
                              }
                              const updatedOrder = {
                                range: this.state.rangeSelected,
                                thumbnail: {
                                  uri: this.state.thumbnail,
                                  url: "",
                                },
                                title: this.state.orderTitle,
                                timestamp: this.state.dateTimeStamp,
                              };
                              this.props.updateOrderFirebase(
                                updatedOrder,
                                this.state.toDeleteImages,
                                toAddImages,
                                this.props.elementKey,
                                this.props.index
                              );
                              this.setState({
                                editing: false,
                                hasSaved: true,
                                toDeleteImages: [],
                                toAddImages: [],
                                beforeEditing: {},
                                newThumbnail: false,
                              });
                            } else {
                              //1 console.log("new Order");
                              const newOrderObject = {
                                range: this.state.rangeSelected,
                                thumbnail: {
                                  uri: this.state.thumbnail,
                                  url: "",
                                },
                                title: this.state.orderTitle,
                                timestamp: this.state.dateTimeStamp,
                              };
                              const imageUris = [];
                              const imageUrls = this.state.imageUrls;
                              //1 console.log("imageUrls", imageUrls);
                              for (var i = 0; i < imageUrls.length; i++) {
                                //1 console.log("iamge", imageUrls[i]);
                                imageUris.push(imageUrls[i].url);
                              }
                              if (
                                this.state.thumbnail &&
                                this.state.thumbnail.length > 1 &&
                                this.state.newThumbnail
                              ) {
                                //1 console.log("pushed ", this.state.thumbnail);
                                imageUris.push(this.state.thumbnail);
                              }
                              this.props.addSavedOrder(
                                newOrderObject,
                                imageUris
                              );
                              this.props.exitSelectedOrderModal();
                            }
                          }
                          this._close(this.state.saveHighlight, 0);
                        }}
                      >
                        <Col
                          style={{
                            backgroundColor: "white",
                            justifyContent: "center",
                            borderBottomRightRadius: 20,
                            borderColor: "black",
                            alignItems: "center",
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 20,
                              textDecorationLine: "underline",
                              color: "#4cBB17",
                            }}
                          >
                            {this.state.newOrder ? "Add" : "Save"}
                          </Text>
                        </Col>
                      </TouchableWithoutFeedback>
                      <Animated.View
                        style={{
                          position: "absolute",
                          backgroundColor: "red",
                          width: this.state.deleteHighlight,
                          height: 60,
                        }}
                        opacity={0.5}
                      />
                      <Animated.View
                        style={{
                          position: "absolute",
                          backgroundColor: "#4cBB17",
                          width: this.state.saveHighlight,
                          height: 60,
                          left: this.state.newOrder
                            ? modalWidth / 2
                            : (modalWidth * 2) / 3,
                        }}
                        opacity={0.5}
                      />
                    </>
                  ) : (
                    <>
                      <TouchableWithoutFeedback
                        onPressIn={() =>
                          this.setState({ cancelHighlight: true })
                        }
                        onPressOut={() =>
                          this.setState({ cancelHighlight: false })
                        }
                        onPress={() => {
                          const beforeEditing = clone({
                            thumbnail: this.state.thumbnail,
                            rangeSelected: this.state.rangeSelected,
                            orderTitle: this.state.orderTitle,
                            imageUrls: this.state.imageUrls,
                            amOrPm: this.state.amOrPm,
                            timePreference: this.state.timePreference,
                            dateTimeStamp: this.state.dateTimeStamp,
                          });

                          this.setState({ editing: true, beforeEditing });
                        }}
                      >
                        <Col
                          style={{
                            backgroundColor: this.state.cancelHighlight
                              ? "#C5C5C5"
                              : "white",
                            justifyContent: "center",
                            borderBottomLeftRadius: 20,
                            borderColor: "black",
                            alignItems: "center",
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 20,
                              textDecorationLine: "underline",
                              color: "#FD7070",
                            }}
                          >
                            Edit
                          </Text>
                        </Col>
                      </TouchableWithoutFeedback>
                                              <TouchableWithoutFeedback
                        onPressIn={() => this._start(this.state.orderHighlight,modalWidth - 80,1000)}
                        onPressOut={() => {
                          if(                            (modalWidth -80) -
                              this.state.orderHighlight.__getValue() <=
                            10 ){
                            this.props.exitSelectedOrderModal()
                                                          this.props.togglePopupVisibility(true)
                            this.props.toggleOrderIndex(this.props.index)


                          }
                          this._close(this.state.orderHighlight,0)}}
                        >
                      <View style={{width:modalWidth - 80,marginTop:5,marginRight:5,height:50,borderWidth:1,borderRadius:50,overflow: 'hidden',}}>
                        <View style={{justifyContent:"center",alignItems:"center",height:50}}>
                        <Text style={{fontSize:25}}>Hold to Order</Text>
                        </View>
                                                <Animated.View style={{backgroundColor:"black",position:"absolute",justifyContent:"center",alignItems:"center",height:50,width:this.state.orderHighlight}}/>
                      </View>
                                              </TouchableWithoutFeedback>

                    </>
                  )}
                </Row>
                {this.state.editing && (
                  <DropDownPicker
                    onOpen={() => {
                      // this._start(this.state.sellerDropdown);
                    }}
                    onClose={() => {
                      //this._close(this.state.sellerDropdown);
                    }}
                    items={[
                      { label: "1 to 5" },
                      { label: "5 to 10" },
                      { label: "10 to 15" },
                      { label: "15+" },
                    ]}
                    style={{
                      position: "absolute",
                      top: firstRowHeight + (secondRowHeight/2) - 10,
                      left: 5,
                      width: 18,
                      height: 10,
                      padding: 0,
                      borderColor: "transparent",
                      borderWidth: 0,
                    }}
                    arrowStyle={{
                      position: "absolute",
                      marginLeft: -13,
                    }}
                    arrowSize={20}
                    containerStyle={{
                      borderColor: "red",
                    }}
                    dropDownStyle={{
                      width: 100,
                    }}
                    containerStyle={{
                      position: "absolute",
                      height: 40,
                      width: 200,
                    }}
                    onChangeItem={(item) => {
                      //1 console.log("item ", item);
                      this.setState({ rangeSelected: item.label });
                    }}
                  />
                )}
              </Grid>
            )}
            {/* {this.state.acceptedOrderVisible != undefined && (this.state.acceptedOrderVisible ?
          <ActivityIndicator size="large"></ActivityIndicator>
        :
          this.acceptedOrderError()
        )} */}
            <View style={{ top: -50, right: 0, position: "absolute" }}>
              <TouchableOpacity
                onPress={() => this.props.exitSelectedOrderModal()}
              >
                <AntDesign name="close" size={50} color="white" />
              </TouchableOpacity>
            </View>
            {this.state.possibleProfitVisible && this.possibleProfit()}
            {this.state.isDeleting && this.deleteConfirmation()}
            <UploadImages
              isVisible={this.state.uploadImagesVisible}
              photoCallb={this.photoCallback}
            />
          </View>
        ) : (
          this.modalImages()
        )}
      </>
    );
  }
}

const styles = StyleSheet.create({
  container: {},
  view: {
    backgroundColor: "blue",
    marginHorizontal: 20,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "black",
  },
  glowBorder: {
    borderWidth: 3,
    borderColor: "#FFDB0C",
    shadowColor: "#FFDB0C",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.39,
    shadowRadius: 10,
  },
});
