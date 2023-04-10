import ZegoSignalingPluginCore from '../core';
import ZegoPluginResult from '../core/defines';
import { zlogerror, zloginfo } from '../utils/logger';
import ZPNs, { CallKit, CXCallEndedReason } from 'zego-zpns-react-native';
import { Platform, } from 'react-native';

ZPNs.setBackgroundMessageHandler(message => {
  zloginfo('ZPNs throughMessageReceived: ', message)
  const dataObj = JSON.parse(message.extras.payload);
  ZegoPluginInvitationService.getInstance().getAndroidOfflineDataHandler()(dataObj)
})

export default class ZegoPluginInvitationService {
  static shared;
  _androidOfflineDataHandler;
  _iOSOfflineDataHandler;
  _callKitAnswerCallHandler;
  _callKitEndCallHandler;

  constructor() {
    if (!ZegoPluginInvitationService.shared) {
      this._notifyWhenAppRunningInBackgroundOrQuit = true;
      ZegoPluginInvitationService.shared = this;
    }
    return ZegoPluginInvitationService.shared;
  }
  static getInstance() {
    if (!ZegoPluginInvitationService.shared) {
      ZegoPluginInvitationService.shared = new ZegoPluginInvitationService();
    }
    return ZegoPluginInvitationService.shared;
  }
  setAndroidOfflineDataHandler(handler) {
    this._androidOfflineDataHandler = handler;
  }
  getAndroidOfflineDataHandler() {
    return this._androidOfflineDataHandler;
  }
  setIOSOfflineDataHandler(handler) {
    this._iOSOfflineDataHandler = handler;
  }
  onCallKitAnswerCall(handler) {
    this._callKitAnswerCallHandler = handler;
  }
  onCallKitEndCall(handler) {
    this._callKitEndCallHandler = handler;
  }
  getIOSOfflineDataHandler() {
    return this._iOSOfflineDataHandler;
  }
  getAnswerCallHandle() {
    return this._callKitAnswerCallHandler;
  }
  getEndCallHandle() {
    return this._callKitEndCallHandler;
  }
  reportCallKitCallEnded(uuid) {
    return CallKit.getInstance().reportCallEnded(CXCallEndedReason.AnsweredElsewhere, uuid);
  }
  getZIMInstance() {
    return ZegoSignalingPluginCore.getInstance().getZIMInstance();
  }
  getVersion() {
    return ZegoSignalingPluginCore.getInstance().getVersion();
  }
  init(appID, appSign) {
    ZegoSignalingPluginCore.getInstance().create({
      appID,
      appSign,
    });
  }
  uninit() {
    ZegoSignalingPluginCore.getInstance().destroy();
  }
  login(userID, userName, token) {
    return ZegoSignalingPluginCore.getInstance().login(
      {
        userID,
        userName,
      },
      token
    );
  }
  logout() {
    return ZegoSignalingPluginCore.getInstance().logout();
  }

