import type { TUIRole } from '@tencentcloud/tuiroom-engine-js';

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
