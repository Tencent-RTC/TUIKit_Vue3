import type { Ref } from 'vue';

/**
 * @module RoomType
 * @description 房间类型定义
 *
 * 提供预约房间和房间呼叫相关的类型定义。
 *
 * @example
 * import { RoomStatus, RoomCallStatus } from 'tuikit-atomicx-vue3';
 */

export enum RoomType {
  /** 会议类型 */
  Standard = 1,
  /** 网络研讨会类型 */
  Webinar = 2,
}
/**
 * 房间状态枚举
 * @enum {number}
 * @description 表示房间的当前状态。
 */
export enum RoomStatus {
  /**
   * 房间已预约但未开始
   * @default 1
   */
  Scheduled = 1,
  /**
   * 房间正在进行中
   * @default 2
   */
  Running = 2,
}

/**
 * 房间用户信息
 * @interface RoomUser
 * @description 表示房间系统中的用户信息。
 *
 * @example
 * const user: RoomUser = {
 *   userId: 'user123',
 *   userName: 'John Doe',
 *   avatarUrl: 'https://example.com/avatar.png'
 * };
 */
export interface RoomUser {
  /** 用户唯一标识 */
  userId: string;
  /** 用户显示名称 */
  userName: string;
  /** 用户头像 URL */
  avatarUrl: string;
}

/**
 * 房间信息
 * @interface RoomInfo
 * @description 包含房间的完整信息。
 *
 * @example
 * const roomInfo: RoomInfo = {
 *   roomId: 'room123',
 *   roomName: 'Team Meeting',
 *   roomOwner: { userId: 'user1', userName: 'Host', avatarUrl: '' },
 *   participantCount: 5,
 *   roomStatus: RoomStatus.Running
 * };
 */
export interface RoomInfo {
  /** 房间唯一标识 */
  readonly roomId: string;
  /** 房间类型 */
  roomType: RoomType;
  /** 房间显示名称 */
  roomName: string;
  /** 房间所有者/创建者 */
  roomOwner: RoomUser;
  /** 房间嘉宾数量 */
  readonly participantCount?: number;
  /** 房间观众数量 */
  readonly audienceCount?: number;
  /** 房间创建时间戳 */
  readonly createTime?: number;
  /** 房间当前状态 */
  readonly roomStatus?: RoomStatus;
  /** 预约开始时间（毫秒时间戳） */
  scheduledStartTime?: number;
  /** 预约结束时间（毫秒时间戳） */
  scheduledEndTime?: number;
  /** 开始前多少秒发送提醒通知 */
  startReminderInSeconds?: number;
  /** 预约参会用户列表 */
  scheduleAttendees?: RoomUser[];
  /** 加入房间的密码 */
  password?: string;
  /** 是否默认禁用所有麦克风 */
  isAllMicrophoneDisabled?: boolean;
  /** 是否默认禁用所有摄像头 */
  isAllCameraDisabled?: boolean;
  /** 是否禁用屏幕共享 */
  isAllScreenShareDisabled?: boolean;
  /** 是否禁用消息发送 */
  isAllMessageDisabled?: boolean;
}

/**
 * 预约房间选项
 * @typedef {Object} ScheduleRoomOptions
 * @description 预约新房间时的配置选项。
 *
 * @example
 * const options: ScheduleRoomOptions = {
 *   roomName: 'Weekly Standup',
 *   scheduleStartTime: Date.now() + 3600000,
 *   scheduleEndTime: Date.now() + 7200000,
 *   reminderSecondsBeforeStart: 300,
 *   scheduleAttendees: ['user1', 'user2']
 * };
 */
