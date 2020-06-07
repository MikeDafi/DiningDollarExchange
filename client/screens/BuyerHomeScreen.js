import React from "react"
import {View,Text,StyleSheet,TouchableOpacity,Image,Dimensions} from "react-native"
import * as firebase from 'firebase'
import { FlatGrid } from 'react-native-super-grid';
import AwesomeButton from "react-native-really-awesome-button";
import RatingUser from './RatingUser'
const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

export default class BuyerHomeScreen extends React.Component{

    renderItem = ({item,index}) =>{
        if(item == "REVIEW"){
        return(
                <View style={[styles.itemContainer,{height : (windowHeight - 280)/2}]}>
                    <Text>{item}</Text>
                    <RatingUser starSize={20}/>
                </View>
        )
        }else if (item == "STATISTICS"){
            return(
                <View style={[styles.itemContainer,{height : (windowHeight - 280)/2,alignItems:"flex-end"}]}>
                    <Text>{item}</Text>
                </View>
            ) 
        }else if(item == "SCHEDULE"){
            return(
                <View style={[styles.itemContainer,{height : (windowHeight - 280)/2}]}>
                    <Text>{item}</Text>
                </View>
            )
        }else if(item == "SHARE"){
            return(
                <View style={[styles.itemContainer,{height : (windowHeight - 280)/2,alignItems:"flex-end"}]}>
                    <Text>{item}</Text>
                </View>
            )
        }   
    }
    render(){
        const items = ["REVIEW","STATISTICS","SCHEDULE","SHARE"]

        return(
            <View style={styles.container}>
            
                 <FlatGrid
                    itemDimension={130}
                    data={items}
                    style={styles.gridView}
                    // staticDimension={300}
                    // fixed
                    // spacing={20}
                    renderItem={this.renderItem}
                />
                <AwesomeButton 

                            style={{
                                        position:"absolute",
                                        left: windowWidth/4,
                                        top:windowHeight/2 - (windowWidth)/2 ,
                                        }}
                            width={windowWidth/2}
                            height={windowWidth/2} 
                            borderColor="black"
                            borderWidth={16}
                            borderRadius={windowWidth/4}
                            backgroundColor="#FFDA00"
                            backgroundShadow="#B79D07"
                            backgroundDarker="#B79D07"
                                        >
                                        Hi there
                </AwesomeButton>
            </View>
        )
    }
}

const styles= StyleSheet.create({
    container: {
        flex:1,
        justifyContent:"center",
        alignItems:"center"
    },
    gridView: {
        flex: 1,
        marginTop:25,
    },
    itemContainer: {
        borderRadius: 45,
        padding: 15,
        marginVertical:5,
        marginHorizontal:5,
        backgroundColor:"#FFEB79",
    },
    avatar:{
        position:"absolute",
        width:50,
        height:50,
        borderRadius:50,

    },
    yellowButton:{
        backgroundColor:"#FFDA00",
        borderWidth:10,
        borderColor:"black",
    },
    header:{
        flexDirection:"row",
        alignItems:"center",
        justifyContent:"space-between",
        paddingHorizontal:12,
        marginRight:20,
        borderBottomWidth:1,
        borderBottomColor:"#D8D9D8",
        backgroundColor:"#FFDA00",
        marginTop:20,
    },
    avatarPlaceholder:{
        width:50,
        height:50,
        borderRadius:50,
        position:"absolute",
        top:35,
        right:0,
        backgroundColor:"#E1E2E6",
        alignItems:"center",
        justifyContent:"center",
    }

})