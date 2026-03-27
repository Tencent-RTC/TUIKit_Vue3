import { DeviceStatus } from './device';

/**
 * @module SeatType
 * @description 麦位相关类型定义
 *
 * 提供直播麦位模块的类型定义，包括麦位用户信息、麦位信息、画布配置、移动策略和设备控制策略。
 */

/**
 * 麦位用户信息类型定义
 * @interface SeatUserInfo
 * @description 定义麦位上用户的详细信息，包括用户基本信息、直播间标识、设备状态和设备控制权限。
 * @example
 * const seatUser: SeatUserInfo = {
 *   userId: 'user_001',
 *   userName: '主播A',
 *   avatarUrl: 'https://example.com/avatar.png',
 *   liveId: 'live_123456',
 *   microphoneStatus: DeviceStatus.Open,
 *   allowOpenMicrophone: true,
 *   cameraStatus: DeviceStatus.Open,
 *   allowOpenCamera: true,
 * };
 */
export type SeatUserInfo = {
  /** 用户 ID */
  userId: string;
  /** 用户昵称 */
  userName: string;
  /** 用户头像 URL */
  avatarUrl: string;
  /** 直播间 ID */
  liveId: string;
  /** 麦克风状态 */
  microphoneStatus: DeviceStatus;
  /** 是否允许打开麦克风 */
  allowOpenMicrophone: boolean;
  /** 摄像头状态 */
  cameraStatus: DeviceStatus;
  /** 是否允许打开摄像头 */
  allowOpenCamera: boolean;
}

/**
 * 角色枚举
 * @enum {number}
 * @description 定义直播间中用户的角色类型，包括房主、管理员和普通用户。
 * @example
 * import { Role } from 'tuikit-atomicx-vue3';
 *
 * if (user.role === Role.Owner) {
 *   console.log('当前用户是房主');
 * }
 */
export enum Role {
  /**
   * 房主
   * @default 0
   */
  Owner = 0,
  /**
   * 管理员
   * @default 1
   */
  Administrator = 1,
  /**
   * 普通用户
   * @default 2
   */
  GeneralUser = 2,
}

/**
 * 区域信息类型定义
 * @interface RegionInfo
 * @description 定义麦位在混流画布上的区域位置和大小信息，包括坐标、宽高和层级顺序。
 * @example
 * const region: RegionInfo = {
 *   x: 0,
 *   y: 0,
 *   w: 480,
 *   h: 640,
 *   zOrder: 1,
 * };
 */
export type RegionInfo = {
  /** 区域左上角 X 坐标 */
  x: number;
  /** 区域左上角 Y 坐标 */
  y: number;
  /** 区域宽度 */
  w: number;
  /** 区域高度 */
  h: number;
  /** 层级顺序（数值越大越靠前） */
  zOrder: number;
};

/**
 * 麦位信息类型定义
 * @interface SeatInfo
 * @description 定义单个麦位的完整信息，包括麦位索引、锁定状态、用户信息和区域信息。
 * @example
 * const seat: SeatInfo = {
 *   index: 0,
 *   isLocked: false,
 *   userInfo: {
 *     userId: 'user_001',
 *     userName: '主播A',
 *     avatarUrl: 'https://example.com/avatar.png',
 *     liveId: 'live_123456',
 *     microphoneStatus: DeviceStatus.Open,
 *     allowOpenMicrophone: true,
 *     cameraStatus: DeviceStatus.Open,
 *     allowOpenCamera: true,
 *   },
 *   region: { x: 0, y: 0, w: 480, h: 640, zOrder: 1 },
 * };
 */
export type SeatInfo = {
  /** 麦位索引（从 0 开始） */
  index: number;
  /** 麦位是否被锁定 */
  isLocked: boolean;
  /** 麦位上的用户信息（空麦位时为 undefined） */
  userInfo?: SeatUserInfo;
  /** 麦位在混流画布上的区域信息 */
  region?: RegionInfo;
};

/**
 * 直播画布配置接口
 * @interface LiveCanvas
 * @description 定义直播混流画布的宽度、高度和背景色配置。
 * @example
 * const canvas: LiveCanvas = {
 *   width: 1080,
 *   height: 1920,
 *   background: '#000000',
 * };
 */
export interface LiveCanvas {
  /** 画布宽度（单位：像素） */
  width: number;
  /** 画布高度（单位：像素） */
  height: number;
  /** 画布背景色（如 '#000000'） */
  background: string;
}

/**
 * 移动麦位策略枚举
 * @enum {number}
 * @description 定义将用户移动到目标麦位时的冲突处理策略。
 * @example
 * import { MoveSeatPolicy } from 'tuikit-atomicx-vue3';
 *
 * // 强制替换目标麦位上的用户
 * moveSeat(userId, targetIndex, MoveSeatPolicy.ForceReplace);
 */
