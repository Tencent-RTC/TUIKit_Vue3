import type { SeatUserInfo } from './seat';

/**
 * @module BattleType
 * @description PK 对战相关类型定义
 *
 * 提供直播 PK 对战模块的类型定义，包括对战配置、对战信息和对战结束原因。
 */

/**
 * PK 对战配置接口
 * @interface BattleConfig
 * @description 定义 PK 对战的配置信息，包括对战时长、是否需要对方响应和扩展信息。
 * @example
 * const config: BattleConfig = {
 *   duration: 300,
 *   needResponse: true,
 *   extensionInfo: '{"type":"pk"}',
 * };
 */
export interface BattleConfig {
  /** 对战时长（秒） */
  duration: number;
  /** 是否需要对方响应 */
  needResponse: boolean;
  /** 扩展信息 */
  extensionInfo: string;
}

/**
 * PK 对战信息接口
 * @interface BattleInfo
 * @description 定义 PK 对战的详细信息，包括对战 ID、配置、开始时间和结束时间。
 * @example
 * const battle: BattleInfo = {
 *   battleId: 'battle_001',
 *   config: { duration: 300, needResponse: true, extensionInfo: '' },
 *   startTime: 1640995200,
 *   endTime: 1640995500,
 * };
 */
export interface BattleInfo {
  /** 对战 ID */
  battleId: string;
  /** 对战配置 */
  config: BattleConfig;
  /** 对战开始时间戳（秒） */
  startTime: number;
  /** 对战结束时间戳（秒） */
  endTime: number;
}

/**
 * PK 对战结束原因枚举
 * @enum {number}
 * @description 定义 PK 对战结束的原因类型。
 * @example
 * if (reason === BattleEndedReason.timeOver) {
 *   console.log('对战时间结束');
 * }
 */
export enum BattleEndedReason {
  /** 对战时间结束 */
  timeOver = 0,
  /** 所有成员退出 */
  allMemberExit = 1,
}

/**
 * @module BattleEvent
 * @description **PK 对战事件列表**
 *
 * 直播 PK 对战模块的事件定义，通过 subscribeEvent/unsubscribeEvent 订阅/取消订阅对战事件。
 * 您可以通过这些事件处理对战开始、结束、用户加入退出以及对战请求的变化。
 *
 * > **注意：**
 * > 事件需要在事件触发之前监听，这样才能收到相应的事件通知。
 * > 建议在进入直播间前完成事件监听，这样才能确保不会漏掉事件通知。
 *
 * @example
 * import { BattleEvent, useBattleState } from 'tuikit-atomicx-vue3';
 * const { subscribeEvent, unsubscribeEvent } = useBattleState();
 *
 * const onBattleStarted = (eventInfo) => {
 *   console.log('PK 对战开始:', eventInfo.battleInfo.battleId);
 * };
 * subscribeEvent(BattleEvent.onBattleStarted, onBattleStarted);
 * unsubscribeEvent(BattleEvent.onBattleStarted, onBattleStarted);
 */
