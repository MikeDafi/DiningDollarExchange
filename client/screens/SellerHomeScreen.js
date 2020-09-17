import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Dimensions,
  TouchableOpacity,
  TouchableWithoutFeedback,
  AsyncStorage,
  Animated,
} from "react-native";
const windowHeight = Dimensions.get("window").height;
const windowWidth = Dimensions.get("window").width;
import LottieView from "lottie-react-native";
import * as firebase from "firebase";
import * as FileSystem from 'expo-file-system';
export default class SellerHomeScreen extends React.Component {

    state ={
        orders : {},
        viewHeight : 0,
    }

    getTime = (timestamp) => {
        const orderDate = new Date(timestamp)
        const AM = orderDate.getHours() < 12 ? true : false
        const hour = orderDate.getHours() <= 12 ? orderDate.getHours() : orderDate.getHours() - 12
        const minute =  "0" + orderDate.getMinutes()
        return hour + ":" + minute.substr(-2) + (AM ? "am" : "pm")
    }

    _change = (variable,value) => {
        //1 console.log("oooooooooo");
        Animated.timing(variable, {
        toValue: value,
        duration: 50,
        }).start();
    };


    componentDidMount(){
        const user = firebase.auth().currentUser;
        const start = (user || {}).email.indexOf("@");
        const end = (user || {}).email.indexOf(".edu");
        const domain = (user || {}).email.substring(start, end);
        firebase.database().ref("orders/"+domain +"/currentOrders").on("value", async (orderSnapshot) =>{
            var oldOrders = this.state.orders
            const numbOfOrders = (Object.keys(orderSnapshot)).length
            //1 console.log("row " , windowWidth/50)
            //1 console.log("col ", (windowHeight - 300)/50)
            var multiArray = [...Array(Math.floor(windowWidth/50))].map((e,i) => Array(Math.floor((windowHeight -300)/50)).fill(false))
            // for(var i = 0; i < windowWidth/50;i++){
            //     for(var j = 0; j < (windowHeight - 300)/50; j++){
            //         const value = 50 * (i + 1)
            //         multiArray[i][j] = [value,false]
            //     }
            // }

            //1 console.log("rowLength", multiArray.length)
            //1 console.log("colLength ", multiArray[0].length)
            const shouldBeKept = {}
            const shouldBeDeleted = []
            var count = 0 
            var orders = {}
            //1 console.log("orders",orders )
            orderSnapshot.forEach(element => {
                count+=1
                //1 console.log("KEY ", element.key)
                if(count <=30){
                  var timeSelected = element.val().timeSelected
                  timeSelected = timeSelected.toString(10).substring(0,13)
                    const stillExists = parseInt(timeSelected) - new Date().getTime() + 60000
                  console.log(stillExists)
                    if(stillExists > 0 && element.val().status == "searching" ){
                        var randomX,randomY
                        shouldBeKept[[element.key]] = true
                        while(true){
                            randomX = Math.floor(Math.random() * ((windowWidth/50) - 1))
                            randomY =  Math.floor(Math.random() * (((windowHeight - 300)/50) - 1))
                            //1 console.log("x " + randomX + " y " + randomY)
                            //1 console.log(multiArray[randomX][randomY])
                            if(!multiArray[randomX][randomY]){
                                break
                            }
                        }
                        //1 console.log("GOOOOOO")
                        //1 console.log(element.val().timeSelected)
                        //1 console.log(element.val().buyer)
                        //1 console.log((element.val().rangeSelected || "").substring((element.val().rangeSelected != undefined ? element.val().rangeSelected.length : 2) - 2))
                        const possibleProfit = element.val().rangeSelected.includes("+") ? 12 : 
                                                (element.val().rangeSelected.includes("to") ?
                                                parseInt(element.val().rangeSelected.substring(element.val().rangeSelected.length - 2).split(' ').join('')) * 0.8 
                                                : Math.ceil(parseInt(element.val().rangeSelected) * 0.8))

                        orders[[element.key]] = {
                            formattedTime : this.getTime(parseInt(element.val().timeSelected)),
                            possibleProfit,
                            x : 50 * randomX,
                            y : 50 * randomY,
                            BuyerUid : element.val().buyerUid || "Unknown",
                            opacity : new Animated.Value(1)
                        }
                        multiArray[randomX][randomY] = true
                    }else if(element.val().status != "in-progress"){
                      shouldBeDeleted.push(element.key)
                    }
                }
            });

            const oldOrdersKeys = Object.keys(oldOrders)
            for(var i = 0; i < oldOrdersKeys.length;i++){
              if(oldOrdersKeys[i] in orders){
                orders[[oldOrdersKeys[i]]] = oldOrders[[oldOrdersKeys[i]]]
              }
            }

            this.setState({orders,multiArray})
            let viewedOrders = await AsyncStorage.getItem('viewedOrders')
            viewedOrders = JSON.parse(viewedOrders);
            const fireBasePromises = []
            const deleteStoragePromises = []
            //1 console.log("shouldBeDeleted " ,shouldBeKept)
            for(var i = 0; i < shouldBeDeleted.length ; i++){
                fireBasePromises.push(
                    firebase.database().ref("orders/"+domain +"/currentOrders/").update({[[shouldBeDeleted[i]]] : null})
                )
            }
            Object.keys(viewedOrders || []).map(key => {
              if(shouldBeKept[[key]] != true){
                deleteStoragePromises.push(() => {
                  this.deleteUri(viewedOrders[[shouldBeDeleted[i]]].uri)
                  viewedOrders[[shouldBeDeleted[i]]] = null
                })
              }
            })
            //1 console.log("orders after ",orders)
            Promise.all(fireBasePromises)
            await Promise.all(deleteStoragePromises)
            AsyncStorage.setItem("viewedOrders",JSON.stringify(viewedOrders))
            //1 console.log("set item")
        })
    }

