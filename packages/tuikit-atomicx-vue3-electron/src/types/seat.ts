import type { Ref } from 'vue';
import { DeviceStatus } from './device';
import type { NetworkInfo } from './device';
import type { EventCallback } from '../utils/eventCenter';

/**
 * User suspend status enum.
 * @description Defines the suspend status of a user, e.g. moved to background or in a phone call.
 * Aligned with the Android `SuspendStatus` enum.
 */
export enum SuspendStatus {
  /** Not suspended. */
  None = 0,
  /** User has moved the app to background. */
  InBackground = 1,
  /** User is currently on a phone call. */
  InCalling = 2,
}

/**
 * Seat user info.
 * @description Detailed information of a user on a seat, including basic profile,
 * live room id, role, device status, device control permissions and suspend status.
 */
export type SeatUserInfo = {
  /** User ID. */
  userId: string;
  /** User nickname. */
  userName: string;
  /** User avatar URL. */
  avatarUrl: string;
  /** Live room ID. */
  liveId: string;
  /** User role in the live room. */
  role: Role;
  /** Microphone status. */
  microphoneStatus: DeviceStatus;
  /** Whether opening the microphone is allowed. */
  allowOpenMicrophone: boolean;
  /** Camera status. */
  cameraStatus: DeviceStatus;
  /** Whether opening the camera is allowed. */
  allowOpenCamera: boolean;
  /** User suspend status. */
  userSuspendStatus: SuspendStatus;
}

/**
 * Role enum.
 * @description Defines the role of a user in the live room: owner, administrator or general user.
 */
export enum Role {
  /** Live room owner. */
  Owner = 0,
  /** Live room administrator. */
  Administrator = 1,
  /** General audience / co-host user. */
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