export type ScheduleRoomOptions = {
  /** 房间显示名称 */
  roomName?: string;
  /** 加入房间的密码 */
  password?: string;
  /** 预约开始时间（毫秒时间戳） */
  scheduleStartTime: number;
  /** 预约结束时间（毫秒时间戳） */
  scheduleEndTime: number;
  /** 开始前多少秒发送提醒通知 */
  reminderSecondsBeforeStart?: number;
  /** 邀请的用户 ID 列表 */
  scheduleAttendees?: string[];
  /** 是否默认禁用所有麦克风 */
  isAllMicrophoneDisabled?: boolean;
  /** 是否默认禁用所有摄像头 */
  isAllCameraDisabled?: boolean;
  /** 是否禁用屏幕共享 */
  isAllScreenShareDisabled?: boolean;
  /** 是否禁用消息发送 */
  isAllMessageDisabled?: boolean;
};

/**
 * 创建房间选项
 * @typedef {Object} CreateRoomOptions
 * @description 创建并立即加入新房间时的配置选项。
 *
 * @example
 * const options: CreateRoomOptions = {
 *   roomName: 'Quick Meeting',
 *   password: '123456',
 *   isAllMicrophoneDisabled: false
 * };
 */
export type CreateRoomOptions = {
  /** 房间显示名称 */
  roomName?: string;
  /** 加入房间的密码 */
  password?: string;
  /** 是否默认禁用所有麦克风 */
  isAllMicrophoneDisabled?: boolean;
  /** 是否默认禁用所有摄像头 */
  isAllCameraDisabled?: boolean;
  /** 是否禁用屏幕共享 */
  isAllScreenShareDisabled?: boolean;
  /** 是否禁用消息发送 */
  isAllMessageDisabled?: boolean;
};

/**
 * 更新房间选项
 * @typedef {Object} UpdateRoomOptions
 * @description 更新现有房间时的配置选项。
 *
 * @example
 * const options: UpdateRoomOptions = {
 *   roomName: 'Updated Meeting Name'
 * };
 */
export type UpdateRoomOptions = {
  /** 新的房间显示名称 */
  roomName?: string;
  /** 新的房间密码 */
  password?: string;
};

/**
 * 房间呼叫状态枚举
 * @enum {number}
 * @description 表示房间呼叫/邀请的当前状态。
 */
export enum RoomCallStatus {
  /**
   * 无活跃呼叫
   * @default 0
   */
  None = 0,
  /**
   * 呼叫进行中，等待响应
   * @default 1
   */
  Calling = 1,
  /**
   * 呼叫超时无响应
   * @default 2
   */
  Timeout = 2,
  /**
   * 呼叫被被叫方拒绝
   * @default 3
   */
  Rejected = 3,
}

/**
 * 房间呼叫结果枚举
 * @enum {number}
 * @description 发起房间呼叫的结果。
 */
export enum RoomCallResult {
  /**
   * 呼叫发起成功
   * @default 0
   */
  Success = 0,
  /**
   * 用户已在呼叫中
   * @default 1
   */
  AlreadyInCalling = 1,
  /**
   * 用户已在房间中
   * @default 2
   */
  AlreadyInRoom = 2,
}

/**
 * 呼叫拒绝原因枚举
 * @enum {number}
 * @description 表示呼叫被拒绝的原因。
 *
 */
export enum CallRejectReason {
  /**
   * 用户拒绝呼叫
   */
  Rejected = 0,
  /**
   * 用户已在其他房间中
   */
  InOtherRoom = 1,
}

/**
 * 房间呼叫信息
 * @interface RoomCall
 * @description 表示加入房间的呼叫/邀请信息。
 *
 * @example
 * const call: RoomCall = {
 *   caller: { userId: 'host', userName: 'Host User', avatarUrl: '' },
 *   callee: { userId: 'guest', userName: 'Guest User', avatarUrl: '' },
 *   status: RoomCallStatus.Calling
 * };
 */
export interface RoomCall {
  /** 发起呼叫的用户 */
  caller: RoomUser;
  /** 被呼叫的用户 */
  callee: RoomUser;
  /** 呼叫的当前状态 */
  status?: RoomCallStatus;
}

