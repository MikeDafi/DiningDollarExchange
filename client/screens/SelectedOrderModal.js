import React from "react";
import Modal from "react-native-modal";
import { Col, Row, Grid } from "react-native-easy-grid";
import * as firebase from "firebase";
import Loading from "./LoadingScreen";
import LottieView from "lottie-react-native";
import { FontAwesome, MaterialIcons, Entypo,AntDesign} from "@expo/vector-icons";
import RatingUser from "./RatingUser"
import Dialog, { DialogFooter, DialogButton, DialogContent } from 'react-native-popup-dialog';
import Swiper from "react-native-swiper/src";
import SwipeButton from 'rn-swipe-button';
import arrowRight from '../assets/arrowRight.png';
import ImageViewer from "react-native-image-zoom-viewer";
import * as FileSystem from 'expo-file-system';
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
  Image,
  ActivityIndicator,
  AsyncStorage,
  Keyboard,
} from "react-native";
const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;


export default class SelectedOrderModal extends React.Component {
  state = {
      animatedWidth: new Animated.Value(0),
      animatedHeight: new Animated.Value(0),
      searching : true,
      rangeSelected: "",
      timeSelected: "",
      amOrPm : "",
      dateSelected:"",
      imageUrls : [],
      imageNames : [],
      profileImage: "",
      buyerEmail: "",
      buyerStarRating:5,
      possibleProfitVisible: false,
      carouselHeight : 0,
      cancelHighlight:false,
      modalOn: false,
      imageIndex : 0,
      showImageViewer: false,
  };

  timestamp = () => {
    return firebase.database.ServerValue.TIMESTAMP;
  };
  
  agreeToOrder = () => {
    console.log("agreed")
    this.orderRef().once("value", async (snapshot) => {
      const order = snapshot.val()
          const user = firebase.auth().currentUser;
    const end = user.email.indexOf(".com");
    const email = user.email.substring(0, end);
      if(order.status == "searching" && this.state.buyerEmail != email){
        this.setState({modalOn : false,acceptedOrderVisible: true})
        const name = "";
        const myUser = firebase
          .auth()
          .currentUser.email.substring(
            0,
            firebase.auth().currentUser.email.length - 4
          );
        const start = myUser.indexOf("@");
        const domain = firebase.auth().currentUser.email.substring(
          start,
          firebase.auth().currentUser.email.length - 4
        );
        this.orderRef().update({ status: "in-progress" });
        const promises = []
          firebase
            .database()
            .ref(
              "users/" +
                domain +
                "/" +
                myUser +
                "/chats/seller/" +
                order.buyer +
                myUser +
                "/"
            )
          .set({
            timestamp: this.timestamp(),
            text: "Image",
            read: false //COULD CAUSE ERROR BECAUSE SOMEONE COULD ALREADY BE READING
          });
          firebase
            .database()
            .ref(
              "users/" +
                domain +
                "/" +
                order.buyer +
                "/chats/buyer/" +
                order.buyer +
                myUser +
                "/"
            )
            .set({
              timestamp: this.timestamp(),
              text: "Image",
              read: false
            });
        
        const buyerSentMessage = order.buyer + "_hasSentMessage";

          firebase
            .database()
            .ref("/chats/" + domain + "/" + order.buyer + myUser + "/"+ order.buyer)
            .update({ [buyerSentMessage]: true });
                    firebase
            .database()
            .ref("/chats/" + domain + "/" + order.buyer + myUser + "/")
            .update({ [buyerSentMessage]: true });

        const path =
        "/chats/" + domain + "/" + order.buyer + myUser + "/chat";
        for (var i = 0; i < this.state.imageNames.length; i++) {
          // console.log("length ",notification.data.data.imageNames.length)
          // console.log("orderImages ", 'tempPhotos/' + domain + "/" + order.buyer)
          // console.log("befor",notification.data.data.imageNames[i] + ".jpg")
          // console.log("orderImages ", 'tempPhotos/' + domain + "/" + order.buyer)
          //console.log("BEFORE")
          var message = {
            text: "",
            image: this.state.imageUrls[i].url,
            timestamp: this.timestamp(),
            user: { _id: this.props.navigation.state.params.BuyerUid },
          };
          console.log("message", message)
          firebase.database().ref(path).push(message);
        }

      this._close(this.state.animatedWidth); 
      this._close(this.state.animatedHeight)
      this.setState({acceptedOrderVisible:undefined})
      this.props.navigation.goBack();
      this.props.navigation.navigate("Room", {
        thread: order.buyer + myUser,
        chattingUser: this.state.buyerName,
        otherChatterEmail: order.buyer,
      })
      }else{
        this.setState({acceptedOrderVisible : false})
      }
    })
  }

