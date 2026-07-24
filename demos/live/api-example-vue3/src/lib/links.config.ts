/**
 * Link registry DATA for inline `[[label|linkKey]]` tokens.
 *
 * This file is intentionally pure data — no logic — so it is trivial to
 * scan and edit. To add or repoint a link, edit ONLY here.
 *
 * `linkKey` is a stable, language-neutral key; the visible `label` lives
 * in the translatable string (description / notes / field.help), never
 * here. See `links.ts` for the resolver (`resolveLink`) and the full
 * `[[label|linkKey]]` contract.
 *
 * In addition to the hand-curated `LINKS` registry above, this file also
 * holds `SDK_DOC_ANCHORS`: a map of every SDK identifier that appears in
 * card prose (interface types, reactive state fields, enum/const types) to
 * its anchor on the atomicx-core SDK documentation page. `RichText` uses it
 * to auto-link those names wherever they show up — in BOTH i18n languages,
 * with no per-string token needed. Only identifiers that exist on the doc
 * page are listed, so a link never 404s.
 */
interface LinkTarget {
  /** Internal route jump to another example card. */
  to?: { state: string; apiId: string };
  /** External http(s) URL. */
  href?: string;
}

// ---- hand-curated links (internal card jumps + external docs) ----
const LINKS: Record<string, LinkTarget> = {
  // ---- internal card jumps ----
  login: { to: { state: 'login', apiId: 'login' } },
  startLive: { to: { state: 'live-list', apiId: 'startLive' } },
  endLive: { to: { state: 'live-list', apiId: 'endLive' } },
  genTestUserSig: { to: { state: 'login', apiId: 'genTestUserSig' } },

  // ---- external documentation ----
  officialDocsLogin: { href: 'https://cloud.tencent.com/document/product/647/105439' },
};

/**
 * Single-page SDK documentation. Every API / type / state field is reached
 * via a `#<anchor>` hash appended to this base URL.
 */
const SDK_DOC_BASE = 'https://web.sdk.qcloud.com/trtc/live/web/doc/zh/index.html';

/**
 * Maps an SDK identifier to its documentation anchor (without the leading
 * '#'). Anchors follow the doc's own scheme:
 *   - interface types   -> `interface-<Name>`
 *   - reactive fields   -> `<fieldName>`
 *   - enum / const types-> `type-<Name>`
 *
 * Only names that exist on the doc page are listed. Sorted longest-first is
 * NOT required here (the regex builder sorts), but keeping related names
 * grouped aids scanning.
 */
