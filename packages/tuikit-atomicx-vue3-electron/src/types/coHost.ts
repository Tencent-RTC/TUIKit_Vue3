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
   * @param {SeatUserInfo} options.inviter User info who initiated the request
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
  HostDynamicGrid = 600,
  HostDynamic1v6 = 601,
}

export interface ICoHostState {
  coHostStatus: ComputedRef<CoHostStatus>;
  connected: Ref<SeatUserInfo[]>;
  applicant: Ref<SeatUserInfo | null>;
  invitees: Ref<SeatUserInfo[]>;
  candidates: ComputedRef<SeatUserInfo[]>;
  requestHostConnection: (params: { liveId: string; layoutTemplate: CoHostLayoutTemplate; timeout: number; extensionInfo: string }) => Promise<Map<string, any>>;
  cancelHostConnection: (params: { liveId: string }) => Promise<void>;
  acceptHostConnection: (params: { liveId: string }) => Promise<void>;
  rejectHostConnection: (params: { liveId: string }) => Promise<void>;
  exitHostConnection: () => Promise<void>;
  subscribeEvent: (event: CoHostEvent, callback: (eventInfo: any) => void) => void;
  unsubscribeEvent: (event: CoHostEvent, callback: (eventInfo: any) => void) => void;
}
