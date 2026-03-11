import type { Ref } from 'vue';
import type { DeviceType, DeviceStatus, NetworkInfo } from './device';
import type { RoomUser } from './room';

/**
 * @module RoomParticipantType
 * @description 房间相关用户类型定义
 *
 * 提供房间相关用户类型定义。
 *
 * @example
 * import { RoomParticipantRole, RoomParticipantStatus } from '@tuikit-atomicx-vue3/room';
 */

/**
 * 房间参与者角色枚举
 * @enum {number}
 * @description 表示房间参与者的角色。
 */
export enum RoomParticipantRole {
  /**
   * 房主
   * @default 0
   */
  Owner = 0,
  /**
   * 管理员
   * @default 1
   */
  Admin = 1,
  /**
   * 普通用户
   * @default 2
   */
  GeneralUser = 2,
}

/**
 * 房间参与者状态枚举
 * @enum {string}
 * @description 表示房间参与者的状态。
 */
export enum RoomParticipantStatus {
  /**
   * 未定义
   * @default 'None'
   */
  None = 'None',
  /**
   * 预约房间
   * @default 'Scheduled'
   */
  Scheduled = 'Scheduled',
  /**
   * 呼叫中
   * @default 'InCalling'
   */
  InCalling = 'InCalling',
  /**
   * 呼叫超时
   * @default 'CallTimeout'
   */
  CallTimeout = 'CallTimeout',
  /**
   * 呼叫被拒绝
   * @default 'CallRejected'
   */
  CallRejected = 'CallRejected',
  /**
   * 在房间内
   * @default 'InRoom'
   */
  InRoom = 'InRoom',
}

/**
 * 房间参与者类型定义
 * @interface RoomParticipant
 * @description 表示房间参与者，继承自 RoomUser。
 * @example
 * const participant: RoomParticipant = {
 *   userId: 'user123',
 *   userName: 'John Doe',
 *   avatarUrl: 'https://example.com/avatar.jpg',
 *   nameCard: 'John Doe',
 *   role: RoomParticipantRole.GeneralUser,
 *   roomStatus: RoomParticipantStatus.InRoom,
 */
export interface RoomParticipant extends RoomUser {
  /** 用户名片 */
  nameCard: string;
  /** 用户角色 */
  role: RoomParticipantRole;
  /** 用户状态 */
  roomStatus: RoomParticipantStatus;
  /** 麦克风状态 */
  microphoneStatus: DeviceStatus;
  /** 摄像头状态 */
  cameraStatus: DeviceStatus;
  /** 屏幕共享状态 */
  screenShareStatus: DeviceStatus;
  /** 是否禁言 */
  isMessageDisabled: boolean;
  /** 用户自定义元数据 */
  metaData: Record<string, string>;
}

/**
 * 被踢出房间原因枚举
 * @enum {string}
 * @description 表示被踢出房间的原因。
 */
export enum KickedOutOfRoomReason {
  /**
   * 被管理员踢出房间
   * @default 'KickedByAdmin'
   */
  KickedByAdmin = 'KickedByAdmin',
  /**
   * 被其他设备替换
   * @default 'ReplacedByAnotherDevice'
   */
  ReplacedByAnotherDevice = 'ReplacedByAnotherDevice',
  /**
   * 被服务端踢出
   * @default 'KickedByServer'
   */
  KickedByServer = 'KickedByServer',
  /**
   * 连接超时
   * @default 'ConnectionTimeout'
   */
  ConnectionTimeout = 'ConnectionTimeout',
  /**
   * 离线期间态进房状发生变化（被踢出房间或者房间已解散）
   * @default 'InvalidStatusOnReconnect'
   */
  InvalidStatusOnReconnect = 'InvalidStatusOnReconnect',
  /**
   * 房间人数超过限制
   * @default 'RoomLimitExceeded'
   */
  RoomLimitExceeded = 'RoomLimitExceeded',
}

