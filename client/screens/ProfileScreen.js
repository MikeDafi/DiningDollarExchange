import React from "react"
import {Animated,View,Text,StyleSheet,TouchableOpacity,ScrollView,Dimensions,TouchableWithoutFeedback,Switch} from "react-native"
const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;
import {FontAwesome,AntDesign} from "@expo/vector-icons"
import RatingUser from './RatingUser'
import * as firebase from 'firebase'
import Modal from 'react-native-modal';
import { Col, Row, Grid } from "react-native-easy-grid";
import Image from 'react-native-image-progress';
import DropDownPicker from 'react-native-dropdown-picker';

export default class ProfileScreen extends React.Component{



    state = {
        imageUrl:"",
        generalCategory: [],
        clicked : Array(100).fill(false),
        accountCategory:[],
        buyerDropdown: new Animated.Value(0),
        sellerDropdown: new Animated.Value(0),
        beforeChanges : [],
        formEditMode: false,
    }

    _start = (heightVariable) => {
        console.log("oooooooooo")
        Animated.timing(
            heightVariable,
            {
                toValue: 150,
                duration: 50,
            }
        ).start();
    }

    _close = (heightVariable) => {
        console.log("iiiiii")
        Animated.timing(
            heightVariable,
            {
                toValue: 0,
                duration: 50,
            }
        ).start();
    }

    async componentDidMount(){

        var email = firebase.auth().currentUser.email
        const start = email.indexOf("@")
        const end = email.indexOf(".com")
        var domain = email.substring(start + 1,end)
        const realDomain = email.substring(start,end)
        email = email.substring(0,end)
        domain = domain.toUpperCase()
        const generalCategory = [
            {
                title:"Name",
                field:firebase.auth().currentUser.displayName,
                inEditMode: false,
            },
            {
                title:"Email",
                field:firebase.auth().currentUser.email,
            },
            {
                title:"School",
                field:domain
            }
        ]

        var isBuyer = {}
        var isSeller = {}
        this.setState({generalCategory})
        const accountCategory = [
            {
                title:"Change Password",
                inEditMode: false,
            },
            {
                title:"Buyer",
                isBuyer,
            },
            {
                title:"Seller",
                isSeller,
            }
        ]
        this.setState({accountCategory})
        var  imageUrl = ""
        const image = firebase.storage().ref().child("profilePics/" + realDomain + "/" + email +"/profilePic.jpg")
        const promises = []
        promises.push(
            image.getDownloadURL().then((foundURL) => {
            this.setState({imageUrl : foundURL})
        }).catch((error) => {console.log(error)})
        )

        promises.push(firebase.database().ref("users/" + realDomain + "/" + email).once("value",(snapshot) =>{
            // console.log("snapshot ",snapshot)
            // console.log("path ","users/" + realDomain + "/" + email )
            // console.log(snapshot.val().isBuyer.ranges)
            const accountCategory = this.state.accountCategory
            var isBuyer = snapshot.val().isBuyer
            isBuyer.ranges = this.convertToArray(isBuyer.ranges)
            var isSeller = snapshot.val().isSeller   
            isSeller.ranges = this.convertToArray(isSeller.ranges)  
            accountCategory[1].isBuyer = isBuyer
            accountCategory[2].isSeller = isSeller
            this.setState({accountCategory})
           // console.log("after get ", accountCategory)
        })
        )

        const responses = await Promise.all(promises)
    }