/**
 * 房间状态接口
 * @interface IRoomState
 * @description 管理房间状态和操作的主接口，提供响应式状态属性和房间管理方法。
 */
export interface IRoomState {
  /** 预约房间列表（响应式） */
  scheduledRoomList: Ref<RoomInfo[]>;
  /** 预约房间列表分页游标 */
  scheduledRoomListCursor: Ref<string>;
  /** 当前活跃房间信息 */
  currentRoom: Ref<RoomInfo | null>;

  /**
   * 获取预约房间列表
   * @param options - 查询选项
   * @param options.cursor - 分页游标
   * @returns Promise，包含预约房间列表和下一页游标
   */
  getScheduledRoomList(options: { cursor: string }): Promise<{ scheduledRoomList: RoomInfo[]; cursor: string }>;

  /**
   * 获取预约房间的参会人员
   * @param options - 查询选项
   * @param options.roomId - 房间 ID
   * @param options.cursor - 分页游标
   * @returns Promise，包含参会人员列表、下一页游标和总人数
   */
  getScheduledAttendees(options: { roomId: string; cursor: string }): Promise<{ attendees: RoomUser[]; cursor: string; totalAttendeesCount: number }>;

  /**
   * 预约新房间
   * @param options - 预约选项
   * @param options.roomId - 房间 ID
   * @param options.options - 房间预约配置
   */
  scheduleRoom(options: { roomId: string; options: ScheduleRoomOptions }): Promise<void>;

  /**
   * 更新预约房间
   * @param options - 更新选项
   * @param options.roomId - 房间 ID
   * @param options.options - 更新的房间配置
   */
  updateScheduledRoom(options: { roomId: string; options: ScheduleRoomOptions }): Promise<void>;

  /**
   * 向预约房间添加参会人员
   * @param options - 选项
   * @param options.roomId - 房间 ID
   * @param options.userIdList - 要添加的用户 ID 列表
   */
  addScheduledAttendees(options: { roomId: string; userIdList: string[] }): Promise<void>;

  /**
   * 从预约房间移除参会人员
   * @param options - 选项
   * @param options.roomId - 房间 ID
   * @param options.userIdList - 要移除的用户 ID 列表
   */
  removeScheduledAttendees(options: { roomId: string; userIdList: string[] }): Promise<void>;

  /**
   * 取消预约房间
   * @param options - 选项
   * @param options.roomId - 要取消的房间 ID
   */
  cancelScheduledRoom(options: { roomId: string }): Promise<void>;

  /**
   * 创建并立即加入新房间
   * @param options - 创建选项
   * @param options.roomId - 房间 ID
   * @param options.options - 房间创建配置
   */
  createAndJoinRoom(options: { roomId: string; roomType?: RoomType; options: CreateRoomOptions }): Promise<void>;

  /**
   * 加入现有房间
   * @param options - 加入选项
   * @param options.roomId - 房间 ID
   * @param options.password - 房间密码（如需要）
   */
  joinRoom(options: { roomId: string; roomType?: RoomType; password?: string }): Promise<void>;

  /**
   * 离开当前房间
   */
  leaveRoom(): Promise<void>;

  /**
   * 结束当前房间（仅房主可用）
   */
  endRoom(): Promise<void>;

  /**
   * 更新房间信息
   * @param options - 更新选项
   * @param options.roomId - 房间 ID
   * @param options.options - 更新的房间信息
   */
  updateRoomInfo(options: { roomId: string; options: UpdateRoomOptions }): Promise<void>;

  /**
   * 获取房间信息
   * @param options - 查询选项
   * @param options.roomId - 房间 ID
   * @returns Promise，包含房间信息
   */
  getRoomInfo(options: { roomId: string }): Promise<RoomInfo>;

  /**
   * 获取房间的待处理呼叫
   * @param options - 查询选项
   * @param options.roomId - 房间 ID
   * @param options.cursor - 分页游标
   * @returns Promise，包含呼叫列表和下一页游标
   */
  getPendingCalls(options: { roomId: string; cursor: string }): Promise<{ calls: RoomCall[]; cursor: string }>;

