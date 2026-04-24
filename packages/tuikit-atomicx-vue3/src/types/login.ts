/**
 * @module LoginType
 * @description 登录相关类型定义
 *
 * 提供登录模块的类型定义，包括用户信息、登录参数、登录事件和登录状态。
 */

/**
 * 登录用户信息接口
 * @interface LoginUserInfo
 * @description 定义登录用户的基本信息，包括用户 ID、昵称、头像和自定义信息。
 * @example
 * const userInfo: LoginUserInfo = {
 *   userId: 'user_001',
 *   userName: '用户A',
 *   avatarUrl: 'https://example.com/avatar.png',
 *   customInfo: { vipLevel: 3 },
 * };
 */
export interface LoginUserInfo {
  /** 用户 ID */
  userId: string;
  /** 用户昵称 */
  userName: string;
  /** 用户头像 URL */
  avatarUrl: string;
  /** 自定义信息 */
  customInfo?: Record<string, any>;
}

/**
 * 设置用户信息参数接口
 * @interface SetSelfInfoParams
 * @description 定义更新当前用户信息时的参数。
 * @example
 * const params: SetSelfInfoParams = {
 *   userName: '新昵称',
 *   avatarUrl: 'https://example.com/new-avatar.png',
 * };
 */
export interface SetSelfInfoParams {
  /** 用户昵称 */
  userName?: string;
  /** 用户头像 URL */
  avatarUrl?: string;
  /** 自定义信息 */
  customInfo?: Record<string, any>;
}

/**
 * 登录参数接口
 * @interface LoginParams
 * @description 定义登录所需的参数，包括用户 ID、用户签名和应用 ID。
 * @example
 * const loginParams: LoginParams = {
 *   userId: 'user_001',
 *   userSig: 'xxxxx',
 *   sdkAppId: 1400000000,
 * };
 */
export interface LoginParams {
  /** 用户 ID */
  userId: string;
  /** 用户签名 */
  userSig: string;
  /** 应用 ID */
  sdkAppId: number;
  [key: string]: any;
}

/**
 * 登录选项接口
 * @interface LoginOptions
 * @description 定义登录选项，与 LoginParams 相同。
 */
export interface LoginOptions {
  /** 用户 ID */
  userId: string;
  /** 用户签名 */
  userSig: string;
  /** 应用 ID */
  sdkAppId: number;
  [key: string]: any;
}

/**
 * @module LoginEvent
 * @description **登录事件列表**
 *
 * 登录模块的事件定义，通过 subscribeEvent/unsubscribeEvent 订阅/取消订阅登录事件。
 * 您可以通过这些事件处理登录过期和被强制下线等情况。
 *
 * > **注意：**
 * > 事件需要在事件触发之前监听，这样才能收到相应的事件通知。
 * > 建议在登录前完成事件监听，这样才能确保不会漏掉事件通知。
 *
 * @example
 * import { LoginEvent, useLoginState } from 'tuikit-atomicx-vue3';
 * const { subscribeEvent, unsubscribeEvent } = useLoginState();
 *
 * const onLoginExpired = () => {
 *   console.log('登录已过期，请重新登录');
 * };
 * subscribeEvent(LoginEvent.onLoginExpired, onLoginExpired);
 * unsubscribeEvent(LoginEvent.onLoginExpired, onLoginExpired);
 */
export enum LoginEvent {
  /**
   * 当登录凭证过期时触发，收到此事件后需要重新登录。
   * @event
   * @param {void} 无参数
   * @example
   * import { LoginEvent, useLoginState } from 'tuikit-atomicx-vue3';
   * const { subscribeEvent } = useLoginState();
   *
   * subscribeEvent(LoginEvent.onLoginExpired, () => {
   *   console.log('登录已过期，请重新登录');
   *   // 跳转到登录页面或刷新 userSig
   * });
   */
  onLoginExpired = 'onLoginExpired',
  /**
   * 当账号在其他设备登录导致当前设备被强制下线时触发。
   * @event
   * @param {void} 无参数
   * @example
   * import { LoginEvent, useLoginState } from 'tuikit-atomicx-vue3';
   * const { subscribeEvent } = useLoginState();
   *
   * subscribeEvent(LoginEvent.onKickedOffline, () => {
   *   console.log('账号在其他设备登录，已被强制下线');
   *   // 提示用户重新登录
   * });
   */
  onKickedOffline = 'onKickedOffline',
}

/**
 * 登录状态枚举
 * @enum {number}
 * @description 定义当前的登录状态。
 * @example
 * if (status === LoginStatus.LOGINED) {
 *   console.log('已登录');
 * }
 */
export enum LoginStatus {
  /** 未知状态 */
  UNKNOWN = 0,
  /** 已登录 */
  LOGINED = 1,
}

/**
 * 事件回调函数类型定义
 * @template T - 传递给回调的数据类型
 * @description 通用事件回调函数类型。
 */
export type EventCallback<T = any> = (data?: T) => void;
