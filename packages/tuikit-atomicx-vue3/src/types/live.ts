// Import from local types
import { TUISeatMode } from './types';
import { TUISeatLayoutTemplate } from '@tencentcloud/tuiroom-engine-js';
import type { TUILoginUserInfo, TUIVideoStreamType } from './types';

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
  layoutTemplate: TUISeatLayoutTemplate;
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

export enum LiveStatus {
  IDLE = 'IDLE', // 未进入直播间的状态
  NotStarted = 'NotStarted', // 进入直播间，直播未开始
  Live = 'Live', // 进入直播间，直播中
  Paused = 'Paused', // 进入直播间，直播暂停中，优先级低
  Ended = 'Ended', // 进入直播间，直播已结束
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
  notice: string;
  isMessageDisableForAllUser: boolean;
  isGiftEnabled: boolean;
  isLikeEnabled: boolean;
  isPublicVisible: boolean;
  isSeatEnabled: boolean;
  keepOwnerOnSeat: boolean;
  seatLayoutTemplateId: number;
  maxSeatCount: number;
  seatMode: TUISeatMode;
  coverUrl: string;
  backgroundUrl: string;
  categoryList: Array<number>;
  activityStatus: number;
}

export interface JoinLiveParams {
  liveId: string;
}

export interface UpdateLiveInfoParams {
  liveId: string;
  activityStatus?: number;
  categoryList?: Array<number>;
  coverUrl?: string;
  backgroundUrl?: string;
  isPublicVisible?: boolean;
}