const SDK_DOC_ANCHORS: Record<string, string> = {
  // ---- Interface types (#interface-<Name>) ----
  LoginUserInfo: 'interface-LoginUserInfo',
  SetSelfInfoParams: 'interface-SetSelfInfoParams',
  LoginParams: 'interface-LoginParams',
  TUIRoomInfo: 'interface-TUIRoomInfo',
  TUIEnterRoomOptions: 'interface-TUIEnterRoomOptions',
  TUISeatLockParams: 'interface-TUISeatLockParams',
  TUIMessage: 'interface-TUIMessage',
  TUINetwork: 'interface-TUINetwork',
  TUIVideoEncoderParams: 'interface-TUIVideoEncoderParams',
  TUIUserInfo: 'interface-TUIUserInfo',
  TUISeatInfo: 'interface-TUISeatInfo',
  SeatInfo: 'interface-SeatInfo',
  SeatUserInfo: 'interface-SeatUserInfo',
  TUIRequest: 'interface-TUIRequest',
  TUIRequestCallback: 'interface-TUIRequestCallback',
  TUIDeviceInfo: 'interface-TUIDeviceInfo',
  NetworkInfo: 'interface-NetworkInfo',
  TUIConferenceInfo: 'interface-TUIConferenceInfo',
  TUIConferenceModifyInfo: 'interface-TUIConferenceModifyInfo',
  TUIInvitation: 'interface-TUIInvitation',
  TUILiveInfo: 'interface-TUILiveInfo',
  TUILiveModifyInfo: 'interface-TUILiveModifyInfo',
  TUILiveModifyFlag: 'interface-TUILiveModifyFlag',
  AudienceInfo: 'interface-AudienceInfo',
  LiveUserInfo: 'interface-LiveUserInfo',
  SearchResult: 'interface-SearchResult',

  // ---- Enum / const types (#type-<Name>) ----
  ASRSettingsPayload: 'type-ASRSettingsPayload',
  TranscriberMessage: 'type-TranscriberMessage',
  RawTranscriberMessage: 'type-RawTranscriberMessage',
  RealtimeTranscriberEventInfoMap: 'type-RealtimeTranscriberEventInfoMap',
  AudienceItemSlotProps: 'type-AudienceItemSlotProps',
  LiveAudienceEventInfo: 'type-LiveAudienceEventInfo',
  BarrageType: 'type-BarrageType',
  Barrage: 'type-Barrage',
  MessageItemSlotProps: 'type-MessageItemSlotProps',
  BarrageSender: 'type-BarrageSender',
  BattleEndedReason: 'type-BattleEndedReason',
  BattleConfig: 'type-BattleConfig',
  BattleInfo: 'type-BattleInfo',
  BattleEventInfoMap: 'type-BattleEventInfoMap',
  TRTCBeautyStyle: 'type-TRTCBeautyStyle',
  FreeBeautyConfig: 'type-FreeBeautyConfig',
  NoResponseReason: 'type-NoResponseReason',
  SeatApplicationErrorCode: 'type-SeatApplicationErrorCode',
  CoGuestRequestInfo: 'type-CoGuestRequestInfo',
  CoHostStatus: 'type-CoHostStatus',
  CoHostLayoutTemplate: 'type-CoHostLayoutTemplate',
  SeatLayoutTemplate: 'type-SeatLayoutTemplate',
  LiveEndedReason: 'type-LiveEndedReason',
  LiveKickedOutReason: 'type-LiveKickedOutReason',
  LiveListEventInfo: 'type-LiveListEventInfo',
  LoginStatus: 'type-LoginStatus',
  LoginOptions: 'type-LoginOptions',
  RoomParticipantRole: 'type-RoomParticipantRole',
  RoomParticipantStatus: 'type-RoomParticipantStatus',
  KickedOutOfRoomReason: 'type-KickedOutOfRoomReason',
  VideoStreamType: 'type-VideoStreamType',
  FillMode: 'type-FillMode',
  RoomLayoutTemplate: 'type-RoomLayoutTemplate',
  RoomParticipant: 'type-RoomParticipant',
  DeviceRequestInfo: 'type-DeviceRequestInfo',
  PlayerControlButton: 'type-PlayerControlButton',
  Resolution: 'type-Resolution',
  FullscreenResult: 'type-FullscreenResult',
  ButtonState: 'type-ButtonState',
  CustomButton: 'type-CustomButton',
  PlayerControlEventMap: 'type-PlayerControlEventMap',
  RoomType: 'type-RoomType',
  RoomStatus: 'type-RoomStatus',
  RoomCallStatus: 'type-RoomCallStatus',
  RoomCallResult: 'type-RoomCallResult',
  CallRejectReason: 'type-CallRejectReason',
  RoomUser: 'type-RoomUser',
  RoomInfo: 'type-RoomInfo',
  RoomCall: 'type-RoomCall',
  ScheduleRoomOptions: 'type-ScheduleRoomOptions',
  CreateRoomOptions: 'type-CreateRoomOptions',
  UpdateRoomOptions: 'type-UpdateRoomOptions',
  SuspendStatus: 'type-SuspendStatus',
  Role: 'type-Role',
  MoveSeatPolicy: 'type-MoveSeatPolicy',
  DeviceControlPolicy: 'type-DeviceControlPolicy',
  AVStatistics: 'type-AVStatistics',
  LiveCanvas: 'type-LiveCanvas',
  RegionInfo: 'type-RegionInfo',
  VirtualBackgroundType: 'type-VirtualBackgroundType',
  VirtualBackgroundConfig: 'type-VirtualBackgroundConfig',
  CustomBackgroundImage: 'type-CustomBackgroundImage',

  // ---- Reactive state fields (#<fieldName>) ----
  // LoginState
  loginUserInfo: 'loginUserInfo',
  loginStatus: 'loginStatus',
  logout: 'logout',
  // LiveListState
  currentLive: 'currentLive',
  liveList: 'liveList',
  liveListCursor: 'liveListCursor',
  // LiveSeatState
  seatList: 'seatList',
  canvas: 'canvas',
  speakingUsers: 'speakingUsers',
  networkQualities: 'networkQualities',
  // LiveMonitorState
  monitorLiveInfoList: 'monitorLiveInfoList',
  // MessageInputState
  inputRawValue: 'inputRawValue',
  isPeerTyping: 'isPeerTyping',
  // MessageActionState
  forwardMessageIDList: 'forwardMessageIDList',
  isForwardMessageSelectionDone: 'isForwardMessageSelectionDone',
  forwardConversationIDList: 'forwardConversationIDList',
  quotedMessage: 'quotedMessage',
  // ConversationListState
  conversationList: 'conversationList',
  activeConversation: 'activeConversation',
  totalUnRead: 'totalUnRead',
  netStatus: 'netStatus',
  // ContactListState
  friendList: 'friendList',
  groupList: 'groupList',
  blackList: 'blackList',
  friendApplicationUnreadCount: 'friendApplicationUnreadCount',
  friendGroupList: 'friendGroupList',
  friendApplicationList: 'friendApplicationList',
  groupApplicationList: 'groupApplicationList',
  // GroupSettingState
  groupID: 'groupID',
  groupType: 'groupType',
  groupName: 'groupName',
  introduction: 'introduction',
  notification: 'notification',
  isMuted: 'isMuted',
  isPinned: 'isPinned',
  groupOwner: 'groupOwner',
  adminMembers: 'adminMembers',
  allMembers: 'allMembers',
  memberCount: 'memberCount',
  maxMemberCount: 'maxMemberCount',
  currentUserID: 'currentUserID',
  currentUserRole: 'currentUserRole',
  nameCard: 'nameCard',
  isMuteAllMembers: 'isMuteAllMembers',
  isInGroup: 'isInGroup',
  inviteOption: 'inviteOption',
  // VideoMixerState
  publishVideoQuality: 'publishVideoQuality',
  isVideoMixerEnabled: 'isVideoMixerEnabled',
  mediaSourceList: 'mediaSourceList',
  activeMediaSource: 'activeMediaSource',
  // ASRState
  recentTranscripts: 'recentTranscripts',
  transcriptHistory: 'transcriptHistory',
  // SearchState
  keyword: 'keyword',
  results: 'results',
  isLoading: 'isLoading',
  error: 'error',
  searchAdvancedParams: 'searchAdvancedParams',
  selectedSearchType: 'selectedSearchType',
  // SeatStore
  liveOwnerUserId: 'liveOwnerUserId',
  localUserId: 'localUserId',
  coHostUserList: 'coHostUserList',
  sentDeviceRequestMap: 'sentDeviceRequestMap',
  receivedDeviceRequestMap: 'receivedDeviceRequestMap',
  userInfoMap: 'userInfoMap',
  // AITranscriberState
  realtimeMessageList: 'realtimeMessageList',
  // BarrageState
  messageList: 'messageList',
  // BattleState
  currentBattleInfo: 'currentBattleInfo',
  battleUsers: 'battleUsers',
  battleScore: 'battleScore',
  // C2CSettingState
  userID: 'userID',
  nick: 'nick',
  signature: 'signature',
  remark: 'remark',
  isContact: 'isContact',
  // CoGuestState
  connected: 'connected',
  invitees: 'invitees',
  applicants: 'applicants',
  candidates: 'candidates',
  // CoHostState
  coHostStatus: 'coHostStatus',
  applicant: 'applicant',
  candidatesCursor: 'candidatesCursor',
  // DeviceState
  microphoneStatus: 'microphoneStatus',
  microphoneList: 'microphoneList',
  currentMicrophone: 'currentMicrophone',
  microphoneLastError: 'microphoneLastError',
  isMicrophoneTesting: 'isMicrophoneTesting',
  currentMicVolume: 'currentMicVolume',
  captureVolume: 'captureVolume',
  testingMicVolume: 'testingMicVolume',
  cameraStatus: 'cameraStatus',
  cameraList: 'cameraList',
  currentCamera: 'currentCamera',
  cameraLastError: 'cameraLastError',
  isCameraTesting: 'isCameraTesting',
  isCameraTestLoading: 'isCameraTestLoading',
  isFrontCamera: 'isFrontCamera',
  localMirrorType: 'localMirrorType',
  localVideoQuality: 'localVideoQuality',
  speakerList: 'speakerList',
  currentSpeaker: 'currentSpeaker',
  outputVolume: 'outputVolume',
  currentAudioRoute: 'currentAudioRoute',
  isSpeakerTesting: 'isSpeakerTesting',
  screenStatus: 'screenStatus',
  screenLastError: 'screenLastError',
  networkInfo: 'networkInfo',
  // FreeBeautyState
  beautyConfig: 'beautyConfig',
  // LiveAudienceState
  audienceList: 'audienceList',
  audienceCount: 'audienceCount',
  messageBannedUserList: 'messageBannedUserList',
  // LiveGiftState
  giftInfoList: 'giftInfoList',
  totalLikeCount: 'totalLikeCount',
  // LivePlayerState
  isPlaying: 'isPlaying',
  isFullscreen: 'isFullscreen',
  isPictureInPicture: 'isPictureInPicture',
  controlBarVisible: 'controlBarVisible',
  buttons: 'buttons',
  currentVolume: 'currentVolume',
  currentResolution: 'currentResolution',
  resolutionList: 'resolutionList',
  // MessageListState
  activeConversationID: 'activeConversationID',
  hasMoreOlderMessage: 'hasMoreOlderMessage',
  hasMoreNewerMessage: 'hasMoreNewerMessage',
  enableReadReceipt: 'enableReadReceipt',
  isDisableScroll: 'isDisableScroll',
  recalledMessageIDSet: 'recalledMessageIDSet',
  highlightMessageIDSet: 'highlightMessageIDSet',
  messageListType: 'messageListType',
  pendingScrollTargetMessageID: 'pendingScrollTargetMessageID',
  // RoomParticipantState
  participantList: 'participantList',
  participantListCursor: 'participantListCursor',
  adminList: 'adminList',
  audienceListCursor: 'audienceListCursor',
  messageDisabledUserList: 'messageDisabledUserList',
  participantListWithVideo: 'participantListWithVideo',
  participantWithScreen: 'participantWithScreen',
  localParticipant: 'localParticipant',
  pendingDeviceApplications: 'pendingDeviceApplications',
  pendingDeviceInvitations: 'pendingDeviceInvitations',
  pendingParticipantList: 'pendingParticipantList',
  // RoomState
  scheduledRoomList: 'scheduledRoomList',
  scheduledRoomListCursor: 'scheduledRoomListCursor',
  currentRoom: 'currentRoom',
};

