import React from "react";
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
  Image,
  TextInput,
  TouchableHighlight,
  ScrollView,
  Keyboard,
  TouchableOpacity,
} from "react-native";
import * as firebase from "firebase";
import Modal from "react-native-modal";
import AwesomeButton from "react-native-really-awesome-button";
import { SwipeableFlatList } from "react-native-swipeable-flat-list";
import { FontAwesome, AntDesign, Ionicons } from "@expo/vector-icons";
import { SwipeListView } from "react-native-swipe-list-view";
import { Col, Row, Grid } from "react-native-easy-grid";
import PopupOrder from "./PopupOrder";
const windowWidth = Dimensions.get("window").width;
const windowHeight = Dimensions.get("window").height;
const rowSwipeAnimatedValues = {};
const cardHeight = 200;
const cardWidth = 160;
const nameOfImages = [require("../assets/Venmo.png"),require("../assets/GooglePay.png"),require("../assets/ApplePay.png"),require("../assets/Paypal.png"),require("../assets/Skrill.png"),require("../assets/Square.png"),require("../assets/FacebookMessenger.png"),require("../assets/WePay.png")]
const stringOfImages = ["../assets/Venmo.png","../assets/GooglePay.png","../assets/ApplePay.png","../assets/Paypal.png","../assets/Skrill.png","../assets/Square.png","../assets/FacebookMessenger.png","../assets/WePay.png"]
export default class PaymentOptions extends React.Component {
  state = {
    listData: [],
    clicked : nameOfImages.map(x => false),
    addSpecificPaymentVisible:false,
    isEditing:false,
    nameOfImagesIndex:0,
    addPaymentVisible: false,
    newPaymentText:"",
  };

  componentDidMount() {
    const user = firebase.auth().currentUser;
    const start = (user || {}).email.indexOf("@");
    const end = (user || {}).email.indexOf(".com");
    const domain = (user || {}).email.substring(start, end);
    const realEmail = (user || {}).email.substring(0, end);

    firebase
      .database()
      .ref("users/" + domain + "/" + realEmail + "/paymentOptions")
      .on("value", async (snapshot) => {
        var listData = []
        const snapshotVal = snapshot.val() || {}
        const keys = Object.keys(snapshotVal)
        for(var i = 0; i < keys.length; i++){
          listData.push(
            {
              index:i,
              key : keys[i],
              username : snapshotVal[[keys[i]]].username,
              image : snapshotVal[[keys[i]]].image,
              stringOfImage : snapshotVal[[keys[i]]].stringOfImage
            }
          )
          rowSwipeAnimatedValues[[keys[i]]] = new Animated.Value(0);
        }
        this.setState({listData})
      });
  }

  closeRow = (rowMap, rowKey) => {
    if (rowMap[rowKey]) {
      rowMap[rowKey].closeRow();
    }
  };

