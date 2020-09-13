import React from "react"
import {View,Text,StyleSheet,Dimensions} from "react-native"
import { ImageBrowser } from 'expo-multiple-media-imagepicker';
import * as Permissions from "expo-permissions"
import Constants from "expo-constants"
import Modal from 'react-native-modal';
const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;
export default class UploadImages extends React.Component{

    state = {
        isVisible : this.props.isVisible,
    }

    render(){
        return(
            <Modal
                    testID={'modal'}
                    coverScreen={true}
                    hasBackdrop={true}
                    isVisible={this.props.isVisible}
                    // onBackdropPress={() => {this.props.togglePopupVisibility(false);}}
                    animationIn="slideInUp"
                    animationInTiming={500}
                    style={{backgroundColor:"white",justifyContent:"center",alignItems:"center",width:windowWidth,height:windowHeight,padding:0,margin:0}}>
                <ImageBrowser
                    max={101} // Maximum number of pickable image. default is None
                    headerCloseText={'Close'} // Close button text on header. default is 'Close'.
                    headerDoneText={'Submit'} // Done button text on header. default is 'Done'.
                    headerButtonColor={'black'} // Button color on header.
                    headerSelectText={'Selected'} // Word when picking.  default is 'n selected'.
                    badgeColor={'blue'} // Badge color when picking.
                    emptyText={'There are no images or no permission granted.'} // Empty Text
                    callback={(param) => this.props.photoCallb(param)} // Callback functinon on press Done or Cancel Button. A
                />
            </Modal>
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