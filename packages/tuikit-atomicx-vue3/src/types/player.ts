import { Component, CSSProperties, VNode } from 'vue';

/**
 * @module PlayerType
 * @description 播放器相关类型定义
 *
 * 提供播放器控制模块的类型定义，包括分辨率、按钮状态、自定义按钮和事件回调。
 */

/**
 * 分辨率类型定义
 * @interface Resolution
 * @description 播放器清晰度切换的分辨率配置，每个分辨率包含一个展示标签和一个内部数值。
 * @example
 * const resolution: Resolution = {
 *   label: '720P',
 *   value: 720,
 * };
 */
export type Resolution = {
  /** 分辨率展示标签（如 '720P'、'1080P'） */
  label: string;
  /** 分辨率内部数值 */
  value: number;
};

/**
 * 全屏结果类型定义
 * @interface FullscreenResult
 * @description 全屏操作返回的结果对象，表示操作是否成功以及使用的全屏模式。
 * @example
 * const result: FullscreenResult = {
 *   success: true,
 *   mode: 'standard',
 *   shouldRotateToLandscape: false,
 * };
 */
export type FullscreenResult = {
  /** 全屏操作是否成功 */
  success: boolean;
  /**
   * 使用的全屏模式：
   * - 'standard'：原生 Fullscreen API
   * - 'simulated'：基于 CSS 的模拟全屏
   */
  mode: 'standard' | 'simulated';
  /** 是否需要旋转为横屏 */
  shouldRotateToLandscape: boolean;
  /** 操作失败时的错误对象 */
  error?: Error;
};

/**
 * 播放器内置控制按钮标识枚举
 * @enum {string}
 * @description 播放器内置控制按钮标识。
 * 播放和暂停合并为一个 Play 按钮，因为它们共享同一个插槽，根据播放状态自动切换。
 */
export enum PlayerControlButton {
  /**
   * 播放/暂停切换按钮
   * @default 'play'
   */
  Play = 'play',
  /**
   * 音量控制按钮
   * @default 'volume'
   */
  Volume = 'volume',
  /**
   * 清晰度切换按钮
   * @default 'resolution'
   */
  Resolution = 'resolution',
  /**
   * 画中画切换按钮
   * @default 'pictureInPicture'
   */
  PictureInPicture = 'pictureInPicture',
  /**
   * 全屏切换按钮
   * @default 'fullscreen'
   */
  Fullscreen = 'fullscreen'
}

/**
 * 按钮状态类型定义
 * @interface ButtonState
 * @description 单个内置播放器控制按钮的状态配置，包括可见性、禁用状态和自定义图标。
 * @example
 * const state: ButtonState = {
 *   visible: true,
 *   disabled: false,
 *   tooltip: 'Play',
 * };
 */
export type ButtonState = {
  /** 按钮是否可见 */
  visible: boolean;
  /** 按钮是否禁用 */
  disabled: boolean;
  /**
   * 按钮默认（未激活）状态的自定义图标组件。
   * - Play 按钮：播放时显示（"暂停"图标，进入直播间时默认可见）。
   * - Volume 按钮：未静音时显示。
   * - PictureInPicture 按钮：未处于画中画模式时显示。
   * - Fullscreen 按钮：未处于全屏模式时显示。
   */
  icon?: Component | (() => VNode);
  /**
   * 按钮激活（点击/切换后）状态的自定义图标组件。
   * - Play 按钮：暂停时显示（"播放"图标，用户点击暂停后显示）。
   * - Volume 按钮：静音时显示。
   * - PictureInPicture 按钮：处于画中画模式时显示。
   * - Fullscreen 按钮：处于全屏模式时显示。
   */
  activeIcon?: Component | (() => VNode);
  /** 鼠标悬停时显示的提示文字 */
  tooltip?: string;
};

/**
 * 播放器控制按钮集合类型定义
 * @interface PlayerControlButtons
 * @description 将每个内置 PlayerControlButton 映射到其 ButtonState 的记录类型。
 * 用于读取和配置所有内置按钮的可见性和禁用状态。
 * @example
 * const { buttons } = useLivePlayerState();
 * const isPlayVisible = buttons[PlayerControlButton.Play].visible;
 */