    deleteUri = async(path) => {
    try{
      await FileSystem.deleteAsync(path, {})
                        //1 console.log("truly deleted")
      return true
    }catch(e){
      return false
      //1 console.log("ERROR deleting profile image in profile screen")
    }
    
  }

  render() {
    return (
      <View 
        onLayout={(event) => {
        var {x, y, width, height} = event.nativeEvent.layout;
        this.setState({viewHeight : height})
        }}
        style={styles.container}>
        <ImageBackground
          source={require("../assets/SellerHomeScreenBackground.jpg")}
          style={[styles.image]}
        >
          {/* <View style={{position:"absolute",left:100,top:100,width:75,height:75,backgroundColor:"red"}}> */}
          
          
          {Object.keys(this.state.orders).map((element,i) => {
          if(i >= 100){return null}
          return(
          <>
          <Animated.View
            style={{
              position: "absolute",
              left: this.state.orders[[element]].x,
              top: this.state.orders[[element]].y,
              width: 75,
              height: 75,
              opacity : this.state.orders[[element]].opacity,
              borderRadius: 75,
            }}
          >
            <LottieView
              source={require("../assets/orderCoin.json")}
              autoPlay
              resizeMode="cover"
              style={{
                marginLeft: -12,
                marginTop: -14,
                width: 150,
                height: 150,
              }}
            />
            <View style={{marginTop:-70,flexDirection:"row"}}>
                <Text style={{color:"white"}}>
                    <Text style={{fontSize:10}}>$</Text>
                    <Text>{this.state.orders[[element]].possibleProfit} </Text>
                </Text>
                <Text style={{color:"white"}}>{this.state.orders[[element]].formattedTime}</Text>
            </View>
          </Animated.View>
                      <TouchableWithoutFeedback 
                        onPressIn={() => this._change(this.state.orders[[element]].opacity,0.3)}
                        onPressOut={() => {this._change(this.state.orders[[element]].opacity,1)}}
                onPress={() => {
                    this.props.navigation.navigate("SelectedOrderModal",{
                        BuyerUid : this.state.orders[[element]].BuyerUid,
                        orderNumber  : element,
                    })
                
                }}

                    // style={{
                    // position: "absolute",
                    // left: this.state.orders[[element]].x,
                    // top: this.state.orders[[element]].y,
                    // backgroundColor:"blue",
                    // width: 75,
                    // height: 75,
                    // borderRadius: 75,
                    // }}
                >
                {/* <View style={{backgroundColor:"red",width:200,height:200}}></View> */}
                <View
                                    style={{
                    position: "absolute",
                    left: this.state.orders[[element]].x,
                    top: this.state.orders[[element]].y,
                    width: 75,
                    height: 75,
                    borderRadius: 75,
                    }}>

                </View>
                
            </TouchableWithoutFeedback>
          </>
          )
          })}
      </ImageBackground>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
  },
  image: {
    resizeMode: "cover",
    width:"100%",
    height:"100%"
  },
});
