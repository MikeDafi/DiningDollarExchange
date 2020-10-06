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
import { Notifications } from "expo";
import { SwipeListView } from "react-native-swipe-list-view";
import { Col, Row, Grid } from "react-native-easy-grid";
import PopupOrder from "./PopupOrder";
const windowWidth = Dimensions.get("window").width;
const windowHeight = Dimensions.get("window").height;
const rowSwipeAnimatedValues = {};
const statusValues = {
  searching: 0,
  "in-progress": 1,
  completed: 2,
  expired: 3,
};
export default class PendingOrders extends React.Component {
  state = {
    attemptToDelete: false,
    deletionKey: "",
    rowMap: [],
    possibleTime: {},
    deletionOrderNumber: 0,
    listData: [],
    isEditing: false,
    timerId: 0,
    timer: 0,
    minuteTimer: false,
    refreshing: false,
    popupVisible: false,
  };

  togglePopupVisibility = (value) => {
    this.setState({ popupVisible: value });
  };

  componentDidMount() {
    const user = firebase.auth().currentUser;
    const start = (user || {}).email.indexOf("@");
    const end = (user || {}).email.indexOf(".edu");
    const domain = (user || {}).email.substring(start, end);
    const realEmail = (user || {}).email.substring(0, end);

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
        var listData = {};
        var foundAOneMinute = false;
        //1 console.log("orderNumbers ", orderNumbers);
        //1 console.log("allStatus", allStatus);
        for (var i = 0; i < orderNumbers.length; i++) {
          const pendingCurrentOrder = (snapshot.val() || {})[[orderNumbers[i]]];
          promises.push(
            currentOrderRef
              .child(orderNumbers[i])
              .once("value", (orderSnapshot) => {
                var notSearching =
                  pendingCurrentOrder.status != "searching" ? true : false;
                var wasViewed = true;

                if (
                  pendingCurrentOrder.status == "completed" &&
                  pendingCurrentOrder.timeSelected <= new Date().getTime() &&
                  pendingCurrentOrder.timeViewed == undefined
                ) {
                  wasViewed = false;
                  firebase
                    .database()
                    .ref(
                      "users/" +
                        domain +
                        "/" +
                        realEmail +
                        "/pendingOrders/" +
                        orderNumbers[i]
                    )
                    .update({
                      timeViewed: new Date().getTime(),
                    });
                }

                if (
                  pendingCurrentOrder.status == "searching" &&
                  pendingCurrentOrder.timeSelected <= new Date().getTime() &&
                  pendingCurrentOrder.timeViewed == undefined
                ) {
                  notSearching = true
                  pendingCurrentOrder.status = "expired"
                  wasViewed = false;
                  firebase
                    .database()
                    .ref(
                      "users/" +
                        domain +
                        "/" +
                        realEmail +
                        "/pendingOrders/" +
                        orderNumbers[i]
                    )
                    .update({
                      status: "expired",
                      timeViewed: new Date().getTime(),
                    });
                }
                if (
                  (pendingCurrentOrder.status == "expired" ||
                    pendingCurrentOrder.status == "completed") &&
                  pendingCurrentOrder.timeViewed + 86400000 <=
                    new Date().getTime()
                ) {
                  firebase
                    .database()
                    .ref("users/" + domain + "/" + realEmail + "/pendingOrders")
                    .update({
                      [[orderNumbers[i]]]: null,
                    });
                  return;
                }
                if (pendingCurrentOrder.status == "in-progress") {
                  if (
                    pendingCurrentOrder.timeSelected + 3600000 <=
                    new Date().getTime()
                  ) {
                    if (pendingCurrentOrder.timeViewed == undefined) {
                      wasViewed = false;
                      firebase
                        .database()
                        .ref(
                          "users/" +
                            domain +
                            "/" +
                            realEmail +
                            "/pendingOrders/" +
                            orderNumbers[i]
                        )
                        .update({
                          timeViewed: new Date().getTime(),
                        });
                    }else if(                  pendingCurrentOrder.timeViewed + 86400000 <=
                    new Date().getTime()){
                  firebase
                    .database()
                    .ref("users/" + domain + "/" + realEmail + "/pendingOrders")
                    .update({
                      [[orderNumbers[i]]]: null,
                    });
                  return;
                    }
                  } else {
                    notSearching = false;
                    
                  }
                }

                const { amOrPm, time, date } = this.formatTime(
                  pendingCurrentOrder.timeSelected
                );
                const removalTime = this.formatTime(
                  wasViewed
                    ? (pendingCurrentOrder || {}).timeViewed + 86400000
                    : new Date().getTime() + 86400000
                );
                listData[[orderNumbers[i]]] = {
                  addedToSavedOrder:
                    (pendingCurrentOrder || {}).addedToSavedOrder || false,
                  chatId: (pendingCurrentOrder || {}).chatId || "",
                  timestamp: notSearching
                    ? wasViewed
                      ? pendingCurrentOrder.timeViewed + 86400000
                      : new Date().getTime() + 86400000
                    : pendingCurrentOrder.timeSelected,
                  amOrPm,
                  timePreference: time,
                  originalTime: pendingCurrentOrder.timeSelected,
                  date,
                  scheduledIds: pendingCurrentOrder.scheduledIds,
                  timeRemaining: this.findRemainingTime(
                    notSearching
                      ? wasViewed
                        ? pendingCurrentOrder.timeViewed + 86400000
                        : new Date().getTime() + 86400000
                      : pendingCurrentOrder.timeSelected
                  ),
                  range: (pendingCurrentOrder || {}).rangeSelected || "",
                  status: (pendingCurrentOrder || {}).status || "",
                  orderNumber: orderNumbers[i],
                  removalTime: notSearching
                    ? (pendingCurrentOrder.status == "in-progress"
                        ? "(Idle Order)"
                        : "") +
                      "Will be Removed by " +
                      removalTime.time +
                      removalTime.amOrPm +
                      " " +
                      removalTime.date
                    : "",
                  key: `${i}`,
                  text: "this man",
                };
                if (
                  listData[[orderNumbers[i]]].timeRemaining == "1 Minute" ||
                  listData[[orderNumbers[i]]].timeRemaining.includes("Second")
                ) {
                  foundAOneMinute = true;
                  console.log(
                    "(listData[[orderNumbers[i]]] ",
                    listData[[orderNumbers[i]]]
                  );
                }
                rowSwipeAnimatedValues[[i]] = new Animated.Value(0);
              })
          );
        }

        await Promise.all(promises);
        listData = this.mergeSort(Object.values(listData));
        this.checkAllRemainingTime();
        let timerId = setInterval(
          () => {
            //1 console.log("60 second called from timeout");
            this.checkAllRemainingTime();
          },
          foundAOneMinute ? 1000 : 60000
        );
        this.setState({
          listData,
          rowSwipeAnimatedValues,
          timerId,
        });
      });
  }

  merge = (left, right) => {
    let resultArray = [],
      leftIndex = 0,
      rightIndex = 0;
    //1 console.log("----------")
    // We will concatenate values into the resultArray in order
    while (leftIndex < left.length && rightIndex < right.length) {
      //1 console.log("leftIndex ", left[leftIndex][[orderBy]] )
      //1 console.log("rightIndex ", right[rightIndex][[orderBy]])
      //1 console.log("order ", orderBy)
      //1 console.log("ascending ", ascending)

      var leftOperand = left[leftIndex].status;
      var rightOperand = right[rightIndex].status;
      var result =
        statusValues[[leftOperand]] != statusValues[[rightOperand]]
          ? statusValues[[leftOperand]] < statusValues[[rightOperand]]
          : left[leftIndex].timestamp < right[rightIndex].timestamp;

      if (result) {
        resultArray.push(left[leftIndex]);
        leftIndex++; // move left array cursor
      } else {
        resultArray.push(right[rightIndex]);
        rightIndex++; // move right array cursor
      }
    }

    // We need to concat here because there will be one element remaining
    // from either left OR the right
    return resultArray
      .concat(left.slice(leftIndex))
      .concat(right.slice(rightIndex));
  };

  mergeSort = (unsortedArray) => {
    if (unsortedArray.length <= 1) {
      return unsortedArray;
    }
    // In order to divide the array in half, we need to figure out the middle
    const middle = Math.floor(unsortedArray.length / 2);

    // This is where we will be dividing the array into left and right
    const left = unsortedArray.slice(0, middle);
    const right = unsortedArray.slice(middle);
    //1 console.log("left ", left);
    //1 console.log("right ",right)
    // Using recursion to combine the left and right
    return this.merge(this.mergeSort(left), this.mergeSort(right));
  };

  closeRow = (rowMap, rowKey) => {
    if (rowMap[rowKey]) {
      rowMap[rowKey].closeRow();
    }
  };

  deleteRow = (rowMap, rowKey, orderNumber, scheduledIds) => {
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
    const end = (user || {}).email.indexOf(".edu");
    const domain = (user || {}).email.substring(start, end);
    const realEmail = (user || {}).email.substring(0, end);
    for (var i = 0; i < scheduledIds.length; i++) {
      Notifications.cancelScheduledNotificationAsync(scheduledIds[i].id);
    }
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
    //1 console.log("This row opened", rowKey);
  };

  onSwipeValueChange = (swipeData) => {
    const { key, value } = swipeData;
    rowSwipeAnimatedValues[key].setValue(Math.abs(value));
  };

  removeOrder = (orderNumber) => {};

  componentWillUnmount() {
    const user = firebase.auth().currentUser;
    const start = (user || {}).email.indexOf("@");
    const end = (user || {}).email.indexOf(".edu");
    const domain = (user || {}).email.substring(start, end);
    const realEmail = (user || {}).email.substring(0, end);
    clearInterval(this.state.timerId);
    firebase
      .database()
      .ref("users/" + domain + "/" + realEmail + "/pendingOrders")
      .off();
  }

  checkAllRemainingTime = () => {
    const user = firebase.auth().currentUser;
    const start = (user || {}).email.indexOf("@");
    const end = (user || {}).email.indexOf(".edu");
    const domain = (user || {}).email.substring(start, end);
    const realEmail = (user || {}).email.substring(0, end);
    const listData = this.state.listData;
    var foundAOneMinute = false;
    var listDataLength = listData.length;
    for (var i = 0; i < listData.length; i++) {
      console.log("checked");
      listData[i].timeRemaining = this.findRemainingTime(listData[i].timestamp);
      //1 console.log("listData[i].timeRemaining", listData[i].timeRemaining);
      if (listData[i].timeRemaining == "1 Minute") {
        foundAOneMinute = true;
        let timerId = this.state.timerId;
        if (!this.state.minuteTimer) {
          clearInterval(timerId);
          timerId = setInterval(() => {
            //1 console.log("1 minute interval");
            this.checkAllRemainingTime();
          }, 1000);
        }
        this.setState({ minuteTimer: true, timerId });
      } else if (listData[i].timeRemaining == "0 Seconds") {
        let timerId = this.state.timerId;
        if (this.state.minuteTimer && !foundAOneMinute) {
          clearInterval(timerId);
          timerId = setInterval(() => {
            //1 console.log("0 second interval");
            this.checkAllRemainingTime();
          }, 60000);
        }
        this.setState({ minuteTimer: false, timerId });
      }
      if (
        listData[i].timeRemaining == "0 Minutes" ||
        listData[i].timeRemaining == "0 Seconds"
      ) {
        console.log("listData[i] ", listData[i]);
        console.log(
          "users/" +
            domain +
            "/" +
            realEmail +
            "/pendingOrders/" +
            listData[i].orderNumber
        );
        if (listData[i].status == "searching") {
          const order = listData[i].orderNumber;
          firebase
            .database()
            .ref(
              "users/" + domain + "/" + realEmail + "/pendingOrders/" + order
            )
            .update({
              status: "expired",
              timeViewed: new Date().getTime(),
            });
        } else if (
          (listData[i].status == "expired" || listData.status == "completed") &&
          listData[i].timeViewed + 86400000 <= new Date().getTime()
        ) {
          this.deleteRow(
            {},
            listData[i].key,
            listData[i].orderNumber,
            listData[i].scheduledIds
          );
          listDataLength -= 1;
        }
      }
      // this.setState({listData})
    }
    if (listDataLength == 0) {
      clearInterval(this.state.timerId);
    }
    this.setState({ listData, refreshing: false });
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
          pendingOrderInfo: {
            orderStatus: data.item.status,
            orderIdle: data.item.removalTime == "" ? false : true,
            possibleTime: this.formatTime(data.item.originalTime + 3600000),
            chatId: data.item.chatId,
            scheduledIds: data.item.scheduledIds,
            addedToSavedOrder:data.item.addedToSavedOrder,
          },
        })
      }
      style={[styles.rowFront, { marginTop: 15, width: windowWidth }]}
      underlayColor={"#AAA"}
    >
      <View>
        <Grid style={{ height: 75 }}>
          <Col
            style={{
              width: windowWidth / 3,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <View style={{ justifyContent: "center" }}>
              <Text
                style={{ color: "green", fontSize: 25, fontWeight: "bold" }}
              >
                ${data.item.range}
              </Text>
            </View>
          </Col>
          <Col
            style={{
              width: windowWidth / 3,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: 25,
                color:
                  data.item.status == "searching"
                    ? "red"
                    : data.item.status == "expired"
                    ? "gray"
                    : data.item.status == "completed"
                    ? "green"
                    : "orange",
              }}
            >
              {data.item.status}
            </Text>
            <View
              style={{
                position: "absolute",
                bottom: 0,
                paddingTop: 5,
              }}
            >
              <Ionicons name="ios-arrow-down" size={24} color="black" />
            </View>
          </Col>
          <Col
            style={{
              width: windowWidth / 3,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <View style={{ justifyContent: "center", alignItems: "center" }}>
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
                <Text
                  style={{
                    color: data.item.timeRemaining.includes("Second")
                      ? "red"
                      : "black",
                  }}
                >
                  {data.item.timeRemaining}
                </Text>
              </View>
            </View>
          </Col>
        </Grid>
        <View
          style={{
            position: "absolute",
            justifyContent: "center",
            alignItems: "center",
            width: windowWidth,
          }}
        >
          <Text style={{ fontSize: 15, color: "gray" }}>
            {data.item.removalTime}
          </Text>
        </View>
      </View>
    </TouchableHighlight>
  );

  formatTime = (timestamp) => {
    const orderDate = new Date(parseInt(timestamp));

    const AM = orderDate.getHours() < 12 ? true : false;
    const hour =
      orderDate.getHours() <= 12
        ? (orderDate.getHours() == 0 ? 12 : orderDate.getHours())
        : orderDate.getHours() - 12;
    const minute = "0" + orderDate.getMinutes();
    const time = hour + ":" + minute.substr(-2);
    const amOrPm = AM ? "am" : "pm";
    const date = orderDate.getMonth() + 1 + "/" + orderDate.getDate();
    // const date = orderDate.getDay() + '/' + (orderDate.getMonth() + 1)
    return { time, amOrPm, date };
  };

  generateRandomString = () => {
    return Math.random().toString().substr(2, 20);
  };

  renderHiddenItem = (data, rowMap) => {
    // if(data == undefined || data.item == undefined || data.item.key == ""){
    //   return <View/>
    // }
    return (
      <View style={styles.rowBack}>
        <TouchableOpacity
          onPress={() => {
            const user = firebase.auth().currentUser;
            const start = (user || {}).email.indexOf("@");
            const end = (user || {}).email.indexOf(".edu");
            const domain = (user || {}).email.substring(start, end);
            const realEmail = (user || {}).email.substring(0, end);

            firebase
              .database()
              .ref(
                "orders/" + domain + "/currentOrders/" + data.item.orderNumber
              )
              .once("value", (snapshot) => {
                firebase
                  .database()
                  .ref("users/" + domain + "/" + realEmail + "/savedOrders/")
                  .update({
                    [[this.generateRandomString()]]: {
                      images: snapshot.val().imageNames,
                      range: snapshot.val().rangeSelected,
                      timePreference: snapshot.val().timeSelected,
                      title: "",
                      thumbnail: snapshot.val().imageNames[0],
                    },
                  });
                firebase
                  .database()
                  .ref(
                    "users/" +
                      domain +
                      "/" +
                      realEmail +
                      "/pendingOrders/" +
                      data.item.orderNumber
                  )
                  .update({
                    addedToSavedOrder: true,
                  });
              });
          }}
          style={[styles.backRightBtn, styles.backLeftBtnLeft, { padding: 10 }]}
        >
          <Text
            style={{ fontWeight: "500", fontSize: 20, textAlign: "center" }}
            adjustsFontSizeToFit={true}
            numberOfLines={data.item.addedToSavedOrder ? 1 : 3}
          >
            {data.item.addedToSavedOrder ? "Added" : "Add to Saved Orders"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.backRightBtn, styles.backRightBtnLeft]}
          onPress={() => {
            if (
              data.item.status != "expired" &&
              data.item.status != "searching"
            ) {
              const user = firebase.auth().currentUser;
              const start = (user || {}).email.indexOf("@");
              const end = (user || {}).email.indexOf(".edu");
              const email = (user || {}).email.substring(0, end);
              const domain = (user || {}).email.substring(start, end);
              const otherChatterEmail =
                data.item.chatId.substring(0, email.length) == email
                  ? data.item.chatId.substring(
                      email.length,
                      data.item.chatId.length
                    )
                  : data.item.chatId.substring(0, email.length);
              firebase
                .database()
                .ref("users/" + domain + "/" + otherChatterEmail)
                .once("value", (snapshot) => {
                  this.props.navigation.navigate("Room", {
                    thread: data.item.chatId,
                    chattingUser: snapshot.val().name,
                    otherChatterEmail: otherChatterEmail,
                  });
                });
            } else {
              this.closeRow(rowMap, data.item.key);
            }
          }}
        >
          <Text
            style={styles.backTextWhite}
            adjustsFontSizeToFit={true}
            numberOfLines={2}
          >
            {data.item.status != "expired" && data.item.status != "searching"
              ? "Go to Chat"
              : "Close"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.backRightBtn,
            styles.backRightBtnRight,
            { borderRightRadius: 10 },
          ]}
          onPress={() => {
            if (
              (data.item.removalTime == "" &&
                data.item.status == "in-progress") ||
              data.item.status != "in-progress"
            ) {
              this.setState({
                attemptToDelete: true,
                possibleTime: this.formatTime(data.item.originalTime + 3600000),
                rowMap,
                deletionScheduledIds: data.item.scheduledIds || [],
                deletionKey: data.item.key,
                deletionOrderNumber: data.item.orderNumber,
              });
            } else {
              this.setState({ attemptToDelete: true, possibleTime: {} });
            }
          }}
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

  deleteOrder = () => {
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
            <Text style={{ fontSize: 20 }}>Delete Order</Text>
          </View>
          <View
            style={{
              alignItems: "center",
              marginHorizontal: 10,
              justifyContent: "center",
              height: 100,
              flexDirection: "col",
            }}
          >
            <Text style={{ fontSize: 17 }}>
              {this.state.possibleTime == {}
                ? "Confirm Deleting this Pending Order"
                : "The order is in-progress, wait until "}

              <Text style={{ fontWeight: "500" }}>
                {this.state.possibleTime.time +
                  this.state.possibleTime.amOrPm +
                  " " +
                  this.state.possibleTime.date}
              </Text>
              <Text> to delete</Text>
            </Text>
          </View>
          {this.state.possibleTime == {} ? (
            <TouchableOpacity
              onPress={() => this.setState({ attemptToDelete: false })}
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
          ) : (
            <View style={{ flexDirection: "row" }}>
              <TouchableOpacity
                onPress={() => {
                  this.setState({ attemptToDelete: false });
                }}
              >
                <View
                  style={{
                    alignItems: "center",
                    justifyContent: "center",
                    borderTopWidth: 0.5,
                    borderRightWidth: 0.3,
                    height: 50,
                    width: 125,
                    borderColor: "gray",
                  }}
                >
                  <Text style={{ fontSize: 20 }}>Cancel</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  this.setState({ attemptToDelete: false });
                  this.deleteRow(
                    this.state.rowMap,
                    this.state.deletionKey,
                    this.state.deletionOrderNumber,
                    this.state.deletionScheduledIds
                  );
                }}
              >
                <View
                  style={{
                    alignItems: "center",
                    justifyContent: "center",
                    borderTopWidth: 0.5,
                    borderLeftWidth: 0.3,
                    width: 125,
                    height: 50,
                    borderColor: "gray",
                  }}
                >
                  <Text style={{ fontSize: 20, color: "red" }}>Delete</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}
        </View>
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
          <Text style={{ fontSize: 20 }}>Pending Orders</Text>
          <TouchableOpacity
            onPress={() => this.setState({ popupVisible: true })}
          >
            <AntDesign name="pluscircle" size={27} color="black" />
          </TouchableOpacity>
        </View>
        <View style={{ justifyContent: "space-around", flexDirection: "row" }}>
          <View style={{ width: 100 }}>
            <Text style={{ fontWeight: "bold", fontSize: 17 }}>Price</Text>
          </View>
          <View style={{ width: 75 }}>
            <Text style={{ fontWeight: "bold", fontSize: 17 }}>Status</Text>
          </View>
          <View
            style={{ width: 100, alignItems: "flex-end", overflow: "visible" }}
          >
            <Text style={{ fontWeight: "bold", fontSize: 17 }}>Expected</Text>
          </View>
        </View>
        <SwipeListView
          data={this.state.listData}
          renderItem={this.renderItem}
          renderHiddenItem={this.renderHiddenItem}
          refreshControl={
            <RefreshControl
              refreshing={this.state.refreshing}
              onRefresh={() => {
                this.setState({ refreshing: true });
                this.checkAllRemainingTime();
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
        {this.state.attemptToDelete && this.deleteOrder()}
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
    textAlign: "center",
    color: "#FFF",
    fontSize: 18,
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
  backLeftBtnLeft: {
    backgroundColor: "#FFDB0C",
    left: 0,
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
