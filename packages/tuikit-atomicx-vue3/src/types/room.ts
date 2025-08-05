// Import from local types
import { TUIConferenceStatus, TUIUserInfo } from '@tencentcloud/tuiroom-engine-js';
import { TUIRoomType, TUISeatMode } from './types';
import type { TUILoginUserInfo } from './types';

export type RoomInfo = {
  roomId: string;              // readonly
  roomName: string;
  roomOwner: TUILoginUserInfo; // readonly
  memberCount: number;         // readonly
  createTime: number;          // readonly
  roomStatus: TUIConferenceStatus;
  scheduleStartTime: number;
  scheduleEndTime: number;
  reminderSecondsBeforeStart: number;
  scheduleAttendees: TUIUserInfo[];
  password: string;
  isSeatEnabled: boolean;     // readonly
  seatMode: TUISeatMode;
  maxSeatCount: number;
  isMicrophoneDisableForAllUser: boolean;
  isScreenShareDisableForAllUser: boolean;
  isCameraDisableForAllUser: boolean;
  isMessageDisableForAllUser: boolean;
  customInfo: Record<string, any>;
};

export interface StartRoomParams {
  roomId: string;
  roomName?: string;
  seatMode?: TUISeatMode;
  maxSeatCount?: number;
  isMicrophoneDisableForAllUser?: boolean;
  isScreenShareDisableForAllUser?: boolean;
  isCameraDisableForAllUser?: boolean;
  isMessageDisableForAllUser?: boolean;
}

export interface EnterRoomParams {
  roomId: string;
}

export interface ScheduleRoomParams {
  scheduleStartTime: number;
  scheduleEndTime: number;
  scheduleAttendees?: string[];
  reminderSecondsBeforeStart?: number;
  roomId: string;
  roomName?: string;
  roomType?: TUIRoomType;
  isSeatEnabled?: boolean;
  seatMode?: TUISeatMode;
  isMicrophoneDisableForAllUser?: boolean;
  isScreenShareDisableForAllUser?: boolean;
  isCameraDisableForAllUser?: boolean;
  isMessageDisableForAllUser?: boolean;
  maxSeatCount?: number;
  password?: string;
}

export enum RoomAction {
  AudioAction = 'RoomAudioAction',
  VideoAction = 'RoomVideoAction',
  ScreenAction = 'RoomScreenAction',
}

export enum LocalRoomStatus {
  IDLE = "IDLE",               // 未加入会议
  JOINING = "JOINING",         // 正在加入会议
  JOINED = "JOINED",           // 已加入会议
  EXITING = "EXITING",         // 正在退出会议
  EXITED = "EXITED",           // 已退出会议
}