  /**
   * 呼叫用户加入房间
   * @param options - 呼叫选项
   * @param options.roomId - 房间 ID
   * @param options.userIdList - 要呼叫的用户 ID 列表
   * @param options.timeout - 呼叫超时时间（秒）
   * @param options.extensionInfo - 附加信息
   * @returns Promise，包含 userId 到呼叫结果的映射
   */
  callUserToRoom(options: { roomId: string; userIdList: string[]; timeout?: number; extensionInfo?: string }): Promise<Map<string, RoomCallResult>>;

  /**
   * 取消待处理的呼叫
   * @param options - 取消选项
   * @param options.roomId - 房间 ID
   * @param options.userIdList - 要取消呼叫的用户 ID 列表
   */
  cancelCall(options: { roomId: string; userIdList: string[] }): Promise<void>;

  /**
   * 接受来电
   * @param options - 接受选项
   * @param options.roomId - 房间 ID
   */
  acceptCall(options: { roomId: string }): Promise<void>;

  /**
   * 拒绝来电
   * @param options - 拒绝选项
   * @param options.roomId - 房间 ID
   * @param options.extensionInfo - 拒绝原因或附加信息
   */
  rejectCall(options: { roomId: string; extensionInfo?: string }): Promise<void>;

  /**
   * 订阅房间事件
   * @template T - 事件类型
   * @param event - 要订阅的事件名称
   * @param handler - 事件处理函数
   */
  subscribeEvent<T extends RoomEvent>(event: T | `${T}`, handler: RoomEventHandlers[T]): void;

  /**
   * 取消订阅房间事件
   * @template T - 事件类型
   * @param event - 要取消订阅的事件名称
   * @param handler - 要移除的事件处理函数
   */
  unsubscribeEvent<T extends RoomEvent>(event: T | `${T}`, handler: RoomEventHandlers[T]): void;
}

/**
 * @module RoomEvent
 * @description **房间事件列表**
 *
 * 通过 `roomState.subscribeEvent(RoomEvent.XXX, handler)` 监听指定的事件。
 * 您可以通过这些事件处理房间生命周期、预约房间通知和呼叫相关事件。
 *
 * > **注意：**
 * > 事件需要在事件触发之前监听，这样才能收到相应的事件通知。
 * > 建议在加入房间前完成事件监听，这样才能确保不会漏掉事件通知。
 *
 * @example
 * import { useRoomState, RoomEvent, RoomInfo, RoomCall, RoomUser } from 'tuikit-atomicx-vue3';
 *
 * const roomState = useRoomState();
 *
 * // 监听收到呼叫事件
 * roomState.subscribeEvent(RoomEvent.onCallReceived, ({ roomInfo, call }) => {
 *   console.log(`${call.caller.userName} 邀请您加入 ${roomInfo.roomName}`);
 * });
 *
 * // 监听房间结束事件
 * roomState.subscribeEvent(RoomEvent.onRoomEnded, ({ roomInfo }) => {
 *   console.log(`房间 ${roomInfo.roomName} 已结束`);
 * });
 */
export enum RoomEvent {
  /**
   * 当您被添加到预约房间作为参与者时触发。
   * @event
   * @param {object} options - 事件参数对象
   * @param {RoomInfo} options.roomInfo - 预约房间信息，包含房间 ID、名称、房主等详细信息
   * @example
   * import { useRoomState, RoomEvent } from 'tuikit-atomicx-vue3';
   *
   * const roomState = useRoomState();
   * roomState.subscribeEvent(RoomEvent.onAddedToScheduledRoom, ({ roomInfo }) => {
   *   console.log('被添加到预约房间:', roomInfo.roomName);
   * });
   */
  onAddedToScheduledRoom = 'onAddedToScheduledRoom',

