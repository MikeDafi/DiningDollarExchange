import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import * as firebase from "firebase";
import { AntDesign } from "@expo/vector-icons";
import AwesomeButton from "react-native-really-awesome-button";
import Swiper from "react-native-swiper/src";

const windowWidth = Dimensions.get("window").width;
const windowHeight = Dimensions.get("window").height;

export default class TutorialScreen extends React.Component {

    state = {
        buyerPages:undefined,
    }

    firstBuyerPage = () => (
        <View style={{ alignItems: "center" }}>
            <View
              style={{
                padding: 10,
                marginBottom: 10,
                marginTop: 85,
                backgroundColor: "white",
                borderRadius: 50,
              }}
            >
              <Text style={{ fontSize: 25, fontWeight: "700" }}>
                Click "Buy Now" to Buy Meal
              </Text>
            </View>
            <View style={styles.image}>
              <Image
                source={require("../assets/TutorialBuyerScreen1.1.jpg")}
                style={{
                  resizeMode: "contain",
                  width:
                    100 < windowWidth - 100
                      ? (100 * 1125) / 368
                      : ((windowWidth - 100) * 1125) / 368,
                  height: 100,
                }}
              />
            </View>
            <View
              style={{
                padding: 10,
                marginBottom: 10,
                marginTop: 70,
                backgroundColor: "white",
                borderRadius: 50,
              }}
            >
              <Text
                style={{ fontSize: 25, fontWeight: "700", textAlign: "center" }}
              >
                Put the Grubhub Images, Price, and Date
              </Text>
            </View>
            <View style={styles.image}>
              <Image
                source={require("../assets/TutorialBuyerScreen1.2.jpg")}
                style={{
                  resizeMode: "contain",
                  width:
                    300 < windowWidth - 100
                      ? (300 * 1125) / 885
                      : ((windowWidth - 100) * 1125) / 885,
                  height: 300,
                }}
              />
            </View>
            <View
              style={{
                padding: 5,
                marginBottom: 10,
                backgroundColor: "white",
                borderRadius: 50,
              }}
            >
              <Text
                style={{ fontSize: 20, fontWeight: "700", textAlign: "center" }}
              >
                *You Can Save Order*
              </Text>
            </View>
          </View>
    )
    secondBuyerPage = () => (
        <View style={{ alignItems: "center" }}>
            <View
              style={{
                padding: 10,
                marginBottom: 10,
                marginTop: 85,
                backgroundColor: "white",
                borderRadius: 50,
              }}
            >
              <Text style={{ fontSize: 23, fontWeight: "500" ,textAlign:"center"}}                         adjustsFontSizeToFit={true}
                        numberOfLines={1}>
                When the Seller Accepts Your Order,
              </Text>
              <Text style={{fontSize:24,fontWeight:"700",textAlign:"center"}}                         adjustsFontSizeToFit={true}
                        numberOfLines={1}>Go to Messages</Text>

            </View>
            <View style={styles.image}>
              <Image
                source={require("../assets/TutorialBuyerScreen2.jpg")}
                style={{
                  resizeMode: "contain",
                  width:windowWidth - 50,
                  height: windowHeight - 250,
                }}
              />
            </View>
            
          </View>
    )

    thirdBuyerPage = () => (
        <View style={{ alignItems: "center" }}>
            <View
              style={{
                padding: 10,
                marginBottom: 10,
                marginTop: 85,
                backgroundColor: "white",
                borderRadius: 50,
              }}
            >
              <Text style={{ fontSize: 23, fontWeight: "500" ,textAlign:"center"}}                         adjustsFontSizeToFit={true}
                        numberOfLines={1}>
                Seller will send a Confirmation Message
              </Text>
              <Text style={{fontSize:24,fontWeight:"700",textAlign:"center"}}                         adjustsFontSizeToFit={true}
                        numberOfLines={1}>Confirm the Price</Text>
            </View>
            <View style={styles.image}>
              <Image
                source={require("../assets/TutorialBuyerScreen3.jpg")}
                style={{
                  width:windowWidth - 50,
                  height: windowHeight - 250,
                }}
              />
            </View>
            
          </View>
    )

