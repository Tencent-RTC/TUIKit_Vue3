import { DeviceStatus } from './device';

export type SeatUserInfo = {
  roomId: string;
  userId: string;
  userName: string;
  avatarUrl: string;
  microphoneStatus: DeviceStatus;
  cameraStatus: DeviceStatus;
  onSeatTimestamp: number;
  customInfo: Record<string, any>;
};

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
