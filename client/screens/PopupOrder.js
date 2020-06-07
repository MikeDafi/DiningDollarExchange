import Modal from 'react-native-modal';
import React,{ useCallback, useState } from 'react'
import { AntDesign } from '@expo/vector-icons'; 
import AwesomeButton from "react-native-really-awesome-button";
import {CameraRoll,View,Text, StyleSheet,Button,TouchableOpacity,LayoutAnimation,AppRegistry,Image,Dimensions} from 'react-native'
const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;
import { ImageBrowser } from 'expo-multiple-media-imagepicker';
import UserPermissions from "../../utilities/UserPermissions"

function useCameraRoll({
  first = 40,
  assetType = 'Photos',
  groupTypes = 'All',
}) {
  const [photos, setPhotos] = useState([]);
  const [after, setAfter] = useState(null);
  const [hasNextPage, setHasNextPage] = useState(true);
  const getPhotos = useCallback(async () => {
    if (!hasNextPage) return;
    const { edges, page_info: pageInfo } = await CameraRoll.getPhotos({
      first,
      assetType,
      groupTypes,
      ...(after && { after }),
    });
    if (after === pageInfo.end_cursor) return;
    const images = edges.map(i => i.node).map(i => i.image);
    setPhotos([...photos, ...images]);
    setAfter(pageInfo.end_cursor);
    setHasNextPage(pageInfo.has_next_page);
  }, [after, hasNextPage, photos]);
  return [photos, getPhotos];
}

export default class PopupOrder extends React.Component{

    state={
        uploadedImages: []
    }


//     takePics = () => {
// ImagePicker.openPicker({
//   multiple: true
// }).then(images => {
//   console.log(images);
// });

//     }


    SomeComponent = () => {
	    const [photos, getPhotos] = useCameraRoll({ first: 80 })
    }

    // takePics = () => {
    //     console.log("in takepics")
    //     UserPermissions.getCameraPermission()
    //     ImagePicker.launchImageLibraryAsync({
    //         mediaTypes: ImagePicker.MediaTypeOptions.Images,
    //         allowsMultipleSelection :true,
    //         aspect:[4,3]
    //     })
    //     .then(response => {
    //         let tempArray = []
    //         console.log("responseimage-------" + response)
    //         this.setState({ ImageSource: response })
    //         console.log("responseimagearray" + this.state.ImageSource)
    //         response.forEach((item) => {
    //         let image = {
    //             uri: item.path,
    //             // width: item.width,
    //             // height: item.height,
    //         }
    //         console.log("imagpath==========" + image)
    //         tempArray.push(image)
    //         this.setState({ uploadedImages: tempArray })

    //         console.log("imagpath==========" + image)
    //         })

    //     })
    // }



    render(){

            const emptyStayComponent = <Text style={styles.emptyStay}>Empty =(</Text>;
    const noCameraPermissionComponent = <Text style={styles.emptyStay}>No access to camera</Text>;
        return(
            <View>
                <Modal
                    testID={'modal'}
                    coverScreen={true}
                    hasBackdrop={true}
                    isVisible={true}
                    onBackdropPress={() => this.props.togglePopupVisibility()}
                    animationIn="slideInLeft"
                    animationOut="slideOutRight"
                    style={{justifyContent:"flex-end",padding:0,margin:0}}>
                    <View style={styles.content}>
                        <TouchableOpacity onPress={() => {this.props.togglePopupVisibility()}} >
                            <AntDesign name="close" size={40} color="black" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={this.SomeComponent} style={{alignItems: 'center',}}>
                            <AwesomeButton 
                                width={windowWidth - 50}
                                height={50} 
                                borderColor="gray"
                                backgroundColor="#D6D6D6"
                                backgroundShadow="#737373"
                                backgroundDarker="#464646"
                                            >
                                <View style={{flex:1,flexDirection:"row",justifyContent:'space-evenly'}}>
                                <AntDesign name="upload" size={24} color="black" />
                                        <Text style={{fontSize:20}}>Upload Photos</Text>
                                </View>
                            </AwesomeButton>
                        </TouchableOpacity>
                        <View style={{flex:1,flexDirection:"row",justifyContent:"flex-end",alignItems:"center",marginRight:10,marginBottom:10}}>
                            <TouchableOpacity onPress={() => this.SomeComponent()} style={{borderRadius:10,backgroundColor: "#0E89FF",padding:10}}>
                                <Text>Find A Seller!</Text>
                            </TouchableOpacity>
                        </View>
                        <ImageBrowser
                            max={101} // Maximum number of pickable image. default is None
                            headerCloseText={'キャンセル'} // Close button text on header. default is 'Close'.
                            headerDoneText={'　　完了'} // Done button text on header. default is 'Done'.
                            headerButtonColor={'#E31676'} // Button color on header.
                            headerSelectText={'枚の画像を選択中'} // Word when picking.  default is 'n selected'.
                            mediaSubtype={'screenshot'} // Only iOS, Filter by MediaSubtype. default is display all.
                            badgeColor={'#E31676'} // Badge color when picking.
                            emptyText={'選択できる画像がありません'} // Empty Text
                            callback={this.imageBrowserCallback} // Callback functinon on press Done or Cancel Button. A
                        />
                    </View>
                </Modal>
            </View> 
        )
    }
}

const styles = StyleSheet.create({

    content: {
        backgroundColor: 'white',
        borderRadius: 4,
        height:300,
        borderColor: 'rgba(0, 0, 0, 0.1)',
    },
    contentTitle: {
        fontSize: 20,
        marginBottom: 12,
    }
});