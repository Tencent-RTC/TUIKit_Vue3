import { defineComponent } from 'vue';
import { PropType } from 'vue';
import { TUIRole, TUINetworkQuality } from './types';
import { DeviceStatus } from './device';

export enum SeatStatus {
  On = "On",            // 在麦上
  Off = "Off",          // 在麦下
  OffNeedPermission= "OffNeedPermission",  // 关闭状态且需要申请权限
  OffInvitationPending = "OffInvitationPending",   // 关闭状态且正在被邀请中
  OffApplicationPending = "OffApplicationPending", // 关闭状态且正在申请中
}

export enum UserRoomStatus {
  NotInRoom = "NotInRoom",       // 不在房间内
  InRoom = "InRoom",             // 在房间内
  InCalling = "InCalling"        // 在呼叫中
}

export enum ConnectionStatus {
  On = "On",            // 连接
  Off = "Off",          // 未连接
  OffInvitationPending = "OffInvitationPending",   // 未连接状态且正在被邀请中
  OffApplicationPending = "OffApplicationPending", // 未连接状态且正在申请中
}

export enum BattleStatus {
  On = "On",            // 连接
  Off = "Off",          // 未连接
  OffInvitationPending = "OffInvitationPending",   // 未连接状态且正在被邀请中
  OffApplicationPending = "OffApplicationPending", // 未连接状态且正在申请中
}

export enum StreamPlayStatus {
  Loading = 'Loading',
  Playing = 'Playing',
  Stopped = 'Stopped',
}

export enum RequestType {
  Seat = 'Seat',
  Microphone = 'Microphone',
  Camera = 'Camera',
  ScreenShare = 'ScreenShare',
  Connection = 'Connection',
}

export interface UserInfo {
  // 基础信息
  userId: string;
  userName: string;
  avatarUrl: string;
  nameCard: string;
  roomCustomInfo: Record<string, any>;
  userRole: TUIRole;
  isMessageDisabled: boolean;
  joinedTimestamp: number;
  // 会控信息
  seatStatus: SeatStatus;
  onSeatTimestamp: number;   // 新增，需要评审
  // 设备状态
  microphoneStatus: DeviceStatus;
  cameraStatus: DeviceStatus; // 有摄像头但是要播放 cdn 的流
  screenStatus: DeviceStatus;
  // 媒体流
  audioVolume: number;
  videoPlayStatus: StreamPlayStatus;
  screenPlayStatus: StreamPlayStatus;
  // 网络
  networkQuality: TUINetworkQuality;
  // 跨房字段
  roomId: string;
  userRoomStatus: UserRoomStatus;
  hostConnectionStatus: ConnectionStatus;
}

export enum UserAction {
  AudioAction = 'AudioAction',
  VideoAction = 'VideoAction',
  ChatAction = 'ChatAction',
  AdministratorAction = 'AdministratorAction',
  TransferOwnerAction = 'TransferOwnerAction',
  KickOutOfRoomAction = 'KickOutOfRoomAction',
  ChangeUserNameCardAction = 'ChangeUserNameCardAction',
  SeatAction = 'SeatAction',
  InviteEnterRoomAction = 'InviteEnterRoomAction',

  InviteOnSeatAction = 'InviteOnSeatAction',
  AgreeOnSeatAction = 'AgreeOnSeatAction',
  DenyOnSeatAction = 'DenyOnSeatAction',
  KickOffSeatAction = 'KickOutSeatAction',
}

export type ActionType<T> = {
  key: T;
  icon?: PropType<ReturnType<typeof defineComponent>>;
  label: string;
  handler: (data?: any) => void;
  style?: string;
};

export type UserActionType = ActionType<UserAction>;
