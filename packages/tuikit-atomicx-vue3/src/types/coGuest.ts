import type { LiveUserInfo } from './audience';

/**
 * @module CoGuestType
 * @description 连麦相关类型定义
 *
 * 提供直播连麦模块的类型定义，包括主播端事件、观众端事件、连麦请求信息和错误码。
 */

/**
 * @module HostEvent
 * @description **主播端连麦事件列表**
 *
 * 直播连麦模块中主播端的事件定义，通过 subscribeEvent/unsubscribeEvent 订阅/取消订阅主播端连麦事件。
 * 您可以通过这些事件处理观众上麦申请、申请取消和邀请响应等变化。
 *
 * > **注意：**
 * > 事件需要在事件触发之前监听，这样才能收到相应的事件通知。
 * > 建议在进入直播间前完成事件监听，这样才能确保不会漏掉事件通知。
 *
 * @example
 * import { HostEvent, useCoGuestState } from 'tuikit-atomicx-vue3';
 * const { subscribeEvent, unsubscribeEvent } = useCoGuestState();
 *
 * const onApplicationReceived = (eventInfo) => {
 *   console.log('收到连麦申请:', eventInfo.guestUser.userName);
 * };
 * subscribeEvent(HostEvent.onGuestApplicationReceived, onApplicationReceived);
 * unsubscribeEvent(HostEvent.onGuestApplicationReceived, onApplicationReceived);
 */
export enum HostEvent {
  /**
   * 当收到观众的连麦申请时触发。
   * @event
   * @param {object} eventInfo - 事件参数对象
   * @param {LiveUserInfo} eventInfo.guestUser - 申请连麦的观众信息
   * @example
   * import { HostEvent, useCoGuestState } from 'tuikit-atomicx-vue3';
   * const { subscribeEvent } = useCoGuestState();
   *
   * subscribeEvent(HostEvent.onGuestApplicationReceived, (eventInfo) => {
   *   console.log('收到连麦申请:', eventInfo.guestUser.userName);
   * });
   */
  onGuestApplicationReceived = 'onGuestApplicationReceived',
  /**
   * 当观众取消连麦申请时触发。
   * @event
   * @param {object} eventInfo - 事件参数对象
   * @param {LiveUserInfo} eventInfo.guestUser - 取消连麦申请的观众信息
   * @example
   * import { HostEvent, useCoGuestState } from 'tuikit-atomicx-vue3';
   * const { subscribeEvent } = useCoGuestState();
   *
   * subscribeEvent(HostEvent.onGuestApplicationCancelled, (eventInfo) => {
   *   console.log('连麦申请已取消:', eventInfo.guestUser.userName);
   * });
   */
  onGuestApplicationCancelled = 'onGuestApplicationCancelled',
  /**
   * 当观众的连麦申请被其他主播/管理员处理时触发。
   * @event
   * @param {object} eventInfo - 事件参数对象
   * @param {LiveUserInfo} eventInfo.guestUser - 申请连麦的观众信息
   * @param {LiveUserInfo} eventInfo.hostUser - 处理该申请的主播信息
   * @example
   * import { HostEvent, useCoGuestState } from 'tuikit-atomicx-vue3';
   * const { subscribeEvent } = useCoGuestState();
   *
   * subscribeEvent(HostEvent.onGuestApplicationProcessedByOtherHost, (eventInfo) => {
   *   console.log('连麦申请已被其他主播处理:', eventInfo.hostUser.userName);
   * });
   */
  onGuestApplicationProcessedByOtherHost = 'onGuestApplicationProcessedByOtherHost',
  /**
   * 当观众响应主播的连麦邀请时触发（接受或拒绝）。
   * @event
   * @param {object} eventInfo - 事件参数对象
   * @param {boolean} eventInfo.isAccept - 是否接受邀请
   * @param {LiveUserInfo} eventInfo.guestUser - 响应邀请的观众信息
   * @example
   * import { HostEvent, useCoGuestState } from 'tuikit-atomicx-vue3';
   * const { subscribeEvent } = useCoGuestState();
   *
   * subscribeEvent(HostEvent.onHostInvitationResponded, (eventInfo) => {
   *   console.log('邀请响应:', eventInfo.guestUser.userName, eventInfo.isAccept ? '已接受' : '已拒绝');
   * });
   */
  onHostInvitationResponded = 'onHostInvitationResponded',
  /**
   * 当观众未响应主播的连麦邀请时触发（超时或已在麦上）。
   * @event
   * @param {object} eventInfo - 事件参数对象
   * @param {LiveUserInfo} eventInfo.guestUser - 未响应的观众信息
   * @param {NoResponseReason} eventInfo.reason - 无响应原因
   * @example
   * import { HostEvent, useCoGuestState } from 'tuikit-atomicx-vue3';
   * const { subscribeEvent } = useCoGuestState();
   *
   * subscribeEvent(HostEvent.onHostInvitationNoResponse, (eventInfo) => {
   *   console.log('邀请无响应:', eventInfo.guestUser.userName);
   * });
   */
  onHostInvitationNoResponse = 'onHostInvitationNoResponse',
}

