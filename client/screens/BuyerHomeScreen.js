import React from "react"
import {View,Text,StyleSheet,TouchableOpacity,Image,Dimensions} from "react-native"
import * as firebase from 'firebase'
import { FlatGrid } from 'react-native-super-grid';
import AwesomeButton from "react-native-really-awesome-button";
import RatingUser from './RatingUser'
const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;
import { Col, Row, Grid } from "react-native-easy-grid";
export default class BuyerHomeScreen extends React.Component{

    state ={
        currentFont : 20,
        clickedStars : false,
        starCount: ''
    }

    onStarRatingPress(rating) {
        console.log("onstarratingpress")
        this.setState({
            starCount: rating,
            clickedStars:true
        });
    }

    reviewView = () =>{
        return(
            <View style={[styles.itemContainer,{height : (windowHeight - 280)/2}]}>
                <View style={{alignItems:"center"}}>
                    <Text>Review</Text>
                    <RatingUser starSize={20} starCount={this.state.starCount} selected={(rating) => this.onStarRatingPress(rating)}/>
                    <View style={styles.avatarPlaceholder} >
                        <Image source={require('./a.jpg')} style={styles.avatar}/>
                        {/* <Image source={{uri : this.state.avatar}} style={styles.avatar}/>                        */}
                    </View>
                    <Text
                        //currentFont={this.state.currentFont}
                        //setState={(number) => this.setState({currentFont:number})}
                        adjustsFontSizeToFit
                        style={{fontSize: this.state.currentFont }}
                        onTextLayout={ (e) => {
                            const { lines } = e.nativeEvent;
                            if (lines.length > 1) {
                            this.setState({currentFont: this.state.currentFont - 1});
                            }
                        } }
                        >
                        Michael Askndafi fsfsdfaf
                    </Text>
                    <Text style={{fontSize:10}}>From May 12,2000</Text>
                </View>
                <View style={{flex:1,justifyContent:"flex-end",marginBottom:20}}>
                    <TouchableOpacity style={[styles.submit,{backgroundColor:this.state.clickedStars ? "black" : "gray"}]} disabled={!this.state.clickedStars} >
                        <Text style={{color:"yellow"}}>Submit</Text>
                    </TouchableOpacity>
                </View>
            </View>
        )
    }
    statisticsView = () => {
        return(
            <View style={[styles.itemContainer,{height : (windowHeight - 280)/2,alignItems:"flex-end"}]}>
                <Text>Statistics</Text>
            </View>
        ) 
    }

    scheduleView = () => {
        return(
            <View style={[styles.itemContainer,{height : (windowHeight - 280)/2}]}>
                <Text>Schedule</Text>
            </View>
        )
    }
    shareView = () =>{
        return(
            <View style={[styles.itemContainer,{height : (windowHeight - 280)/2,alignItems:"flex-end"}]}>
                <Text>Share</Text>
            </View>
        )
    }

    render(){
        const items = ["REVIEW","STATISTICS","SCHEDULE","SHARE"]

        return(
            <View style={styles.container}>
            
                 {/* <FlatGrid
                    itemDimension={130}
                    data={items}
                    style={styles.gridView}
                    // staticDimension={300}
                    // fixed
                    // spacing={20}
                    renderItem={this.renderItem}
                /> */}
                <View style={{width:windowWidth,height:windowHeight - 280,marginTop:50}}>
                <Grid style={{width:windowWidth}}>
                    <Row style={{marginBottom:20}} size={50}>
                        <Col  size={50}>
                        {this.reviewView()}
                        </Col>
                        <Col size={50}>
                        {this.statisticsView()}
                        </Col>
                    </Row>          
                    <Row size={50}>
                        <Col  size={50}>
                        {this.scheduleView()}
                        </Col>
                        <Col size={50}>
                        {this.shareView()}
                        </Col>                    
                    </Row>
                </Grid>
                </View>
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
    },
    itemContainer: {
        borderRadius: 45,
        marginHorizontal:5,
        padding:10,
        backgroundColor:"#FFEB79",
    },
    submit:{
        width:65,
        height:45,
        borderRadius:25,
        justifyContent:"center",
        alignItems:"center",
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
        width:75,
        height:75,
        borderRadius:75,
        backgroundColor:"#E1E2E6",
        alignItems:"center",
        justifyContent:"center",
    },
    avatar:{
        width:60,
        height:60,
        borderRadius:60,
    },

})