  uriToBlob = async (uri) => {
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

  model = () => {
    return(
            <Modal
        testID={"modal"}
        isVisible={this.state.showImageViewer}
        onBackdropPress={() => {this.setState({showImageViewer:false})}}
        animationIn="slideInUp"
        animationInTiming={500}
        style={{ overflow:"visible",width: windowWidth, height: windowHeight, margin: 0 }}
      >
        <ImageViewer
          index={this.state.imageIndex}
          imageUrls={this.state.imageUrls}
          enableSwipeDown
          onSwipeDown={() => this.setState({showImageViewer : false})}
        />
        <View style={{ position: "absolute", left: windowWidth - 50, top: 30 }}>
          <TouchableOpacity onPress={() => this.setState({showImageViewer : false})}>
            <AntDesign name="close" size={35} color="white" />
          </TouchableOpacity>
        </View>
      </Modal>
    )
  }

  takePhotoFromTemp = (index, path ) => {
    console.log("path ",path)
    this.uriToBlob(this.state.imageUrls[index]).then((blob) => {
      this.uploadToFirebase(blob, path + this.state.imageNames[index]);
      // console.log("here i am", path + name)
      var message = {
        text: "",
        image: this.state.imageUrls[index],
        timestamp: this.timestamp(),
        user: { _id: this.props.navigation.state.params.BuyerUid, name: this.state.imageNames[index] },
      };
      console.log("message", message)
      firebase.database().ref(path).push(message);
    });
  };

  orderRef = () => {
     const myUser = firebase
      .auth()
      .currentUser.email.substring(
        0,
        firebase.auth().currentUser.email.length - 4
      );
    const start = myUser.indexOf("@");
    const domain = firebase.auth().currentUser.email.substring(
      start,
      firebase.auth().currentUser.email.length - 4
    );
    return firebase
      .database()
      .ref(
        "orders/" +
          domain +
          "/currentOrders/" +
          this.props.navigation.state.params.orderNumber
      )
  }
  
  componentDidMount(){
     const myUser = firebase
      .auth()
      .currentUser.email.substring(
        0,
        firebase.auth().currentUser.email.length - 4
      );
    const start = myUser.indexOf("@");
    const domain = firebase.auth().currentUser.email.substring(
      start,
      firebase.auth().currentUser.email.length - 4
    );
    console.log("85");
    console.log("order Number ", this.props.navigation.state.params)
    this.orderRef()
      .once("value", async (snapshot) => {
        //console.log("snapshot","orders/"+domain + "/currentOrders/" + notification.data.data.orderNumber)
        const order = snapshot.val();
        console.log("order",order)
        if (order.status == "searching") {
          const name = "";
          const profileImagePath =
            "profilePics/" + domain + "/" + order.buyer + "/profilePic.jpg";
          this.formatTime(order.timeSelected)
          this.setState({rangeSelected : order.rangeSelected,imageNames : order.imageNames,imageUrls:order.imageUrls || [],buyerEmail: order.buyer})
          const promises = []
          promises.push(firebase.database().ref("/users/" + domain + "/" + order.buyer+ "/").once("value",(snapshot) => {
            this.setState({buyerStarRating : snapshot.val().starRating,buyerName : snapshot.val().name})
          }))
          promises.push(firebase.storage().ref().child(profileImagePath).getDownloadURL().then((foundURL) => {
              this.setState({ profileImage: foundURL})
          }))
          let viewedOrders = await AsyncStorage.getItem('viewedOrders')
          viewedOrders = JSON.parse(viewedOrders);
          if(!viewedOrders){
            console.log("viewed orders doesn't exist")
            viewedOrders = {[[this.props.navigation.state.params.orderNumber]] : {}}
          }else if(!viewedOrders[[this.props.navigation.state.params.orderNumber]]){
            viewedOrders[[this.props.navigation.state.params.orderNumber]] = {}
            console.log("viewed orders exists")
          }

          var allImagesExist = true 
          order.imageNames.map((name) => {
            if(!viewedOrders[[this.props.navigation.state.params.orderNumber]][[name]]){
              allImagesExist = false
            }
          })
          console.log("this order " , viewedOrders[[this.props.navigation.state.params.orderNumber]])
          const imageUrls = this.state.imageUrls
          if(!allImagesExist){
            order.imageNames.map((name) => {
              promises.push(
                firebase.storage().ref(`/tempPhotos/${domain}/${order.buyer}/processingOrders/${this.props.navigation.state.params.orderNumber}/${name}.jpg`).getDownloadURL()
                  .then(async (foundURL) => {
                    console.log("foundURL ", foundURL)
                    console.log("viewedorders...[[name]] ", viewedOrders[[this.props.navigation.state.params.orderNumber]][[name]])
                    if(!viewedOrders[[this.props.navigation.state.params.orderNumber]][[name]]){
                      const uri = await this.downloadUrl(foundURL,name)
                      viewedOrders[[this.props.navigation.state.params.orderNumber]][[name]]= {url : foundURL,uri}
                    }
                    console.log("got uri")
                    imageUrls.push({url : viewedOrders[[this.props.navigation.state.params.orderNumber]][[name]].uri})
                  })
              )
            })
            await Promise.all(promises)
            this.setState({imageUrls})
            AsyncStorage.setItem("viewedOrders",JSON.stringify(viewedOrders))
          }else{
            order.imageNames.map((name) => {
              imageUrls.push({url : viewedOrders[[this.props.navigation.state.params.orderNumber]][[name]].url,
                        uri : viewedOrders[[this.props.navigation.state.params.orderNumber]][[name]].uri})
            })
          }
          this.setState({imageUrls})
          console.log("setitems");
        }else{
          this.setState({acceptedOrderVisible : false})
        }
      });

  }

  downloadUrl = async (url,name) => {
    const callback = downloadProgress => {
    const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
    // this.setState({
    //   downloadProgress: progress,
    // });
    }

   console.log("url ", url)
   await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory +"otherChattersProfileImages/",{intermediates:true})
  // const downloadResumable = FileSystem.createDownloadResumable(
  //     url,
  //     FileSystem.documentDirectory  + name + ".png",
  //     {},
  //     callback
  //   )

    try {
      const { uri } = await FileSystem.downloadAsync(
              url,
      FileSystem.documentDirectory  + "otherChattersProfileImages/" + name + ".png",
      {},
      callback
      );
      console.log('Finished downloading to ', uri);
      return uri;
    } catch (e) {
      console.error(e);
    }


    // try {
    //   await downloadResumable.pauseAsync();
    //   console.log('Paused download operation, saving for future retrieval');
    //   AsyncStorage.setItem('pausedDownload', JSON.stringify(downloadResumable.savable()));
    // } catch (e) {
    //   console.error(e);
    // }

    // try {
    //   const { uri } = await downloadResumable.resumeAsync();
    //   console.log('Finished downloading to ', uri);
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
    //   console.log('Finished downloading to ', uri);
    // } catch (e) {
    //   console.error(e);
    // }
  }

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
      duration: 600,
    }).start();
  };

  _close =  (heightVariable) => {
    console.log("iiiiii");
     Animated.timing(heightVariable, {
      toValue: 0,
      duration: 200,
    }).start();
  };

  formatTime = (timestamp) => {

    const orderDate = new Date(parseInt(timestamp))

    const AM = orderDate.getHours() < 12 ? true : false
    const hour = AM ? orderDate.getHours() : orderDate.getHours()  - 12
    const minute =  "0" + orderDate.getMinutes()
    const time = hour + ":" + minute.substr(-2)
    const date = orderDate.getDay() + '/' + (orderDate.getMonth() + 1)
    this.setState({timeSelected : time, dateSelected : date,amOrPm:(AM ? "am" : "pm")})
  }

  acceptedOrderError = () => {
    const user = firebase.auth().currentUser;
    const end = user.email.indexOf(".com");
    const email = user.email.substring(0, end);
    return(
      <View style={{position:"absolute",width:windowWidth,height:windowHeight,justifyContent:"center",alignItems:"center",backgroundColor: 'rgba(0,0,0,0.8)'}}>
        <View style={{
          width:250,
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
            <Text style={{fontSize:20}}>Order Error</Text>
          </View>
          <View style={{
              alignItems:"center",
              marginHorizontal:10,
              justifyContent:"center",
              height:100,}}>
            <Text style={{fontSize:15,justifyContent:"center"}}>
              {email == this.state.buyerEmail ? "You can't accept your own order." : "Someone Has Already Accepted the Order."}
            </Text>
          </View>
          <TouchableOpacity onPress={() => {
          this.setState({acceptedOrderVisible : false})
          this._close(this.state.animatedWidth); 
          this._close(this.state.animatedHeight)
          this.props.navigation.goBack();
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
  }

  possibleProfit = () => {
    return(
      <View style={{position:"absolute",width:windowWidth,height:windowHeight,justifyContent:"center",alignItems:"center",backgroundColor: 'rgba(0,0,0,0.8)'}}>
        <View style={{
          width:250,
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
            <Text style={{fontSize:20}}>Possible Profit</Text>
          </View>
          <View style={{
              alignItems:"center",
              marginHorizontal:10,
              justifyContent:"center",
              height:100,}}>
            <Text style={{fontSize:15}}>
              <Text>You Make </Text>
              <Text style={{fontWeight:"700"}}>80%</Text>
              <Text> in </Text>
              <Text style={{color:"green"}} >Cash</Text>
            {this.state.rangeSelected.includes("to") ?
                <Text>
                  <Text>. For a "{this.state.rangeSelected}" range, the </Text>
                  <Text style={{fontWeight:"bold"}}> maximum </Text>
                  <Text> profit is </Text>
                </Text>
            :(this.state.rangeSelected.includes("+") ? 
              <Text>
                <Text>. For a "{this.state.rangeSelected}" range, the </Text>
                <Text style={{fontWeight:"bold"}}> minimum </Text>
                <Text> profit is </Text>
              </Text>
              :
              <Text>
                <Text>. For a price of ${this.state.rangeSelected}, the </Text>
                <Text> profit is </Text>
              </Text>

            )}
            </Text>
            {this.state.rangeSelected.includes("to") ?
              <Text style={{fontWeight:"700",color:"#4CBB17",fontSize:18}}>{parseInt(this.state.rangeSelected.substring(this.state.rangeSelected.length - 2).split(' ').join('')) * 0.8} Dollars</Text>
            :(this.state.rangeSelected.includes("+") ?
              <Text style={{fontWeight:"700",color:"#4CBB17",fontSize:18}}>12 Dollars</Text> : 
              <Text style={{fontWeight:"700",color:"#4CBB17",fontSize:18}}>{Math.ceil(parseInt(this.state.rangeSelected) *0.8)} Dollars</Text>
            )}
          </View>
          <TouchableOpacity onPress={() => this.setState({possibleProfitVisible : false})}>
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
  }

  render() {
    const firstRowHeight = (windowHeight - 100)/8
    const firstRowPadding = 8
    const secondRowHeight = (windowHeight - 100)/10
    const modalWidth = windowWidth - 50
    const itemsCount = 50
    return (
      <>
      {!this.state.showImageViewer ?
      <Modal
        testID={"modal"}
        coverScreen={true}
        hasBackdrop={true}
        isVisible={true}
        animationInTiming={0.00000000000001}
        hideModalContentWhileAnimating={true}
        style={{
          alignItems: "center",
        }}
        onModalWillShow={()=> {this._startWidth(this.state.animatedWidth); this._startHeight(this.state.animatedHeight)}}
        onModalShow={() => this.setState({modalOn:true})}
        onModalWillHide={() => {this._close(this.state.animatedWidth); this._close(this.state.animatedHeight)}}
        onBackdropPress={ () =>{
          this.setState({modalOn : false})
          this._close(this.state.animatedWidth); 
          this._close(this.state.animatedHeight)
          this.props.navigation.goBack();
          // this.props.togglePopupVisibility(false)
        }}
      >
        <Animated.View
          style={{
            justifyContent: 'center',
            alignItems:"center",
            backgroundColor: "white",
            height: this.state.animatedHeight,
            width: this.state.animatedWidth,
            borderRadius: 20,
          }}
        >
        {this.state.modalOn && 
        <Grid>
          <Row style={{width:modalWidth,
                      height:firstRowHeight,
                      borderTopLeftRadius:20,
                      borderTopRightRadius:20,
                      justifyContent:"flex-start",
                      alignItems:"flex-start",
                      paddingTop:firstRowPadding,
                      paddingHorizontal:firstRowPadding}}>
            <Col style={{width:firstRowHeight - firstRowPadding}}>
              <View style={{ 
                borderRadius: firstRowHeight - firstRowPadding,
                height: firstRowHeight - firstRowPadding,
                borderColor: "black",
                borderWidth: 1,
                alignItems: "center",
                justifyContent: "center"}}>
                {this.state.profileImage != "" ? (
                  <Image
                    source={{ url: this.state.profileImage }}
                    style={{             
                        borderRadius: firstRowHeight - firstRowPadding,
                        width: firstRowHeight - firstRowPadding,
                        height: firstRowHeight - firstRowPadding,
                        borderColor: "black",
                        borderWidth: 1,
                        alignItems: "center",
                        justifyContent: "center"}}
                  />
                ) : (
                  <FontAwesome name="user" size={50} color="black" />
                )}
              </View>
            </Col>
            <Col style={{height:firstRowHeight - firstRowPadding,paddingTop:5,paddingLeft:5,justifyContent:"center"}}>
            
              <Text numberOfLines={1} style={{fontSize:25}}>{this.state.buyerName}</Text>
              <Row style={{alignItems:"flex-start"}}>
                <Text style={{fontSize:20,color:"gray"}}>{this.state.buyerStarRating}</Text>
                <MaterialIcons name="star" size={24} color="#FFE300" />
              </Row>
            </Col>
          </Row>
          <Row style={{borderColor:"gray",height:secondRowHeight,borderBottomWidth:0.3,marginHorizontal:10}}>
            <Col style={{alignItems:"center",justifyContent:"center"}}>
              
              <Text style={{fontSize:27,fontWeight:"600",color:"#4cBB17"}}>{this.state.rangeSelected}</Text>
              <Text style={{fontSize:9,color:"gray"}}>Price Range</Text>
            </Col>
            <Col style={{alignItems:"center",justifyContent:"center"}}>
              <View style={{flexDirection:"row",justifyContent:"center"}}>
                <Text style={{fontSize:27,fontWeight:"300"}}>{this.state.timeSelected}</Text>
                <View>
                  <Text>{this.state.dateSelected}</Text>
                  <Text>{this.state.amOrPm}</Text>
                </View>
              </View>
              <Text style={{fontSize:9,color:"gray"}}>Expected By</Text>
            </Col>
            <Col style={{justifyContent:"flex-start",alignItems:"center"}}>
              <LottieView
              style={{width:65,height:65,position:"absolute",marginTop:-3}}
                source={require("../assets/yellowCircle.json")}
                autoPlay
              />
              
              <Text style={{marginTop:7,}}>
              <Text style={{marginLeft:3,fontSize:10}}>$</Text>
                <Text style={{fontSize:26,fontWeight:"700"}}>
              {this.state.rangeSelected.includes("+") ? 12 : 
                  (this.state.rangeSelected.includes("to") ?
                  parseInt(this.state.rangeSelected.substring(this.state.rangeSelected.length - 2).split(' ').join('')) * 0.8 
                  : Math.ceil(parseInt(this.state.rangeSelected) * 0.8))
              
              }
                </Text>
              </Text>
              <TouchableOpacity style={{flexDirection:"row",marginTop:6}} onPress={() => this.setState({possibleProfitVisible:true})}>
                <Text style={{fontSize:9,color:"gray"}}>Possible Profit</Text>
                <View style={{marginLeft:3,marginTop:-2}}>
                  <Entypo name="info-with-circle" size={12} color="black" />
                </View>
              </TouchableOpacity>
            </Col>
            
          </Row>
          <Row>
            <View
              style={{alignItems:"center"}}
              onLayout={(event) => {
                var {x, y, width, height} = event.nativeEvent.layout;
                this.setState({carouselHeight : height})
              }}
            >
              <ScrollView 
                ref={(scrollView) => { this.scrollView = scrollView; }}
                style={{width:modalWidth}}
                contentContainerStyle={{alignItems:"center"}}
                //pagingEnabled={true}
                horizontal= {true}
                decelerationRate={0}
                snapToOffsets={this.state.imageUrls.map((x, i) => (i * (modalWidth - 60)) )}
                snapToAlignment={"start"}
                contentInset={{
                  top: 0,
                  left: 30,
                  bottom: 0,
                  right: 30,
              }}>
                {this.state.imageUrls.map((x, i) =>
                          // <View 
                          //   onLayout={(event) => {
                          //     var {x, y, width, height} = event.nativeEvent.layout;
                          //     this.setState({carouselHeight : height})
                          //   }}
                          //   style={{margin:25,width:modalWidth ,alignItems:"center",justifyContent:"center",backgroundColor:"gray",backgroundOpacity:0.5,borderRadius:20}}>
                          //   {/* // source={{ url: item }}/> */}
                          //   <Image style={{resizeMode:"contain",width:modalWidth-30,height:this.state.carouselHeight-30}} source={require('./StartPage.png')}/>
                          // </View>
                  <View key={i}
                    style={[styles.view, {height:this.state.carouselHeight - 60,alignItems:"center",justifyContent:"center",width: modalWidth - 100,backgroundColor: 'rgba(252,220,0,1)'}]} >
                    <TouchableOpacity activeOpacity={0.7} onPress={() => {this.setState({showImageViewer : true,imageIndex:i})}}>
                      
                      <Image key={i} style={{resizeMode:"contain",width:modalWidth-100,height:this.state.carouselHeight-100}} source={{ uri: x.uri }}/>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            </View>
          </Row>
          <Row style={{height:60,borderTopWidth: 2,borderBottomLeftRadius:20,borderBottomRightRadius:20}}>
            <TouchableWithoutFeedback
              onPressIn={() => this.setState({ cancelHighlight: true })}
              onPressOut={() => this.setState({ cancelHighlight: false })}
              onPress={() => {
                this.setState({modalOn : false})
                this._close(this.state.animatedWidth); 
                this._close(this.state.animatedHeight)
                this.props.navigation.goBack();
              }}
            >
              <Col
                style={{
                  backgroundColor: this.state.cancelHighlight
                    ? "#C5C5C5"
                    : "white",
                  justifyContent: "center",
                  borderBottomLeftRadius:20,
                  borderColor: "black",
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 20,textDecorationLine: 'underline',color:"#FD7070" }}>
                  Reject
                </Text>
              </Col>
            </TouchableWithoutFeedback>
            <SwipeButton 
              width={modalWidth - 80}
              swipeSuccessThreshold={50}
              onSwipeSuccess={() =>  {this.agreeToOrder()}}
              onSwipeFail={() => console.log("onSwipeFail")}
              thumbIconStyles={{justifyContent:"center",alignItems:"center"}}
              thumbIconImageSource={arrowRight}
              thumbIconBackgroundColor="white"
              thumbIconBorderColor="black"
              title={"Accept Order"}
              railBackgroundColor="white"
              renderMessageImage={null}
              railFillBorderColor="rgba(252,220,0,1)"
              railFillBackgroundColor="rgba(252,220,0,1)"
          />
          </Row>

        </Grid>}
        <View style={{top:-50,right:0,position:"absolute"}}>
          <TouchableOpacity onPress={() => {
                      this.setState({modalOn : false})
          this._close(this.state.animatedWidth); 
          this._close(this.state.animatedHeight)
          this.props.navigation.goBack();
          }}>
            <AntDesign name="close" size={50} color="white" />
          </TouchableOpacity>
        </View>
        {this.state.acceptedOrderVisible != undefined && (this.state.acceptedOrderVisible ?
          <ActivityIndicator size="large"></ActivityIndicator>
        :
          this.acceptedOrderError()
        )}
        </Animated.View> 

        {this.state.possibleProfitVisible &&
          this.possibleProfit()
        }
      </Modal> : 
      this.model()}
      </>
    );
  }
}

const styles = StyleSheet.create({
  container: {},
  view: {
    backgroundColor: 'blue',
    marginHorizontal: 20,
    borderRadius: 20,
    borderWidth:2,
    borderColor:"black"
  },
});