  /**
   * 当您被从预约房间中移除时触发。
   * @event
   * @param {object} options - 事件参数对象
   * @param {RoomInfo} options.roomInfo - 预约房间信息
   * @param {RoomUser} options.operator - 执行移除操作的用户信息
   * @example
   * import { useRoomState, RoomEvent } from 'tuikit-atomicx-vue3';
   *
   * const roomState = useRoomState();
   * roomState.subscribeEvent(RoomEvent.onRemovedFromScheduledRoom, ({ roomInfo, operator }) => {
   *   console.log(`被 ${operator.userName} 从 ${roomInfo.roomName} 移除`);
   * });
   */
  onRemovedFromScheduledRoom = 'onRemovedFromScheduledRoom',

  /**
   * 当您参与的预约房间被取消时触发。
   * @event
   * @param {object} options - 事件参数对象
   * @param {RoomInfo} options.roomInfo - 被取消的房间信息
   * @param {RoomUser} options.operator - 取消房间的用户信息
   * @example
   * import { useRoomState, RoomEvent } from 'tuikit-atomicx-vue3';
   *
   * const roomState = useRoomState();
   * roomState.subscribeEvent(RoomEvent.onScheduledRoomCancelled, ({ roomInfo, operator }) => {
   *   console.log(`房间 ${roomInfo.roomName} 被 ${operator.userName} 取消`);
   * });
   */
  onScheduledRoomCancelled = 'onScheduledRoomCancelled',

  /**
   * 当预约房间即将开始时触发（提醒通知）。
   * @event
   * @param {object} options - 事件参数对象
   * @param {RoomInfo} options.roomInfo - 即将开始的房间信息
   * @example
   * import { useRoomState, RoomEvent } from 'tuikit-atomicx-vue3';
   *
   * const roomState = useRoomState();
   * roomState.subscribeEvent(RoomEvent.onScheduledRoomStartingSoon, ({ roomInfo }) => {
   *   console.log(`房间 ${roomInfo.roomName} 即将开始！`);
   * });
   */
  onScheduledRoomStartingSoon = 'onScheduledRoomStartingSoon',

  /**
   * 当当前房间已结束时触发。
   * @event
   * @param {object} options - 事件参数对象
   * @param {RoomInfo} options.roomInfo - 已结束的房间信息
   * @example
   * import { useRoomState, RoomEvent } from 'tuikit-atomicx-vue3';
   *
   * const roomState = useRoomState();
   * roomState.subscribeEvent(RoomEvent.onRoomEnded, ({ roomInfo }) => {
   *   console.log(`房间 ${roomInfo.roomName} 已结束`);
   * });
   */
  onRoomEnded = 'onRoomEnded',

  /**
   * 当您收到加入房间的呼叫/邀请时触发。
   * @event
   * @param {object} options - 事件参数对象
   * @param {RoomInfo} options.roomInfo - 房间信息
   * @param {RoomCall} options.call - 呼叫信息，包含呼叫者和被呼叫者信息
   * @param {string} options.extensionInfo - 呼叫者附加的扩展信息
   * @example
   * import { useRoomState, RoomEvent } from 'tuikit-atomicx-vue3';
   *
   * const roomState = useRoomState();
   * roomState.subscribeEvent(RoomEvent.onCallReceived, ({ roomInfo, call, extensionInfo }) => {
   *   console.log(`${call.caller.userName} 邀请您加入 ${roomInfo.roomName}`);
   *   // 显示接受或拒绝呼叫的 UI
   * });
   */
  onCallReceived = 'onCallReceived',

  /**
   * 当来电被呼叫者取消时触发。
   * @event
   * @param {object} options - 事件参数对象
   * @param {RoomInfo} options.roomInfo - 房间信息
   * @param {RoomCall} options.call - 呼叫信息
   * @example
   * import { useRoomState, RoomEvent } from 'tuikit-atomicx-vue3';
   *
   * const roomState = useRoomState();
   * roomState.subscribeEvent(RoomEvent.onCallCancelled, ({ roomInfo, call }) => {
   *   console.log(`来自 ${call.caller.userName} 的呼叫已取消`);
   * });
   */
  onCallCancelled = 'onCallCancelled',