export type PlayerControlButtons = Record<PlayerControlButton, ButtonState>;

/**
 * 自定义按钮类型定义
 * @interface CustomButton
 * @description 添加到播放器控制栏的自定义按钮配置。
 * 支持位置配置、自定义图标、点击处理和样式设置。
 * @example
 * const { addCustomButtons } = useLivePlayerState();
 *
 * const likeButton: CustomButton = {
 *   id: 'like',
 *   icon: LikeIcon,
 *   onClick: () => console.log('liked'),
 *   tooltip: 'Like',
 *   position: { anchor: PlayerControlButton.Play, position: 'after' },
 * };
 *
 * addCustomButtons([likeButton]);
 */
export type CustomButton = {
  /** 自定义按钮的唯一标识 */
  id: string;
  /** 按钮图标组件或渲染函数 */
  icon: Component | (() => VNode);
  /** 点击处理函数，支持同步和异步函数 */
  onClick: () => void | Promise<void>;
  /** 鼠标悬停时显示的提示文字 */
  tooltip?: string;
  /** 按钮是否可见（默认：true） */
  visible?: boolean;
  /** 按钮是否禁用（默认：false） */
  disabled?: boolean;
  /**
   * 按钮位置配置：
   * - 'start' | 'end'：添加到控制栏两端（最常用）
   * - { slot: 'left' | 'center' | 'right' }：放置在逻辑区域中
   * - { anchor: PlayerControlButton, position: 'before' | 'after' }：相对于已有按钮定位
   * @default 'end'
   */
  position?:
    | 'start'
    | 'end'
    | { slot: 'left' | 'center' | 'right' }
    | { anchor: PlayerControlButton; position: 'before' | 'after' };
  /** 按钮的附加 CSS 类名 */
  className?: string;
  /** 按钮的内联 CSS 样式 */
  style?: CSSProperties;
};

/**
 * @module PlayerEvent
 * @description **播放器控制事件列表**
 *
 * 播放器控制模块的事件定义，通过 subscribeEvent/unsubscribeEvent 订阅/取消订阅播放器控制事件。
 * 您可以通过这些事件处理播放状态、音量、全屏、画中画、清晰度和控制栏可见性的变化。
 *
 * > **注意：**
 * > 事件需要在事件触发之前监听，这样才能收到相应的事件通知。
 * > 建议在进入直播间前完成事件监听，这样才能确保不会漏掉事件通知。
 *
 * @example
 * import { PlayerControlEvent } from 'tuikit-atomicx-vue3';
 * const { subscribeEvent, unsubscribeEvent } = useLivePlayerState();
 *
 * const onPlayStateChange = (isPlaying: boolean) => {
 *   console.log('Play state:', isPlaying);
 * };
 * subscribeEvent(PlayerControlEvent.PlayStateChange, onPlayStateChange);
 * unsubscribeEvent(PlayerControlEvent.PlayStateChange, onPlayStateChange);
 */