    fourthBuyerPage = () => (
        <View style={{ alignItems: "center" }}>
            <View
              style={{
                padding: 10,
                marginBottom: 10,
                marginTop: 85,
                backgroundColor: "white",
                borderRadius: 50,
              }}
            >
              <Text style={{ fontSize: 23, fontWeight: "500" ,textAlign:"center"}}                         adjustsFontSizeToFit={true}
                        numberOfLines={1}>
                Pay the Seller from the Payment Options.
              </Text>
              <Text style={{fontSize:24,fontWeight:"700",textAlign:"center"}}                         adjustsFontSizeToFit={true}
                        numberOfLines={1}>Send Proof of Payment</Text>
            <Text style={{ fontSize: 18, textAlign:"center",fontWeight: "500",color:"gray" }}                         adjustsFontSizeToFit={true}
                        numberOfLines={1}>
                You, the Buyer, will pay before Seller makes Order
              </Text>
            </View>
            <View style={styles.image}>
              <Image
                source={require("../assets/TutorialBuyerScreen4.jpg")}
                style={{
                  resizeMode: "contain",
                  width:windowWidth - 50,
                  height: windowHeight - 250,
                }}
              />
            </View>
            
          </View>
    )

    fifthBuyerPage = () => (
        <View style={{ alignItems: "center" }}>
            <View
              style={{
                padding: 10,
                marginBottom: 10,
                marginTop: 85,
                backgroundColor: "white",
                borderRadius: 50,
              }}
            >
              <Text style={{ fontSize: 23, fontWeight: "500" ,textAlign:"center"}}                         adjustsFontSizeToFit={true}
                        numberOfLines={1}>
                The Seller will send Proof of Purchase Order
              </Text>
              <Text style={{fontSize:24,fontWeight:"700",textAlign:"center"}}                         adjustsFontSizeToFit={true}
                        numberOfLines={1}>Done!</Text>
            <Text style={{ fontSize: 18, textAlign:"center",fontWeight: "500",color:"gray" }}                         adjustsFontSizeToFit={true}
                        numberOfLines={1}>
                If there are any issues report in Messages or Settings
              </Text>
            </View>
            <View style={styles.image}>
              <Image
                source={require("../assets/TutorialBuyerScreen5.jpg")}
                style={{
                  resizeMode: "contain",
                  width:windowWidth - 50,
                  height: windowHeight - 250,
                }}
              />
            </View>
            
          </View>
    )

      firstSellerPage = () => (
        <View style={{ alignItems: "center" }}>
            <View
              style={{
                padding: 10,
                marginBottom: 10,
                marginTop: 85,
                backgroundColor: "white",
                borderRadius: 50,
              }}
            >
              <Text style={{ fontSize: 24, fontWeight: "700" ,textAlign:"center"}}                         adjustsFontSizeToFit={true}
                        numberOfLines={1}>
                Go to Seller Home Screen
              </Text>
            <Text style={{ fontSize: 18, textAlign:"center",fontWeight: "500",color:"gray" }}                         adjustsFontSizeToFit={true}
                        numberOfLines={1}>
                *Click on an Order*
              </Text>
            </View>
            <View style={styles.image}>
              <Image
                source={require("../assets/TutorialSellerScreen1.jpg")}
                style={{
                  resizeMode: "contain",
                  width:windowWidth - 50,
                  height: windowHeight - 250,
                }}
              />
            </View>
            
          </View>
    )
      secondSellerPage = () => (
        <View style={{ alignItems: "center" }}>
            <View
              style={{
                padding: 10,
                marginBottom: 10,
                marginTop: 85,
                backgroundColor: "white",
                borderRadius: 50,
              }}
            >

              <Text style={{fontSize:24,fontWeight:"700",textAlign:"center"}}                         adjustsFontSizeToFit={true}
                        numberOfLines={1}>View and Accept Order!</Text>
            </View>
            <View style={styles.image}>
              <Image
                source={require("../assets/TutorialSellerScreen2.jpg")}
                style={{
                  resizeMode: "contain",
                  width:windowWidth - 50,
                  height: windowHeight - 250,
                }}
              />
            </View>
            
          </View>
    )
      thirdSellerPage = () => (
        <View style={{ alignItems: "center" }}>
            <View
              style={{
                padding: 10,
                marginBottom: 10,
                marginTop: 85,
                backgroundColor: "white",
                borderRadius: 50,
              }}
            >
              <Text style={{ fontSize: 24, fontWeight: "500" ,textAlign:"center"}}                         adjustsFontSizeToFit={true}
                        numberOfLines={2}>
                Prepare Their Order on Grubhub. Then, Confirm Order with Buyer
              </Text>
            <Text style={{ fontSize: 18, textAlign:"center",fontWeight: "500",color:"gray" }}                         adjustsFontSizeToFit={true}
                        numberOfLines={1}>
                *The Buyer must accept Confirmation before you purchase* 
              </Text>
            </View>
            <View style={styles.image}>
              <Image
                source={require("../assets/TutorialSellerScreen3.jpg")}
                style={{
                  resizeMode: "contain",
                  width:windowWidth - 50,
                  height: windowHeight - 250,
                }}
              />
            </View>
            
          </View>
    )
      fourthSellerPage = () => (
        <View style={{ alignItems: "center" }}>
            <View
              style={{
                padding: 10,
                marginBottom: 10,
                marginTop: 85,
                backgroundColor: "white",
                borderRadius: 50,
              }}
            >
              <Text style={{ fontSize: 23, fontWeight: "500" ,textAlign:"center"}}                         adjustsFontSizeToFit={true}
                        numberOfLines={2}>
                After Buyer Accepts, wait for Payment before Ordering
              </Text>
            </View>
            <View style={styles.image}>
              <Image
                source={require("../assets/TutorialSellerScreen4.jpg")}
                style={{
                  resizeMode: "contain",
                  width:windowWidth - 50,
                  height: windowHeight - 250,
                }}
              />
            </View>
            
          </View>
    )
      fifthSellerPage = () => (
        <View style={{ alignItems: "center" }}>
            <View
              style={{
                padding: 10,
                marginBottom: 10,
                marginTop: 85,
                backgroundColor: "white",
                borderRadius: 50,
              }}
            >
              <Text style={{ fontSize: 23, fontWeight: "500" ,textAlign:"center"}}                         adjustsFontSizeToFit={true}
                        numberOfLines={1}>
                Send Proof of Purchased Grubhub Order
              </Text>
              <Text style={{fontSize:24,fontWeight:"700",textAlign:"center"}}                         adjustsFontSizeToFit={true}
                        numberOfLines={1}>Done!</Text>

            </View>
            <View style={styles.image}>
              <Image
                source={require("../assets/TutorialSellerScreen5.jpg")}
                style={{
                  resizeMode: "contain",
                  width:windowWidth - 50,
                  height: windowHeight - 250,
                }}
              />
            </View>
            
          </View>
    )

