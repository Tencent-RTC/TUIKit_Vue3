import type { TUIRole } from '@tencentcloud/tuiroom-engine-js';

/**
 * @module AudienceType
 * @description 观众相关类型定义
 *
 * 提供直播观众模块的类型定义，包括观众信息、用户信息、事件回调和插槽属性。
 */

/**
 * 观众信息接口
 * @interface AudienceInfo
 * @description 定义直播间观众的详细信息，包括用户基本信息、自定义数据、角色、禁言状态和加入时间。
 * @example
 * const audience: AudienceInfo = {
 *   userId: 'user_001',
 *   userName: '观众A',
 *   avatarUrl: 'https://example.com/avatar.png',
 *   customInfo: {},
 *   userRole: TUIRole.kGeneralUser,
 *   isMessageDisabled: false,
 *   joinedTimestamp: 1640995200,
 * };
 */
export interface AudienceInfo {
  /** 用户 ID */
  userId: string;
  /** 用户昵称 */
  userName: string;
  /** 用户头像 URL */
  avatarUrl: string;
  /** 自定义信息 */
  customInfo: Record<string, any>;
  /** 用户角色 */
  userRole: TUIRole;
  /** 是否被禁言 */
  isMessageDisabled: boolean;
  /** 加入直播间的时间戳（秒） */
  joinedTimestamp?: number;
}

/**
 * 直播用户基础信息接口
 * @interface LiveUserInfo
 * @description 定义直播用户的基础信息，包含用户 ID、昵称和头像。
 * @example
 * const user: LiveUserInfo = {
 *   userId: 'user_001',
 *   userName: '用户A',
 *   avatarUrl: 'https://example.com/avatar.png',
 * };
 */
export interface LiveUserInfo {
  /** 用户 ID */
  userId: string;
  /** 用户昵称 */
  userName: string;
  /** 用户头像 URL */
  avatarUrl: string;
}

/**
 * @module AudienceEvent
 * @description **观众事件列表**
 *
 * 直播观众模块的事件定义，通过 subscribeEvent/unsubscribeEvent 订阅/取消订阅观众事件。
 * 您可以通过这些事件处理观众加入和离开直播间的变化。
 *
 * > **注意：**
 * > 事件需要在事件触发之前监听，这样才能收到相应的事件通知。
 * > 建议在进入直播间前完成事件监听，这样才能确保不会漏掉事件通知。
 *
 * @example
 * import { LiveAudienceEvent } from 'tuikit-atomicx-vue3';
 * const { subscribeEvent, unsubscribeEvent } = useLiveAudienceState();
 *
 * const onAudienceJoined = (eventInfo: { audience: LiveUserInfo }) => {
 *   console.log('观众加入:', eventInfo.audience);
 * };
 * subscribeEvent(LiveAudienceEvent.onAudienceJoined, onAudienceJoined);
 * unsubscribeEvent(LiveAudienceEvent.onAudienceJoined, onAudienceJoined);
 */
export enum LiveAudienceEvent {
  /**
   * 当有观众加入直播间时触发。
   * @event
   * @example
   * import { LiveAudienceEvent } from 'tuikit-atomicx-vue3';
   * const { subscribeEvent, unsubscribeEvent } = useLiveAudienceState();
   *
   * const onAudienceJoined = (eventInfo: { audience: LiveUserInfo }) => {
   *   console.log('观众加入:', eventInfo.audience.userName);
   * };
   * subscribeEvent(LiveAudienceEvent.onAudienceJoined, onAudienceJoined);
   * unsubscribeEvent(LiveAudienceEvent.onAudienceJoined, onAudienceJoined);
   */
  onAudienceJoined = 'onAudienceJoined',
  /**
   * 当有观众离开直播间时触发。
   * @event
   * @example
   * import { LiveAudienceEvent } from 'tuikit-atomicx-vue3';
   * const { subscribeEvent, unsubscribeEvent } = useLiveAudienceState();
   *
   * const onAudienceLeft = (eventInfo: { audience: LiveUserInfo }) => {
   *   console.log('观众离开:', eventInfo.audience.userName);
   * };
   * subscribeEvent(LiveAudienceEvent.onAudienceLeft, onAudienceLeft);
   * unsubscribeEvent(LiveAudienceEvent.onAudienceLeft, onAudienceLeft);
   */
  onAudienceLeft = 'onAudienceLeft',
}

/**
 * 观众加入事件信息类型定义
 * @interface AudienceJoinedEventInfo
 * @description 观众加入直播间事件的回调参数类型。
 * @example
 * type JoinedPayload = AudienceJoinedEventInfo;
 * // { audience: LiveUserInfo }
 */
type AudienceJoinedEventInfo = {
  /** 加入的观众信息 */
  audience: LiveUserInfo;
};

/**
 * 观众离开事件信息类型定义
 * @interface AudienceLeftEventInfo
 * @description 观众离开直播间事件的回调参数类型。
 * @example
 * type LeftPayload = AudienceLeftEventInfo;
 * // { audience: LiveUserInfo }
 */
type AudienceLeftEventInfo = {
  /** 离开的观众信息 */
  audience: LiveUserInfo;
};

/**
 * 观众事件映射类型定义
 * @interface LiveAudienceEventInfo
 * @description 将每个 LiveAudienceEvent 映射到其对应的回调参数类型。
 * @example
 * type JoinedPayload = LiveAudienceEventInfo[LiveAudienceEvent.onAudienceJoined]; // AudienceJoinedEventInfo
 * type LeftPayload = LiveAudienceEventInfo[LiveAudienceEvent.onAudienceLeft]; // AudienceLeftEventInfo
 */
export interface LiveAudienceEventInfo {
  [LiveAudienceEvent.onAudienceJoined]: AudienceJoinedEventInfo;
  [LiveAudienceEvent.onAudienceLeft]: AudienceLeftEventInfo;
}

/**
 * 观众事件回调函数类型定义
 * @interface LiveAudienceEventCallback
 * @description 观众事件的回调函数类型。
 * 回调函数接收与订阅的事件类型对应的事件载荷。
 * @example
 * const onAudienceJoined: LiveAudienceEventCallback = (eventInfo) => {
 *   console.log('观众加入:', eventInfo.audience.userName);
 * };
 */
export type LiveAudienceEventCallback = <T extends LiveAudienceEvent = LiveAudienceEvent>(eventInfo: LiveAudienceEventInfo[T]) => void;

/**
 * 观众列表 audience-item 插槽属性定义
 * @interface AudienceItemSlotProps
 * @description 传递给 LiveAudienceList 组件 audience-item 作用域插槽的属性。
 * 使用此插槽可以自定义观众列表中每个观众项的渲染方式。
 * @example
 * <LiveAudienceList>
 *   <template #audience-item="{ index, audience }">
 *     <div class="custom-audience-item">
 *       <img v-if="index < 3" :src="getMedalIcon(index + 1)" class="rank-medal" />
 *       <span v-else class="rank-number">{{ index + 1 }}</span>
 *       <img :src="audience.avatarUrl" class="avatar" />
 *       <span class="name">{{ audience.userName }}</span>
 *     </div>
 *   </template>
 * </LiveAudienceList>
 */
export interface AudienceItemSlotProps {
  /** 列表项索引（从 0 开始） */
  index: number;
  /** 观众信息（userId、userName、avatarUrl 等） */
  audience: AudienceInfo;
}
