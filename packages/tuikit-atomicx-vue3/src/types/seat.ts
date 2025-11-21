import { DeviceStatus } from './device';

export type SeatUserInfo = {
  userId: string;
  userName: string;
  avatarUrl: string;
  // role: Role;  // 暂不支持，等 roomEngine 支持
  liveId: string;
  microphoneStatus: DeviceStatus;
  allowOpenMicrophone: boolean;
  cameraStatus: DeviceStatus;
  allowOpenCamera: boolean;
}

export enum Role {
  Owner = 0,
  Administrator = 1,
  GeneralUser = 2,
}

export type RegionInfo = {
  x: number;
  y: number;
  w: number;
  h: number;
  zOrder: number;
};

export type SeatInfo = {
  index: number;
  isLocked: boolean;
  userInfo?: SeatUserInfo;
  region?: RegionInfo;
};

export interface LiveCanvas {
  width: number;
  height: number;
  background: string;
}

export enum MoveSeatPolicy {
  AbortWhenOccupied = 0,
  ForceReplace = 1,
  SwapPosition = 2,
}

export enum DeviceControlPolicy {
  UnlockOnly = 1,
}

export enum LiveSeatEvent {
  onLocalCameraOpenedByAdmin = 'onLocalCameraOpenedByAdmin',
  onLocalCameraClosedByAdmin = 'onLocalCameraClosedByAdmin',
  onLocalMicrophoneOpenedByAdmin = 'onLocalMicrophoneOpenedByAdmin',
  onLocalMicrophoneClosedByAdmin = 'onLocalMicrophoneClosedByAdmin',
}