/**
 * 设备申请信息类型定义
 * @interface DeviceRequestInfo
 * @description 表示设备申请信息。
 *
 * @example
 * const deviceRequestInfo: DeviceRequestInfo = {
 *   timestamp: 1714339200,
 *   senderUserId: 'user123',
 *   senderUserName: 'John Doe',
 *   senderNameCard: 'John Doe',
 *   senderAvatarUrl: 'https://example.com/avatar.jpg',
 *   content: '申请使用摄像头',
 *   deviceType: DeviceType.Camera,
 * };
 */
export interface DeviceRequestInfo {
  /** 申请时间戳 */
  timestamp: number;
  /** 申请者用户ID */
  senderUserId: string;
  /** 申请者用户名 */
  senderUserName: string;
  /** 申请者昵称 */
  senderNameCard: string;
  /** 申请者头像URL */
  senderAvatarUrl: string;
  /** 申请内容 */
  content: string;
  /** 申请设备类型 */
  deviceType: DeviceType;
}

/**
 * 视频流类型枚举
 * @enum {string}
 * @description 表示视频流类型。
 */
export enum VideoStreamType {
  /**
   * 屏幕流
   * @default 'screen'
   */
  Screen = 'screen',
  /**
   * 摄像头流
   * @default 'camera'
   */
  Camera = 'camera',
}

/**
 * 填充模式枚举
 * @enum {string}
 * @description 表示填充模式。
 */
export enum FillMode {
  /**
   * 图像铺满屏幕
   * @default 'fill'
   */
  Fill = 'fill',
  /**
   * 图像长边填满屏幕，短边区域会被填充黑色
   * @default 'fit'
   */
  Fit = 'fit',
}

/**
 * 房间布局模板枚举
 * @enum {string}
 * @description 表示房间布局模板。
 */
export enum RoomLayoutTemplate {
  /**
   * 网格布局
   * @default 'gridLayout'
   */
  GridLayout = 'gridLayout',
  /**
   * 顶部拦布局
   * @default 'cinemaLayout'
   */
  CinemaLayout = 'cinemaLayout',
  /**
   * 侧边栏布局
   * @default 'sidebarLayout'
   */
  SidebarLayout = 'sidebarLayout',
  /**
   * 移动端布局
   * @default 'mobileLayout'
   */
  MobileLayout = 'MobileLayout',
}

export interface IRoomParticipantState {
  // data:
  participantList: Ref<RoomParticipant[]>;
  participantListCursor: Ref<string>;
  participantListWithVideo: Ref<RoomParticipant[]>;
  participantWithScreen: Ref<RoomParticipant | null>;
  pendingDeviceApplications: Ref<DeviceRequestInfo[]>;
  pendingDeviceInvitations: Ref<DeviceRequestInfo[]>;
  speakingUsers: Ref<Map<string, number>>;
  networkQualities: Ref<Map<string, NetworkInfo>>;
  pendingParticipantList: Ref<RoomParticipant[]>;

  readonly localParticipant: Ref<RoomParticipant | null>;

  // functions:
  getParticipantList(options: { cursor?: string }): Promise<{ participantList: RoomParticipant[]; cursor: string }>;

  transferOwner(options: { userId: string }): Promise<void>;
  setAdmin(options: { userId: string }): Promise<void>;
  revokeAdmin(options: { userId: string }): Promise<void>;
  kickParticipant(options: { userId: string }): Promise<void>;
  updateParticipantNameCard(options: { userId: string; nameCard: string }): Promise<void>;
  updateParticipantMetaData(options: { userId: string; metaData: Record<string, string> }): Promise<void>;

  closeParticipantDevice(options: { userId: string; deviceType: DeviceType }): Promise<void>;
  muteParticipantMessage(options: { userId: string; mute: boolean }): Promise<void>;
  disableAllDevices(options: { deviceType: DeviceType; disable: boolean }): Promise<void>;
  disableAllMessages(options: { disable: boolean }): Promise<void>;