  areYouBuyerOrSeller = () => (
    <View style={{flexDirection:"row"}}>
      <View style={{backgroundColor:"white",width:windowWidth/2,height:windowHeight,justifyContent:"flex-start",alignItems:"center",paddingTop:100}}>
      <View style={{alignItems:"center",paddingHorizontal:10}}>
      <Text style={{fontSize:100,textAlign:"center"}} adjustsFontSizeToFit={true} numberOfLines={1}>Pay ONLY</Text>
      <Text style={{fontSize:100,textAlign:"center",fontWeight:"700"}} adjustsFontSizeToFit={true} numberOfLines={1}>80%</Text>
      <Text style={{fontSize:100,textAlign:"center"}} adjustsFontSizeToFit={true} numberOfLines={1}> of any price on</Text>
      <Image source={require("../assets/grubhub.png")} style={{resizeMode:"contain",height:(windowWidth/2) - 70,width:(windowWidth/2) - 70}}/>
      </View>
   <AwesomeButton
          style={{
            position:"absolute",
            bottom:50
          }}
                    onPress={() => {this.setState({buyerPages:true});
          setTimeout(() => {
                     this._swiper.scrollBy(1)
          }, 300);
}}
          width={(windowWidth/2) - 20}
          height={(windowWidth/2) - 20}
          ripple={true}
          borderColor="black"
          borderWidth={12}
          raiseLevel={12}
          
          borderRadius={(windowWidth/2) - 20}
          backgroundColor="#FFDA00"
          backgroundShadow="#B79D07"
          backgroundDarker="#B79D07"
          textSize={30}
          textColor="black"
        >
          <View style={{width:(windowWidth/2) - 50}}>
          <Text style={{fontSize:100}} adjustsFontSizeToFit={true} numberOfLines={1}>Buyer</Text>
          </View>
        </AwesomeButton>
        </View>
              <View style={{backgroundColor:"black",width:windowWidth/2,height:windowHeight,justifyContent:"flex-start",alignItems:"center",paddingTop:100}}>
      <View style={{alignItems:"center",paddingHorizontal:10}}>
      <Text style={{fontSize:30,textAlign:"center",color:"white"}} adjustsFontSizeToFit={true} numberOfLines={1}>Get</Text>
      <Text style={{fontSize:100,textAlign:"center",fontWeight:"700",color:"green"}} adjustsFontSizeToFit={true} numberOfLines={1}>80%</Text>
      <Text style={{fontSize:50,textAlign:"center",color:"white",paddingHorizontal:15}} adjustsFontSizeToFit={true} numberOfLines={1}> instead of </Text>
            <Text style={{fontSize:100,textAlign:"center",fontWeight:"700",color:"red"}} adjustsFontSizeToFit={true} numberOfLines={1}>50%</Text>
                  <Text style={{fontSize:20,textAlign:"center",color:"white"}} adjustsFontSizeToFit={true} numberOfLines={1}>back per</Text>
                  <Text style={{fontSize:100,textAlign:"center",color:"white"}} adjustsFontSizeToFit={true} numberOfLines={1}>Dining Dollar </Text>
      <Image source={require("../assets/diningdollar.png")} style={{resizeMode:"contain",height:70,width:(windowWidth/2) - 70}}/>
      </View>
   <AwesomeButton
          style={{
            position:"absolute",
            bottom:50
          }}
                    onPress={() => {this.setState({buyerPages:false});
          setTimeout(() => {
                     this._swiper.scrollBy(1)
          }, 300);
}}
          width={(windowWidth/2) - 20}
          height={(windowWidth/2) - 20}
          ripple={true}
          borderColor="white"
          borderWidth={12}
          raiseLevel={12}
          
          borderRadius={(windowWidth/2) - 20}
          backgroundColor="#FFDA00"
          backgroundShadow="#B79D07"
          backgroundDarker="#B79D07"
          textSize={30}
          textColor="black"
        >
          <View style={{width:(windowWidth/2) - 50}}>
          <Text style={{fontSize:100}} adjustsFontSizeToFit={true} numberOfLines={1}>Seller</Text>
          </View>
        </AwesomeButton>
        </View>
      </View>
  )


