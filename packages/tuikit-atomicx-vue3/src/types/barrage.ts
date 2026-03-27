import { TUIUserInfo } from '@tencentcloud/tuiroom-engine-js';
import { TUIRole } from './types';

/**
 * @module BarrageType
 * @description 弹幕相关类型定义
 *
 * 提供弹幕消息模块的类型定义，包括消息类型、消息结构、回调函数和插槽属性。
 */

/**
 * 弹幕消息类型枚举
 * @enum {number}
 * @description 定义弹幕消息的类型，包括文本消息和自定义消息。
 * @example
 * import { BarrageType } from 'tuikit-atomicx-vue3';
 *
 * // 判断消息类型
 * if (message.messageType === BarrageType.text) {
 *   console.log('这是文本消息:', message.textContent);
 * } else if (message.messageType === BarrageType.custom) {
 *   console.log('这是自定义消息:', message.data);
 * }
 */
export enum BarrageType {
  /**
   * 文本消息
   * @default 0
   */
  text = 0,
  /**
   * 自定义消息
   * @default 1
   */
  custom = 1,
}

/**
 * @module BarrageEvent
 * @description **弹幕事件列表**
 *
 * 弹幕模块的事件定义，通过 subscribeEvent/unsubscribeEvent 订阅/取消订阅弹幕事件。
 * 您可以通过这些事件处理弹幕消息的接收。
 *
 * > **注意：**
 * > 事件需要在事件触发之前监听，这样才能收到相应的事件通知。
 * > 建议在进入直播间前完成事件监听，这样才能确保不会漏掉事件通知。
 *
 * @example
 * import { BarrageEvent } from 'tuikit-atomicx-vue3';
 * const { subscribeEvent, unsubscribeEvent } = useBarrageState();
 *
 * const onBarrageReceived = (barrage: Barrage) => {
 *   console.log('收到弹幕消息:', barrage);
 * };
 * subscribeEvent(BarrageEvent.onBarrageReceived, onBarrageReceived);
 * unsubscribeEvent(BarrageEvent.onBarrageReceived, onBarrageReceived);
 */
export enum BarrageEvent {
  /**
   * 当收到弹幕消息时触发。
   * @event
   * @example
   * import { BarrageEvent } from 'tuikit-atomicx-vue3';
   * const { subscribeEvent, unsubscribeEvent } = useBarrageState();
   *
   * const onBarrageReceived = (barrage: Barrage) => {
   *   console.log('收到弹幕消息:', barrage);
   * };
   * subscribeEvent(BarrageEvent.onBarrageReceived, onBarrageReceived);
   * unsubscribeEvent(BarrageEvent.onBarrageReceived, onBarrageReceived);
   */
  onBarrageReceived = 'onBarrageReceived',
}

/**
 * 弹幕发送前回调类型定义
 * @interface OnWillSendBarrage
 * @description 弹幕消息发送前触发的回调函数类型。
 * 返回 false 可拦截发送，返回 true（或 void）允许发送。支持异步回调，适用于内容审核等场景。
 * @example
 * import { useBarrageState, Barrage } from 'tuikit-atomicx-vue3';
 *
 * const onWillSend: OnWillSendBarrage = async (message: Barrage) => {
 *   // 进行内容审核
 *   const isValid = await checkContent(message.textContent);
 *   return isValid; // 返回 false 拦截发送
 * };
 */
export type OnWillSendBarrage = (message: Barrage) => void | boolean | Promise<boolean>;

/**
 * 弹幕发送成功回调类型定义
 * @interface OnDidSendBarrage
 * @description 弹幕消息发送成功后触发的回调函数类型。
 * 适用于埋点统计、发送成功提示等场景。
 * @example
 * import { useBarrageState, Barrage } from 'tuikit-atomicx-vue3';
 *
 * const onDidSend: OnDidSendBarrage = (message: Barrage) => {
 *   console.log('弹幕发送成功:', message.textContent);
 * };
 */
export type OnDidSendBarrage = (message: Barrage) => void;

/**
 * 弹幕事件映射类型定义
 * @interface BarrageEventMap
 * @description 将每个 BarrageEvent 映射到其对应的回调参数类型。
 * @example
 * type BarragePayload = BarrageEventMap[BarrageEvent.onBarrageReceived]; // Barrage
 */
type BarrageEventMap = {
  [BarrageEvent.onBarrageReceived]: Barrage;
};