/**
 * @module GuestEvent
 * @description **观众端连麦事件列表**
 *
 * 直播连麦模块中观众端的事件定义，通过 subscribeEvent/unsubscribeEvent 订阅/取消订阅观众端连麦事件。
 * 您可以通过这些事件处理主播邀请上麦、申请响应和被踢下麦等变化。
 *
 * > **注意：**
 * > 事件需要在事件触发之前监听，这样才能收到相应的事件通知。
 * > 建议在进入直播间前完成事件监听，这样才能确保不会漏掉事件通知。
 *
 * @example
 * import { GuestEvent, useCoGuestState } from 'tuikit-atomicx-vue3';
 * const { subscribeEvent, unsubscribeEvent } = useCoGuestState();
 *
 * const onInvitationReceived = (eventInfo) => {
 *   console.log('收到主播连麦邀请:', eventInfo.hostUser.userName);
 * };
 * subscribeEvent(GuestEvent.onHostInvitationReceived, onInvitationReceived);
 * unsubscribeEvent(GuestEvent.onHostInvitationReceived, onInvitationReceived);
 */
export enum GuestEvent {
  /**
   * 当收到主播的连麦邀请时触发。
   * @event
   * @param {object} eventInfo - 事件参数对象
   * @param {LiveUserInfo} eventInfo.hostUser - 发起邀请的主播信息
   * @example
   * import { GuestEvent, useCoGuestState } from 'tuikit-atomicx-vue3';
   * const { subscribeEvent } = useCoGuestState();
   *
   * subscribeEvent(GuestEvent.onHostInvitationReceived, (eventInfo) => {
   *   console.log('收到主播邀请:', eventInfo.hostUser.userName);
   * });
   */
  onHostInvitationReceived = 'onHostInvitationReceived',
  /**
   * 当主播取消连麦邀请时触发。
   * @event
   * @param {object} eventInfo - 事件参数对象
   * @param {LiveUserInfo} eventInfo.hostUser - 取消邀请的主播信息
   * @example
   * import { GuestEvent, useCoGuestState } from 'tuikit-atomicx-vue3';
   * const { subscribeEvent } = useCoGuestState();
   *
   * subscribeEvent(GuestEvent.onHostInvitationCancelled, (eventInfo) => {
   *   console.log('主播已取消邀请:', eventInfo.hostUser.userName);
   * });
   */
  onHostInvitationCancelled = 'onHostInvitationCancelled',
  /**
   * 当主播响应观众的连麦申请时触发（接受或拒绝）。
   * @event
   * @param {object} eventInfo - 事件参数对象
   * @param {boolean} eventInfo.isAccept - 是否通过申请
   * @param {LiveUserInfo} eventInfo.hostUser - 处理申请的主播信息
   * @example
   * import { GuestEvent, useCoGuestState } from 'tuikit-atomicx-vue3';
   * const { subscribeEvent } = useCoGuestState();
   *
   * subscribeEvent(GuestEvent.onGuestApplicationResponded, (eventInfo) => {
   *   console.log('申请响应:', eventInfo.isAccept ? '已通过' : '已拒绝');
   * });
   */
  onGuestApplicationResponded = 'onGuestApplicationResponded',
  /**
   * 当观众的连麦申请无人响应时触发（超时）。
   * @event
   * @param {object} eventInfo - 事件参数对象
   * @param {NoResponseReason} eventInfo.reason - 无响应原因
   * @example
   * import { GuestEvent, useCoGuestState } from 'tuikit-atomicx-vue3';
   * const { subscribeEvent } = useCoGuestState();
   *
   * subscribeEvent(GuestEvent.onGuestApplicationNoResponse, (eventInfo) => {
   *   console.log('连麦申请无响应, 原因:', eventInfo.reason);
   * });
   */
  onGuestApplicationNoResponse = 'onGuestApplicationNoResponse',
  /**
   * 当观众的连麦申请发生错误时触发。
   * @event
   * @param {object} eventInfo - 事件参数对象
   * @param {SeatApplicationErrorCode} eventInfo.code - 错误码
   * @param {string} eventInfo.message - 错误信息
   * @example
   * import { GuestEvent, useCoGuestState } from 'tuikit-atomicx-vue3';
   * const { subscribeEvent } = useCoGuestState();
   *
   * subscribeEvent(GuestEvent.onGuestApplicationError, (eventInfo) => {
   *   console.log('连麦申请错误:', eventInfo.code, eventInfo.message);
   * });
   */
  onGuestApplicationError = 'onGuestApplicationError',
  /**
   * 当观众被主播踢下麦位时触发。
   * @event
   * @param {object} eventInfo - 事件参数对象
   * @param {number} eventInfo.seatIndex - 麦位索引
   * @param {LiveUserInfo} eventInfo.hostUser - 执行踢人操作的主播信息
   * @example
   * import { GuestEvent, useCoGuestState } from 'tuikit-atomicx-vue3';
   * const { subscribeEvent } = useCoGuestState();
   *
   * subscribeEvent(GuestEvent.onKickedOffSeat, (eventInfo) => {
   *   console.log('被踢下麦位:', eventInfo.seatIndex, '操作者:', eventInfo.hostUser.userName);
   * });
   */
  onKickedOffSeat = 'onKickedOffSeat',
}

