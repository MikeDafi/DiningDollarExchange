import React from "react"
import {createAppContainer,createSwitchNavigator} from 'react-navigation'
import {createStackNavigator} from "react-navigation-stack"
import {createBottomTabNavigator} from "react-navigation-tabs"
import {Ionicons,MaterialIcons,FontAwesome} from "@expo/vector-icons"
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
import HistoryPage from './client/screens/HistoryPage'
import SelectedOrderModal from "./client/screens/SelectedOrderModal";
import SavedOrders from "./client/screens/SavedOrders"
import PendingOrders from "./client/screens/PendingOrders"
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
                History:{
                    screen: HistoryPage,
                    navigationOptions:{
                        tabBarIcon: ({tintColor}) => <FontAwesome name="history" size={24} color="black" />
                    }
                },
                Message:{
                    screen: MessageScreen,
                    navigationOptions:{
                        tabBarIcon: ({focused,tintColor}) => (
                            <Ionicons 
                                name="ios-chatboxes" 
                                size={35} 
                                color="#E9446A"
                                style={{
                                    shadowColor:"#E9446A",
                                    shadowOffset:{width:0,height:0},
                                    shadowRadius:10,
                                    shadowOpacity:0.3
                            
                            }}/>),
                        tabBarLabel:"Messages"
                    }
                },
                Profile:{
                    screen: ProfileScreen,
                    navigationOptions:{
                        title : "Settings",
                        tabBarIcon: ({tintColor}) => (<MaterialIcons name="settings" size={30} color={tintColor}/>),
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
                    showLabel: true,
                    allowFontScaling:true,
                }
            }
        ),
        BuyModal:{
            screen: BuyModalScreen,
        },
        Room:{
            screen: RoomScreen,
        },
        SelectedOrderModal:{
            screen:SelectedOrderModal,
        },
        UploadImages:{
            screen: UploadImages,
        },
        SavedOrders:{
            screen: SavedOrders,
        },
        PendingOrders:{
            screen:PendingOrders,
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