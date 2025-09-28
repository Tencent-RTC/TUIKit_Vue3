import { DeviceStatus, DeviceStatusReason } from './device';

export type SeatUserInfo = {
  liveId: string;
  userId: string;
  userName: string;
  avatarUrl: string;
  microphoneStatus: DeviceStatus;
  microphoneStatusReason: DeviceStatusReason;
  cameraStatus: DeviceStatus;
  cameraStatusReason: DeviceStatusReason;
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