export enum BattleEvent {
  /**
   * 当 PK 对战开始时触发。
   * @event
   * @param {object} eventInfo - 事件参数对象
   * @param {BattleInfo} eventInfo.battleInfo - 对战信息
   * @param {SeatUserInfo} eventInfo.inviter - 发起邀请的用户信息
   * @param {SeatUserInfo[]} eventInfo.invitees - 被邀请的用户列表
   * @example
   * import { BattleEvent, useBattleState } from 'tuikit-atomicx-vue3';
   * const { subscribeEvent } = useBattleState();
   *
   * subscribeEvent(BattleEvent.onBattleStarted, (eventInfo) => {
   *   console.log('对战开始:', eventInfo.battleInfo.battleId);
   *   console.log('邀请者:', eventInfo.inviter.userName);
   *   console.log('被邀请者:', eventInfo.invitees.map(u => u.userName));
   * });
   */
  onBattleStarted = 'onBattleStarted',
  /**
   * 当 PK 对战结束时触发。
   * @event
   * @param {object} eventInfo - 事件参数对象
   * @param {BattleInfo} eventInfo.battleInfo - 对战信息
   * @param {BattleEndedReason} eventInfo.reason - 对战结束原因
   * @example
   * import { BattleEvent, useBattleState } from 'tuikit-atomicx-vue3';
   * const { subscribeEvent } = useBattleState();
   *
   * subscribeEvent(BattleEvent.onBattleEnded, (eventInfo) => {
   *   console.log('对战结束:', eventInfo.battleInfo.battleId);
   *   console.log('结束原因:', eventInfo.reason);
   * });
   */
  onBattleEnded = 'onBattleEnded',
  /**
   * 当有用户加入 PK 对战时触发。
   * @event
   * @param {object} eventInfo - 事件参数对象
   * @param {string} eventInfo.battleId - 对战 ID
   * @param {SeatUserInfo} eventInfo.battleUser - 加入对战的用户信息
   * @example
   * import { BattleEvent, useBattleState } from 'tuikit-atomicx-vue3';
   * const { subscribeEvent } = useBattleState();
   *
   * subscribeEvent(BattleEvent.onUserJoinBattle, (eventInfo) => {
   *   console.log('用户加入对战:', eventInfo.battleUser.userName);
   * });
   */
  onUserJoinBattle = 'onUserJoinBattle',
  /**
   * 当有用户退出 PK 对战时触发。
   * @event
   * @param {object} eventInfo - 事件参数对象
   * @param {string} eventInfo.battleId - 对战 ID
   * @param {SeatUserInfo} eventInfo.battleUser - 退出对战的用户信息
   * @example
   * import { BattleEvent, useBattleState } from 'tuikit-atomicx-vue3';
   * const { subscribeEvent } = useBattleState();
   *
   * subscribeEvent(BattleEvent.onUserExitBattle, (eventInfo) => {
   *   console.log('用户退出对战:', eventInfo.battleUser.userName);
   * });
   */
  onUserExitBattle = 'onUserExitBattle',
  /**
   * 当收到 PK 对战请求时触发。
   * @event
   * @param {object} eventInfo - 事件参数对象
   * @param {string} eventInfo.battleId - 对战 ID
   * @param {SeatUserInfo} eventInfo.inviter - 发起邀请的用户信息
   * @param {SeatUserInfo} eventInfo.invitee - 被邀请的用户信息
   * @example
   * import { BattleEvent, useBattleState } from 'tuikit-atomicx-vue3';
   * const { subscribeEvent } = useBattleState();
   *
   * subscribeEvent(BattleEvent.onBattleRequestReceived, (eventInfo) => {
   *   console.log('收到对战请求, 邀请者:', eventInfo.inviter.userName);
   * });
   */
  onBattleRequestReceived = 'onBattleRequestReceived',
  /**
   * 当 PK 对战请求被取消时触发。
   * @event
   * @param {object} eventInfo - 事件参数对象
   * @param {string} eventInfo.battleId - 对战 ID
   * @param {SeatUserInfo} eventInfo.inviter - 发起邀请的用户信息
   * @param {SeatUserInfo} eventInfo.invitee - 被邀请的用户信息
   * @example
   * import { BattleEvent, useBattleState } from 'tuikit-atomicx-vue3';
   * const { subscribeEvent } = useBattleState();
   *
   * subscribeEvent(BattleEvent.onBattleRequestCancelled, (eventInfo) => {
   *   console.log('对战请求已取消, 邀请者:', eventInfo.inviter.userName);
   * });
   */
  onBattleRequestCancelled = 'onBattleRequestCancelled',
  /**
   * 当 PK 对战请求超时时触发。
   * @event
   * @param {object} eventInfo - 事件参数对象
   * @param {string} eventInfo.battleId - 对战 ID
   * @param {SeatUserInfo} eventInfo.inviter - 发起邀请的用户信息
   * @param {SeatUserInfo} eventInfo.invitee - 被邀请的用户信息
   * @example
   * import { BattleEvent, useBattleState } from 'tuikit-atomicx-vue3';
   * const { subscribeEvent } = useBattleState();
   *
   * subscribeEvent(BattleEvent.onBattleRequestTimeout, (eventInfo) => {
   *   console.log('对战请求超时, 邀请者:', eventInfo.inviter.userName);
   * });
   */
  onBattleRequestTimeout = 'onBattleRequestTimeout',
  /**
   * 当 PK 对战请求被接受时触发。
   * @event
   * @param {object} eventInfo - 事件参数对象
   * @param {string} eventInfo.battleId - 对战 ID
   * @param {SeatUserInfo} eventInfo.inviter - 发起邀请的用户信息
   * @param {SeatUserInfo} eventInfo.invitee - 被邀请的用户信息
   * @example
   * import { BattleEvent, useBattleState } from 'tuikit-atomicx-vue3';
   * const { subscribeEvent } = useBattleState();
   *
   * subscribeEvent(BattleEvent.onBattleRequestAccept, (eventInfo) => {
   *   console.log('对战请求已接受, 被邀请者:', eventInfo.invitee.userName);
   * });
   */
  onBattleRequestAccept = 'onBattleRequestAccept',
  /**
   * 当 PK 对战请求被拒绝时触发。
   * @event
   * @param {object} eventInfo - 事件参数对象
   * @param {string} eventInfo.battleId - 对战 ID
   * @param {SeatUserInfo} eventInfo.inviter - 发起邀请的用户信息
   * @param {SeatUserInfo} eventInfo.invitee - 被邀请的用户信息
   * @example
   * import { BattleEvent, useBattleState } from 'tuikit-atomicx-vue3';
   * const { subscribeEvent } = useBattleState();
   *
   * subscribeEvent(BattleEvent.onBattleRequestReject, (eventInfo) => {
   *   console.log('对战请求已拒绝, 被邀请者:', eventInfo.invitee.userName);
   * });
   */
  onBattleRequestReject = 'onBattleRequestReject',
}
/**
 * PK 对战开始事件信息类型定义
 * @interface BattleStartedEventInfo
 * @description PK 对战开始事件的回调参数类型。
 */
