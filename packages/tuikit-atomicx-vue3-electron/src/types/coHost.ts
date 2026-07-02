import type { Ref, ComputedRef } from 'vue';
import type { SeatUserInfo } from './seat';

export enum CoHostStatus {
  Connected = 'Connected', // In connection
  Disconnected = 'Disconnected', // Not in connection
}

export enum CoHostEvent {
  /**
   * @param {object} options
   * @param {SeatUserInfo} options.inviter User info who initiated the request
   * @param {string} options.extensionInfo Extension info
   */
  onCoHostRequestReceived = 'onCoHostRequestReceived',
  /**
   * @param {object} options
   * @param {SeatUserInfo} options.inviter User info who cancelled the request (the original inviter)
   * @param {SeatUserInfo} options.invitee Local user info (the invitee whose pending request was cancelled)
   */
  onCoHostRequestCancelled = 'onCoHostRequestCancelled',
  /**
   * @param {object} options
   * @param {SeatUserInfo} options.invitee User info who accepted the request
   */
  onCoHostRequestAccepted = 'onCoHostRequestAccepted',
  /**
   * @param {object} options
   * @param {SeatUserInfo} options.invitee User info who rejected the request
   */
  onCoHostRequestRejected = 'onCoHostRequestRejected',
  /**
   * @param {object} options
   * @param {SeatUserInfo} options.inviter User info who initiated the request
   * @param {SeatUserInfo} options.invitee User info who was invited
   */
  onCoHostRequestTimeout = 'onCoHostRequestTimeout',
  /**
   * @param {object} options
   * @param {SeatUserInfo} options.userInfo User information
  */
  onCoHostUserJoined = 'onCoHostUserJoined',
  /**
   * @param {object} options
   * @param {SeatUserInfo} options.userInfo User information
  */
  onCoHostUserLeft = 'onCoHostUserLeft',
}

export enum CoHostLayoutTemplate {
  /** Dynamic grid layout. */
  HostDynamicGrid = 600,
  /** Dynamic 1v6 layout. */
  HostDynamic1v6 = 601,
  /** Fixed 2-seat landscape layout. */
  HostVideoLandscapeFixed2Seats = 400,
}

export interface ICoHostState {
  coHostStatus: ComputedRef<CoHostStatus>;
  connected: Ref<SeatUserInfo[]>;
  applicant: Ref<SeatUserInfo | null>;
  invitees: Ref<SeatUserInfo[]>;
  candidates: Ref<SeatUserInfo[]>;
  candidatesCursor: Ref<string>;
  /**
   * Live IDs of remote co-hosts whose audio is currently muted by the local
   * user. Owned by the store (not the panel component) so the mute toggle
   * survives the CoHostPanel dialog's `v-if` unmount/remount cycle. Mirrors
   * the Web kit's `mutedHosts`.
   */
  mutedHosts: Ref<string[]>;

  requestHostConnection: (params: { liveId: string; layoutTemplate: CoHostLayoutTemplate; timeout: number; extensionInfo: string }) => Promise<Map<string, any>>;
  cancelHostConnection: (params: { liveId: string }) => Promise<void>;
  acceptHostConnection: (params: { liveId: string }) => Promise<void>;
  rejectHostConnection: (params: { liveId: string }) => Promise<void>;
  exitHostConnection: () => Promise<void>;
  getCoHostCandidates: (cursor: string) => Promise<void>;
  muteRemoteHostAudio: (liveId: string, isMuted: boolean) => Promise<void>;
  
  subscribeEvent: (event: CoHostEvent, callback: (eventInfo: any) => void) => void;
  unsubscribeEvent: (event: CoHostEvent, callback: (eventInfo: any) => void) => void;
}

