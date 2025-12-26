import type { Ref } from 'vue';

export enum RoomStatus {
  Scheduled = 1,
  Running = 2,
}

export interface RoomUser {
  userId: string;
  userName: string;
  avatarUrl: string;
}

export interface RoomInfo {
  readonly roomId: string;
  roomName: string;
  roomOwner: RoomUser;
  readonly participantCount?: number;
  readonly createTime?: number;
  readonly roomStatus?: RoomStatus;
  scheduledStartTime?: number;
  scheduledEndTime?: number;
  startReminderInSeconds?: number;
  scheduleAttendees?: RoomUser[];
  password?: string;
  isAllMicrophoneDisabled?: boolean;
  isAllCameraDisabled?: boolean;
  isAllScreenShareDisabled?: boolean;
  isAllMessageDisabled?: boolean;
}

export type ScheduleRoomOptions = {
  roomName?: string;
  password?: string;
  scheduleStartTime: number;
  scheduleEndTime: number;
  reminderSecondsBeforeStart?: number;
  scheduleAttendees?: string[];
  isAllMicrophoneDisabled?: boolean;
  isAllCameraDisabled?: boolean;
  isAllScreenShareDisabled?: boolean;
  isAllMessageDisabled?: boolean;
};

export type CreateRoomOptions = {
  roomName?: string;
  password?: string;
  isAllMicrophoneDisabled?: boolean;
  isAllCameraDisabled?: boolean;
  isAllScreenShareDisabled?: boolean;
  isAllMessageDisabled?: boolean;
};

export type UpdateRoomOptions = {
  roomName?: string;
  password?: string;
};

export enum RoomCallStatus {
  None = 0,
  Calling = 1,
  Timeout = 2,
  Rejected = 3,
}

export enum RoomCallResult {
  Success = 0,
  AlreadyInCalling = 1,
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

export interface RoomCall {
  caller: RoomUser;
  callee: RoomUser;
  status?: RoomCallStatus;
}

export interface IRoomState {
  scheduledRoomList: Ref<RoomInfo[]>;
  scheduledRoomListCursor: Ref<string>;
  currentRoom: Ref<RoomInfo | null>;

  getScheduledRoomList(options: { cursor: string }): Promise<{ scheduledRoomList: RoomInfo[]; cursor: string }>;
  getScheduledAttendees(options: { roomId: string; cursor: string }): Promise<{ attendees: RoomUser[]; cursor: string; totalAttendeesCount: number }>;

  scheduleRoom(options: { roomId: string; options: ScheduleRoomOptions }): Promise<void>;
  updateScheduledRoom(options: { roomId: string; options: ScheduleRoomOptions }): Promise<void>;
  addScheduledAttendees(options: { roomId: string; userIdList: string[] }): Promise<void>;
  removeScheduledAttendees(options: { roomId: string; userIdList: string[] }): Promise<void>;
  cancelScheduledRoom(options: { roomId: string }): Promise<void>;

  createAndJoinRoom(options: { roomId: string; options: CreateRoomOptions }): Promise<void>;
  joinRoom(options: { roomId: string; password?: string }): Promise<void>;
  leaveRoom(): Promise<void>;
  endRoom(): Promise<void>;
  updateRoomInfo(options: { roomId: string; options: UpdateRoomOptions }): Promise<void>;
  getRoomInfo(options: { roomId: string }): Promise<RoomInfo>;

  getPendingCalls(options: { roomId: string; cursor: string }): Promise<{ calls: RoomCall[]; cursor: string }>;
  callUserToRoom(options: { roomId: string; userIdList: string[]; timeout?: number; extensionInfo?: string }): Promise<Map<string, RoomCallResult>>;
  cancelCall(options: { roomId: string; userIdList: string[] }): Promise<void>;
  acceptCall(options: { roomId: string }): Promise<void>;
  rejectCall(options: { roomId: string; extensionInfo?: string }): Promise<void>;

  subscribeEvent<T extends RoomEvent>(event: T | `${T}`, handler: RoomEventHandlers[T]): void;
  unsubscribeEvent<T extends RoomEvent>(event: T | `${T}`, handler: RoomEventHandlers[T]): void;
}

export enum RoomEvent {
  onAddedToScheduledRoom = 'onAddedToScheduledRoom',
  onRemovedFromScheduledRoom = 'onRemovedFromScheduledRoom',
  onScheduledRoomCancelled = 'onScheduledRoomCancelled',
  onScheduledRoomStartingSoon = 'onScheduledRoomStartingSoon',
  onRoomEnded = 'onRoomEnded',
  onCallReceived = 'onCallReceived',
  onCallCancelled = 'onCallCancelled',
  onCallTimeout = 'onCallTimeout',
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
  onCallHandledByOtherDevice = 'onCallHandledByOtherDevice',
  onCallRevokedByAdmin = 'onCallRevokedByAdmin',
}

export interface RoomEventHandlers {
  onAddedToScheduledRoom: (options: { roomInfo: RoomInfo }) => void;
  onRemovedFromScheduledRoom: (options: { roomInfo: RoomInfo; operator: RoomUser }) => void;
  onScheduledRoomCancelled: (options: { roomInfo: RoomInfo; operator: RoomUser }) => void;
  onScheduledRoomStartingSoon: (options: { roomInfo: RoomInfo }) => void;
  onRoomEnded: (options: { roomInfo: RoomInfo }) => void;

  onCallReceived: (options: { roomInfo: RoomInfo; call: RoomCall; extensionInfo: string }) => void;
  onCallCancelled: (options: { roomInfo: RoomInfo; call: RoomCall }) => void;
  onCallTimeout: (options: { roomInfo: RoomInfo; call: RoomCall }) => void;
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
  onCallRevokedByAdmin: (options: { roomInfo: RoomInfo; call: RoomCall; operator: RoomUser }) => void;
}
