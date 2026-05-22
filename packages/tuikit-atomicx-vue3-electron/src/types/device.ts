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
  Microphone = 'Microphone',
  Camera = 'Camera',
  ScreenShare = 'ScreenShare',
}

export enum VideoQuality {
  Quality360P = 1,
  Quality540P = 2,
  Quality720P = 3,
  Quality1080P = 4,
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

import type { Ref } from 'vue';
import type { TUIDeviceInfo } from './types';

export interface IDeviceState {
  microphoneStatus: Ref<DeviceStatus>;
  microphoneList: Ref<TUIDeviceInfo[]>;
  currentMicrophone: Ref<TUIDeviceInfo | null>;
  microphoneLastError: Ref<DeviceError>;
  isMicrophoneTesting: Ref<boolean>;
  currentMicVolume: Ref<number>;
  captureVolume: Ref<number>;
  testingMicVolume: Ref<number>;
  cameraStatus: Ref<DeviceStatus>;
  cameraList: Ref<TUIDeviceInfo[]>;
  currentCamera: Ref<TUIDeviceInfo | null>;
  cameraLastError: Ref<DeviceError>;
  isCameraTesting: Ref<boolean>;
  isCameraTestLoading: Ref<boolean>;
  isFrontCamera: Ref<boolean>;
  localMirrorType: Ref<MirrorType>;
  localVideoQuality: Ref<VideoQuality>;
  speakerList: Ref<TUIDeviceInfo[]>;
  currentSpeaker: Ref<TUIDeviceInfo | null>;
  outputVolume: Ref<number>;
  currentAudioRoute: Ref<AudioRoute>;
  isSpeakerTesting: Ref<boolean>;
  screenStatus: Ref<DeviceStatus>;
  screenLastError: Ref<DeviceError>;
  networkInfo: Ref<NetworkInfo | null>;
  openLocalMicrophone: () => Promise<void>;
  closeLocalMicrophone: () => Promise<void>;
  muteLocalAudio: () => Promise<void>;
  unmuteLocalAudio: () => Promise<void>;
  getMicrophoneList: () => Promise<void>;
  setCurrentMicrophone: (options: { deviceId: string }) => Promise<void>;
  startMicrophoneTest: (options?: { interval?: number }) => Promise<void>;
  stopMicrophoneTest: () => Promise<void>;
  setCaptureVolume: (volume: number) => Promise<void>;
  getSpeakerList: () => Promise<void>;
  setCurrentSpeaker: (options: { deviceId: string }) => Promise<void>;
  setAudioRoute: (output: AudioRoute) => Promise<void>;
  startSpeakerTest: (options: { filePath: string }) => Promise<void>;
  stopSpeakerTest: () => Promise<void>;
  setOutputVolume: (volume: number) => Promise<void>;
  openLocalCamera: () => Promise<void>;
  closeLocalCamera: () => Promise<void>;
  getCameraList: () => Promise<void>;
  setCurrentCamera: (options: { deviceId: string }) => Promise<void>;
  switchCamera: (options: { isFrontCamera: boolean }) => Promise<void>;
  switchMirror: (options: { mirror: MirrorType }) => Promise<void>;
  updateVideoQuality: (options: { quality: VideoQuality }) => Promise<void>;
  startCameraTest: (options: { view: string | HTMLDivElement }) => Promise<void>;
  stopCameraTest: () => Promise<void>;
  startScreenShare: (options?: { screenAudio?: boolean; view?: string }) => Promise<void>;
  stopScreenShare: () => Promise<void>;
}