  render() {

    return (
            <View style={{width:windowWidth,backgroundColor:"white",height:windowHeight}}>
            <Image source={require("../assets/yellowGradient1.jpg")} style={{width:windowWidth,height:windowHeight,position:"absolute",resizeMode:"cover"}}/>
            {this.state.buyerPages != undefined ?
            (this.state.buyerPages ?
                <Swiper
          ref={(swiper) => {
            this._swiper = swiper;
          }}
          showsPagination
          loop={false}
          showsButtons={true}
                          nextButton={
                  <Text style={{ fontSize: 75, color: "#007aff" }}>›</Text>
                }
                prevButton={
                  <Text style={{ fontSize: 75, color: "#007aff" }}>‹</Text>
                }
          bounces={this.state.buyerPages == undefined ? false : true}
          horizontal
          containerStyle={{flexDirection:"row"}}
          style={{flexDirection:"row",backgroundColor: "rgba(255,227,0,0.3)",backgroundOpacity:"0"}}
        >   
 
{this.areYouBuyerOrSeller()}
{this.firstBuyerPage()}
    {this.secondBuyerPage()}
      {this.thirdBuyerPage()}
        {this.fourthBuyerPage()}
          {this.fifthBuyerPage()}
        </Swiper> :                 <Swiper
          ref={(swiper) => {
            this._swiper = swiper;
          }}
          showsPagination
          loop={false}
          showsButtons={true}
                          nextButton={
                  <Text style={{ fontSize: 75, color: "#007aff" }}>›</Text>
                }
                prevButton={
                  <Text style={{ fontSize: 75, color: "#007aff" }}>‹</Text>
                }
          bounces={this.state.buyerPages == undefined ? false : true}
          horizontal
          containerStyle={{flexDirection:"row"}}
          style={{flexDirection:"row",backgroundColor: "rgba(255,227,0,0.3)",backgroundOpacity:"0"}}
        >   
 
{this.areYouBuyerOrSeller()}
{this.firstSellerPage()}
    {this.secondSellerPage()}
      {this.thirdSellerPage()}
        {this.fourthSellerPage()}
          {this.fifthSellerPage()}
        </Swiper>) :             this.areYouBuyerOrSeller()}
                <View style={{flexDirection:"row",marginTop:50,position:"absolute",width:windowWidth}}>
            <View style={{position:"absolute",left:10}}>
                        <TouchableOpacity onPress={() => {if(this.state.buyerPages == undefined){
                          this.props.navigation.goBack(null)
                      }else{this.setState({buyerPages:undefined})
                      
                        }}}>
            <Text style={{textDecorationLine:"underline",fontSize:20,color:"gray"}}>Go Back</Text>
            </TouchableOpacity>
            </View>
            <View style={{position:"absolute",right:10}}>
            <TouchableOpacity onPress={() => this.props.navigation.goBack(null)}>
            <Text style={{textDecorationLine:"underline",fontSize:20,color:"gray"}}>Skip</Text>
            </TouchableOpacity>
            </View>
        </View>   
      </View>
    );
  }
}


const styles = StyleSheet.create({
  image: {
    shadowColor: "black",
    shadowOffset: {
      width: 0,
      height: 6,
    },

    shadowOpacity: 0.39,
    shadowRadius: 10,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 10,
    marginTop: 5,
  },
});