  addPayment = () => {
    
    var whatsInRow = []
    var nextAvailableIndex = 0
    var spaceLeftInRow = windowWidth
    var numbOfColumns = Math.floor(windowWidth/cardWidth)
    var numbOfRows = Math.ceil(nameOfImages.length/numbOfColumns)
    return (
      <View
        style={{
          position: "absolute",
          width: windowWidth,
          height: windowHeight,
          backgroundColor: "white",
        }}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => this.setState({ addPaymentVisible: false })}
          >
            <AntDesign name="arrowleft" size={30} color="black" />
          </TouchableOpacity>
          <Text style={{ fontSize: 20 }}>Add Payment</Text>

            <Text></Text>

        </View>
        <ScrollView style={{ marginTop: this.state.loading ? 0 : 20 }}>
          <Grid style={{ width: windowWidth,                    marginLeft:
                      (windowWidth -
                        (numbOfColumns * cardWidth +
                          numbOfColumns * 10)) /
                      2, }}>
            {nameOfImages.map((x,i) => {
    var whatsInRow = []
              if (nextAvailableIndex > i || i > nextAvailableIndex) {
                return;
              }

              for (
                var j = nextAvailableIndex;
                j < nameOfImages.length;
                j++
              ) {
                //1 console.log("ANTHONY ", this.state.newSavedOrders[j].width);
                if (spaceLeftInRow - cardWidth >= 0) {
                  nextAvailableIndex += 1;
                  spaceLeftInRow -= cardWidth;
                  whatsInRow.push(j);
                } else {
                  break;
                }
              }
              //1 console.log("whatsInRow ", whatsInRow);
              //1 console.log("currentIndex ", i);
              //1 console.log("nextAvailableIndex ", nextAvailableIndex);
              spaceLeftInRow = windowWidth;
                return(
              <Row
                style={{
                  marginBottom: 20,
                }}
              >
              {whatsInRow.map((x,i) => {

                  return(
<Col style={styles.addItemContainer}>
                  <View
                   style={{ alignItems: "center", justifyContent: "center" }}
                  >
                    <Image source={nameOfImages[x]}
                       style={{width:cardWidth - 20,height:cardHeight- 50}}/>
                    <TouchableWithoutFeedback 
                    onPressIn={() => {
                        const clicked = this.state.clicked
                        clicked[nameOfImages[x]] = true
                        this.setState({clicked})
                    }}
                    onPressOut={() => {
                        const clicked = this.state.clicked
                        clicked[nameOfImages[x]] = false
                        this.setState({clicked})
                    }}
                    onPress={() => {
                        this.setState({addSpecificPaymentVisible:true,nameOfImagesIndex:x})
                    }}>
                    <View
                    style={{ position:"absolute",backgroundColor:"white",borderColor:"#FFE300",right:0,bottom:0,width:50,height:50,borderWidth:5,borderRadius:50 }}>
                      
                      <AntDesign name="plus" size={40} color="black" />
                      </View>
                    </TouchableWithoutFeedback>
                    {this.state.clicked[nameOfImages[x]] && 
                    <View style={{width:cardWidth,height:cardHeight,position:"absolute",backgroundColor:"#3997FF"}}
                    opacity={0.3}/>}
                  </View>
                </Col>
                  )
              })}
                
              </Row>
            )})}
          </Grid>

        </ScrollView>
      </View>
    );
  };

  addSpecificPayment = () => {
      return(
                      <Modal
        testID={"modal"}
        isVisible={this.state.addSpecificPaymentVisible}
        onBackdropPress={() => {this.setState({addSpecificPaymentVisible:false,isEditing:false,textInputFocused:false,newPaymentText:""})}}
        animationIn="slideInLeft"
        animationInTiming={500}
        style={{ overflow:"visible",width: windowWidth, height: 300, margin: 0,marginBottom:this.state.textInputFocused ? 300 : 0,justifyContent:"flex-end" }}
      >
          <View style={{width:windowWidth,height:300,paddingTop:10,backgroundColor: "white",alignItems:"center"}}>
                            <View style={{ position: "absolute", right: 10, top:-50 }}>
          <TouchableOpacity onPress={() => this.setState({addSpecificPaymentVisible : false,newPaymentText:"",textInputFocused:false,isEditing:false})}>
            <AntDesign name="close" size={40} color="white" />
          </TouchableOpacity>
        </View>
          <View style={{                                          shadowColor: "black",
                  shadowOffset: { width: 0, height: 10 },
                  shadowRadius: 10,
                  justifyContent:"center",
                  alignItems:"center",
                  shadowOpacity : 1,}}>
          <Image source={this.state.isEditing ? this.state.nameOfImagesIndex : nameOfImages[this.state.nameOfImagesIndex]}      
          style={{ 
              width:100,
              height:100,
              backgroundColor:"white",
              borderWidth:5,
              borderRadius:100,
}} />
</View>

          <View style={{justifyContent:"flex-start"}}>
          <Text style={{ marginLeft: 20,marginTop:30 }}>Input a Username/Email as Payment Option</Text>

          <TextInput
            style={{
              backgroundColor: "white",
              marginHorizontal: 20,
              borderRadius: 4,
              padding: 8,
              borderWidth: 3,
              width:windowWidth - 100,
              height: 50,
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
            onSubmitEditing={Keyboard.dismiss}
            onFocus={() => this.setState({textInputFocused:true})}
            onChangeText={(field) => {
              this.setState({newPaymentText:field})
            }}
            onEndEditing={() => this.setState({textInputFocused:false})}
            value={this.state.newPaymentText}
          />
          </View>
          <View style={{width:windowWidth - 100,flexDirection:"row",justifyContent:this.state.isEditing ? "space-between" : "flex-end",marginTop:5}}>
          {this.state.isEditing && 
                              <AwesomeButton
          onPress={() => {this.updateSavedPaymentOptions(2,this.state.newPaymentKey);
                      this.setState({textInputFocused:false,newPaymentText:"",isEditing:false})
          }}
          width={95}
          height={50}
          ripple={true}
          borderColor="black"
          borderWidth={4}
          raiseLevel={3}
          borderRadius={30}
          backgroundColor="#EF5255"
          backgroundShadow="#FB3C3F"
          backgroundDarker="#82181A"
          textSize={20}
          textColor="black"
        >
          Delete
        </AwesomeButton>}
                    <AwesomeButton
          onPress={() => {
            this.updateSavedPaymentOptions(this.state.isEditing ? 1 : 0,this.state.newPaymentKey)
            this.setState({textInputFocused:false,newPaymentText:"",isEditing:false})
            }}
          width={95}
          height={50}
          ripple={true}
          borderColor="black"
          borderWidth={4}
          raiseLevel={3}
          borderRadius={30}
          backgroundColor="#FFDA00"
          backgroundShadow="#B79D07"
          backgroundDarker="#B79D07"
          textSize={20}
          textColor="black"
        >
          Submit
        </AwesomeButton>
          </View>
        </View>
          </Modal>
      )
  }
 
  generateRandomString = () => {
    return Math.random().toString().substr(2, 20);
  };

 updateSavedPaymentOptions = (option,_id) => {
            const user = firebase.auth().currentUser;
    const start = (user || {}).email.indexOf("@");
    const end = (user || {}).email.indexOf(".com");
    const domain = (user || {}).email.substring(start, end);
    const realEmail = (user || {}).email.substring(0, end);
    const isEditing = this.state.isEditing
    firebase
      .database()
      .ref("users/" + domain + "/" + realEmail + "/paymentOptions")
      .update({
        [[option == 0 ? this.generateRandomString() : _id]] : (option != 2 ? 
        {username :this.state.newPaymentText,
        image: isEditing ? this.state.nameOfImagesIndex : nameOfImages[this.state.nameOfImagesIndex],
        stringOfImage: isEditing ? this.state.stringOfImagesValue : stringOfImages[this.state.nameOfImagesIndex]} : null)})

    this.setState({isEditing:false,addSpecificPaymentVisible:false,addPaymentVisible:false})
    



 }



  deleteRow = (rowMap, rowKey) => {
    // this.closeRow(rowMap, rowKey);
    const newData = [...this.state.listData];
    //1 console.log("rowKey ", rowKey);
    const prevIndex = this.state.listData.findIndex(
      (item) => item.key === rowKey
    );
    newData.splice(prevIndex, 1);
    this.setState({ listData: newData });
    const user = firebase.auth().currentUser;
    const start = (user || {}).email.indexOf("@");
    const end = (user || {}).email.indexOf(".com");
    const domain = (user || {}).email.substring(start, end);
    const realEmail = (user || {}).email.substring(0, end);
    this.updateSavedPaymentOptions(2,rowKey)
  };

  onRowDidOpen = (rowKey) => {
    //1 console.log("This row opened", rowKey);
  };

  onSwipeValueChange = (swipeData) => {
    const { key, value } = swipeData;
    rowSwipeAnimatedValues[key].setValue(Math.abs(value));
  };

  componentWillUnmount() {
    const user = firebase.auth().currentUser;
    const start = (user || {}).email.indexOf("@");
    const end = (user || {}).email.indexOf(".com");
    const domain = (user || {}).email.substring(start, end);
    const realEmail = (user || {}).email.substring(0, end);
    firebase
      .database()
      .ref("users/" + domain + "/" + realEmail + "/pendingOrders")
      .off();
  }

  renderItem = (data) => (
  <TouchableHighlight
      onPress={() =>{
        this.setState({nameOfImagesIndex:data.item.image,
        addSpecificPaymentVisible: true,
        newPaymentKey: data.item.key,
        newPaymentText:data.item.username,
        stringOfImagesValue : data.item.stringOfImage,
        isEditing:true})
      }}
      style={[styles.rowFront, { marginTop:15,width: windowWidth }]}
      underlayColor={"#AAA"}
    >
      <Grid style={{height:75}}>
        <Col style={{width : windowWidth/3,justifyContent:"center",alignItems:"center"}}>
          <Image source={data.item.image} style={{width:110,height:100}}/>
        </Col>
        <Col  style={{width : (windowWidth *2/3),justifyContent:"center",alignItems:"center",paddingRight:20}}>
          <Text style={{fontSize:30}} adjustsFontSizeToFit={true} numberOfLines={1}>{(!(data.item.username || "").endsWith(".com") && !(data.item.username || "").startsWith("@")) ? ("@" + data.item.username) : data.item.username}</Text>
        </Col>
      </Grid>
    </TouchableHighlight>);

  renderHiddenItem = (data, rowMap) => {
    // if(data == undefined || data.item == undefined || data.item.key == ""){
    //   return <View/>
    // }
    return (
      <View style={styles.rowBack}>
        <TouchableHighlight onPress={() => this.setState({
          nameOfImagesIndex:data.item.image,
          addSpecificPaymentVisible: true,
          newPaymentText:data.item.username,
          stringOfImagesValue : data.item.stringOfImage,
          isEditing:true})}>
          <Text>Edit</Text>
        </TouchableHighlight>
        <TouchableOpacity
          style={[styles.backRightBtn, styles.backRightBtnLeft]}
          onPress={() => this.closeRow(rowMap, data.item.key)}
        >
          <Text style={styles.backTextWhite}>Close</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.backRightBtn,
            styles.backRightBtnRight,
            { borderRightRadius: 10 },
          ]}
          onPress={() =>
            this.deleteRow(rowMap, data.item.key)
          }
        >
          <Animated.View
            style={[
              styles.trash,
              {
                transform: [
                  {
                    scale: rowSwipeAnimatedValues[data.item.key].interpolate({
                      inputRange: [45, 90],
                      outputRange: [0, 1],
                      extrapolate: "clamp",
                    }),
                  },
                ],
              },
            ]}
          >
            <FontAwesome name="trash-o" size={30} color="black" />
          </Animated.View>
        </TouchableOpacity>
      </View>
    );
  };



  render() {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => this.props.navigation.goBack(null)}>
            <AntDesign name="arrowleft" size={30} color="black" />
          </TouchableOpacity>
          <Text style={{ fontSize: 20 }}>Payment Methods</Text>
          <TouchableOpacity
            onPress={() => this.setState({ addPaymentVisible: true })}
          >
            <AntDesign name="pluscircle" size={27} color="black" />
          </TouchableOpacity>
        </View>
        {/* <View style={{justifyContent:"space-around",flexDirection:"row"}}>
          <View style={{width:100}}>
          <Text style={{fontWeight:"bold",fontSize:17}}>Price</Text>
          </View>
                    <View style={{width:75}}>
          <Text style={{fontWeight:"bold",fontSize:17}}>Status</Text>
                    </View>
                    <View style={{width:100,alignItems:"flex-end",overflow: 'visible'}}>
          <Text style={{fontWeight:"bold",fontSize:17}}>Expected</Text>
                  </View>
        </View> */}
        <SwipeListView
          data={this.state.listData}
          renderItem={this.renderItem}
          renderHiddenItem={this.renderHiddenItem}
          refreshControl={
            <RefreshControl
              refreshing={this.state.refreshing}
              onRefresh={() => {
                this.setState({ refreshing: true });
                    const user = firebase.auth().currentUser;
    const start = (user || {}).email.indexOf("@");
    const end = (user || {}).email.indexOf(".com");
    const domain = (user || {}).email.substring(start, end);
    const realEmail = (user || {}).email.substring(0, end);

    firebase
      .database()
      .ref("users/" + domain + "/" + realEmail + "/paymentOptions")
      .once("value", async (snapshot) => {
        var listData = []
        const snapshotVal = snapshot.val() || {}
        const keys = Object.keys(snapshotVal)
        for(var i = 0; i < keys.length; i++){
          listData.push(
            {
              index:i,
              key : keys[i],
              username : snapshotVal[[keys[i]]].username,
              image : snapshotVal[[keys[i]]].image,
              stringOfImage : snapshotVal[[keys[i]]].stringOfImage
            }
          )
          rowSwipeAnimatedValues[[keys[i]]] = new Animated.Value(0);
        }
        setTimeout(() => {
                  this.setState({listData,refreshing:false})
        }, 500);
      });
              }}
            />
          }
          leftOpenValue={75}
          rightOpenValue={-150}
          previewRowKey={"0"}
          previewOpenValue={-40}
          previewOpenDelay={3000}
          onRowDidOpen={this.onRowDidOpen}
          onSwipeValueChange={this.onSwipeValueChange}
        />
        {this.state.addPaymentVisible && this.addPayment()}
        {this.addSpecificPayment()}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  addItemContainer: {
      overflow:"hidden",
    backgroundColor: "#F5F5F5",
    borderColor: "#3997FF",
    borderRadius: 45,
    borderWidth: 10,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 5,
    padding: 10,
    width: cardWidth,
    height: cardHeight,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    marginTop: 50,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderColor: "gray",
  },
  backTextWhite: {
    color: "#FFF",
  },
  rowFront: {
    alignItems: "center",
    backgroundColor: "white",

    borderRadius: 10,
    justifyContent: "center",
    height: 75,
    shadowColor: "#000",
    shadowOffset: { width: 10, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 5,
  },
  rowBack: {
    alignItems: "center",
    backgroundColor: "#DDD",
    flex: 1,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingLeft: 15,
    marginTop: 15,
    overflow: "hidden",
  },
  backRightBtn: {
    alignItems: "center",
    bottom: 0,
    justifyContent: "center",
    position: "absolute",
    top: 0,
    width: 75,
  },
  backRightBtnLeft: {
    backgroundColor: "blue",
    right: 75,
  },
  backRightBtnRight: {
    backgroundColor: "red",
    right: 0,
  },
  trash: {
    height: 25,
    width: 25,
  },
});
