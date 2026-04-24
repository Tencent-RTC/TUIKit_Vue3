/**
 * @module CoHostType
 * @description 主播连线相关类型定义
 *
 * 提供直播主播连线（跨房连线）模块的类型定义，包括连线状态、连线事件和布局模板。
 */

/**
 * 主播连线状态枚举
 * @enum {string}
 * @description 定义主播连线的当前状态。
 * @example
 * if (status === CoHostStatus.Connected) {
 *   console.log('当前正在连线中');
 * }
 */
export enum CoHostStatus {
  /** 连线中 */
  Connected = 'Connected',
  /** 未连线 */
  Disconnected = 'Disconnected',
}

/**
 * @module CoHostEvent
 * @description **主播连线事件列表**
 *
 * 直播主播连线（跨房连线）模块的事件定义，通过 subscribeEvent/unsubscribeEvent 订阅/取消订阅连线事件。
 * 您可以通过这些事件处理连线请求、接受、拒绝、超时以及连线用户加入离开等变化。
 *
 * > **注意：**
 * > 事件需要在事件触发之前监听，这样才能收到相应的事件通知。
 * > 建议在进入直播间前完成事件监听，这样才能确保不会漏掉事件通知。
 *
 * @example
 * import { CoHostEvent, useCoHostState } from 'tuikit-atomicx-vue3';
 * const { subscribeEvent, unsubscribeEvent } = useCoHostState();
 *
 * const onRequestReceived = (eventInfo) => {
 *   console.log('收到连线请求:', eventInfo.inviter.userName);
 * };
 * subscribeEvent(CoHostEvent.onCoHostRequestReceived, onRequestReceived);
 * unsubscribeEvent(CoHostEvent.onCoHostRequestReceived, onRequestReceived);
 */
export enum CoHostEvent {
  /**
   * 当收到其他主播的连线请求时触发。
   * @event
   * @param {object} eventInfo - 事件参数对象
   * @param {SeatUserInfo} eventInfo.inviter - 发起连线请求的用户信息
   * @param {string} eventInfo.extensionInfo - 请求附带的扩展信息
   * @example
   * import { CoHostEvent, useCoHostState } from 'tuikit-atomicx-vue3';
   * const { subscribeEvent } = useCoHostState();
   *
   * subscribeEvent(CoHostEvent.onCoHostRequestReceived, (eventInfo) => {
   *   console.log('收到连线请求:', eventInfo.inviter.userName);
   *   console.log('扩展信息:', eventInfo.extensionInfo);
   * });
   */
  onCoHostRequestReceived = 'onCoHostRequestReceived',
  /**
   * 当主播取消连线请求时触发。
   * @event
   * @param {object} eventInfo - 事件参数对象
   * @param {SeatUserInfo} eventInfo.inviter - 取消连线请求的用户（原邀请方）
   * @param {SeatUserInfo} eventInfo.invitee - 当前登录用户（被取消请求的一方）
   * @example
   * import { CoHostEvent, useCoHostState } from 'tuikit-atomicx-vue3';
   * const { subscribeEvent } = useCoHostState();
   *
   * subscribeEvent(CoHostEvent.onCoHostRequestCancelled, (eventInfo) => {
   *   console.log('连线请求已取消:', eventInfo.inviter.userName);
   *   console.log('被取消方:', eventInfo.invitee.userName);
   * });
   */
  onCoHostRequestCancelled = 'onCoHostRequestCancelled',
  /**
   * 当对方主播接受连线请求时触发。
   * @event
   * @param {object} eventInfo - 事件参数对象
   * @param {SeatUserInfo} eventInfo.invitee - 接受连线请求的用户信息
   * @example
   * import { CoHostEvent, useCoHostState } from 'tuikit-atomicx-vue3';
   * const { subscribeEvent } = useCoHostState();
   *
   * subscribeEvent(CoHostEvent.onCoHostRequestAccepted, (eventInfo) => {
   *   console.log('连线请求已接受:', eventInfo.invitee.userName);
   * });
   */
  onCoHostRequestAccepted = 'onCoHostRequestAccepted',
  /**
   * 当对方主播拒绝连线请求时触发。
   * @event
   * @param {object} eventInfo - 事件参数对象
   * @param {SeatUserInfo} eventInfo.invitee - 拒绝连线请求的用户信息
   * @example
   * import { CoHostEvent, useCoHostState } from 'tuikit-atomicx-vue3';
   * const { subscribeEvent } = useCoHostState();
   *
   * subscribeEvent(CoHostEvent.onCoHostRequestRejected, (eventInfo) => {
   *   console.log('连线请求已拒绝:', eventInfo.invitee.userName);
   * });
   */
  onCoHostRequestRejected = 'onCoHostRequestRejected',
  /**
   * 当连线请求超时未响应时触发。
   * @event
   * @param {object} eventInfo - 事件参数对象
   * @param {SeatUserInfo} eventInfo.inviter - 发起连线请求的用户
   * @param {SeatUserInfo} eventInfo.invitee - 被邀请连线的用户
   * @example
   * import { CoHostEvent, useCoHostState } from 'tuikit-atomicx-vue3';
   * const { subscribeEvent } = useCoHostState();
   *
   * subscribeEvent(CoHostEvent.onCoHostRequestTimeout, (eventInfo) => {
   *   console.log('连线请求超时:', eventInfo.inviter.userName);
   *   console.log('被邀请方:', eventInfo.invitee.userName);
   * });
   */
  onCoHostRequestTimeout = 'onCoHostRequestTimeout',
  /**
   * 当连线用户加入时触发。
   * @event
   * @param {object} eventInfo - 事件参数对象
   * @param {SeatUserInfo} eventInfo.userInfo - 加入连线的用户信息
   * @example
   * import { CoHostEvent, useCoHostState } from 'tuikit-atomicx-vue3';
   * const { subscribeEvent } = useCoHostState();
   *
   * subscribeEvent(CoHostEvent.onCoHostUserJoined, (eventInfo) => {
   *   console.log('连线用户加入:', eventInfo.userInfo.userName);
   * });
   */
  onCoHostUserJoined = 'onCoHostUserJoined',
  /**
   * 当连线用户离开时触发。
   * @event
   * @param {object} eventInfo - 事件参数对象
   * @param {SeatUserInfo} eventInfo.userInfo - 离开连线的用户信息
   * @example
   * import { CoHostEvent, useCoHostState } from 'tuikit-atomicx-vue3';
   * const { subscribeEvent } = useCoHostState();
   *
   * subscribeEvent(CoHostEvent.onCoHostUserLeft, (eventInfo) => {
   *   console.log('连线用户离开:', eventInfo.userInfo.userName);
   * });
   */
  onCoHostUserLeft = 'onCoHostUserLeft',
}

/**
 * 主播连线布局模板枚举
 * @enum {number}
 * @description 定义主播连线时的布局模板。
 * @example
 * import { CoHostLayoutTemplate } from 'tuikit-atomicx-vue3';
 *
 * // 使用动态网格布局
 * setLayout(CoHostLayoutTemplate.HostDynamicGrid);
 */
export enum CoHostLayoutTemplate {
  /** 动态网格布局 */
  HostDynamicGrid = 600,
  /** 动态 1v6 布局 */
  HostDynamic1v6 = 601,
}
