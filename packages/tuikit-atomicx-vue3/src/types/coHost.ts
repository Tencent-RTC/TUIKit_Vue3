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