    updatingFields = () => {
        return(
            <>
                <TouchableOpacity onPress={() => this.setState({formEditMode : false})}
                            style={{position:"absolute",top:50,left:25}}>
                    <Text style={{color:"white",fontSize:20}}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => this.setState({formEditMode : false})}
                        style={{position:"absolute",top:50,right:25}}>
                    <Text style={{color:"white",fontSize:20}}>Submit</Text>
                </TouchableOpacity>
            </>
        )
    }

    uploadAndStars = () => {
        return(
            <View style={styles.uploadAndStars}>
                <View style={styles.profileImage}>
                    {this.state.imageUrl ? 
                    <Image source={{url:this.state.imageUrl}}  
                            threshold={0} 
                            style={{
                                width: 120,
                                height: 120,
                                margin:0,
                                padding:0
                            }}
                            imageStyle={{borderRadius:120}}/> :(
                    <View style={{justifyContent:"center",alignItems:"center"}}>
                        <FontAwesome style={{marginTop:-10}}name="user" size={80} color="black" />
                        <Text>Upload Photo</Text>
                    </View>
                    )}
                </View> 
                <RatingUser starSize={20} 
                            starCount={5} 
                            selected={(rating) => this.onStarRatingPress(rating)}/>
                <Text style={{fontSize:10,color:"white"}}>4.55</Text>
           </View>
        )
    }

    setEditMode = (category,index,title,field) => {
        if(!this.state.formEditMode){
            this.setState({formEditMode:true,beforeChanges:[this.state.generalCategory,this.state.accountCategory]})
        }
        // console.log("values ", index + " " + title + " " + field)
        if(category == 0){
            const generalCategory = this.state.generalCategory
            generalCategory[index][[title]] = field
            this.setState({generalCategory})
            //console.log(this.state.generalCategory)
        }else if(category == 1){
            var accountCategory = this.state.accountCategory
            if(index == 1){
                accountCategory[index]["isBuyer"][[title]] = field
            }else if(index == 2){
                accountCategory[index]["isSeller"][[title]] = field
            }
            this.setState({accountCategory})
        }
    }

    

    general = () => {
        return(
            <View style={{width:windowWidth,marginBottom:15}}>
                <View style={{borderBottomWidth:1,borderColor:"#C5C5C5",marginHorizontal:25}}>
                    <Text style={{fontSize:25}}>General</Text>
                </View>
                <View style={{marginHorizontal:35}}>
                    {this.state.generalCategory.map((item,i) => {
                        return(
                            <View key={i} style={{backgroundColor: item.inEditMode ? "#A9A9A9" : "white"}}>
                            <TouchableWithoutFeedback style={{flexDirection:"row"}} 
                                                    onPressIn={() => {if(item.inEditMode != undefined) { this.setEditMode(0,i,"inEditMode",true)}}}
                                                    onPressOut={() => {if(item.inEditMode != undefined) { this.setEditMode(0,i,"inEditMode",false)}}}
                                                    onPress={() => {if(item.inEditMode != undefined) { this.setEditMode(0,i,item.title,true)}}}>
                                <View style={{flexDirection:"row",marginVertical:10,justifyContent:"space-between"}}>
                                    <Text style={{fontSize:17}}>{item.title}</Text>
                                    <View style={{flexDirection:"row",justifyContent:"center",alignItems:"center"}}>
                                        <Text style={{fontSize:17,color:item.inEditMode == undefined ? "#A9A9A9":"black"}}>{item.field}</Text>
                                        {item.inEditMode != undefined && <AntDesign name="edit" size={15} color="black" />}
                                    </View>
                                </View>
                            </TouchableWithoutFeedback>
                            </View>
                        )
                    })}
                </View>
            </View>
        )
    }

    convertToArray = (number) => {
        const array = []
        var binary = 8
        while( binary >= 1){
            if(number >= binary){
                number -= binary
                array.push(binary)
            }
            binary = binary/2
        }
        return array
    }


    account = () => {
        console.log("buyerRange ", this.state.buyerRanges)
        return(
             <View style={{width:windowWidth}}>
             {this.state.accountCategory.length > 0 && 
                <>
                <View style={{borderBottomWidth:1,borderColor:"#C5C5C5",marginHorizontal:25}}>
                    <Text style={{fontSize:25}}>Account</Text>
                </View>
                <View style={{marginHorizontal:35}}>
                    <View style={{backgroundColor: this.state.accountCategory[0].inEditMode ? "#A9A9A9" : "white"}}>
                        <TouchableWithoutFeedback style={{flexDirection:"row"}} 
                                                onPressIn={() => this.setEditMode(1,0,"inEditMode",true)}
                                                onPressOut={() => this.setEditMode(1,0,"inEditMode",false)}
                                                onPress={() => this.setEditMode(1,0,"Change Password",true)}>
                            <View style={{flexDirection:"row",marginVertical:10}}>
                                <Text style={{fontSize:17}}>{this.state.accountCategory[0].title}</Text>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                    <View>
                        <View style={{flexDirection:"row",justifyContent:"space-between",marginVertical:10}}>
                            <Text style={{fontSize:17}}>{this.state.accountCategory[1].title}</Text>
                            <Switch
                                trackColor={{ false: "gray", true: "black" }}
                                thumbColor={this.state.accountCategory[1].isBuyer.searching ? "yellow" : "black"}
                                onValueChange={(value) => {this.setEditMode(1,1,"searching",value);this.setEditMode(1,1,"ranges",[])}}
                                value={this.state.accountCategory[1].isBuyer.searching}
                            />
                        </View>
                        {this.state.accountCategory[1].isBuyer.searching &&
                        <Animated.View style={{flexDirection:"row",justifyContent:"space-between",alignItems:"center",marginBottom:this.state.buyerDropdown,paddingLeft:30}}>
                            <Text style={{fontSize:17}}>Range</Text>
                            <DropDownPicker
                                onOpen={() => {this._start(this.state.buyerDropdown)}}
                                onClose={() => {this._close(this.state.buyerDropdown)}}
                                items={[
                                    {label: "0 to 5", value: 8},
                                    {label: '5 to 10', value: 4},
                                    {label:"10 to 15", value:2},
                                    {label:"15+",value:1}
                                ]}
                                placeholder="Select at Least One"
                                multiple={true}
                                multipleText="%d items have been selected."
                                min={0}
                                max={4}
                            
                                defaultValue={this.state.accountCategory[1].isBuyer.ranges}
                                containerStyle={{height: 40,width:200}}
                                dropDownMaxHeight={150}
                                onChangeItem={item => this.setEditMode(1,1,"ranges",item)}
                            />

                        </Animated.View> }
                    </View>
                    <View>
                        <View style={{flexDirection:"row",justifyContent:"space-between",marginVertical:10}}>
                            <Text style={{fontSize:17}}>{this.state.accountCategory[2].title}</Text>
                            <Switch
                                trackColor={{ false: "white", true: "black" }}
                                thumbColor={this.state.accountCategory[2].isSeller.searching ? "white" : "black"}
                                ios_backgroundColor="#3e3e3e"
                                onValueChange={(value) => {this.setEditMode(1,2,"searching",value);this.setEditMode(1,2,"ranges",[])}}
                                value={this.state.accountCategory[2].isSeller.searching}
                            />
                        </View>
                        {this.state.accountCategory[2].isSeller.searching &&
                        <Animated.View style={{flexDirection:"row",marginBottom:this.state.sellerDropdown,justifyContent:"space-between",alignItems:"center",paddingLeft:30}}>
                            <Text style={{fontSize:17}}>Range</Text>
                            <DropDownPicker
                                onOpen={() => {this._start(this.state.sellerDropdown)}}
                                onClose={() => {this._close(this.state.sellerDropdown)}}
 
                                items={[
                                    {label: "0 to 5", value: 8},
                                    {label: '5 to 10', value: 4},
                                    {label:"10 to 15", value:2},
                                    {label:"15+",value:1}
                                ]}
                            
                                multiple={true}
                                multipleText="%d items have been selected."
                                placeholder="Select at Least One"
                                min={0}
                                max={4}
                            
                                defaultValue={this.state.accountCategory[2].isSeller.ranges}
                                containerStyle={{height: 40,width:200}}
                                onChangeItem={item => this.setEditMode(1,2,"ranges",item)}
                            />

                        </Animated.View> }
                    </View>
                </View>
                </>}
            </View>
        )
    }
    
    render(){
        return(
            <View style={styles.container}>
                <ScrollView>
                    {this.uploadAndStars()}
                    {this.general()}
                    {this.account()}
                </ScrollView>
                {this.state.formEditMode ? this.updatingFields() : null}
                {/* <Modal
                    testID={'modal'}
                    coverScreen={true}
                    hasBackdrop={true}
                    isVisible={true}
                    onBackdropPress={() => {this.props.togglePopupVisibility(false);}}
                    animationIn="slideInLeft"
                    animationInTiming={500}
                    style={{justifyContent:"center",alignItems:"center"}}>
                    <View style={{backgroundColor:"gray",width:300,height:300}}>
                        <Grid>
                            <Row>  
                                <Text>{this.state.currentEdit}</Text>
                            </Row>

                        </Grid>
                    </View>
                </Modal> */}
            </View>
        )
    }
}

const styles= StyleSheet.create({
    container:{
        flex:1,
        alignItems:"center",
        justifyContent:"center",
        backgroundColor:"white",
    },
    uploadAndStars:{
        justifyContent:"center", 
        alignItems:"center",
        width:windowWidth,
        height:windowHeight/3,
        marginBottom:20,
        backgroundColor:"black"
    },
    profileImage:{
        justifyContent:"center", 
        alignItems:"center",
        width:130,
        height:130,
        borderRadius:130,
        backgroundColor:"white"
    }
})