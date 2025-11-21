import type { LiveUserInfo } from './audience';

export enum HostEvent {
  onGuestApplicationReceived = 'onGuestApplicationReceived',
  onGuestApplicationCancelled = 'onGuestApplicationCancelled',
  onGuestApplicationProcessedByOtherHost = 'onGuestApplicationProcessedByOtherHost',
  onHostInvitationResponded = 'onHostInvitationResponded',
  onHostInvitationNoResponse = 'onHostInvitationNoResponse',
}

export enum GuestEvent {
  onHostInvitationReceived = 'onHostInvitationReceived',
  onHostInvitationCancelled = 'onHostInvitationCancelled',
  onGuestApplicationResponded = 'onGuestApplicationResponded',
  onGuestApplicationNoResponse = 'onGuestApplicationNoResponse',
  onKickedOffSeat = 'onKickedOffSeat',
}

export type CoGuestRequestInfo = {
  timestamp: number;
  requestId: string;
  userId: string;
  userName: string;
  nameCard: string;
  avatarUrl: string;
};

export enum NoResponseReason {
  timeout = 0,
  alreadySeated = 1,
}

interface GuestApplicationReceivedEventInfo {
  guestUser: LiveUserInfo;
}

interface GuestApplicationCancelledEventInfo {
  guestUser: LiveUserInfo;
}

interface GuestApplicationProcessedByOtherHostEventInfo {
  guestUser: LiveUserInfo;
  hostUser: LiveUserInfo;
}

interface HostInvitationRespondedEventInfo {
  isAccept: boolean;
  guestUser: LiveUserInfo;
}

interface HostInvitationNoResponseEventInfo {
  guestUser: LiveUserInfo;
  reason: NoResponseReason;
}

interface HostInvitationReceivedEventInfo {
  hostUser: LiveUserInfo;
}
interface HostInvitationCancelledEventInfo {
  hostUser: LiveUserInfo;
}
interface GuestApplicationRespondedEventInfo {
  isAccept: boolean;
  hostUser: LiveUserInfo;
}
interface GuestApplicationNoResponseEventInfo {
  reason: NoResponseReason;
}

interface KickedOffSeatEventInfo {
  seatIndex: number;
  hostUser: LiveUserInfo;
}

type HostEventInfoMap = {
  [HostEvent.onGuestApplicationReceived]: GuestApplicationReceivedEventInfo;
  [HostEvent.onGuestApplicationCancelled]: GuestApplicationCancelledEventInfo;
  [HostEvent.onGuestApplicationProcessedByOtherHost]: GuestApplicationProcessedByOtherHostEventInfo;
  [HostEvent.onHostInvitationResponded]: HostInvitationRespondedEventInfo;
  [HostEvent.onHostInvitationNoResponse]: HostInvitationNoResponseEventInfo;
};

type GuestEventInfoMap = {
  [GuestEvent.onHostInvitationReceived]: HostInvitationReceivedEventInfo;
  [GuestEvent.onHostInvitationCancelled]: HostInvitationCancelledEventInfo;
  [GuestEvent.onGuestApplicationResponded]: GuestApplicationRespondedEventInfo;
  [GuestEvent.onGuestApplicationNoResponse]: GuestApplicationNoResponseEventInfo;
  [GuestEvent.onKickedOffSeat]: KickedOffSeatEventInfo;
};

export type CoGuestEventInfoMap = HostEventInfoMap & GuestEventInfoMap;

type CoGuestEventCallbackBase<T extends HostEvent | GuestEvent> = (
  eventInfo: CoGuestEventInfoMap[T]
) => void;

export type CoGuestEventCallback = CoGuestEventCallbackBase<HostEvent | GuestEvent>;