/**
 * 弹幕事件回调函数类型定义
 * @interface BarrageEventCallback
 * @description 弹幕事件的回调函数类型。
 * 回调函数接收与订阅的事件类型对应的事件载荷。
 * @example
 * const onBarrageReceived: BarrageEventCallback<BarrageEvent.onBarrageReceived> = (barrage) => {
 *   console.log('收到弹幕:', barrage);
 * };
 */
export type BarrageEventCallback<T extends BarrageEvent> = (eventInfo: BarrageEventMap[T]) => void;

/**
 * 基础消息信息接口
 * @interface BaseMessageInfo
 * @description 定义所有弹幕消息的基础属性，包括直播间标识、发送者信息、消息序列号和时间戳。
 * @example
 * const baseInfo: BaseMessageInfo = {
 *   liveId: 'live_123456',
 *   sender: { userId: 'user_001', userName: '用户A', avatarUrl: '' },
 *   sequence: 1,
 *   timestampInSecond: 1640995200,
 * };
 */
interface BaseMessageInfo {
  /** 直播间 ID */
  liveId: string;
  /** 发送者用户信息 */
  sender: TUIUserInfo;
  /** 消息序列号 */
  sequence: number;
  /** 消息时间戳（秒） */
  timestampInSecond: number;
}

/**
 * 弹幕消息接口
 * @interface Barrage
 * @description 定义完整的弹幕消息结构，继承基础消息信息并扩展消息类型、文本内容、扩展信息和自定义数据等属性。
 * @example
 * // 文本消息示例
 * const textBarrage: Barrage = {
 *   liveId: 'live_123456',
 *   sender: userInfo,
 *   sequence: 1,
 *   timestampInSecond: 1640995200,
 *   messageType: BarrageType.text,
 *   textContent: '大家好！',
 *   extensionInfo: { color: 'red' },
 * };
 *
 * // 自定义消息示例
 * const customBarrage: Barrage = {
 *   liveId: 'live_123456',
 *   sender: userInfo,
 *   sequence: 2,
 *   timestampInSecond: 1640995201,
 *   messageType: BarrageType.custom,
 *   businessId: 'gift',
 *   data: JSON.stringify({ giftId: 1, count: 5 }),
 * };
 */
export interface Barrage extends BaseMessageInfo {
  /** 消息类型（文本消息或自定义消息） */
  messageType: BarrageType;
  /** 文本内容（文本消息时使用） */
  textContent?: string;
  /** 扩展信息（文本消息时使用） */
  extensionInfo?: Record<string, string> | null;
  /** 业务 ID（自定义消息时使用） */
  businessId?: string;
  /** 自定义数据（自定义消息时使用，JSON 字符串格式） */
  data?: string;
}

/**
 * 弹幕发送者信息类型定义
 * @interface BarrageSender
 * @description 弹幕发送者信息的类型别名，包含 userId、userName、avatarUrl 等字段。
 * @example
 * const sender: BarrageSender = {
 *   userId: 'user_001',
 *   userName: '用户A',
 *   avatarUrl: 'https://example.com/avatar.png',
 * };
 */
export type BarrageSender = {
  userId: string;
  userName: string;
  nameCard: string;
  avatarUrl: string;
  userRole: TUIRole;
  level: number;
  hasAudioStream: boolean;
  hasVideoStream: boolean;
  hasScreenStream: boolean;
  isMessageDisabled: boolean;
  roomCustomInfo: Record<string, any>;
};

/**
 * 弹幕列表 message-item 插槽属性定义
 * @interface MessageItemSlotProps
 * @description 传递给 BarrageList 组件 message-item 作用域插槽的属性。
 * 使用此插槽时，所有消息（包括礼物消息）都会在 PC 和 H5 平台统一传递，
 * 允许统一的自定义样式。可通过 message.messageType 和 message.businessId
 * 区分消息类型（如文本、礼物或其他自定义类型）。
 * @example
 * <BarrageList>
 *   <template #message-item="{ message, sender }">
 *     <div class="custom-barrage-item">
 *       <span class="sender-name">{{ sender.userName }}:</span>
 *       <span class="message-text">{{ message.textContent }}</span>
 *     </div>
 *   </template>
 * </BarrageList>
 */
export interface MessageItemSlotProps {
  /** 当前弹幕消息 */
  message: Barrage;
  /** 发送者信息（userId、userName、avatarUrl 等） */
  sender: BarrageSender;
}