/**
 * 连麦请求信息类型定义
 * @interface CoGuestRequestInfo
 * @description 定义连麦请求的详细信息，包括时间戳、请求 ID 和用户信息。
 * @example
 * const request: CoGuestRequestInfo = {
 *   timestamp: 1640995200,
 *   requestId: 'req_001',
 *   userId: 'user_001',
 *   userName: '观众A',
 *   nameCard: '观众A的名片',
 *   avatarUrl: 'https://example.com/avatar.png',
 * };
 */
export type CoGuestRequestInfo = {
  /** 请求时间戳 */
  timestamp: number;
  /** 请求 ID */
  requestId: string;
  /** 用户 ID */
  userId: string;
  /** 用户昵称 */
  userName: string;
  /** 用户名片 */
  nameCard: string;
  /** 用户头像 URL */
  avatarUrl: string;
};

/**
 * 无响应原因枚举
 * @enum {number}
 * @description 定义连麦邀请/申请无人响应的原因。
 */
export enum NoResponseReason {
  /** 超时无响应 */
  timeout = 0,
  /** 用户已在麦位上 */
  alreadySeated = 1,
}

/**
 * 上麦申请错误码枚举
 * @enum {number}
 * @description 定义上麦申请失败时的错误码。
 */
export enum SeatApplicationErrorCode {
  // Maximum seat count exceeds package limit
  MAX_SEAT_COUNT_LIMIT = -2340,

  // Seat index does not exist
  SEAT_INDEX_NOT_EXIST = -2344,

  // Insufficient operation permissions
  INSUFFICIENT_OPERATION_PERMISSIONS = 100006,

  // Seat is locked
  SEAT_LOCKED = 100200,

  // Seat is already occupied
  SEAT_OCCUPIED = 100201,

  // User is already in the seat queue
  ALREADY_ON_THE_SEAT_QUEUE = 100202,

  // User is already in a seat
  ALREADY_IN_SEAT = 100203,

  // User is not on the seat queue
  NOT_ON_THE_SEAT_QUEUE = 100204,

  // All seats are occupied
  ALL_SEAT_OCCUPIED = 100205,

  // User is not in a seat
  USER_NOT_IN_SEAT = 100206,

  // User is already on seat
  USER_ALREADY_ON_SEAT = 100210,

  // Seat does not support link mic
  SEAT_NOT_SUPPORT_LINK_MIC = 100211,

  // empty seat list
  EMPTY_SEAT_LIST = 100251,
}

/**
 * 收到观众连麦申请事件信息类型定义
 * @interface GuestApplicationReceivedEventInfo
 * @description 收到观众连麦申请事件的回调参数类型。
 */
interface GuestApplicationReceivedEventInfo {
  /** 申请连麦的观众信息 */
  guestUser: LiveUserInfo;
}

/**
 * 观众取消连麦申请事件信息类型定义
 * @interface GuestApplicationCancelledEventInfo
 * @description 观众取消连麦申请事件的回调参数类型。
 */
interface GuestApplicationCancelledEventInfo {
  /** 取消连麦申请的观众信息 */
  guestUser: LiveUserInfo;
}

/**
 * 连麦申请被其他主播处理事件信息类型定义
 * @interface GuestApplicationProcessedByOtherHostEventInfo
 * @description 观众的连麦申请被其他主播/管理员处理事件的回调参数类型。
 */
interface GuestApplicationProcessedByOtherHostEventInfo {
  /** 申请连麦的观众信息 */
  guestUser: LiveUserInfo;
  /** 处理该申请的主播信息 */
  hostUser: LiveUserInfo;
}

/**
 * 主播邀请响应事件信息类型定义
 * @interface HostInvitationRespondedEventInfo
 * @description 观众响应主播连麦邀请事件的回调参数类型。
 */
interface HostInvitationRespondedEventInfo {
  /** 是否接受邀请 */
  isAccept: boolean;
  /** 响应邀请的观众信息 */
  guestUser: LiveUserInfo;
}

