// Import from local types
import type { TUISeatMode, TUILoginUserInfo, TUIVideoStreamType } from './types';

/**
 * Seat layout template enumeration
 * @description Simplified single parameter to configure seat-related settings
 *              Replaces the complex combination of isSeatEnabled, maxSeatCount, seatMode, etc.
 */
export enum SeatLayoutTemplate {
  /** Portrait dynamic 9-grid layout */
  VideoDynamicGrid9Seats = 600,
  /** Portrait dynamic 1v6 floating layout */
  VideoDynamicFloat7Seats = 601,
  /** Portrait static 9-grid layout */
  VideoFixedGrid9Seats = 800,
  /** Portrait static 1v6 floating layout */
  VideoFixedFloat7Seats = 801,
  /** Landscape 4-seat layout */
  VideoLandscape4Seats = 200,
}

export type LiveInfo = {
  liveId: string;
  liveName: string;
  liveType: LiveType; // to-do
  liveDescription: string;
  notice: string;
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
  keepOwnerOnSeat: boolean;
  seatMode: TUISeatMode;
  maxSeatCount: number;
  layoutTemplate: number;
  activityStatus: number;
  customInfo: Record<string, any>;
  seatTemplate?: SeatLayoutTemplate;
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

export interface StartLiveParams {
  liveId: string;
  liveName: string;
  notice?: string;
  isMessageDisableForAllUser?: boolean;
  isGiftEnabled?: boolean;
  isLikeEnabled?: boolean;
  isPublicVisible?: boolean;
  seatMode?: TUISeatMode;
  coverUrl?: string;
  backgroundUrl?: string;
  categoryList?: Array<number>;
  activityStatus?: number;
  seatLayoutTemplateId?: number;
  /** Seat template configuration */
  seatTemplate?: SeatLayoutTemplate;
}

/** @deprecated Use {@link StartLiveParams} instead. */
export type CreateLiveParams = StartLiveParams;

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
  /** Seat template configuration */
  seatTemplate?: SeatLayoutTemplate;
  layoutTemplate?: number;
}

/**
 * @module LiveListEvent
 * @description **直播列表事件列表**
 *
 * 直播列表模块的事件定义，通过 subscribeEvent/unsubscribeEvent 订阅/取消订阅直播列表事件。
 * 您可以通过这些事件处理直播结束和被踢出直播间等变化。
 *
 * > **注意：**
 * > 事件需要在事件触发之前监听，这样才能收到相应的事件通知。
 * > 建议在进入直播间前完成事件监听，这样才能确保不会漏掉事件通知。
 *
 * @example
 * import { LiveListEvent, useLiveListState } from 'tuikit-atomicx-vue3';
 * const { subscribeEvent, unsubscribeEvent } = useLiveListState();
 *
 * const onLiveEnded = (eventInfo) => {
 *   console.log('直播已结束:', eventInfo.liveId, '原因:', eventInfo.reason);
 * };
 * subscribeEvent(LiveListEvent.onLiveEnded, onLiveEnded);
 * unsubscribeEvent(LiveListEvent.onLiveEnded, onLiveEnded);
 */
export enum LiveListEvent {
  /**
   * 当直播结束时触发。
   * @event
   * @param {object} eventInfo - 事件参数对象
   * @param {string} eventInfo.liveId - 直播间 ID
   * @param {LiveEndedReason | LiveKickedOutReason} eventInfo.reason - 事件原因
   * @param {string} eventInfo.message - 附加信息
   * @example
   * import { LiveListEvent, useLiveListState } from 'tuikit-atomicx-vue3';
   * const { subscribeEvent } = useLiveListState();
   *
   * subscribeEvent(LiveListEvent.onLiveEnded, (eventInfo) => {
   *   console.log('直播已结束:', eventInfo.liveId);
   *   console.log('结束原因:', eventInfo.reason);
   *   console.log('附加信息:', eventInfo.message);
   * });
   */
  onLiveEnded = 'onLiveEnded',
  /**
   * 当被踢出直播间时触发。
   * @event
   * @param {object} eventInfo - 事件参数对象
   * @param {string} eventInfo.liveId - 直播间 ID
   * @param {LiveEndedReason | LiveKickedOutReason} eventInfo.reason - 踢出原因
   * @param {string} eventInfo.message - 附加信息
   * @example
   * import { LiveListEvent, useLiveListState } from 'tuikit-atomicx-vue3';
   * const { subscribeEvent } = useLiveListState();
   *
   * subscribeEvent(LiveListEvent.onKickedOutOfLive, (eventInfo) => {
   *   console.log('被踢出直播间:', eventInfo.liveId);
   *   console.log('踢出原因:', eventInfo.reason);
   *   console.log('附加信息:', eventInfo.message);
   * });
   */
  onKickedOutOfLive = 'onKickedOutOfLive',
}

/**
 * 直播结束原因枚举
 * @enum {number}
 * @description 定义直播结束的原因。
 */
export enum LiveEndedReason {
  /** 主播主动结束直播 */
  endedByHost = 1,
  /** 服务端结束直播 */
  endedByServer = 2,
}

/**
 * 被踢出直播间原因枚举
 * @enum {number}
 * @description 定义被踢出直播间的原因。
 */
export enum LiveKickedOutReason {
  /** 被管理员踢出 */
  byAdmin = 0,
  /** 在其他设备登录被踢出 */
  byLoggedOnOtherDevice = 1,
  /** 被服务端踢出 */
  byServer = 2,
  /** 网络断开 */
  forNetworkDisconnected = 3,
  /** 离线期间加入房间状态无效 */
  forJoinRoomStatusInvalidDuringOffline = 4,
  /** 加入的房间数超过限制 */
  forCountOfJoinedRoomsExceedLimit = 5,
}

/**
 * 直播列表事件信息类型定义
 * @interface LiveListEventInfo
 * @description 直播列表事件的回调参数类型。
 * @example
 * const eventInfo: LiveListEventInfo = {
 *   liveId: 'live_001',
 *   reason: LiveEndedReason.endedByHost,
 *   message: '主播结束了直播',
 * };
 */
export interface LiveListEventInfo {
  /** 直播间 ID */
  liveId: string;
  /** 事件原因 */
  reason: LiveEndedReason | LiveKickedOutReason;
  /** 附加信息 */
  message: string;
}

/**
 * 直播列表事件回调函数类型定义
 * @description 直播列表事件的回调函数类型。
 */
export type LiveListEventCallback = (eventInfo: LiveListEventInfo) => void;
