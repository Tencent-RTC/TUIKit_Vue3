import { TUIUserInfo } from '@tencentcloud/tuiroom-engine-js';

/**
 * 弹幕消息类型枚举
 * @memberof module:BarrageState
 * @description 定义弹幕消息的类型，包括文本消息和自定义消息
 * @enum {number}
 * @example
 * ```typescript
 * import { BarrageType } from '@/states/BarrageState';
 *
 * // 判断消息类型
 * if (message.messageType === BarrageType.text) {
 *   console.log('这是文本消息:', message.textContent);
 * } else if (message.messageType === BarrageType.custom) {
 *   console.log('这是自定义消息:', message.data);
 * }
 * ```
 */
export enum BarrageType {
  /** 文本消息 */
  text = 0,
  /** 自定义消息 */
  custom = 1,
}

/**
   * 基础消息信息接口
   * @memberof module:BarrageState
   * @description 定义所有弹幕消息的基础属性
   * @interface BaseMessageInfo
   * @property {string} liveId - 直播间ID
   * @property {TUIUserInfo} sender - 发送者用户信息
   * @property {number} sequence - 消息序列号
   * @property {number} timestampInSecond - 消息时间戳(秒)
   */
interface BaseMessageInfo {
  liveId: string;
  sender: TUIUserInfo;
  sequence: number;
  timestampInSecond: number;
}

/**
   * 弹幕消息接口
   * @memberof module:BarrageState
   * @description 定义完整的弹幕消息结构，继承基础消息信息并扩展特定属性
   * @interface Barrage
   * @extends BaseMessageInfo
   * @property {BarrageType} messageType - 消息类型
   * @property {string} [textContent] - 文本内容(文本消息时使用)
   * @property {Record<string, string>} [extensionInfo] - 扩展信息(文本消息时使用)
   * @property {string} [businessId] - 业务ID(自定义消息时使用)
   * @property {string} [data] - 自定义数据(自定义消息时使用)
   * @example
   * ```typescript
   * // 文本消息示例
   * const textBarrage: Barrage = {
   *   liveId: 'live123',
   *   sender: userInfo,
   *   sequence: 1,
   *   timestampInSecond: 1640995200,
   *   messageType: BarrageType.text,
   *   textContent: '大家好！',
   *   extensionInfo: { color: 'red' }
   * };
   *
   * // 自定义消息示例
   * const customBarrage: Barrage = {
   *   liveId: 'live123',
   *   sender: userInfo,
   *   sequence: 2,
   *   timestampInSecond: 1640995201,
   *   messageType: BarrageType.custom,
   *   businessId: 'gift',
   *   data: JSON.stringify({ giftId: 1, count: 5 })
   * };
   * ```
   */
export interface Barrage extends BaseMessageInfo {
  messageType: BarrageType;

  textContent?: string;
  extensionInfo?: Record<string, string> | null;

  businessId?: string;
  data?: string;
}
