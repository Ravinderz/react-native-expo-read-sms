import {
  NativeEventEmitter,
  NativeModules,
  PermissionsAndroid,
  Platform,
} from "react-native";

const { RNExpoReadSms } = NativeModules;

export default RNExpoReadSms;

export async function startReadSMS(callback) {
  let resultFun = (status, sms, error) => {
    if (callback) {
      callback(status, sms, error);
    }
  };
  if (Platform.OS === "android") {
    const hasPermission = await checkIfHasSMSPermission();
    if (hasPermission) {
      RNExpoReadSms.startReadSMS(
        (result) => {
          new NativeEventEmitter(RNExpoReadSms).addListener(
            "received_sms",
            (sms) => {
              resultFun("success", sms);
            }
          );
        },
        (error) => {
          resultFun("error", "", error);
        }
      );
    } else {
      resultFun("error", "", "Required RECEIVE_SMS and READ_SMS permission");
    }
  } else {
    resultFun("error", "", "ReadSms Plugin is only for android platform");
  }
}

export const checkIfHasSMSPermission = async () => {
  if (Platform.OS === "android" && Platform.Version < 23) {
    return true;
  }

  const hasReceiveSmsPermission = await PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.RECEIVE_SMS
  );
  const hasReadSmsPermission = await PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.READ_SMS
  );

  if (hasReceiveSmsPermission && hasReadSmsPermission) return true;

  return {
    hasReceiveSmsPermission,
    hasReadSmsPermission,
  };
};

export async function requestReadSMSPermission() {
  if (Platform.OS === "android") {
    const hasPermission = await checkIfHasSMSPermission();
    if (
      hasPermission.hasReadSmsPermission &&
      hasPermission.hasReceiveSmsPermission
    )
      return true;
    const readGranted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_SMS,
      {
        title: "SMS Read Permission",
        message: "This app needs access to your Read SMS messages",
        buttonNeutral: "Ask Me Later",
        buttonNegative: "Cancel",
        buttonPositive: "OK",
      }
    );
    const receiveGranted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
      {
        title: "SMS Receive Permission",
        message: "This app needs access to your Receive SMS messages",
        buttonNeutral: "Ask Me Later",
        buttonNegative: "Cancel",
        buttonPositive: "OK",
      }
    );
    if (
      readGranted === PermissionsAndroid.RESULTS.GRANTED &&
      receiveGranted === PermissionsAndroid.RESULTS.GRANTED
    ) {
      return true;
    } else if (
      readGranted === PermissionsAndroid.RESULTS.DENIED ||
      receiveGranted === PermissionsAndroid.RESULTS.DENIED
    ) {
      console.log("Read Sms permission denied by user.");
    } else if (status === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
      console.log("Read Sms permission revoked by user.");
    }
    return false;
  }
  return true;
}

export function stopReadSMS() {
  if (Platform.OS === "android") {
    RNExpoReadSms.stopReadSMS();
  }
}