/**
 * Maps an API card's `api` name to the card that demonstrates it
 * (`{ state, apiId }`). Used by `RichText` to auto-link a bare API name
 * that appears in the "使用须知" prose to its card — in BOTH i18n
 * languages, with no per-string token.
 *
 * Only `api` names that are UNIQUE across the whole demo are listed here.
 * A few names (`state`, `subscribeEvent`, `unsubscribeEvent`) are
 * injected into many groups (the auto-subscribe cards + the `state`
 * readout convention), so they cannot be resolved by name alone — those
 * are handled via `API_CARD_COLLISIONS` + the current card's `state`.
 */
const API_CARD_LINKS: Record<string, { state: string; apiId: string }> = {
  // login
  login: { state: 'login', apiId: 'login' },
  logout: { state: 'login', apiId: 'logout' },
  setSelfInfo: { state: 'login', apiId: 'setSelfInfo' },
  // live-list
  fetchLiveList: { state: 'live-list', apiId: 'fetchLiveList' },
  fetchLiveInfo: { state: 'live-list', apiId: 'fetchLiveInfo' },
  startLive: { state: 'live-list', apiId: 'startLive' },
  createLive: { state: 'live-list', apiId: 'createLive' },
  joinLive: { state: 'live-list', apiId: 'joinLive' },
  leaveLive: { state: 'live-list', apiId: 'leaveLive' },
  endLive: { state: 'live-list', apiId: 'endLive' },
  updateLiveInfo: { state: 'live-list', apiId: 'updateLiveInfo' },
  queryMetaData: { state: 'live-list', apiId: 'queryMetaData' },
  updateLiveMetaData: { state: 'live-list', apiId: 'updateLiveMetaData' },
  // live-audience
  fetchAudienceList: { state: 'live-audience', apiId: 'fetchAudienceList' },
  setAdministrator: { state: 'live-audience', apiId: 'setAdministrator' },
  revokeAdministrator: { state: 'live-audience', apiId: 'revokeAdministrator' },
  kickUserOutOfRoom: { state: 'live-audience', apiId: 'kickUserOutOfRoom' },
  disableSendMessage: { state: 'live-audience', apiId: 'disableSendMessage' },
  // co-guest
  applyForSeat: { state: 'co-guest', apiId: 'applyForSeat' },
  cancelApplication: { state: 'co-guest', apiId: 'cancelApplication' },
  acceptApplication: { state: 'co-guest', apiId: 'acceptApplication' },
  rejectApplication: { state: 'co-guest', apiId: 'rejectApplication' },
  inviteToSeat: { state: 'co-guest', apiId: 'inviteToSeat' },
  cancelInvitation: { state: 'co-guest', apiId: 'cancelInvitation' },
  acceptInvitation: { state: 'co-guest', apiId: 'acceptInvitation' },
  rejectInvitation: { state: 'co-guest', apiId: 'rejectInvitation' },
  disConnect: { state: 'co-guest', apiId: 'disConnect' },
  // co-host
  getCoHostCandidates: { state: 'co-host', apiId: 'getCoHostCandidates' },
  requestHostConnection: { state: 'co-host', apiId: 'requestHostConnection' },
  cancelHostConnection: { state: 'co-host', apiId: 'cancelHostConnection' },
  acceptHostConnection: { state: 'co-host', apiId: 'acceptHostConnection' },
  rejectHostConnection: { state: 'co-host', apiId: 'rejectHostConnection' },
  exitHostConnection: { state: 'co-host', apiId: 'exitHostConnection' },
  muteRemoteHostAudio: { state: 'co-host', apiId: 'muteRemoteHostAudio' },
  // battle
  requestBattle: { state: 'battle', apiId: 'requestBattle' },
  cancelBattleRequest: { state: 'battle', apiId: 'cancelBattleRequest' },
  acceptBattle: { state: 'battle', apiId: 'acceptBattle' },
  rejectBattle: { state: 'battle', apiId: 'rejectBattle' },
  exitBattle: { state: 'battle', apiId: 'exitBattle' },
  // live-gift
  refreshGiftList: { state: 'live-gift', apiId: 'refreshGiftList' },
  sendGift: { state: 'live-gift', apiId: 'sendGift' },
  sendLikes: { state: 'live-gift', apiId: 'sendLikes' },
  setLanguage: { state: 'live-gift', apiId: 'setLanguage' },
  getGiftList: { state: 'live-gift', apiId: 'getGiftList' },
  // live-barrage
  sendTextMessage: { state: 'live-barrage', apiId: 'sendTextMessage' },
  sendCustomMessage: { state: 'live-barrage', apiId: 'sendCustomMessage' },
  appendLocalTip: { state: 'live-barrage', apiId: 'appendLocalTip' },
  // live-seat
  takeSeat: { state: 'live-seat', apiId: 'takeSeat' },
  leaveSeat: { state: 'live-seat', apiId: 'leaveSeat' },
  lockSeat: { state: 'live-seat', apiId: 'lockSeat' },
  unlockSeat: { state: 'live-seat', apiId: 'unlockSeat' },
  kickUserOutOfSeat: { state: 'live-seat', apiId: 'kickUserOutOfSeat' },
  moveUserToSeat: { state: 'live-seat', apiId: 'moveUserToSeat' },
  openRemoteCamera: { state: 'live-seat', apiId: 'openRemoteCamera' },
  closeRemoteCamera: { state: 'live-seat', apiId: 'closeRemoteCamera' },
  openRemoteMicrophone: { state: 'live-seat', apiId: 'openRemoteMicrophone' },
  closeRemoteMicrophone: { state: 'live-seat', apiId: 'closeRemoteMicrophone' },
  muteMicrophone: { state: 'live-seat', apiId: 'muteMicrophone' },
  unmuteMicrophone: { state: 'live-seat', apiId: 'unmuteMicrophone' },
  startPlayStream: { state: 'live-seat', apiId: 'startPlayStream' },
  stopPlayStream: { state: 'live-seat', apiId: 'stopPlayStream' },
  // live-player
  pause: { state: 'live-player', apiId: 'pause' },
  resume: { state: 'live-player', apiId: 'resume' },
  refresh: { state: 'live-player', apiId: 'refresh' },
  setVolume: { state: 'live-player', apiId: 'setVolume' },
  mute: { state: 'live-player', apiId: 'mute' },
  unmute: { state: 'live-player', apiId: 'unmute' },
  requestFullscreen: { state: 'live-player', apiId: 'requestFullscreen' },
  exitFullscreen: { state: 'live-player', apiId: 'exitFullscreen' },
  requestPictureInPicture: { state: 'live-player', apiId: 'requestPictureInPicture' },
  exitPictureInPicture: { state: 'live-player', apiId: 'exitPictureInPicture' },
  // device
  startCameraTest: { state: 'device', apiId: 'startCameraTest' },
  stopCameraTest: { state: 'device', apiId: 'stopCameraTest' },
  openLocalCamera: { state: 'device', apiId: 'openLocalCamera' },
  closeLocalCamera: { state: 'device', apiId: 'closeLocalCamera' },
  openLocalMicrophone: { state: 'device', apiId: 'openLocalMicrophone' },
  closeLocalMicrophone: { state: 'device', apiId: 'closeLocalMicrophone' },
  getCameraList: { state: 'device', apiId: 'getCameraList' },
  setCurrentCamera: { state: 'device', apiId: 'setCurrentCamera' },
  getMicrophoneList: { state: 'device', apiId: 'getMicrophoneList' },
  setCurrentMicrophone: { state: 'device', apiId: 'setCurrentMicrophone' },
  setCaptureVolume: { state: 'device', apiId: 'setCaptureVolume' },
  setOutputVolume: { state: 'device', apiId: 'setOutputVolume' },
};