export enum PlayerControlEvent {
  /**
   * 当播放状态发生变化（播放/暂停）时触发。
   * @event
   * @example
   * import { PlayerControlEvent } from 'tuikit-atomicx-vue3';
   * const { subscribeEvent, unsubscribeEvent } = useLivePlayerState();
   *
   * const onPlayStateChange = (isPlaying: boolean) => {
   *   console.log('Play state changed:', isPlaying);
   * };
   * subscribeEvent(PlayerControlEvent.PlayStateChange, onPlayStateChange);
   * unsubscribeEvent(PlayerControlEvent.PlayStateChange, onPlayStateChange);
   */
  PlayStateChange = 'playStateChange',
  /**
   * 当音量发生变化时触发。
   * @event
   * @example
   * import { PlayerControlEvent } from 'tuikit-atomicx-vue3';
   * const { subscribeEvent, unsubscribeEvent } = useLivePlayerState();
   *
   * const onVolumeChange = (volume: number) => {
   *   console.log('Volume changed:', volume);
   * };
   * subscribeEvent(PlayerControlEvent.VolumeChange, onVolumeChange);
   * unsubscribeEvent(PlayerControlEvent.VolumeChange, onVolumeChange);
   */
  VolumeChange = 'volumeChange',
  /**
   * 当进入或退出全屏模式时触发。
   * @event
   * @example
   * import { PlayerControlEvent } from 'tuikit-atomicx-vue3';
   * const { subscribeEvent, unsubscribeEvent } = useLivePlayerState();
   *
   * const onFullscreenChange = (isFullscreen: boolean) => {
   *   console.log('Fullscreen changed:', isFullscreen);
   * };
   * subscribeEvent(PlayerControlEvent.FullscreenChange, onFullscreenChange);
   * unsubscribeEvent(PlayerControlEvent.FullscreenChange, onFullscreenChange);
   */
  FullscreenChange = 'fullscreenChange',
  /**
   * 当进入或退出画中画模式时触发。
   * @event
   * @example
   * import { PlayerControlEvent } from 'tuikit-atomicx-vue3';
   * const { subscribeEvent, unsubscribeEvent } = useLivePlayerState();
   *
   * const onPictureInPictureChange = (isPictureInPicture: boolean) => {
   *   console.log('PiP changed:', isPictureInPicture);
   * };
   * subscribeEvent(PlayerControlEvent.PictureInPictureChange, onPictureInPictureChange);
   * unsubscribeEvent(PlayerControlEvent.PictureInPictureChange, onPictureInPictureChange);
   */
  PictureInPictureChange = 'pictureInPictureChange',
  /**
   * 当清晰度切换时触发。
   * @event
   * @example
   * import { PlayerControlEvent, Resolution } from 'tuikit-atomicx-vue3';
   * const { subscribeEvent, unsubscribeEvent } = useLivePlayerState();
   *
   * const onResolutionChange = (resolution: Resolution | undefined) => {
   *   console.log('Resolution changed:', resolution);
   * };
   * subscribeEvent(PlayerControlEvent.ResolutionChange, onResolutionChange);
   * unsubscribeEvent(PlayerControlEvent.ResolutionChange, onResolutionChange);
   */
  ResolutionChange = 'resolutionChange',
  /**
   * 当控制栏可见性发生变化（显示/隐藏）时触发。
   * @event
   * @example
   * import { PlayerControlEvent } from 'tuikit-atomicx-vue3';
   * const { subscribeEvent, unsubscribeEvent } = useLivePlayerState();
   *
   * const onControlBarVisibilityChange = (visible: boolean) => {
   *   console.log('Control bar visibility:', visible);
   * };
   * subscribeEvent(PlayerControlEvent.ControlBarVisibilityChange, onControlBarVisibilityChange);
   * unsubscribeEvent(PlayerControlEvent.ControlBarVisibilityChange, onControlBarVisibilityChange);
   */
  ControlBarVisibilityChange = 'controlBarVisibilityChange',
}

/**
 * 播放器控制事件映射类型定义
 * @interface PlayerControlEventMap
 * @description 将每个 PlayerControlEvent 映射到其对应的回调参数类型。
 * @example
 * type PlayStatePayload = PlayerControlEventMap[PlayerControlEvent.PlayStateChange]; // boolean
 * type VolumePayload = PlayerControlEventMap[PlayerControlEvent.VolumeChange]; // number
 */
export type PlayerControlEventMap = {
  [PlayerControlEvent.PlayStateChange]: boolean;
  [PlayerControlEvent.VolumeChange]: number;
  [PlayerControlEvent.FullscreenChange]: boolean;
  [PlayerControlEvent.PictureInPictureChange]: boolean;
  [PlayerControlEvent.ControlBarVisibilityChange]: boolean;
  [PlayerControlEvent.ResolutionChange]: Resolution | undefined;
};

/**
 * 播放器控制事件回调类型定义
 * @interface PlayerControlEventCallback
 * @description 播放器控制事件的回调函数类型。
 * 回调函数接收与订阅的事件类型对应的事件载荷。
 * @example
 * const onPlayStateChange: PlayerControlEventCallback<PlayerControlEvent.PlayStateChange> = (isPlaying) => {
 *   console.log('Play state changed:', isPlaying);
 * };
 */
export type PlayerControlEventCallback<T extends PlayerControlEvent = PlayerControlEvent> = (
  eventInfo: PlayerControlEventMap[T]
) => void;