  /**
   * 当来电超时未响应时触发。
   * @event
   * @param {object} options - 事件参数对象
   * @param {RoomInfo} options.roomInfo - 房间信息
   * @param {RoomCall} options.call - 呼叫信息
   * @example
   * import { useRoomState, RoomEvent } from 'tuikit-atomicx-vue3';
   *
   * const roomState = useRoomState();
   * roomState.subscribeEvent(RoomEvent.onCallTimeout, ({ roomInfo, call }) => {
   *   console.log(`来自 ${call.caller.userName} 的呼叫已超时`);
   * });
   */
  onCallTimeout = 'onCallTimeout',

  /**
   * 当您发出的呼叫被被叫方接受时触发。
   * @event
   * @param {object} options - 事件参数对象
   * @param {RoomInfo} options.roomInfo - 房间信息
   * @param {RoomCall} options.call - 呼叫信息
   * @example
   * import { useRoomState, RoomEvent } from 'tuikit-atomicx-vue3';
   *
   * const roomState = useRoomState();
   * roomState.subscribeEvent(RoomEvent.onCallAccepted, ({ roomInfo, call }) => {
   *   console.log(`${call.callee.userName} 接受了您的呼叫`);
   * });
   */
  onCallAccepted = 'onCallAccepted',

  /**
   * 当您发出的呼叫被被叫方拒绝时触发。
   * @event
   * @param {object} options - 事件参数对象
   * @param {RoomInfo} options.roomInfo - 房间信息
   * @param {RoomCall} options.call - 呼叫信息
   * @param {string} options.extensionInfo - 被叫方拒绝的原因或附加信息
   * @example
   * import { useRoomState, RoomEvent } from 'tuikit-atomicx-vue3';
   *
   * const roomState = useRoomState();
   * roomState.subscribeEvent(RoomEvent.onCallRejected, ({ roomInfo, call, reason }) => {
   *   console.log(`${call.callee.userName} 拒绝了您的呼叫: ${reason}`);
   * });
   */
  onCallRejected = 'onCallRejected',

  /**
   * 当来电在其他设备上被处理（接受/拒绝）时触发。
   * @event
   * @param {object} options - 事件参数对象
   * @param {RoomInfo} options.roomInfo - 房间信息
   * @param {boolean} options.isAccepted - 呼叫是否在其他设备上被接受，true 表示接受，false 表示拒绝
   * @example
   * import { useRoomState, RoomEvent } from 'tuikit-atomicx-vue3';
   *
   * const roomState = useRoomState();
   * roomState.subscribeEvent(RoomEvent.onCallHandledByOtherDevice, ({ roomInfo, isAccepted }) => {
   *   console.log(`呼叫已在其他设备上${isAccepted ? '接受' : '拒绝'}`);
   * });
   */
  onCallHandledByOtherDevice = 'onCallHandledByOtherDevice',

  /**
   * 当呼叫被管理员撤销/取消时触发。
   * @event
   * @param {object} options - 事件参数对象
   * @param {RoomInfo} options.roomInfo - 房间信息
   * @param {RoomCall} options.call - 呼叫信息
   * @param {RoomUser} options.operator - 撤销呼叫的管理员信息
   * @example
   * import { useRoomState, RoomEvent } from 'tuikit-atomicx-vue3';
   *
   * const roomState = useRoomState();
   * roomState.subscribeEvent(RoomEvent.onCallRevokedByAdmin, ({ roomInfo, call, operator }) => {
   *   console.log(`呼叫被管理员 ${operator.userName} 撤销`);
   * });
   */
  onCallRevokedByAdmin = 'onCallRevokedByAdmin',
}

