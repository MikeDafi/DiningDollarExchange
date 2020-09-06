import React from 'react'
import {View,Text, StyleSheet,ActivityIndicator,TouchableOpacity} from 'react-native'
import * as firebase from 'firebase';
import { Ionicons } from '@expo/vector-icons'; 
export default class NotificationIcon extends React.Component{


    state = {
        totalCount : 0
    }

    componentDidMount(){
            const user = firebase.auth().currentUser;
    const start = user.email.indexOf("@");
    const end = user.email.indexOf(".com");
    const domain = user.email.substring(start, end);
    const email = user.email.substring(0, end);
        firebase.database().ref("users/" + domain + "/" + email + "/chats/").on("value",snapshot => {
            var totalCount = 0
            const buyerSnapshot = snapshot.child("buyer").val()
            console.log(buyerSnapshot)
            const buyerChats = Object.keys(buyerSnapshot || {})
            console.log("buyerChats ", buyerChats)
            console.log(buyerSnapshot[[buyerChats[0]]])
            for(var i = 0; i < buyerChats.length; i++){
                if(!buyerSnapshot[[buyerChats[i]]].read){
                    totalCount += 1
                }
            }

            const sellerSnapshot = snapshot.child("seller").val()
            const sellerChats = Object.keys(sellerSnapshot || {})
            for(var i = 0; i < sellerChats.length; i++){
                if(!sellerSnapshot[[sellerChats[i]]].read){
                    totalCount += 1
                }
            }
            this.setState({totalCount})

        })
    }

    render(){
        return(
            <View>
              <Ionicons
                name="ios-chatboxes"
                size={35}
                color={this.props.focused ? "black" : this.props.tintColor}
                style={{
                  shadowColor: this.props.focused ? "#E9446A" : "rgba(0,0,0,0)",
                  shadowOffset: { width: 0, height: 0 },
                  shadowRadius: this.props.focused ? 10 : 0,
                  shadowOpacity: this.props.focused ? 0.3 : 0,
                }}
              />
              {this.state.totalCount != 0 && 
                      <View style={{ position: 'absolute', right: -19, top: 0, backgroundColor: 'red', borderRadius: 9, width: this.state.totalCount.toString().length == 1 ? 18 : this.state.totalCount.toString().length* 12, height: 18, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: 'white' }}>{this.state.totalCount}</Text>
        </View>}
        </View>

        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center"
    },
    header:{
        flex:1,
        flexDirection:"row",
        justifyContent:"space-between",
        marginHorizontal:10,
        marginTop:5
    }
});