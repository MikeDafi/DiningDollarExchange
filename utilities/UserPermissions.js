import Constants from "expo-constants"
import { Notifications } from 'expo';
import * as Permissions from "expo-permissions"

class UserPermissions{
    getCameraPermission = async() => {
        if(Constants.platform.ios){
            const {status} = await Permissions.askAsync(Permissions.CAMERA_ROLL)

            if(status != "granted"){
                return true
            }else{
                return false
            }
        }
    }

    getDeviceToken = async () => {
        if (Constants.isDevice) {
            const { status: existingStatus } = await Permissions.getAsync(Permissions.NOTIFICATIONS);
            let finalStatus = existingStatus;
            if (existingStatus !== 'granted') {
                const { status } = await Permissions.askAsync(Permissions.NOTIFICATIONS);
                finalStatus = status;
            }
            if (finalStatus !== 'granted') {
                return;
            }
            token = await Notifications.getExpoPushTokenAsync();
            //1 console.log(token);
            return token
        }
    }
}


export default new UserPermissions();