  requestToOpenDevice(options: { device: DeviceType; timeout?: number }): Promise<void>;
  cancelOpenDeviceRequest(options: { device: DeviceType }): Promise<void>;
  approveOpenDeviceRequest(options: { device: DeviceType; userId: string }): Promise<void>;
  rejectOpenDeviceRequest(options: { device: DeviceType; userId: string }): Promise<void>;

  inviteToOpenDevice(options: { userId: string; device: DeviceType; timeout?: number }): Promise<void>;
  cancelOpenDeviceInvitation(options: { userId: string; device: DeviceType }): Promise<void>;
  acceptOpenDeviceInvitation(options: { userId: string; device: DeviceType }): Promise<void>;
  declineOpenDeviceInvitation(options: { userId: string; device: DeviceType }): Promise<void>;

  muteMicrophone(): Promise<void>;
  unmuteMicrophone(): Promise<void>;

  subscribeEvent(event: RoomParticipantEvent, callback: RoomParticipantEventPayloads[keyof RoomParticipantEventPayloads]): void;
  unsubscribeEvent(event: RoomParticipantEvent, callback: RoomParticipantEventPayloads[keyof RoomParticipantEventPayloads]): void;
}

/**
 * @module RoomParticipantEvent
 * @description **房间事件列表**
 *
 * 通过 subscribeEvent(RoomParticipantEvent.XXX, handler)` 监听指定的事件。
 * 您可以通过这些事件处理房间参与者加入、离开、设备关闭、消息禁用等事件。
 *
 * > **注意：**
 * > 事件需要在事件触发之前监听，这样才能收到相应的事件通知。
 * > 建议在加入房间前完成事件监听，这样才能确保不会漏掉事件通知。
 *
 * @example
 * import { useRoomParticipantState, RoomParticipantEvent } from '@tuikit-atomicx-vue3/room';
 * const { subscribeEvent, unsubscribeEvent } = useRoomParticipantState();
 *
 * const onParticipantJoined = (options: { userInfo: RoomUser }) => {
 *   console.log('参与者加入:', options.userInfo);
 * };
 * subscribeEvent(RoomParticipantEvent.onParticipantJoined, onParticipantJoined);
 * unsubscribeEvent(RoomParticipantEvent.onParticipantJoined, onParticipantJoined);
 */