  enableNotifyWhenAppRunningInBackgroundOrQuit(enable, isIOSDevelopmentEnvironment, appName) {
    this._notifyWhenAppRunningInBackgroundOrQuit = enable;

    if (enable) {
      if (Platform.OS === 'ios') {
        const CXProviderConfiguration = { localizedName: appName };
        CallKit.setInitConfiguration(CXProviderConfiguration);
        ZPNs.getInstance().applyNotificationPermission();
        ZPNs.enableDebug(isIOSDevelopmentEnvironment);
        ZPNs.getInstance().registerPush({ enableIOSVoIP: true });
      } else {
        ZPNs.setPushConfig({ "enableFCMPush": true, "enableHWPush": false, "enableMiPush": false, "enableOppoPush": false, "enableVivoPush": false });

        ZPNs.getInstance().registerPush({ enableIOSVoIP: true });
      }


      ZPNs.getInstance().on("registered", (message) => {
        console.log("@@@@@@@@@@@@@@@@>>>>>>>>>>>>>>>############", message)
      })

      // ZPNs.getInstance().on("notificationArrived", (message) => {
      //   console.log("@@@@@@@@@@@@@@@@notificationArrived>>>>>>>>>>>>>>>############", getCallID(message))
      //   setZpnState("notificationArrived: " + getCallID(message))
      // })
      // ZPNs.getInstance().on("notificationClicked", (message) => {
      //   console.log("@@@@@@@@@@@@@@@@notificationClicked>>>>>>>>>>>>>>>############", getCallID(message))
      //   setZpnState("notificationClicked: " + getCallID(message))
      // })
      // ZPNs.getInstance().on("throughMessageReceived", (message) => {
      //   console.log("@@@@@@@@@@@@@@@@throughMessageReceived>>>>>>>>>>>>>>>############", getCallID(message))
      //   setZpnState("throughMessageReceived: " + getCallID(message))
      // })

      CallKit.getInstance().on("didReceiveIncomingPush", (extras, uuid) => {
        console.log('#########didReceiveIncomingPush', extras, uuid);
        let { payload } = extras;
        const dataObj = payload ? JSON.parse(payload) : {};
        ZegoPluginInvitationService.getInstance().getIOSOfflineDataHandler()(dataObj, uuid);
      });
      CallKit.getInstance().on("providerDidReset", () => {
        console.log('#########providerDidReset');
      });
      CallKit.getInstance().on("providerDidBegin", () => {
        console.log('#########providerDidBegin');
      });
      CallKit.getInstance().on("didActivateAudioSession", () => {
        console.log('#########didActivateAudioSession');
      });
      CallKit.getInstance().on("didDeactivateAudioSession", () => {
        console.log('#########didDeactivateAudioSession');
      });
      CallKit.getInstance().on("timedOutPerformingAction", (action) => {
        console.log('#########timedOutPerformingAction', action);
      });
      CallKit.getInstance().on("performStartCallAction", (action) => {
        console.log('#########performStartCallAction', action);
      });
      CallKit.getInstance().on("performAnswerCallAction", (action) => {
        console.log('#########performAnswerCallAction', action);
        ZegoPluginInvitationService.getInstance().getAnswerCallHandle()()
      });
      CallKit.getInstance().on("performEndCallAction", (action) => {
        console.log('#########performEndCallAction', action);
        ZegoPluginInvitationService.getInstance().getEndCallHandle()()
      });
      CallKit.getInstance().on("performSetHeldCallAction", (action) => {
        console.log('#########performSetHeldCallAction', action);
      });
      CallKit.getInstance().on("performSetMutedCallAction", (action) => {
        console.log('#########performSetMutedCallAction', action);
      });
      CallKit.getInstance().on("performSetGroupCallAction", (action) => {
        console.log('#########performSetGroupCallAction', action);
      });
      CallKit.getInstance().on("performPlayDTMFCallAction", (action) => {
        console.log('#########performPlayDTMFCallAction', action);
      });
    } else {
      // ZPNs.getInstance().unregisterPush();
      ZPNs.getInstance().off("registered")
      // ZPNs.getInstance().off("notificationArrived")
      // ZPNs.getInstance().off("notificationClicked")
      // ZPNs.getInstance().off("throughMessageReceived")
    }

  }
  sendInvitation(inviterName, invitees, timeout, type, data, notificationConfig) {

    // invitees = invitees.map((invitee) => invitee);
    if (!invitees.length) {
      zlogerror('[Service]Send invitees is empty.');
      return Promise.reject(new ZegoPluginResult());
    }
    const config = { timeout };
    config.extendedData = JSON.stringify({
      inviter_name: inviterName,
      type,
      data,
    });

    if (this._notifyWhenAppRunningInBackgroundOrQuit) {
      config.pushConfig = {
        title: notificationConfig.title ?? "",
        content: notificationConfig.message ?? "",
        resourcesID: notificationConfig.resourceID ?? "",
        payload: data
      };
    }
    zloginfo(
      `[Service]Send invitation: invitees: ${invitees}, timeout: ${timeout}, type: ${type}, data: ${data}.`
    );
    return ZegoSignalingPluginCore.getInstance().invite(invitees, config);
  }
  cancelInvitation(invitees, data) {
    invitees = invitees.map((invitee) => invitee);
    if (!invitees.length) {
      zlogerror('[Service]Cancel invitees is empty.');
      return Promise.reject(new ZegoPluginResult());
    }
    const config = { extendedData: data };
    const callID = ZegoSignalingPluginCore.getInstance().getCallIDByUserID(
      ZegoSignalingPluginCore.getInstance().getLocalUser().userID
    );
    zloginfo(
      `[Service]Cancel invitation: callID: ${callID}, invitees: ${invitees}, data: ${data}.`
    );
    return ZegoSignalingPluginCore.getInstance().cancel(
      invitees,
      callID,
      config
    );
  }
  refuseInvitation(inviterID, data) {
    let callID;
    // Parse data and adapt automatic rejection
    if (data) {
      const dataObj = JSON.parse(data);
      callID = dataObj.callID;
    } else {
      callID =
        ZegoSignalingPluginCore.getInstance().getCallIDByUserID(inviterID);
    }
    if (!callID) {
      zlogerror('[Service]Call id corresponding to the inviterID is empty.');
      return Promise.reject(new ZegoPluginResult());
    }
    const config = { extendedData: data };
    zloginfo(
      `[Service]Refuse invitation: callID: ${callID}, inviter id: ${inviterID}, data: ${data}.`
    );
    return ZegoSignalingPluginCore.getInstance().reject(callID, config);
  }
  acceptInvitation(inviterID, data) {
    const callID =
      ZegoSignalingPluginCore.getInstance().getCallIDByUserID(inviterID);
    if (!callID) {
      zlogerror('[Service]Call id corresponding to the inviterID is empty.');
      return Promise.reject(new ZegoPluginResult());
    }
    const config = { extendedData: data };
    zloginfo(
      `[Service]Accept invitation: callID: ${callID}, inviter id: ${inviterID}, data: ${data}.`
    );
    return ZegoSignalingPluginCore.getInstance().accept(callID, config);
  }

  onConnectionStateChanged(callbackID, callback) {
    ZegoSignalingPluginCore.getInstance().onConnectionStateChanged(
      callbackID,
      callback
    );
  }
  onCallInvitationReceived(callbackID, callback) {
    ZegoSignalingPluginCore.getInstance().onCallInvitationReceived(
      callbackID,
      callback
    );
  }
  onCallInvitationTimeout(callbackID, callback) {
    ZegoSignalingPluginCore.getInstance().onCallInvitationTimeout(
      callbackID,
      callback
    );
  }
  onCallInviteesAnsweredTimeout(callbackID, callback) {
    ZegoSignalingPluginCore.getInstance().onCallInviteesAnsweredTimeout(
      callbackID,
      callback
    );
  }
  onCallInvitationAccepted(callbackID, callback) {
    ZegoSignalingPluginCore.getInstance().onCallInvitationAccepted(
      callbackID,
      callback
    );
  }
  onCallInvitationRejected(callbackID, callback) {
    ZegoSignalingPluginCore.getInstance().onCallInvitationRejected(
      callbackID,
      callback
    );
  }
  onCallInvitationCancelled(callbackID, callback) {
    ZegoSignalingPluginCore.getInstance().onCallInvitationCancelled(
      callbackID,
      callback
    );
  }
}
