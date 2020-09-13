import React from 'react'
import {View,Text, StyleSheet,ActivityIndicator,TouchableOpacity} from 'react-native'
import * as firebase from 'firebase';
import { AntDesign } from '@expo/vector-icons'; 
export default class VerifyScreen extends React.Component{
    componentDidMount(){

    }

//   useEffect(() => {
//     const unsubscribe = firebase.auth().onAuthStateChanged(user=>{
//             this.props.navigation.navigate(user && (user || {}).emailVerified ? "App":"Verify");
//         })

//     /**
//      * unsubscribe listener
//      */
//     return () => unsubscribe();
//   }, []);

    removeUser = () => {
        var user = firebase.auth().currentUser
        user.delete()
        this.props.navigation.navigate("Login")
    }

    render(){
        return(
            <View>
                <View style={styles.header}>
                    <TouchableOpacity onPress={this.removeUser}>
                        <AntDesign name="arrowleft" size={30} color="black" />
                    </TouchableOpacity>
                </View>
                <View style={styles.container}>
                    <Text>Waiting to Verify Email...</Text>
                    <ActivityIndicator size="large"></ActivityIndicator>
                </View>
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