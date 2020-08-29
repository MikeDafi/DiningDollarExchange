import React from "react";
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableHighlight,
  Animated,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import * as firebase from "firebase";
import { SwipeableFlatList } from "react-native-swipeable-flat-list";
import { FontAwesome, AntDesign, Ionicons } from "@expo/vector-icons";
import { SwipeListView } from "react-native-swipe-list-view";
import { Col, Row, Grid } from "react-native-easy-grid";
import PopupOrder from "./PopupOrder"
const windowWidth = Dimensions.get("window").width;
const windowHeight = Dimensions.get("window").height;
const rowSwipeAnimatedValues = {};
export default class PendingOrders extends React.Component {
  state = {
    listData: [],
    isEditing: false,
    timerId: 0,
    timer: 0,
    minuteTimer: false,
    refreshing: false,
    popupVisible:false,
  };

    togglePopupVisibility = (value) => {
    this.setState({ popupVisible: value });
  };

  componentDidMount() {
    const user = firebase.auth().currentUser;
    const start = user.email.indexOf("@");
    const end = user.email.indexOf(".com");
    const domain = user.email.substring(start, end);
    const realEmail = user.email.substring(0, end);

    const currentOrderRef = firebase
      .database()
      .ref("orders/" + domain + "/currentOrders");
    firebase
      .database()
      .ref("users/" + domain + "/" + realEmail + "/pendingOrders")
      .on("value", async (snapshot) => {
        const orderNumbers = Object.keys(snapshot.val() || {});
        const allStatus = Object.values(snapshot.val() || {});
        const promises = [];
    const listData = {};
        var foundAOneMinute = false
        console.log("orderNumbers ", orderNumbers);
        console.log("allStatus", allStatus);
        for (var i = 0; i < orderNumbers.length; i++) {
          promises.push(
            currentOrderRef
              .child(orderNumbers[i])
              .once("value", (orderSnapshot) => {
                if (!orderSnapshot.val()) {
                  //                 firebase
                  // .database()
                  // .ref("users/" + domain + "/" + realEmail + "/pendingOrders").update({
                  //   [[orderNumbers[i]]] : null
                  // })
                  // return
                }
                console.log(orderSnapshot.val());
                if (!orderSnapshot.val()) {
                  firebase
                    .database()
                    .ref("users/" + domain + "/" + realEmail + "/pendingOrders")
                    .update({
                      [[orderNumbers[i]]]: null,
                    });
                }
                const { amOrPm, time, date } = this.formatTime(
                  (orderSnapshot.val() || {}).timeSelected || 0
                );
                listData[[orderNumbers[i]]] = {
                  timestamp: (orderSnapshot.val() || {}).timeSelected || 0,
                  amOrPm,
                  timePreference: time,
                  date,
                  timeRemaining: this.findRemainingTime(
                    (orderSnapshot.val() || {}).timeSelected || 0
                  ),
                  range: (orderSnapshot.val() || {}).rangeSelected || "",
                  status: (orderSnapshot.val() || {}).status || "",
                  orderNumber: orderNumbers[i],
                  key: `${i}`,
                  text: "this man",
                };
                if(listData[[orderNumbers[i]]].timeRemaining == "1 Minute" || listData[[orderNumbers[i]]].timeRemaining.includes("Second") ){
                  foundAOneMinute = true
                }
                rowSwipeAnimatedValues[[i]] = new Animated.Value(0);
              })
          );
        }

        await Promise.all(promises);
        let timerId = setInterval(() => {
          console.log("60 second called from timeout");
          this.checkAllRemainingTime();
        }, foundAOneMinute ? 1000 : 60000);
        this.setState({
          listData: Object.values(listData),
          rowSwipeAnimatedValues,
          timerId,
        });
      });
  }

  closeRow = (rowMap, rowKey) => {
    if (rowMap[rowKey]) {
      rowMap[rowKey].closeRow();
    }
  };

