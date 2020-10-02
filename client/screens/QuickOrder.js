import React from "react";
import { View, Text, StyleSheet, Dimensions,TouchableOpacity,TouchableWithoutFeedback,Animated } from "react-native";
import * as firebase from "firebase";
const windowWidth = Dimensions.get("window").width;
const windowHeight = Dimensions.get("window").height;
import { FontAwesome5, Ionicons,Entypo } from "@expo/vector-icons";
import * as Permissions from "expo-permissions"

export default class QuickOrder extends React.Component {

  state={
    isClickedBuyNow : false,
    warningHeight: new Animated.Value(0),
    notificationsOff:false,
    showWarning: this.props.showWarning || false,
  }
  componentDidMount(){
    const user = firebase.auth().currentUser;
    const start = (user || {}).email.indexOf("@");
    const end = (user || {}).email.indexOf(".edu");
    const domain = (user || {}).email.substring(start, end);
    const email = (user || {}).email.substring(0, end);
    setTimeout(() => {
          firebase.database().ref("users/" + domain +"/" + email).on("value",async snapshot => {
      const result = this.state.showWarning && (snapshot.val().expoToken == undefined || snapshot.val().expoToken == "" || snapshot.val().expoToken == null)
      if(result){
        this.setState({notificationsOff:true})
        this._start(this.state.warningHeight,45)
      }else{
            const {status} = await Permissions.getAsync(Permissions.CAMERA_ROLL)
            if(this.state.showWarning && status != "granted"){
              this.setState({notificationsOff:false})
              this._start(this.state.warningHeight,45)
            }
      }

    })
    }, 3000);
  }


  nextButton = () => {
    return (
      <View
        style={[
          styles.nextButton,
          {
            backgroundColor: this.props.page == 1 ? "#FFE300" : (this.props.blackBackground ? "white" :"black"),
            marginLeft: -5,
            width: windowWidth / 2 - 50,
          },
        ]}
      >
        <Text style={{color : (!this.props.blackBackground && this.props.page == 0 ? "white" : "black"),fontSize:18 }}>SELLER</Text>
                        <TouchableOpacity style={{marginLeft:5}} onPress={() => this.props.setInfoModal(1)}>
                                                        <Entypo
                            name="info-with-circle"
                            size={18}
                            color={(!this.props.blackBackground && this.props.page == 0 ? "white" : "black")}
                          />
                          </TouchableOpacity>
      </View>
    );
  };

  prevButton = () => {
    return (
      <View
        style={[
          styles.prevButton,
          {
            backgroundColor: this.props.page == 0 ? "#FFE300" : (this.props.blackBackground ? "white" :"black"),
            marginRight: -5,
            width: windowWidth / 2 - 60,
            zIndex:999,
          },
        ]}
      >
        <Text style={{color:(!this.props.blackBackground && this.props.page == 1 ? "white" : "black" ),fontSize:18}}>BUYER</Text>
                              <TouchableOpacity style={{marginLeft:5}} onPress={() => this.props.setInfoModal(0)}>
                                                        <Entypo
                            name="info-with-circle"
                            size={18}
                            color={(!this.props.blackBackground && this.props.page == 1 ? "white" : "black" )}
                          />
                          </TouchableOpacity>
      </View>
    );
  };

      _start = (variable,result) => {
    // //1 console.log("oooooooooo");
    Animated.timing(variable, {
      toValue: result,
      duration: 200,
    }).start();
  };

  render() {
    return (
<View style={{height:80}}>
          <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              try{
              this.props._swiper.scrollBy(this.props.page * -1);
              }catch(e){}
              this.props.setPage(0);
            }}
          >
            {this.prevButton()}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              try{
              this.props._swiper.scrollBy((this.props.page + 1) % 2);
              }catch(e){}
              this.props.setPage(1);
            }}
          >
            {this.nextButton()}
          </TouchableOpacity>
          </View>
          <Animated.View style={{height:this.state.warningHeight,backgroundColor:"#FFF358",flexDirection:"row",borderBottomLeftRadius:20,borderBottomRightRadius:20}}>
            <Animated.View style={{width:(windowWidth/2) - 50,paddingLeft:4,height:this.state.warningHeight,justifyContent:"center",alignItems:"center"}}>
              <Text 
                          adjustsFontSizeToFit={true}
            numberOfLines={2}>
              {this.state.notificationsOff ? 
              "*Notifications Off*" :
              "*Photo Access Off*"}
            </Text>
            </Animated.View>
                        <Animated.View style={{width:(windowWidth/2) - 50,height:this.state.warningHeight,justifyContent:"center",alignItems:"center",position:"absolute",right:0}}>
              <Text 
              style={{fontSize:17,textAlign:"center"}}
                          adjustsFontSizeToFit={true}
            numberOfLines={2}>
              Go to Apple Settings
            </Text>
            </Animated.View>
          </Animated.View>
          
          <TouchableWithoutFeedback

            onPressIn={() => this.setState({isClickedBuyNow:true})}
            onPressOut={() => this.setState({isClickedBuyNow:false})}
            onPress={() => {
              this.props.togglePopupVisibility(true);
            }}
          >
            <View
                        style={{
              position: "absolute",
              left: windowWidth / 2 - 62,
              marginTop:5,
              width: 120,
              height: 120,
              borderRadius: 120,
              backgroundColor: this.state.isClickedBuyNow ? "#FFE300" : "white",
              justifyContent: "center",
              alignItems: "center",
              borderColor: !this.state.isClickedBuyNow ? "#FFE300" : (this.props.blackBackground ? "white" : "black"),
              borderWidth: 10,
            }}>
            <FontAwesome5 name="user-friends" size={45} color="black" />
            <Text> BUY NOW</Text>
            </View>
          </TouchableWithoutFeedback>
          {(this.state.buyerInfoVisible || this.state.sellerInfoVisible) && this.infoModal()}
        </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 50,
  },
    nextButton: {
      flexDirection:"row",
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  prevButton: {
    flexDirection:"row",
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
});