export enum RoomParticipantEvent {
  /**
   * 当其他参会者加入房间时触发。
   * @event
   * @example
   * import { useRoomParticipantState, RoomParticipantEvent } from '@tuikit-atomicx-vue3/room';
   * const { subscribeEvent, unsubscribeEvent } = useRoomParticipantState();
   * const onParticipantJoined = (options: { userInfo: RoomUser }) => {
   *   console.log('参与者加入房间:', options.userInfo);
   * };
   * subscribeEvent(RoomParticipantEvent.onParticipantJoined, onParticipantJoined);
   * unsubscribeEvent(RoomParticipantEvent.onParticipantJoined, onParticipantJoined);
   */
  onParticipantJoined = 'onParticipantJoined',
  /**
   * 当其他参会者离开房间时触发。
   * @event
   * @example
   * import { useRoomParticipantState, RoomParticipantEvent } from '@tuikit-atomicx-vue3/room';
   * const { subscribeEvent, unsubscribeEvent } = useRoomParticipantState();
   * const onParticipantLeft = (options: { userInfo: RoomUser }) => {
   *   console.log('参会者离开房间:', options.userInfo);
   * };
   * subscribeEvent(RoomParticipantEvent.onParticipantLeft, onParticipantLeft);
   * unsubscribeEvent(RoomParticipantEvent.onParticipantLeft, onParticipantLeft);
   */
  onParticipantLeft = 'onParticipantLeft',
  /**
   * 当房间所有者变更时触发。
   * @event
   * @example
   * import { useRoomParticipantState, RoomParticipantEvent } from '@tuikit-atomicx-vue3/room';
   * const { subscribeEvent, unsubscribeEvent } = useRoomParticipantState();
   *
   * const onOwnerChanged = (options: { newOwner: RoomUser }) => {
   *   console.log('房间所有者变更:', options.newOwner);
   * };
   * subscribeEvent(RoomParticipantEvent.onOwnerChanged, onOwnerChanged);
   * unsubscribeEvent(RoomParticipantEvent.onOwnerChanged, onOwnerChanged);
   */
  onOwnerChanged = 'onOwnerChanged',
  /**
   * 当房间内用户被设为管理员时触发。
   * @event
   * @example
   * import { useRoomParticipantState, RoomParticipantEvent } from '@tuikit-atomicx-vue3/room';
   * const { subscribeEvent, unsubscribeEvent } = useRoomParticipantState();
   *
   * const onAdminSet = (options: { userInfo: RoomUser }) => {
   *   console.log('用户被设为管理员:', options.userInfo);
   * };
   * subscribeEvent(RoomParticipantEvent.onAdminSet, onAdminSet);
   * unsubscribeEvent(RoomParticipantEvent.onAdminSet, onAdminSet);
   */
  onAdminSet = 'onAdminSet',
  /**
   * 当用户管理员权限被撤销时触发。
   * @event
   * @example
   * import { useRoomParticipantState, RoomParticipantEvent } from '@tuikit-atomicx-vue3/room';
   * const { subscribeEvent, unsubscribeEvent } = useRoomParticipantState();
   *
   * const onAdminRevoked = (options: { userInfo: RoomUser }) => {
   *   console.log('用户管理员权限被撤销:', options.userInfo);
   * };
   * subscribeEvent(RoomParticipantEvent.onAdminRevoked, onAdminRevoked);
   * unsubscribeEvent(RoomParticipantEvent.onAdminRevoked, onAdminRevoked);
   */
  onAdminRevoked = 'onAdminRevoked',
  /**
   * 当本地用户被踢出房间时触发。
   * @event
   * @example
   * import { useRoomParticipantState, RoomParticipantEvent } from '@tuikit-atomicx-vue3/room';
   * const { subscribeEvent, unsubscribeEvent } = useRoomParticipantState();
   *
   * const onKickedFromRoom = (options: { reason: KickedOutOfRoomReason; message: string }) => {
   *   console.log('本地用户被踢出房间:', options.reason, options.message);
   * };
   * subscribeEvent(RoomParticipantEvent.onKickedFromRoom, onKickedFromRoom);
   * unsubscribeEvent(RoomParticipantEvent.onKickedFromRoom, onKickedFromRoom);
   */
  onKickedFromRoom = 'onKickedFromRoom',
  /**
   * 当本地用户媒体设备（麦克风/摄像头/屏幕共享）被房主/管理员关闭时触发。
   * @event
   * @example
   * import { useRoomParticipantState, RoomParticipantEvent } from '@tuikit-atomicx-vue3/room';
   * const { subscribeEvent, unsubscribeEvent } = useRoomParticipantState();
   *
   * const onParticipantDeviceClosed = (options: { device: DeviceType; operator: RoomUser }) => {
   *   console.log('本地用户媒体设备被关闭:', options.device, options.operator);
   * };
   * subscribeEvent(RoomParticipantEvent.onParticipantDeviceClosed, onParticipantDeviceClosed);
   * unsubscribeEvent(RoomParticipantEvent.onParticipantDeviceClosed, onParticipantDeviceClosed);
   */
  onParticipantDeviceClosed = 'onParticipantDeviceClosed',
  /**
   * 当本地用户发消息能力被房主/管理员禁用/启用时触发。
   * @event
   * @example
   * import { useRoomParticipantState, RoomParticipantEvent } from '@tuikit-atomicx-vue3/room';
   * const { subscribeEvent, unsubscribeEvent } = useRoomParticipantState();
   *
   * const onParticipantMessageMuted = (options: { muted: boolean; operator: RoomUser }) => {
   *   console.log('用户被禁言/解禁:', options.muted, options.operator);
   * };
   * subscribeEvent(RoomParticipantEvent.onParticipantMessageMuted, onParticipantMessageMuted);
   * unsubscribeEvent(RoomParticipantEvent.onParticipantMessageMuted, onParticipantMessageMuted);
   */
  onParticipantMessageMuted = 'onParticipantMessageMuted',
  /**
   * 当全体参会者媒体设备（麦克风/摄像头/屏幕共享）被房主/管理员禁用/启用时触发。
   * @event
   * @example
   * import { useRoomParticipantState, RoomParticipantEvent } from '@tuikit-atomicx-vue3/room';
   * const { subscribeEvent, unsubscribeEvent } = useRoomParticipantState();
   *
   * const onAllDevicesDisabled = (options: { device: DeviceType; disable: boolean; operator: RoomUser }) => {
   *   console.log('全体参会者媒体设备被禁用/启用:', options.device, options.disable, options.operator);
   * };
   * subscribeEvent(RoomParticipantEvent.onAllDevicesDisabled, onAllDevicesDisabled);
   * unsubscribeEvent(RoomParticipantEvent.onAllDevicesDisabled, onAllDevicesDisabled);
   */
  onAllDevicesDisabled = 'onAllDevicesDisabled',
  /**
   * 当全体参会者发消息能力被房主/管理员禁用/启用时触发。
   * @event
   * @example
   * import { useRoomParticipantState, RoomParticipantEvent } from '@tuikit-atomicx-vue3/room';
   * const { subscribeEvent, unsubscribeEvent } = useRoomParticipantState();
   *
   * const onAllMessagesDisabled = (options: { disable: boolean; operator: RoomUser }) => {
   *   console.log('全体参会者发消息能力被禁用/启用:', options.disable, options.operator);
   * };
   * subscribeEvent(RoomParticipantEvent.onAllMessagesDisabled, onAllMessagesDisabled);
   * unsubscribeEvent(RoomParticipantEvent.onAllMessagesDisabled, onAllMessagesDisabled);
   */
  onAllMessagesDisabled = 'onAllMessagesDisabled',
  /**
   * 当房主/管理员收到其他参会者申请开启媒体设备（麦克风/摄像头/屏幕共享）时触发。
   * @event
   * @example
   * import { useRoomParticipantState, RoomParticipantEvent, DeviceRequestInfo } from '@tuikit-atomicx-vue3/room';
   * const { subscribeEvent, unsubscribeEvent } = useRoomParticipantState();
   *
   * const onDeviceRequestReceived = (options: { request: DeviceRequestInfo }) => {
   *   const { deviceType, senderUserName } = options.request;
   *   console.log(`${senderUserName} 申请开启 ${deviceType} 设备`);
   * };
   * subscribeEvent(RoomParticipantEvent.onDeviceRequestReceived, onDeviceRequestReceived);
   * unsubscribeEvent(RoomParticipantEvent.onDeviceRequestReceived, onDeviceRequestReceived);
   */
  onDeviceRequestReceived = 'onDeviceRequestReceived',
  /**
   * 当房主/管理员收到其他参会者申请开启媒体设备（麦克风/摄像头/屏幕共享）申请被取消时触发。
   * @event
   * @example
   * import { useRoomParticipantState, RoomParticipantEvent, DeviceRequestInfo } from '@tuikit-atomicx-vue3/room';
   * const { subscribeEvent, unsubscribeEvent } = useRoomParticipantState();
   *
   * const onDeviceRequestCancelled = (options: { request: DeviceRequestInfo }) => {
   *   console.log('其他参会者申请开启媒体设备被取消:', options.request);
   *   const { deviceType, senderUserName } = options.request;
   *   console.log(`${senderUserName} 取消申请开启 ${deviceType} 设备被取消`);
   * };
   * subscribeEvent(RoomParticipantEvent.onDeviceRequestCancelled, onDeviceRequestCancelled);
   * unsubscribeEvent(RoomParticipantEvent.onDeviceRequestCancelled, onDeviceRequestCancelled);
   */
  onDeviceRequestCancelled = 'onDeviceRequestCancelled',
  /**
   * 当房主/管理员收到其他参会者开启媒体设备的申请超时时触发。
   * @event
   * @example
   * import { useRoomParticipantState, RoomParticipantEvent, DeviceRequestInfo } from '@tuikit-atomicx-vue3/room';
   * const { subscribeEvent, unsubscribeEvent } = useRoomParticipantState();
   *
   * const onDeviceRequestTimeout = (options: { request: DeviceRequestInfo }) => {
   *   const { deviceType, senderUserName } = options.request;
   *   console.log(`${senderUserName} 申请开启 ${deviceType} 设备超时`);
   * };
   * subscribeEvent(RoomParticipantEvent.onDeviceRequestTimeout, onDeviceRequestTimeout);
   * unsubscribeEvent(RoomParticipantEvent.onDeviceRequestTimeout, onDeviceRequestTimeout);
   */
  onDeviceRequestTimeout = 'onDeviceRequestTimeout',
  /**
   * 当参会者申请开启媒体设备（麦克风/摄像头/屏幕共享）请求被批准时触发。
   * @event
   * @example
   * import { useRoomParticipantState, RoomParticipantEvent, DeviceRequestInfo } from '@tuikit-atomicx-vue3/room';
   * const { subscribeEvent, unsubscribeEvent } = useRoomParticipantState();
   *
   * const onDeviceRequestApproved = (options: { request: DeviceRequestInfo, operator: RoomUser }) => {
   *   const { deviceType } = options.request;
   *   const { userName } = options.operator;
   *   console.log(`${userName} 同意我打开 ${deviceType} 设备`);
   * };
   * subscribeEvent(RoomParticipantEvent.onDeviceRequestApproved, onDeviceRequestApproved);
   * unsubscribeEvent(RoomParticipantEvent.onDeviceRequestApproved, onDeviceRequestApproved);
   */
  onDeviceRequestApproved = 'onDeviceRequestApproved',
  /**
   * 当参会者申请开启媒体设备（麦克风/摄像头/屏幕共享）请求被拒绝时触发。
   * @event
   * @example
   * import { useRoomParticipantState, RoomParticipantEvent, DeviceRequestInfo } from '@tuikit-atomicx-vue3/room';
   * const { subscribeEvent, unsubscribeEvent } = useRoomParticipantState();
   *
   * const onDeviceRequestRejected = (options: { request: DeviceRequestInfo }) => {
   *   const { deviceType } = options.request;
   *   const { userName } = options.operator;
   *   console.log(`${userName} 拒绝我打开 ${deviceType} 设备`);
   * };
   * subscribeEvent(RoomParticipantEvent.onDeviceRequestRejected, onDeviceRequestRejected);
   * unsubscribeEvent(RoomParticipantEvent.onDeviceRequestRejected, onDeviceRequestRejected);
   */
  onDeviceRequestRejected = 'onDeviceRequestRejected',
  /**
   * 当参会者申请开启媒体设备（麦克风/摄像头/屏幕共享）的请求被其他房主/管理员处理时触发。
   * @event
   * @example
   * import { useRoomParticipantState, RoomParticipantEvent, DeviceRequestInfo } from '@tuikit-atomicx-vue3/room';
   * const { subscribeEvent, unsubscribeEvent } = useRoomParticipantState();
   *
   * const onDeviceRequestProcessed = (options: { request: DeviceRequestInfo; operator: RoomUser }) => {
   *   const { senderUserName, deviceType } = options.request;
   *   const { userName } = options.operator;
   *   console.log(`${senderUserName} 处理了 ${userName} 申请打开 ${deviceType} 设备的请求`);
   * };
   * subscribeEvent(RoomParticipantEvent.onDeviceRequestProcessed, onDeviceRequestProcessed);
   * unsubscribeEvent(RoomParticipantEvent.onDeviceRequestProcessed, onDeviceRequestProcessed);
   */
  onDeviceRequestProcessed = 'onDeviceRequestProcessed',
  /**
   * 本地用户收到房主/管理员开启媒体设备（麦克风/摄像头/屏幕共享）的邀请时触发。
   * @event
   * @example
   * import { useRoomParticipantState, RoomParticipantEvent, DeviceRequestInfo } from '@tuikit-atomicx-vue3/room';
   * const { subscribeEvent, unsubscribeEvent } = useRoomParticipantState();
   *
   * const onDeviceInvitationReceived = (options: { invitation: DeviceRequestInfo }) => {
   *   const { senderUserName, deviceType } = options.invitation;
   *   console.log(`${senderUserName} 邀请我打开 ${deviceType} 设备`);
   * };
   * subscribeEvent(RoomParticipantEvent.onDeviceInvitationReceived, onDeviceInvitationReceived);
   * unsubscribeEvent(RoomParticipantEvent.onDeviceInvitationReceived, onDeviceInvitationReceived);
   */
  onDeviceInvitationReceived = 'onDeviceInvitationReceived',
  /**
   * 本地用户收到房主/管理员开启媒体设备（麦克风/摄像头/屏幕共享）的邀请被取消时触发。
   * @event
   * @example
   * import { useRoomParticipantState, RoomParticipantEvent, DeviceRequestInfo } from '@tuikit-atomicx-vue3/room';
   * const { subscribeEvent, unsubscribeEvent } = useRoomParticipantState();
   *
   * const onDeviceInvitationCancelled = (options: { invitation: DeviceRequestInfo }) => {
   *   const { senderUserName, deviceType } = options.invitation;
   *   console.log(`${senderUserName} 取消邀请我打开 ${deviceType} 设备`);
   * };
   * subscribeEvent(RoomParticipantEvent.onDeviceInvitationCancelled, onDeviceInvitationCancelled);
   * unsubscribeEvent(RoomParticipantEvent.onDeviceInvitationCancelled, onDeviceInvitationCancelled);
   */
  onDeviceInvitationCancelled = 'onDeviceInvitationCancelled',
  /**
   * 本地用户收到房主/管理员开启媒体设备（麦克风/摄像头/屏幕共享）的邀请超时时触发。
   * @event
   * @example
   * import { useRoomParticipantState, RoomParticipantEvent, DeviceRequestInfo } from '@tuikit-atomicx-vue3/room';
   * const { subscribeEvent, unsubscribeEvent } = useRoomParticipantState();
   *
   * const onDeviceInvitationTimeout = (options: { invitation: DeviceRequestInfo }) => {
   *   const { senderUserName, deviceType } = options.invitation;
   *   console.log(`${senderUserName} 邀请我打开 ${deviceType} 设备的邀请超时`);
   * };
   * subscribeEvent(RoomParticipantEvent.onDeviceInvitationTimeout, onDeviceInvitationTimeout);
   * unsubscribeEvent(RoomParticipantEvent.onDeviceInvitationTimeout, onDeviceInvitationTimeout);
   */
  onDeviceInvitationTimeout = 'onDeviceInvitationTimeout',
  /**
   * 房主/管理员收到普通用户接受开启媒体设备（麦克风/摄像头/屏幕共享）的邀请时触发。
   * @event
   * @example
   * import { useRoomParticipantState, RoomParticipantEvent, DeviceRequestInfo } from '@tuikit-atomicx-vue3/room';
   * const { subscribeEvent, unsubscribeEvent } = useRoomParticipantState();
   *
   * const onDeviceInvitationAccepted = (options: { invitation: DeviceRequestInfo; operator: RoomUser }) => {
   *   const { deviceType } = options.invitation;
   *   const { userName } = options.operator;
   *   console.log(`${userName} 接受了打开 ${deviceType} 设备的邀请`);
   * };
   * subscribeEvent(RoomParticipantEvent.onDeviceInvitationAccepted, onDeviceInvitationAccepted);
   * unsubscribeEvent(RoomParticipantEvent.onDeviceInvitationAccepted, onDeviceInvitationAccepted);
   */
  onDeviceInvitationAccepted = 'onDeviceInvitationAccepted',
  /**
   * 房主/管理员收到普通用户拒绝开启媒体设备（麦克风/摄像头/屏幕共享）的邀请时触发。
   * @event
   * @example
   * import { useRoomParticipantState, RoomParticipantEvent, DeviceRequestInfo } from '@tuikit-atomicx-vue3/room';
   * const { subscribeEvent, unsubscribeEvent } = useRoomParticipantState();
   *
   * const onDeviceInvitationDeclined = (options: { invitation: DeviceRequestInfo }) => {
   *   const { deviceType } = options.invitation;
   *   const { userName } = options.operator;
   *   console.log(`${userName} 拒绝了打开 ${deviceType} 设备的邀请`);
   * };
   * subscribeEvent(RoomParticipantEvent.onDeviceInvitationDeclined, onDeviceInvitationDeclined);
   * unsubscribeEvent(RoomParticipantEvent.onDeviceInvitationDeclined, onDeviceInvitationDeclined);
   */
  onDeviceInvitationDeclined = 'onDeviceInvitationDeclined',
}

