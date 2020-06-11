import React from "react"
import {createAppContainer,createSwitchNavigator} from 'react-navigation'
import {createStackNavigator} from "react-navigation-stack"
import {createBottomTabNavigator} from "react-navigation-tabs"
import {Ionicons} from "@expo/vector-icons"
import LoadingScreen from "./client/screens/LoadingScreen"
import RegisterScreen from "./client/screens/RegisterScreen"
import LoginScreen from "./client/screens/LoginScreen"
import HomeScreen from "./client/screens/HomeScreen"
import MessageScreen from "./client/screens/MessageScreen"
import PostScreen from "./client/screens/PostScreen"
import NotificationScreen from "./client/screens/NotificationScreen"
import ProfileScreen from "./client/screens/ProfileScreen"
import BuyModalScreen from "./client/screens/BuyModalScreen"
import RoomScreen from "./client/screens/RoomScreen";
import VerifyScreen from "./client/screens/VerifyScreen";
import UploadImages from './client/screens/UploadImages'
import firebase from "./config"

const AppContainer = createStackNavigator(
    {
        default: createBottomTabNavigator(
            {
                Home:{
                    screen: HomeScreen,
                    navigationOptions:{
                        tabBarIcon: ({tintColor}) => <Ionicons name="ios-home" size={24} color={tintColor}/>
                    }
                },
                Message:{
                    screen: MessageScreen,
                    navigationOptions:{
                        tabBarIcon: ({tintColor}) => (
                            <Ionicons 
                                name="ios-chatboxes" 
                                size={45} 
                                color="#E9446A"
                                style={{
                                    shadowColor:"#E9446A",
                                    shadowOffset:{width:0,height:0},
                                    shadowRadius:10,
                                    shadowOpacity:0.3
                            
                            }}/>)
                    }
                },
                Profile:{
                    screen: ProfileScreen,
                    navigationOptions:{
                        tabBarIcon: ({tintColor}) => <Ionicons name="ios-person" size={24} color={tintColor}/>
                    }
                }
            },
            {
                defaultNavigationOptions:{
                    tabBarOnPress:({navigation,defaultHandler}) =>{
                        if(navigation.state.key === "BuyModal"){
                            navigation.navigate("BuyModal")
                        }else if(navigation.state.key === "Room"){
                            navigation.navigate("Room")
                        }else{
                            defaultHandler()
                        }
                    }
                },
                tabBarOptions:{
                    activeTintColor:"#161F30",
                    inactiveTintColor:"#B8BBC4",
                    showLabel: false
                }
            }
        ),
        BuyModal:{
            screen: BuyModalScreen,
        },
        Room:{
            screen: RoomScreen,
        },
        UploadImages:{
            screen: UploadImages,
        }
    },
    {
        mode:"modal",
        headerMode:"none"
    }
)

  const AuthStack = createStackNavigator(
    {
      Login:{
        screen: LoginScreen,
        navigationOptions: {
            headerShown: false,
        }
      },
      Register:{
        screen: RegisterScreen,
        navigationOptions: {
            headerShown: false,
      }
    }
  })

  export default createAppContainer(
      createSwitchNavigator({
          Loading: LoadingScreen,
          App:AppContainer,
          Auth:AuthStack
      },
      {
          initialRouteName:"Loading"
      })
  )