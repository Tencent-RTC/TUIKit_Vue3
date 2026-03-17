// Import from local types
import type { TUISeatMode, TUILoginUserInfo, TUIVideoStreamType } from './types';

export type LiveInfo = {
  liveId: string;
  liveName: string;
  liveType: LiveType; // to-do
  liveDescription: string;
  categoryList?: Array<number>;
  coverUrl: string;
  backgroundUrl: string;
  liveOwner: TUILoginUserInfo; // readonly
  currentViewerCount: number; // readonly
  totalViewerCount: number; // readonly
  createTime: number; // readonly
  isMessageDisable: boolean;
  isGiftEnabled: boolean;
  isPublicVisible: boolean;
  isSeatEnabled: boolean;
  seatMode: TUISeatMode;
  maxSeatCount: number;
  layoutTemplate: number;
  customInfo: Record<string, any>;
};

export enum LiveType {
  kLive = 0,
  kChatRoom = 1, // to-do liveType 如何知晓？roomEngine 需要支持
}

export enum LiveOrientation {
  Landscape = 'landscape',
  Portrait = 'portrait',
}

export interface LayoutItem {
  locationX: number; // 以画面左上角为原点的 x 坐标
  locationY: number; // 以画面左上角为原点的 y 坐标
  imageWidth: number; // 调整后的画面宽度
  imageHeight: number; // 调整后的画面高度
  zOrder: number; // 画面层级
  streamType: TUIVideoStreamType; // 0 摄像头, 1 屏幕共享, 2 白板, 3 自定义
  memberAccount: string; // 该路流的用户ID
  backgroundImageUrl: string;
  roomId: string;
  backgroundColor: string;
}

export interface LayoutInfo {
  videoEncode: {
    width: number;
    height: number;
  };
  layoutMode: number; // 0~9 内置布局模板， 1000 为自定义布局
  layoutInfo: {
    layoutList: LayoutItem[];
    maxUserLayout: {
      zOrder: number; // 层级，主要跟布局列表不要重复
      streamType: TUIVideoStreamType; // 0为摄像头， 1为屏幕共享
      memberAccount: string;
      roomId: string;
      backgroundColor: string;
    };
  };
}

export interface CreateLiveParams {
  liveId: string;
  liveName: string;
  notice?: string;
  isMessageDisableForAllUser?: boolean;
  isGiftEnabled?: boolean;
  isLikeEnabled?: boolean;
  isPublicVisible?: boolean;
  isSeatEnabled?: boolean;
  keepOwnerOnSeat?: boolean;
  seatLayoutTemplateId?: number;
  maxSeatCount?: number;
  seatMode?: TUISeatMode;
  coverUrl?: string;
  backgroundUrl?: string;
  categoryList?: Array<number>;
  activityStatus?: number;
}

export interface JoinLiveParams {
  liveId: string;
}

export interface UpdateLiveInfoParams {
  liveId?: string;
  activityStatus?: number;
  categoryList?: Array<number>;
  coverUrl?: string;
  backgroundUrl?: string;
  isPublicVisible?: boolean;
  layoutTemplate?: number;
}

export enum LiveListEvent {
  onLiveEnded = 'onLiveEnded',
  onKickedOutOfLive = 'onKickedOutOfLive',
}

export enum LiveEndedReason {
  endedByHost = 1,
  endedByServer = 2,
}

export enum LiveKickedOutReason {
  byAdmin = 0,
  byLoggedOnOtherDevice = 1,
  byServer = 2,
  forNetworkDisconnected = 3,
  forJoinRoomStatusInvalidDuringOffline = 4,
  forCountOfJoinedRoomsExceedLimit = 5,
}

export interface LiveListEventInfo {
  liveId: string;
  reason: LiveEndedReason | LiveKickedOutReason;
  message: string;
}

export type LiveListEventCallback = (eventInfo: LiveListEventInfo) => void;