/**
 * 主播邀请无响应事件信息类型定义
 * @interface HostInvitationNoResponseEventInfo
 * @description 观众未响应主播连麦邀请事件的回调参数类型。
 */
interface HostInvitationNoResponseEventInfo {
  /** 未响应的观众信息 */
  guestUser: LiveUserInfo;
  /** 无响应原因 */
  reason: NoResponseReason;
}

/**
 * 收到主播连麦邀请事件信息类型定义
 * @interface HostInvitationReceivedEventInfo
 * @description 收到主播连麦邀请事件的回调参数类型。
 */
interface HostInvitationReceivedEventInfo {
  /** 发起邀请的主播信息 */
  hostUser: LiveUserInfo;
}

/**
 * 主播取消连麦邀请事件信息类型定义
 * @interface HostInvitationCancelledEventInfo
 * @description 主播取消连麦邀请事件的回调参数类型。
 */
interface HostInvitationCancelledEventInfo {
  /** 取消邀请的主播信息 */
  hostUser: LiveUserInfo;
}

/**
 * 连麦申请响应事件信息类型定义
 * @interface GuestApplicationRespondedEventInfo
 * @description 主播响应观众连麦申请事件的回调参数类型。
 */
interface GuestApplicationRespondedEventInfo {
  /** 是否通过申请 */
  isAccept: boolean;
  /** 处理申请的主播信息 */
  hostUser: LiveUserInfo;
}

/**
 * 连麦申请无响应事件信息类型定义
 * @interface GuestApplicationNoResponseEventInfo
 * @description 连麦申请无人响应事件的回调参数类型。
 */
interface GuestApplicationNoResponseEventInfo {
  /** 无响应原因 */
  reason: NoResponseReason;
}

/**
 * 连麦申请错误事件信息类型定义
 * @interface GuestApplicationErrorEventInfo
 * @description 连麦申请发生错误事件的回调参数类型。
 */
interface GuestApplicationErrorEventInfo {
  /** 错误码 */
  code: SeatApplicationErrorCode;
  /** 错误信息 */
  message: string;
}

/**
 * 被踢下麦位事件信息类型定义
 * @interface KickedOffSeatEventInfo
 * @description 观众被踢下麦位事件的回调参数类型。
 */
interface KickedOffSeatEventInfo {
  /** 麦位索引 */
  seatIndex: number;
  /** 执行踢人操作的主播信息 */
  hostUser: LiveUserInfo;
}

/**
 * 主播端事件映射类型定义
 * @description 将每个 HostEvent 映射到其对应的回调参数类型。
 */
type HostEventInfoMap = {
  [HostEvent.onGuestApplicationReceived]: GuestApplicationReceivedEventInfo;
  [HostEvent.onGuestApplicationCancelled]: GuestApplicationCancelledEventInfo;
  [HostEvent.onGuestApplicationProcessedByOtherHost]: GuestApplicationProcessedByOtherHostEventInfo;
  [HostEvent.onHostInvitationResponded]: HostInvitationRespondedEventInfo;
  [HostEvent.onHostInvitationNoResponse]: HostInvitationNoResponseEventInfo;
};

/**
 * 观众端事件映射类型定义
 * @description 将每个 GuestEvent 映射到其对应的回调参数类型。
 */
type GuestEventInfoMap = {
  [GuestEvent.onHostInvitationReceived]: HostInvitationReceivedEventInfo;
  [GuestEvent.onHostInvitationCancelled]: HostInvitationCancelledEventInfo;
  [GuestEvent.onGuestApplicationResponded]: GuestApplicationRespondedEventInfo;
  [GuestEvent.onGuestApplicationNoResponse]: GuestApplicationNoResponseEventInfo;
  [GuestEvent.onGuestApplicationError]: GuestApplicationErrorEventInfo;
  [GuestEvent.onKickedOffSeat]: KickedOffSeatEventInfo;
};

/**
 * 连麦事件映射类型定义
 * @description 合并主播端和观众端的事件映射类型。
 */
export type CoGuestEventInfoMap = HostEventInfoMap & GuestEventInfoMap;

/**
 * 连麦事件回调函数基础类型定义
 * @description 连麦事件的回调函数基础类型。
 */
type CoGuestEventCallbackBase<T extends HostEvent | GuestEvent> = (
  eventInfo: CoGuestEventInfoMap[T]
) => void;

/**
 * 连麦事件回调函数类型定义
 * @interface CoGuestEventCallback
 * @description 连麦事件的回调函数类型。
 * 回调函数接收与订阅的事件类型对应的事件载荷。
 */
export type CoGuestEventCallback = CoGuestEventCallbackBase<HostEvent | GuestEvent>;