/**
 * 房间事件处理函数类型定义
 * @interface RoomEventHandlers
 * @description 所有房间事件处理函数的类型定义，每个属性对应一个 RoomEvent。
 */
export interface RoomEventHandlers {
  /**
   * onAddedToScheduledRoom 事件处理函数
   * @param options - 事件数据
   * @param options.roomInfo - 预约房间信息
   */
  onAddedToScheduledRoom: (options: { roomInfo: RoomInfo }) => void;

  /**
   * onRemovedFromScheduledRoom 事件处理函数
   * @param options - 事件数据
   * @param options.roomInfo - 预约房间信息
   * @param options.operator - 执行移除操作的用户
   */
  onRemovedFromScheduledRoom: (options: { roomInfo: RoomInfo; operator: RoomUser }) => void;

  /**
   * onScheduledRoomCancelled 事件处理函数
   * @param options - 事件数据
   * @param options.roomInfo - 被取消的房间信息
   * @param options.operator - 取消房间的用户
   */
  onScheduledRoomCancelled: (options: { roomInfo: RoomInfo; operator: RoomUser }) => void;

  /**
   * onScheduledRoomStartingSoon 事件处理函数
   * @param options - 事件数据
   * @param options.roomInfo - 即将开始的房间信息
   */
  onScheduledRoomStartingSoon: (options: { roomInfo: RoomInfo }) => void;

  /**
   * onRoomEnded 事件处理函数
   * @param options - 事件数据
   * @param options.roomInfo - 已结束的房间信息
   */
  onRoomEnded: (options: { roomInfo: RoomInfo }) => void;

  /**
   * onCallReceived 事件处理函数
   * @param options - 事件数据
   * @param options.roomInfo - 房间信息
   * @param options.call - 呼叫信息
   * @param options.extensionInfo - 呼叫者附加信息
   */
  onCallReceived: (options: { roomInfo: RoomInfo; call: RoomCall; extensionInfo: string }) => void;

  /**
   * onCallCancelled 事件处理函数
   * @param options - 事件数据
   * @param options.roomInfo - 房间信息
   * @param options.call - 呼叫信息
   */
  onCallCancelled: (options: { roomInfo: RoomInfo; call: RoomCall }) => void;

  /**
   * onCallTimeout 事件处理函数
   * @param options - 事件数据
   * @param options.roomInfo - 房间信息
   * @param options.call - 呼叫信息
   */
  onCallTimeout: (options: { roomInfo: RoomInfo; call: RoomCall }) => void;

  /**
   * onCallAccepted 事件处理函数
   * @param options - 事件数据
   * @param options.roomInfo - 房间信息
   * @param options.call - 呼叫信息
   */
  onCallAccepted: (options: { roomInfo: RoomInfo; call: RoomCall }) => void;

  /**
   * onCallRejected 事件处理函数
   * @param options - 事件数据
   * @param options.roomInfo - 房间信息
   * @param options.call - 呼叫信息
   * @param options.reason - 被叫方拒绝原因
   */
  onCallRejected: (options: { roomInfo: RoomInfo; call: RoomCall; reason: CallRejectReason }) => void;

  /**
   * onCallHandledByOtherDevice 事件处理函数
   * @param options - 事件数据
   * @param options.roomInfo - 房间信息
   * @param options.isAccepted - 呼叫是否在其他设备上被接受
   */
  onCallHandledByOtherDevice: (options: { roomInfo: RoomInfo; isAccepted: boolean }) => void;

  /**
   * onCallRevokedByAdmin 事件处理函数
   * @param options - 事件数据
   * @param options.roomInfo - 房间信息
   * @param options.call - 呼叫信息
   * @param options.operator - 撤销呼叫的管理员
   */
  onCallRevokedByAdmin: (options: { roomInfo: RoomInfo; call: RoomCall; operator: RoomUser }) => void;
}