  deleteRow = (rowMap, rowKey, orderNumber) => {
    // this.closeRow(rowMap, rowKey);
    const newData = [...this.state.listData];
    console.log("rowKey ", rowKey);
    const prevIndex = this.state.listData.findIndex(
      (item) => item.key === rowKey
    );
    newData.splice(prevIndex, 1);
    this.setState({ listData: newData });
    const user = firebase.auth().currentUser;
    const start = user.email.indexOf("@");
    const end = user.email.indexOf(".com");
    const domain = user.email.substring(start, end);
    const realEmail = user.email.substring(0, end);
    firebase
      .database()
      .ref("orders/" + domain + "/currentOrders")
      .update({
        [[orderNumber]]: null,
      });
    firebase
      .database()
      .ref("users/" + domain + "/" + realEmail + "/pendingOrders")
      .update({
        [[orderNumber]]: null,
      });
  };

  onRowDidOpen = (rowKey) => {
    console.log("This row opened", rowKey);
  };

  onSwipeValueChange = (swipeData) => {
    const { key, value } = swipeData;
    rowSwipeAnimatedValues[key].setValue(Math.abs(value));
  };

  removeOrder = (orderNumber) => {};

  componentWillUnmount() {
    clearInterval(this.state.timerId);
  }

  checkAllRemainingTime = () => {
    const listData = this.state.listData;
    var foundAOneMinute = false
    var listDataLength = listData.length
    for (var i = 0; i < listData.length; i++) {
      listData[i].timeRemaining = this.findRemainingTime(listData[i].timestamp);
      console.log("listData[i].timeRemaining", listData[i].timeRemaining);
      if (listData[i].timeRemaining == "1 Minute") {
        foundAOneMinute = true
        let timerId = this.state.timerId;
        if (!this.state.minuteTimer) {
          clearInterval(timerId);
          timerId = setInterval(() => {
            console.log("1 minute interval");
            this.checkAllRemainingTime();
          }, 1000);
        }
        this.setState({ minuteTimer: true, timerId });
      } else if (listData[i].timeRemaining == "0 Seconds") {
        let timerId = this.state.timerId;
        if (this.state.minuteTimer  && !foundAOneMinute) {
          clearInterval(timerId);
          timerId = setInterval(() => {
            console.log("0 second interval");
            this.checkAllRemainingTime();
          }, 60000);
        }
        this.setState({ minuteTimer: false, timerId });
      }
      if(listData[i].timeRemaining == "0 Minutes" || listData[i].timeRemaining == "0 Seconds"){
        this.deleteRow({}, listData[i].key, listData[i].orderNumber)
        listDataLength -= 1
      }
      // this.setState({listData})
    }
    if(listDataLength == 0){
      clearInterval(this.state.timerId)
    }
    this.setState({ listData,refreshing:false });
  };
  findRemainingTime = (timestamp) => {
    const date = new Date();
    var difference = timestamp - date.getTime();
    const unitsOfTime = [86400000, 3600000, 60000, 1000];
    var unitsFound = 0;
    var numberOfUnits = 0;
    while (difference > 0 && unitsFound < unitsOfTime.length) {
      if (numberOfUnits != 0) {
        if (difference - unitsOfTime[unitsFound] >= 0) {
          difference -= unitsOfTime[unitsFound];
          numberOfUnits += 1;
        } else {
          break;
        }
      } else {
        if (difference - unitsOfTime[unitsFound] >= 0) {
          difference -= unitsOfTime[unitsFound];
          numberOfUnits += 1;
        } else {
          unitsFound += 1;
        }
      }
    }
    return (
      numberOfUnits +
      (unitsFound == 0
        ? numberOfUnits <= 1
          ? " Minute"
          : " Day"
        : unitsFound == 1
        ? " Hour"
        : unitsFound == 2
        ? " Minute"
        : " Second") +
      (numberOfUnits == 1 ? "" : "s")
    );
  };