/**
 * `api` names injected into several groups (the auto-subscribe cards and
 * the `state` readout), so they cannot be resolved by name alone. When one
 * appears in prose, `RichText` links it to the SAME group as the card
 * currently rendered — the most likely intent (e.g. a `live-list` note
 * mentioning `unsubscribeEvent` means the live-list one).
 */
const API_CARD_COLLISIONS = new Set<string>(['state', 'subscribeEvent', 'unsubscribeEvent']);

/**
 * Resolve a bare API name (as written in prose) to a card jump, or null
 * when it is not a known API. `currentState` disambiguates the colliding
 * names above.
 */
function resolveApiCard(name: string, currentState: string): { state: string; apiId: string } | null {
  const direct = API_CARD_LINKS[name];
  if (direct) {
    return direct;
  }
  if (API_CARD_COLLISIONS.has(name) && currentState) {
    return { state: currentState, apiId: name };
  }
  return null;
}

/** Build the full SDK doc URL for a known identifier, or null. */
function sdkDocHref(name: string): string | null {
  const anchor = SDK_DOC_ANCHORS[name];
  return anchor ? `${SDK_DOC_BASE}#${anchor}` : null;
}

// Public API — exports are collected at the end of the file (project rule).
export {
  LINKS,
  SDK_DOC_ANCHORS,
  sdkDocHref,
  API_CARD_LINKS,
  API_CARD_COLLISIONS,
  resolveApiCard,
};
export type { LinkTarget };
