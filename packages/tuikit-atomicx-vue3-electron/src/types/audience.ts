import type { ComputedRef } from 'vue';
import type { TUIRole } from '@tencentcloud/tuiroom-engine-electron';

export interface AudienceInfo {
  userId: string;
  userName: string;
  avatarUrl: string;
  customInfo: Record<string, any>;
  userRole: TUIRole;
  isMessageDisabled: boolean;
  joinedTimestamp?: number;
}

export interface LiveUserInfo {
  userId: string;
  userName: string;
  avatarUrl: string;
}

export enum LiveAudienceEvent {
  onAudienceJoined = 'onAudienceJoined',
  onAudienceLeft = 'onAudienceLeft',
}

type AudienceJoinedEventInfo = {
  audience: LiveUserInfo;
};

type AudienceLeftEventInfo = {
  audience: LiveUserInfo;
};

export interface LiveAudienceEventInfo {
  [LiveAudienceEvent.onAudienceJoined]: AudienceJoinedEventInfo;
  [LiveAudienceEvent.onAudienceLeft]: AudienceLeftEventInfo;
}

export type LiveAudienceEventCallback = <T extends LiveAudienceEvent = LiveAudienceEvent>(eventInfo: LiveAudienceEventInfo[T]) => void;

export interface ILiveAudienceState {
  audienceList: ComputedRef<AudienceInfo[]>;
  audienceCount: ComputedRef<number>;
  fetchAudienceList: () => Promise<AudienceInfo[]>;
  setAdministrator: (params: { userId: string }) => Promise<any>;
  revokeAdministrator: (params: { userId: string }) => Promise<any>;
  kickUserOutOfRoom: (params: { userId: string }) => Promise<any>;
  disableSendMessage: (params: { userId: string; isDisable: boolean }) => Promise<any>;
  subscribeEvent: (event: LiveAudienceEvent, callback: (eventInfo: any) => void) => void;
  unsubscribeEvent: (event: LiveAudienceEvent, callback: (eventInfo: any) => void) => void;
}
