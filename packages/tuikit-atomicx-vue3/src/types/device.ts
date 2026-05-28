import type { Ref } from 'vue';
import type { TUIDeviceInfo } from '@tencentcloud/tuiroom-engine-js';

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

export interface IDeviceState {
  // Microphone state
  microphoneStatus: Ref<DeviceStatus>;
  microphoneList: Ref<TUIDeviceInfo[]>;
  currentMicrophone: Ref<TUIDeviceInfo | null>;
  microphoneLastError: Ref<DeviceError>;
  captureVolume: Ref<number>;
  currentMicVolume: Ref<number>;
  isMicrophoneTesting: Ref<boolean>;
  testingMicVolume: Ref<number>;
  // Camera state
  cameraStatus: Ref<DeviceStatus>;
  cameraList: Ref<TUIDeviceInfo[]>;
  currentCamera: Ref<TUIDeviceInfo | null>;
  cameraLastError: Ref<DeviceError>;
  isCameraTesting: Ref<boolean>;
  isCameraTestLoading: Ref<boolean>;
  isFrontCamera: Ref<boolean>;
  localMirrorType: Ref<MirrorType>;
  localVideoQuality: Ref<VideoQuality>;
  // Speaker state
  speakerList: Ref<TUIDeviceInfo[]>;
  currentSpeaker: Ref<TUIDeviceInfo | null>;
  outputVolume: Ref<number>;
  currentAudioRoute: Ref<AudioRoute>;
  isSpeakerTesting: Ref<boolean>;
  // Screen share state
  screenStatus: Ref<DeviceStatus>;
  screenLastError: Ref<DeviceError>;
  // Network state
  networkInfo: Ref<NetworkInfo | null>;
  // Microphone actions
  openLocalMicrophone: () => Promise<void>;
  closeLocalMicrophone: () => Promise<void>;
  muteLocalAudio: () => Promise<void>;
  unmuteLocalAudio: () => Promise<void>;
  getMicrophoneList: () => Promise<void>;
  setCurrentMicrophone: (options: { deviceId: string }) => Promise<void>;
  startMicrophoneTest: (options?: { interval?: number }) => Promise<void>;
  stopMicrophoneTest: () => Promise<void>;
  setCaptureVolume: (volume: number) => Promise<void>;
  // Speaker actions
  getSpeakerList: () => Promise<void>;
  setCurrentSpeaker: (options: { deviceId: string }) => Promise<void>;
  setAudioRoute: (output: AudioRoute) => Promise<void>;
  startSpeakerTest: (options: { filePath: string }) => Promise<void>;
  stopSpeakerTest: () => Promise<void>;
  setOutputVolume: (volume: number) => Promise<void>;
  // Camera actions
  openLocalCamera: () => Promise<void>;
  closeLocalCamera: () => Promise<void>;
  getCameraList: () => Promise<void>;
  setCurrentCamera: (options: { deviceId: string }) => Promise<void>;
  switchCamera: (options: { isFrontCamera: boolean }) => Promise<void>;
  switchMirror: (options: { mirror: MirrorType }) => Promise<void>;
  updateVideoQuality: (options: { quality: VideoQuality }) => Promise<void>;
  startCameraTest: (options: { view: string | HTMLDivElement }) => Promise<void>;
  stopCameraTest: () => Promise<void>;
  // Screen share actions
  startScreenShare: (options?: { screenAudio?: boolean; view?: string }) => Promise<void>;
  stopScreenShare: () => Promise<void>;
}