export interface RoomParticipantEventPayloads {
  onParticipantJoined: (options: { userInfo: RoomUser }) => void;
  onParticipantLeft: (options: { userInfo: RoomUser }) => void;
  onOwnerChanged: (options: { newOwner: RoomUser }) => void;
  onAdminSet: (options: { userInfo: RoomUser }) => void;
  onAdminRevoked: (options: { userInfo: RoomUser }) => void;
  onKickedFromRoom: (options: { reason: KickedOutOfRoomReason; message: string }) => void;
  onParticipantDeviceClosed: (options: { device: DeviceType; operator: RoomUser }) => void;
  onParticipantMessageMuted: (options: { muted: boolean; operator: RoomUser }) => void;
  onAllDevicesDisabled: (options: { device: DeviceType; disable: boolean; operator: RoomUser }) => void;
  onAllMessagesDisabled: (options: { disable: boolean; operator: RoomUser }) => void;
  onDeviceRequestReceived: (options: { request: DeviceRequestInfo }) => void;
  onDeviceRequestCancelled: (options: { request: DeviceRequestInfo }) => void;
  onDeviceRequestTimeout: (options: { request: DeviceRequestInfo }) => void;
  onDeviceRequestApproved: (options: { request: DeviceRequestInfo; operator: RoomUser }) => void;
  onDeviceRequestRejected: (options: { request: DeviceRequestInfo; operator: RoomUser }) => void;
  onDeviceRequestProcessed: (options: { request: DeviceRequestInfo; operator: RoomUser }) => void;
  onDeviceInvitationReceived: (options: { invitation: DeviceRequestInfo }) => void;
  onDeviceInvitationCancelled: (options: { invitation: DeviceRequestInfo }) => void;
  onDeviceInvitationTimeout: (options: { invitation: DeviceRequestInfo }) => void;
  onDeviceInvitationAccepted: (options: { invitation: DeviceRequestInfo; operator: RoomUser }) => void;
  onDeviceInvitationDeclined: (options: { invitation: DeviceRequestInfo; operator: RoomUser }) => void;
}
