export enum DeviceError {
  NoError = 0,
  NoDeviceDetected = 1,
  NoSystemPermission = 2,
  NotSupportCapture = 3,
  OccupiedError = 4,
  UnknownError = 5,
}

export enum AudioRoute {
  Speakerphone = 0,
  Earpiece = 1,
}

export enum MirrorType {
  Auto = 0,
  Enable = 1,
  Disable = 2,
}

export enum DeviceType {
  Microphone = 0,
  Camera = 1,
  ScreenShare = 2,
}

export enum VideoQuality {
  Quality360P = 1,
  Quality540P = 2,
  Quality720P = 3,
  Quality1080P = 4,
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
  Off = 0,
  On = 1,
}

export enum NetworkQuality {
  Unknown = 0,
  Excellent = 1,
  Good = 2,
  Poor = 3,
  Bad = 4,
  VeryBad = 5,
  Down = 6,
}

export interface NetworkInfo {
  quality: NetworkQuality;
  upLoss: number;
  downLoss: number;
  delay: number;
}