export enum MoveSeatPolicy {
  /**
   * 目标麦位被占用时中止移动
   * @default 0
   */
  AbortWhenOccupied = 0,
  /**
   * 强制替换目标麦位上的用户
   * @default 1
   */
  ForceReplace = 1,
  /**
   * 与目标麦位上的用户交换位置
   * @default 2
   */
  SwapPosition = 2,
}

/**
 * 设备控制策略枚举
 * @enum {number}
 * @description 定义管理员对麦位用户设备的控制策略。
 * @example
 * import { DeviceControlPolicy } from 'tuikit-atomicx-vue3';
 *
 * // 仅解锁设备，不主动打开
 * controlDevice(userId, DeviceControlPolicy.UnlockOnly);
 */
export enum DeviceControlPolicy {
  /**
   * 仅解锁设备（不主动打开，需用户手动开启）
   * @default 1
   */
  UnlockOnly = 1,
}

/**
 * @module SeatEvent
 * @description **麦位事件列表**
 *
 * 直播麦位模块的事件定义，通过 subscribeEvent/unsubscribeEvent 订阅/取消订阅麦位事件。
 * 您可以通过这些事件处理管理员远程操控本地摄像头和麦克风的变化。
 *
 * > **注意：**
 * > 事件需要在事件触发之前监听，这样才能收到相应的事件通知。
 * > 建议在进入直播间前完成事件监听，这样才能确保不会漏掉事件通知。
 *
 * @example
 * import { LiveSeatEvent } from 'tuikit-atomicx-vue3';
 * const { subscribeEvent, unsubscribeEvent } = useLiveSeatState();
 *
 * const onCameraOpened = () => {
 *   console.log('管理员打开了本地摄像头');
 * };
 * subscribeEvent(LiveSeatEvent.onLocalCameraOpenedByAdmin, onCameraOpened);
 * unsubscribeEvent(LiveSeatEvent.onLocalCameraOpenedByAdmin, onCameraOpened);
 */
export enum LiveSeatEvent {
  /**
   * 当管理员远程打开本地摄像头时触发。
   * @event
   * @example
   * import { LiveSeatEvent } from 'tuikit-atomicx-vue3';
   * const { subscribeEvent, unsubscribeEvent } = useLiveSeatState();
   *
   * const onLocalCameraOpenedByAdmin = () => {
   *   console.log('管理员打开了本地摄像头');
   * };
   * subscribeEvent(LiveSeatEvent.onLocalCameraOpenedByAdmin, onLocalCameraOpenedByAdmin);
   * unsubscribeEvent(LiveSeatEvent.onLocalCameraOpenedByAdmin, onLocalCameraOpenedByAdmin);
   */
  onLocalCameraOpenedByAdmin = 'onLocalCameraOpenedByAdmin',
  /**
   * 当管理员远程关闭本地摄像头时触发。
   * @event
   * @example
   * import { LiveSeatEvent } from 'tuikit-atomicx-vue3';
   * const { subscribeEvent, unsubscribeEvent } = useLiveSeatState();
   *
   * const onLocalCameraClosedByAdmin = () => {
   *   console.log('管理员关闭了本地摄像头');
   * };
   * subscribeEvent(LiveSeatEvent.onLocalCameraClosedByAdmin, onLocalCameraClosedByAdmin);
   * unsubscribeEvent(LiveSeatEvent.onLocalCameraClosedByAdmin, onLocalCameraClosedByAdmin);
   */
  onLocalCameraClosedByAdmin = 'onLocalCameraClosedByAdmin',
  /**
   * 当管理员远程打开本地麦克风时触发。
   * @event
   * @example
   * import { LiveSeatEvent } from 'tuikit-atomicx-vue3';
   * const { subscribeEvent, unsubscribeEvent } = useLiveSeatState();
   *
   * const onLocalMicrophoneOpenedByAdmin = () => {
   *   console.log('管理员打开了本地麦克风');
   * };
   * subscribeEvent(LiveSeatEvent.onLocalMicrophoneOpenedByAdmin, onLocalMicrophoneOpenedByAdmin);
   * unsubscribeEvent(LiveSeatEvent.onLocalMicrophoneOpenedByAdmin, onLocalMicrophoneOpenedByAdmin);
   */
  onLocalMicrophoneOpenedByAdmin = 'onLocalMicrophoneOpenedByAdmin',
  /**
   * 当管理员远程关闭本地麦克风时触发。
   * @event
   * @example
   * import { LiveSeatEvent } from 'tuikit-atomicx-vue3';
   * const { subscribeEvent, unsubscribeEvent } = useLiveSeatState();
   *
   * const onLocalMicrophoneClosedByAdmin = () => {
   *   console.log('管理员关闭了本地麦克风');
   * };
   * subscribeEvent(LiveSeatEvent.onLocalMicrophoneClosedByAdmin, onLocalMicrophoneClosedByAdmin);
   * unsubscribeEvent(LiveSeatEvent.onLocalMicrophoneClosedByAdmin, onLocalMicrophoneClosedByAdmin);
   */
  onLocalMicrophoneClosedByAdmin = 'onLocalMicrophoneClosedByAdmin',
}
