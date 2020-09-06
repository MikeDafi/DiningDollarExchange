import React from 'react';
import { View, Text, StyleSheet,TouchableOpacity,TextInput } from 'react-native';
import { AntDesign } from '@expo/vector-icons'; 
import firebase from "../../config"

export default class BuyModalScreen extends React.Component{
  dbRef = firebase.firestore().collection('users');
 
  state ={
    roomName :''
  }

  storeUser = () => {
      this.setState({
        isLoading: true,
      });      
      this.dbRef.add({
        name: this.state.roomName
      }).then((res) => {
        this.setState({
          roomName: ''
        });
        //1 console.log("here i am")
        this.props.navigation.navigate('Message')
      })
      .catch((err) => {
        console.error("Error found: ", err);
      });
    }
  

  render(){
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity  onPress={() => this.props.navigation.navigate("Home")}>
          <AntDesign name="close" size={24} color="black" />
        </TouchableOpacity>
        <Text >Post Screen</Text>
        <TouchableOpacity >
          <Text style={{fontWeight:"500"}}>Post</Text>
        </TouchableOpacity>
      </View>
      <View>
        <Text style={styles.inputTitle}>Room Number</Text>
        <TextInput style={styles.input} 
              autoCapitalize="none"
              onChangeText={roomName => this.setState({roomName})}
              value={this.state.roomName}/>
        <TouchableOpacity onPress={this.storeUser} disabled={this.state.roomName.length === 0}>
          <Text> Submit</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
  }
}


const styles= StyleSheet.create({
    container:{
        flex:1,
    },
    header:{
        flexDirection:"row",
        alignItems:"center",
        justifyContent:"space-between",
        paddingHorizontal:12,
        paddingVertical:12,
        borderBottomWidth:1,
        borderBottomColor:"#D8D9D8"
    }

})