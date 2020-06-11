import React from "react"
import {View,Text,StyleSheet} from "react-native"
import { ImageBrowser } from 'expo-multiple-media-imagepicker';
import UserPermissions from "../../utilities/UserPermissions"
import * as Permissions from "expo-permissions"
import Constants from "expo-constants"
export default class UploadImages extends React.Component{

    state = {
        photoCallb : (this.props.navigation.state.params || {}).photoCallb
    }


    componentDidMount(){
        console.log("in uploadimage")
        console.log(this.props.navigation.state.params.photoCallb)
        this.setState({photoCallb:(this.props.navigation.state.params || {}).photoCallb})

    }

    render(){
        return(
            <View style={styles.container}>
                <ImageBrowser
                    max={101} // Maximum number of pickable image. default is None
                    headerCloseText={'Close'} // Close button text on header. default is 'Close'.
                    headerDoneText={'Submit'} // Done button text on header. default is 'Done'.
                    headerButtonColor={'black'} // Button color on header.
                    headerSelectText={'Selected'} // Word when picking.  default is 'n selected'.
                    badgeColor={'blue'} // Badge color when picking.
                    emptyText={'There are no images or no permission granted.'} // Empty Text
                    callback={(param) => this.state.photoCallb(param)} // Callback functinon on press Done or Cancel Button. A
                />
            </View>
        )
    }
}

const styles= StyleSheet.create({
    container:{
        flex:1,
        alignItems:"center",
        justifyContent:"center"
    }
})