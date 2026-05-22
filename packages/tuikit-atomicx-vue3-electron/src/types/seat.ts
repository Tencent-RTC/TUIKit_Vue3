import type { Ref } from 'vue';
import { DeviceStatus } from './device';
import type { NetworkInfo } from './device';
import type { EventCallback } from '../utils/eventCenter';

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

export interface ILiveSeatState {
  seatList: Ref<SeatInfo[]>;
  canvas: Ref<LiveCanvas>;
  speakingUsers: Ref<Map<string, number>>;
  networkQualities: Ref<Map<string, NetworkInfo>>;
  takeSeat: (params: { seatIndex: number }) => Promise<any>;
  leaveSeat: () => Promise<any>;
  lockSeat: (params: { seatIndex: number }) => Promise<any>;
  unLockSeat: (params: { seatIndex: number }) => Promise<any>;
  kickUserOutOfSeat: (params: { userId: string }) => Promise<any>;
  moveUserToSeat: (params: { userId: string; targetIndex: number; policy: MoveSeatPolicy }) => Promise<any>;
  openRemoteCamera: (params: { userId: string; policy: DeviceControlPolicy }) => Promise<any>;
  closeRemoteCamera: (params: { userId: string }) => Promise<any>;
  openRemoteMicrophone: (params: { userId: string; policy: DeviceControlPolicy }) => Promise<any>;
  closeRemoteMicrophone: (params: { userId: string }) => Promise<any>;
  muteMicrophone: () => Promise<void>;
  unmuteMicrophone: () => Promise<void>;
  startPlayStream: (params: { view: string }) => Promise<any>;
  stopPlayStream: () => Promise<any>;
  subscribeEvent: (event: LiveSeatEvent, callback: EventCallback) => void;
  unsubscribeEvent: (event: LiveSeatEvent, callback: EventCallback) => void;
}
