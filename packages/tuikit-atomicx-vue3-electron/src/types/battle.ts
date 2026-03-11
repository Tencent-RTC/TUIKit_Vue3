import type { SeatUserInfo } from './seat';

export interface BattleConfig {
  duration: number;
  needResponse: boolean;
  extensionInfo: string;
}

export interface BattleInfo {
  battleId: string;
  config: BattleConfig;
  startTime: number;
  endTime: number;
}

export enum BattleEndedReason {
  timeOver = 0,
  allMemberExit = 1,
}

export enum BattleEvent {
  onBattleStarted,
  onBattleEnded,
  onUserJoinBattle,
  onUserExitBattle,
  onBattleRequestReceived,
  onBattleRequestCancelled,
  onBattleRequestTimeout,
  onBattleRequestAccept,
  onBattleRequestReject,
}
interface BattleStartedEventInfo {
  battleInfo: BattleInfo;
  inviter: SeatUserInfo;
  invitees: SeatUserInfo[];
}

interface BattleEndedEventInfo {
  battleInfo: BattleInfo;
  reason: BattleEndedReason;
}

interface UserJoinBattleEventInfo {
  battleId: string;
  battleUser: SeatUserInfo;
}

interface UserExitBattleEventInfo {
  battleId: string;
  battleUser: SeatUserInfo;
}

interface BattleRequestReceivedEventInfo {
  battleId: string;
  inviter: SeatUserInfo;
  invitee: SeatUserInfo;
}

interface BattleRequestCancelledEventInfo {
  battleId: string;
  inviter: SeatUserInfo;
  invitee: SeatUserInfo;
}

interface BattleRequestTimeoutEventInfo {
  battleId: string;
  inviter: SeatUserInfo;
  invitee: SeatUserInfo;
}

interface BattleRequestAcceptEventInfo {
  battleId: string;
  inviter: SeatUserInfo;
  invitee: SeatUserInfo;
}

interface BattleRequestRejectEventInfo {
  battleId: string;
  inviter: SeatUserInfo;
  invitee: SeatUserInfo;
}

export type BattleEventInfoMap = {
  [BattleEvent.onBattleStarted]: BattleStartedEventInfo;
  [BattleEvent.onBattleEnded]: BattleEndedEventInfo;
  [BattleEvent.onUserJoinBattle]: UserJoinBattleEventInfo;
  [BattleEvent.onUserExitBattle]: UserExitBattleEventInfo;
  [BattleEvent.onBattleRequestReceived]: BattleRequestReceivedEventInfo;
  [BattleEvent.onBattleRequestCancelled]: BattleRequestCancelledEventInfo;
  [BattleEvent.onBattleRequestTimeout]: BattleRequestTimeoutEventInfo;
  [BattleEvent.onBattleRequestAccept]: BattleRequestAcceptEventInfo;
  [BattleEvent.onBattleRequestReject]: BattleRequestRejectEventInfo;
};

export type BattleEventCallback = <T extends BattleEvent = BattleEvent>(eventInfo: BattleEventInfoMap[T]) => void;
