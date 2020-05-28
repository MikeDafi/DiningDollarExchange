import React from "react"
import {View,Text,StyleSheet,TouchableOpacity} from "react-native"
import {Ionicons,MaterialIcons} from "@expo/vector-icons"
export default class BuyerHomeScreen extends React.Component{
    here = () =>{
        console.log(this.props)
    }
    render(){
        return(
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={()=>{this.props.navigation.navigate("BuyModal")}}>
                        <Ionicons name="ios-home" size={24}/>
                    </TouchableOpacity>
                    <Text styl>Buyer Screensss</Text>
                    <TouchableOpacity onPress={this.here}>
                        <MaterialIcons name="error" size={24} color="black"/>
                    </TouchableOpacity>
                </View>
                <Text>Message Screen</Text>
            </View>
        )
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