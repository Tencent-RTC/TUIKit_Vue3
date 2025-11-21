export enum DeviceError {
  NoError = 'NoError',
  NoDeviceDetected = 'NoDeviceDetected',
  NoSystemPermission = 'NoSystemPermission',
  NotSupportCapture = 'NotSupportCapture',
}

export enum AudioOutput {
  Speaker = 'speaker',
  Earpiece = 'earpiece',
}

export enum DeviceType {
  Microphone =  'Microphone',
  Camera =  'Camera',
  ScreenShare =  'ScreenShare',
}

export enum DevicePermission {
  PublishAudio = 'PublishAudio',
  PublishVideo = 'PublishVideo',
  ScreenShare = 'ScreenShare',
}

export enum MediaSettingDisplayMode {
  Icon = 'Icon',
  IconWithPanel = 'IconWithPanel',
  Panel = 'Panel',
}

export interface VideoSettingProps {
  displayMode: MediaSettingDisplayMode;
  supportSwitchCamera?: boolean;
  supportSwitchResolution?: boolean;
  supportVideoPreview?: boolean;
  supportSwitchMirror?: boolean;
}

export interface AudioSettingProps {
  displayMode: MediaSettingDisplayMode;
  supportSwitchMicrophone?: boolean;
  supportSwitchSpeaker?: boolean;
  supportAudioLevel?: boolean;
}

export enum DeviceStatus {
  On = "On",            // 媒体状态打开
  Off = "Off",          // 媒体状态关闭
  AdminInviting = "AdminInviting",   // 关闭状态且正在被主持人/管理员被邀请中
  UserApplying = "UserApplying", // 关闭状态且用户正在申请打开中
}
