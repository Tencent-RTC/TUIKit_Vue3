/**
 * @module VirtualBackgroundType
 * @description 虚拟背景类型定义
 *
 * 提供虚拟背景相关的配置、类型和事件定义。
 *
 * @example
 * import { VirtualBackgroundType, VirtualBackgroundConfig } from 'tuikit-atomicx-vue3';
 */

/**
 * 虚拟背景配置
 * @interface VirtualBackgroundConfig
 * @description 虚拟背景功能的配置
 *
 * @example
 * const config: VirtualBackgroundConfig = {
 *   enable: true,
 *   type: VirtualBackgroundType.blur,
 *   blurLevel: 5
 * };
 */
export interface VirtualBackgroundConfig {
  /** 是否启用虚拟背景 */
  enable?: boolean;
  /** 虚拟背景类型 */
  type?: VirtualBackgroundType;
  /** 模糊程度（仅当 type 为 blur 时有效） */
  blurLevel?: number;
  /** 自定义背景图片路径（仅当 type 为 image 时有效） */
  imagePath?: string;
}

/**
 * 虚拟背景类型枚举
 * @enum {string}
 * @description 表示虚拟背景的类型。
 */
export enum VirtualBackgroundType {
  /** 背景模糊 */
  blur = 'blur',
  /** 自定义背景图片 */
  image = 'image',
}

/**
 * @module VirtualBackgroundEvent
 * @description **虚拟背景事件列表**
 *
 * 通过 `useVirtualBackgroundState()` 获取状态和 `subscribeEvent` 方法来订阅事件。
 *
 * @example
 * import { useVirtualBackgroundState, VirtualBackgroundEvent } from 'tuikit-atomicx-vue3';
 *
 * const { subscribeEvent, unsubscribeEvent } = useVirtualBackgroundState();
 *
 * // 监听虚拟背景错误事件
 * subscribeEvent(VirtualBackgroundEvent.onAbort, () => {
 *   console.log('虚拟背景发生错误');
 * });
 */
export enum VirtualBackgroundEvent {
  /**
   * 虚拟背景运行过程中发生错误时触发。
   *
   * 当虚拟背景处理器遇到无法恢复的错误时会触发此事件，
   * 例如：WebGL 上下文丢失、模型加载失败、内存不足等情况。
   * 收到此事件后，建议关闭虚拟背景功能并提示用户。
   * @event
   * @param {void} 无参数 - 此事件不携带任何参数
   * @example
   * import { useVirtualBackgroundState, VirtualBackgroundEvent } from 'tuikit-atomicx-vue3';
   *
   * const { subscribeEvent } = useVirtualBackgroundState();
   *
   * // 监听虚拟背景错误事件
   * subscribeEvent(VirtualBackgroundEvent.onAbort, () => {
   *   console.log('虚拟背景发生错误，已自动关闭');
   *   // 建议的处理方式：
   *   // 1. 关闭虚拟背景功能
   *   // 2. 提示用户虚拟背景已关闭
   *   // 3. 可选：引导用户重新开启或检查设备兼容性
   * });
   */
  onAbort = 'onAbort',
}

/**
 * 虚拟背景事件回调函数类型
 * @typedef {Function} VirtualBackgroundEventCallback
 * @description 虚拟背景事件的回调函数类型定义。
 */
export type VirtualBackgroundEventCallback = () => void;