interface BattleStartedEventInfo {
  /** 对战信息 */
  battleInfo: BattleInfo;
  /** 发起邀请的用户信息 */
  inviter: SeatUserInfo;
  /** 被邀请的用户列表 */
  invitees: SeatUserInfo[];
}

/**
 * PK 对战结束事件信息类型定义
 * @interface BattleEndedEventInfo
 * @description PK 对战结束事件的回调参数类型。
 */
interface BattleEndedEventInfo {
  /** 对战信息 */
  battleInfo: BattleInfo;
  /** 对战结束原因 */
  reason: BattleEndedReason;
}

/**
 * 用户加入对战事件信息类型定义
 * @interface UserJoinBattleEventInfo
 * @description 用户加入 PK 对战事件的回调参数类型。
 */
interface UserJoinBattleEventInfo {
  /** 对战 ID */
  battleId: string;
  /** 加入对战的用户信息 */
  battleUser: SeatUserInfo;
}

/**
 * 用户退出对战事件信息类型定义
 * @interface UserExitBattleEventInfo
 * @description 用户退出 PK 对战事件的回调参数类型。
 */
interface UserExitBattleEventInfo {
  /** 对战 ID */
  battleId: string;
  /** 退出对战的用户信息 */
  battleUser: SeatUserInfo;
}

/**
 * 收到对战请求事件信息类型定义
 * @interface BattleRequestReceivedEventInfo
 * @description 收到 PK 对战请求事件的回调参数类型。
 */
interface BattleRequestReceivedEventInfo {
  /** 对战 ID */
  battleId: string;
  /** 发起邀请的用户信息 */
  inviter: SeatUserInfo;
  /** 被邀请的用户信息 */
  invitee: SeatUserInfo;
}

/**
 * 对战请求取消事件信息类型定义
 * @interface BattleRequestCancelledEventInfo
 * @description PK 对战请求被取消事件的回调参数类型。
 */
interface BattleRequestCancelledEventInfo {
  /** 对战 ID */
  battleId: string;
  /** 发起邀请的用户信息 */
  inviter: SeatUserInfo;
  /** 被邀请的用户信息 */
  invitee: SeatUserInfo;
}

/**
 * 对战请求超时事件信息类型定义
 * @interface BattleRequestTimeoutEventInfo
 * @description PK 对战请求超时事件的回调参数类型。
 */
interface BattleRequestTimeoutEventInfo {
  /** 对战 ID */
  battleId: string;
  /** 发起邀请的用户信息 */
  inviter: SeatUserInfo;
  /** 被邀请的用户信息 */
  invitee: SeatUserInfo;
}

/**
 * 对战请求被接受事件信息类型定义
 * @interface BattleRequestAcceptEventInfo
 * @description PK 对战请求被接受事件的回调参数类型。
 */
interface BattleRequestAcceptEventInfo {
  /** 对战 ID */
  battleId: string;
  /** 发起邀请的用户信息 */
  inviter: SeatUserInfo;
  /** 被邀请的用户信息 */
  invitee: SeatUserInfo;
}

/**
 * 对战请求被拒绝事件信息类型定义
 * @interface BattleRequestRejectEventInfo
 * @description PK 对战请求被拒绝事件的回调参数类型。
 */
interface BattleRequestRejectEventInfo {
  /** 对战 ID */
  battleId: string;
  /** 发起邀请的用户信息 */
  inviter: SeatUserInfo;
  /** 被邀请的用户信息 */
  invitee: SeatUserInfo;
}

/**
 * PK 对战事件映射类型定义
 * @interface BattleEventInfoMap
 * @description 将每个 BattleEvent 映射到其对应的回调参数类型。
 * @example
 * type StartedPayload = BattleEventInfoMap[BattleEvent.onBattleStarted]; // BattleStartedEventInfo
 * type EndedPayload = BattleEventInfoMap[BattleEvent.onBattleEnded]; // BattleEndedEventInfo
 */
export type BattleEventInfoMap = {
  [BattleEvent.onBattleStarted]: BattleStartedEventInfo;
  [BattleEvent.onBattleEnded]: BattleEndedEventInfo;
  [BattleEvent.onUserJoinBattle]: UserJoinBattleEventInfo;
  [BattleEvent.onUserExitBattle]: UserExitBattleEventInfo;
  [BattleEvent.onBattleRequestReceived]: BattleRequestReceivedEventInfo;
  [BattleEvent.onBattleRequestCancelled]: BattleRequestCancelledEventInfo;
  [BattleEvent.onBattleRequestTimeout]: BattleRequestTimeoutEventInfo;
  [BattleEvent.onBattleRequestAccept]: BattleRequestAcceptEventInfo;
  [BattleEvent.onBattleRequestReject]: BattleRequestRejectEventInfo;
};

/**
 * PK 对战事件回调函数类型定义
 * @interface BattleEventCallback
 * @description PK 对战事件的回调函数类型。
 * 回调函数接收与订阅的事件类型对应的事件载荷。
 */
export type BattleEventCallback = <T extends BattleEvent = BattleEvent>(eventInfo: BattleEventInfoMap[T]) => void;
