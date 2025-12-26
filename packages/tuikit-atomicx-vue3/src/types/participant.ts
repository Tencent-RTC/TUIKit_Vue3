import type { Ref } from 'vue';
import type { DeviceType, DeviceStatus, NetworkInfo } from './device';
import type { RoomUser } from './room';

export enum RoomParticipantRole {
  Owner = 0,
  Admin = 1,
  GeneralUser = 2,
}

export enum RoomParticipantStatus {
  None = 'None', // 未定义
  Scheduled = 'Scheduled',
  InCalling = 'InCalling',
  CallTimeout = 'CallTimeout',
  CallRejected = 'CallRejected',
  InRoom = 'InRoom',
}

export interface RoomParticipant extends RoomUser {
  nameCard: string;
  role: RoomParticipantRole;
  roomStatus: RoomParticipantStatus;
  microphoneStatus: DeviceStatus;
  cameraStatus: DeviceStatus;
  screenShareStatus: DeviceStatus;
  isMessageDisabled: boolean;
  metaData: Record<string, string>;
}

export enum KickedOutOfRoomReason {
  KickedByAdmin = 'KickedByAdmin',
  ReplacedByAnotherDevice = 'ReplacedByAnotherDevice',
  KickedByServer = 'KickedByServer',
  ConnectionTimeout = 'ConnectionTimeout',
  InvalidStatusOnReconnect = 'InvalidStatusOnReconnect',
  RoomLimitExceeded = 'RoomLimitExceeded',
}

export interface DeviceRequestInfo {
  timestamp: number;
  senderUserId: string;
  senderUserName: string;
  senderNameCard: string;
  senderAvatarUrl: string;
  content: string;
  deviceType: DeviceType;
}

export enum VideoStreamType {
  Screen = 'screen',
  Camera = 'camera',
}

export enum FillMode {
  Fill = 'fill', // 图像铺满屏幕
  Fit = 'fit', // 图像长边填满屏幕，短边区域会被填充黑色
}

export enum RoomLayoutTemplate {
  GridLayout = 'gridLayout',
  CinemaLayout = 'cinemaLayout', // 顶部栏
  SidebarLayout = 'sidebarLayout', // 侧边栏
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

export enum RoomParticipantEvent {
  onParticipantJoined = 'onParticipantJoined',
  onParticipantLeft = 'onParticipantLeft',
  onOwnerChanged = 'onOwnerChanged',
  onAdminSet = 'onAdminSet',
  onAdminRevoked = 'onAdminRevoked',
  onKickedFromRoom = 'onKickedFromRoom',
  onParticipantDeviceClosed = 'onParticipantDeviceClosed',
  onParticipantMessageMuted = 'onParticipantMessageMuted',
  onAllDevicesDisabled = 'onAllDevicesDisabled',
  onAllMessagesDisabled = 'onAllMessagesDisabled',
  onDeviceRequestReceived = 'onDeviceRequestReceived',
  onDeviceRequestCancelled = 'onDeviceRequestCancelled',
  onDeviceRequestTimeout = 'onDeviceRequestTimeout',
  onDeviceRequestApproved = 'onDeviceRequestApproved',
  onDeviceRequestRejected = 'onDeviceRequestRejected',
  onDeviceRequestProcessed = 'onDeviceRequestProcessed',
  onDeviceInvitationReceived = 'onDeviceInvitationReceived',
  onDeviceInvitationCancelled = 'onDeviceInvitationCancelled',
  onDeviceInvitationTimeout = 'onDeviceInvitationTimeout',
  onDeviceInvitationAccepted = 'onDeviceInvitationAccepted',
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
