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
  onGuestApplicationError = 'onGuestApplicationError',
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

/**
 * Error codes for seat application failures
 */
export enum SeatApplicationErrorCode {
  // Maximum seat count exceeds package limit
  MAX_SEAT_COUNT_LIMIT = -2340,

  // Seat index does not exist
  SEAT_INDEX_NOT_EXIST = -2344,

  // Seat is locked
  SEAT_LOCKED = 100200,

  // Seat is already occupied
  SEAT_OCCUPIED = 100210,

  // User is already in a seat
  ALREADY_IN_SEAT = 100203,

  // All seats are occupied
  ALL_SEAT_OCCUPIED = 100205,

  // User is not in a seat
  USER_NOT_IN_SEAT = 100206,

  // Seat does not support link mic
  SEAT_NOT_SUPPORT_LINK_MIC = 100211,
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

interface GuestApplicationErrorEventInfo {
  code: SeatApplicationErrorCode;
  message: string;
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
  [GuestEvent.onGuestApplicationError]: GuestApplicationErrorEventInfo;
  [GuestEvent.onKickedOffSeat]: KickedOffSeatEventInfo;
};

export type CoGuestEventInfoMap = HostEventInfoMap & GuestEventInfoMap;

type CoGuestEventCallbackBase<T extends HostEvent | GuestEvent> = (
  eventInfo: CoGuestEventInfoMap[T]
) => void;

export type CoGuestEventCallback = CoGuestEventCallbackBase<HostEvent | GuestEvent>;