  renderItem = (data) => (
    <TouchableHighlight
      onPress={() =>
        this.props.navigation.navigate("SelectedOrderModal", {
          BuyerUid: (firebase.auth().currentUser | {}).uid,
          orderNumber: data.item.orderNumber,
        })
      }
      style={[styles.rowFront, { marginTop:15,width: windowWidth }]}
      underlayColor={"#AAA"}
    >
      <Grid style={{height:75}}>
        <Col style={{width : windowWidth/3,justifyContent:"center",alignItems:"center"}}>
        <View style={{ justifyContent: "center" }}>
          <Text style={{ color: "green", fontSize: 25, fontWeight: "bold" }}>
            ${data.item.range}
          </Text>
        </View>
        </Col>
        <Col  style={{width : windowWidth/3,justifyContent:"center",alignItems:"center"}}>
          <Text
            style={{
              fontSize: 25,
              color: data.item.status == "searching" ? "red" : "orange",
            }}
          >
            {data.item.status}
          </Text>
          <View
            style={{
              position:"absolute",
              bottom:0,
              paddingTop: 5,
            }}
          >
            <Ionicons name="ios-arrow-down" size={24} color="black" />
          </View>
        </Col>
        <Col  style={{width : windowWidth/3,justifyContent:"center",alignItems:"center"}}>
                  <View style={{ justifyContent: "center",alignItems:"center" }}>
          <View style={{ flexDirection: "row", justifyContent: "center" }}>
            <Text style={{ fontSize: 27, fontWeight: "300" }}>
              {data.item.timePreference}
            </Text>
            <View>
              <Text>{data.item.date}</Text>
              <Text>{data.item.amOrPm}</Text>
            </View>
          </View>
          <View>
          <Text style={{color: data.item.timeRemaining.includes("Second") ? "red" : "black"}}>
            {data.item.timeRemaining}
          </Text>
          </View>
        </View>
        </Col>
      </Grid>
    </TouchableHighlight>
  );

  formatTime = (timestamp) => {
    const orderDate = new Date(parseInt(timestamp));

    const AM = orderDate.getHours() < 12 ? true : false;
    const hour = AM ? orderDate.getHours() : orderDate.getHours() - 12;
    const minute = "0" + orderDate.getMinutes();
    const time = hour + ":" + minute.substr(-2);
    const amOrPm = AM ? "am" : "pm";
    const date = orderDate.getMonth() + 1 + "/" + orderDate.getDay();
    // const date = orderDate.getDay() + '/' + (orderDate.getMonth() + 1)
    return { time, amOrPm, date };
  };

  renderHiddenItem = (data, rowMap) => {
    // if(data == undefined || data.item == undefined || data.item.key == ""){
    //   return <View/>
    // }
    return(
    <View style={styles.rowBack}>
      <TouchableHighlight onPress={() => this.setState({ isEditing: true })}>
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
          this.deleteRow(rowMap, data.item.key, data.item.orderNumber)
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
    </View>)
  }

  render() {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => this.props.navigation.goBack(null)}>
            <AntDesign name="arrowleft" size={30} color="black" />
          </TouchableOpacity>
          <Text style={{ fontSize: 20 }}>Pending Orders</Text>
          <TouchableOpacity onPress={() => this.setState({popupVisible:true})}>
<AntDesign name="pluscircle" size={27} color="black" />
</TouchableOpacity>
        </View>
        <View style={{justifyContent:"space-around",flexDirection:"row"}}>
          <View style={{width:100}}>
          <Text style={{fontWeight:"bold",fontSize:17}}>Price</Text>
          </View>
                    <View style={{width:75}}>
          <Text style={{fontWeight:"bold",fontSize:17}}>Status</Text>
                    </View>
                    <View style={{width:100,alignItems:"flex-end",overflow: 'visible'}}>
          <Text style={{fontWeight:"bold",fontSize:17}}>Expected</Text>
                  </View>
        </View>
        <SwipeListView
          data={this.state.listData}
          renderItem={this.renderItem}
          renderHiddenItem={this.renderHiddenItem}
          refreshControl={
            <RefreshControl
              refreshing={this.state.refreshing}
              onRefresh={() => {this.setState({refreshing:true});this.checkAllRemainingTime();}}
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
        {this.state.isEditing && (
          <SpecificSavedOrder
            rangeSelected={this.state.element.range || "N/A"}
            elementKey={this.state.element.key}
            index={index}
            exitSelectedOrderModal={this.exitSelectedOrderModal}
            timestamp={this.state.element.timestamp}
            imageUrls={this.state.element.images}
            orderTitle={this.state.element.title}
            updateOrderFirebase={this.updateOrderFirebase}
            deleteSavedOrder={this.deleteSavedOrder}
            thumbnail={this.state.element.thumbnail.uri}
          />
        )}
                <PopupOrder
          navigation={this.props.navigation}
          popupVisible={this.state.popupVisible}
          togglePopupVisibility={this.togglePopupVisibility}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    marginTop:15,
    overflow:"hidden",
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
