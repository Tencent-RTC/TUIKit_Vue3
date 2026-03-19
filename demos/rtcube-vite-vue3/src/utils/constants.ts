import { getUrlParams } from './index';

export const COMMON_CMD = {
  TRTC_LOGIN_OUT: 'trtc-login-out'
};
export const CALLKIT_CMD = {
  EXPERIENCE_DEVICE: 'experience-device',
  EXPERIENCE_SEARCH: 'experience-search',
  EXPERIENCE_VIDEO_CALL: 'experience-video-call',
  EXPERIENCE_SWITCH_AUDIO_CALL: 'experience-switch-audio-call',
  EXPERIENCE_INVITE: 'experience-invite',
  EXPERIENCE_CALL_END: 'experience-call-end',
  REQUEST_LOGIN: 'request-login',
  TRTC_LOGIN_STATUS: 'trtc-login-status',
  DOM_READY: 'dom-ready',
  SWITCH_LANGUAGE: 'switch-language',
  CLOSE_QRCODE_POPUP: 'close-qrcode-popup',
  SEND_QRCODE_ADDRESS: 'send-qrcode-address',
  EXPERIENCE_CALLING_DIALOG: 'experience-calling-dialog',
  SHOW_GUIDE_CARD: 'show-guide-card'
};
export const ROOMKIT_CMD = {
  EXPERIENCE_DEVICE: 'experience-device',
  EXPERIENCE_CREATE_ROOM: 'experience-create-room',
  EXPERIENCE_ROOM_AI: 'experience-room-ai',
  EXPERIENCE_SCREEN_SHARE: 'experience-screen-share',
  EXPERIENCE_INVITE: 'experience-invite',
  EXPERIENCE_CHAT: 'experience-chat',
  REQUEST_LOGIN: 'request-login',
  TRTC_LOGIN_STATUS: 'trtc-login-status',
  DOM_READY: 'dom-ready',
  SWITCH_LANGUAGE: 'switch-language'
};
export const BEAUTY_CMD = {
  OPEN_BEAUTY: 'open-beauty',
  EXPERIENCE_MAKEUP: 'experience-makeup',
  SWITCH_FILTER: 'switch-filter',
  OPEN_STICKERS: 'open-stickers',
  OPEN_AVATAR: 'open-avatar',
  SET_BACKGROUND: 'set-background',
  REQUEST_LOGIN: 'request-login',
  TRTC_LOGIN_STATUS: 'trtc-login-status',
  DOM_READY: 'dom-ready',
  SWITCH_LANGUAGE: 'switch-language'
};
export const CHAT_CMD = {
  EXPERIENCE_SEND_MESSAGE: 'experience-send-message',
  EXPERIENCE_REVOKE_MESSAGE: 'experience-revoke-message',
  EXPERIENCE_CHANGE_NICK: 'experience-change-nick',
  EXPERIENCE_NEW_CONVERSATION: 'experience-new-conversation',
  EXPERIENCE_GROUP_MUTE: 'experience-group-mute',
  EXPERIENCE_DELETE_CONVERSATION: 'experience-delete-conversation',
  EXPERIENCE_CALL: 'experience-call',
  EXPERIENCE_BIND_MOBILE: 'experience-bind-mobile',
  REQUEST_LOGIN: 'request-login',
  TRTC_LOGIN_STATUS: 'trtc-login-status',
  DOM_READY: 'dom-ready',
  SWITCH_LANGUAGE: 'switch-language'
};
// IM TUIKit 海外版本
export const MESSENGER_CMD = {
  // 通用
  EXPERIENCE_SEND_MESSAGE: 'experience-send-message',
  EXPERIENCE_RECALL_MESSAGE: 'experience-recall-message',
  // 社交场景
  EXPERIENCE_START_CHAT: 'experience-start-chat',
  EXPERIENCE_DELETE_CHAT: 'experience-delete-chat',
  EXPERIENCE_CREATE_GROUP: 'experience-create-group',
  // 家庭服务/外卖/打车场景
  EXPERIENCE_QUOTE_REPLY: 'experience-quote-reply',
  EXPERIENCE_INPLATFORM_CALL: 'experience-inplatform-call',
  EXPERIENCE_MESSAGE_SEARCH: 'experience-message-search',
  // 其他
  REQUEST_LOGIN: 'request-login',
  TRTC_LOGIN_STATUS: 'trtc-login-status',
  DOM_READY: 'dom-ready',
  SWITCH_LANGUAGE: 'switch-language'
};

export const PLAYER_FUN_MSG = {
  PLAYER_PLAY_URL: 'player-play-url',
  PLAYER_PLAY_FILEID: 'player-play-fileID',
  PLAYER_QUALITY_API: 'player-quality-api',
  PLAYER_DASH: 'player-dash',
  PLAYER_THUMBNAIL: 'player-thumbnail',
  PLAYER_THUMBNAIL_SRC: 'player-thumbnail-src',
  PLAYER_SUBTITILES: 'player-subtitles',
  PLAYER_BARRAGE: 'player-barrage',
  PLAYER_EVENT: 'player-event',
  PLAYER_DYNAMIC_WATERMARK: 'player-dynamic-watermark',
  PLAYER_GHOST_WATERMARK: 'player-ghost-watermark',
  PLAYER_KEY: 'player-key',
  PLAYER_POSTER: 'player-poster',
  PLAYER_PROGRESS_MARKER: 'plaer-progress-marker',
  PLAYER_MIRROR: 'player-mirror',
  PLAYER_CUSTOM_ERROR: 'player-custom-error',
  PLAYER_SIZE_ADAPTIVE: 'player-size-adaptive',
  PLAYER_CUSTOM_UI: 'player-custom-ui',
  PLAYER_MULTI: 'player-multi',
  PLAYER_LANGUAGE: 'player-language',
  PLAYER_STATISTIC: 'player-statistic',

  PLAYER_PREVIEW_PLAY_URL: 'player-preview-play-url',
  PLAYER_PREVIEW_PLAY_FILEID: 'player-preview-play-fileid'
};
export const PLAYER_CMD = {
  ...PLAYER_FUN_MSG,
  PLAYER_QRCODE: 'player-qrcode',
  PLAYER_URL: 'player-url',
  REQUEST_LOGIN: 'request-login',
  TRTC_LOGIN_STATUS: 'trtc-login-status',
  DOM_READY: 'dom-ready',
  SWITCH_LANGUAGE: 'switch-language'
};

export const TCCC_CMD = {
  REQUEST_LOGIN: 'request-login',
  TRTC_LOGIN_STATUS: 'trtc-login-status',
  DOM_READY: 'dom-ready',
  SWITCH_LANGUAGE: 'switch-language',
  NOTIFY_SIDEBAR: 'notify-sidebar',
  NOTIFY_MAIN_CONTENT: 'notify-main-content'
};
export const PUSHER_CMD = {
  REQUEST_LOGIN: 'request-login',
  TRTC_LOGIN_STATUS: 'trtc-login-status',
  DOM_READY: 'dom-ready',
  STREAMING_FROM_COMPUTER: 'streaming-from-computer',
  SWITCHING_LIVE_BITRATE: 'switching-live-bitrate',
  SWITCH_LANGUAGE: 'switch-language',
  EXPERIENCING_BEAUTY_FILTERS: 'experiencing-beauty-filters',
  EXPERIENCING_LIVE_WATERMARKS: 'Experienceing-live-watermarks',
  EXPERIENCE_DEVICE: 'experience-device',
  EXPERIENCE_DEVICE_COMPLETE: 'experience-device-complete'
};
export const QCLOUDCLASS_CMD = {
  REQUEST_LOGIN: 'request-login',
  SWITCH_LANGUAGE: 'switch-language',
  TRTC_LOGIN_STATUS: 'trtc-login-status',
  DOM_READY: 'dom-ready',
  CREATING_CLASS: 'creating-class',
  BEGIN_CLASS: 'begin-class',
  WHITEBOARD_DOODLING: 'whiteboard-doodling',
  INITIATE_CHAT: 'initiate-chat',
  EXPERIENCE_VIEW: 'experience-view',
  SCREEN_SHARE: 'screen-share',
  UPLOAD_COURSE_MATERIALS: 'upload-course-materials'
};

export const TCCC_SIDEBAR_CMD = {
  NOTIFY_MAIN_CONTENT: 'notify-main-content',
  NOTIFY_SIDEBAR: 'notify-sidebar'
};

export const TRTC_CMD = {
  EXPERIENCE_DEVICE: 'experience-device',
  EXPERIENCE_MINIPROGRAM_ACCELERATE: 'experience-miniprogram-accelerate',
  EXPERIENCE_AREA_ENCODE: 'experience-area-encode',
  EXPERIENCE_3D_AUDIO: 'experience-3d-audio',
  EXPERIENCE_AI_VOICE: 'experience-ai-voice',
  EXPERIENCE_VOICE_CHANGE: 'experience-voice-change',
  EXPERIENCE_MONITOR: 'experience-monitor',
  EXPERIENCE_NETWORK: 'experience-network'
};

export const TRTC_SCENE_CMD = {
  EXPERIENCE_COMMERCE: 'experience-commerce',
  EXPERIENCE_EDUCATION: 'experience-education',
  EXPERIENCE_SOCIAL: 'experience-social',
  EXPERIENCE_FINANCE: 'experience-finance'
};

export const WAWA_CMD = {
  EXPERIENCE_WAWA: 'experience-wawa',
  VIEW_SOLUTION: 'view-solution'
};

export const AI_CMD = {
  CHOOSE_SCENARIO: 'choose-scenario',
  CHOOSE_CHARACTER: 'choose-character',
  START_CONVERSATION: 'start-conversation',
  EXPERIENCE_CHAT: 'experience-chat',
  END_CONVERSATION: 'end-conversation'
};

export const LIVEABILITY_CMD = {
  REQUEST_LOGIN: 'request-login',
  SWITCH_LANGUAGE: 'switch-language',
  TRTC_LOGIN_STATUS: 'trtc-login-status',
  DOM_READY: 'dom-ready'
};

export const GME_CMD = {
  // REQUEST_LOGIN: "request-login",
  // DOM_READY: "dom-ready",
  // SWITCH_LANGUAGE: "switch-language",
  // TRTC_LOGIN_STATUS: "trtc-login-status",

  ENTER_GAME_SCENE: 'enter-game-scene',
  KEYBOARD_MOVE: 'keyboard-move',
  OPEN_MICRO_SPEAKER: 'open-micro-speaker',
  INTERACT_ROBOT: 'interact-robot',
  INTERACT_OTHERS: 'interact-others'
};

export const LIVE_CMD = {
  REQUEST_LOGIN: 'request-login',
  TRTC_LOGIN_STATUS: 'trtc-login-status',
  DOM_READY: 'dom-ready',
  SWITCH_LANGUAGE: 'switch-language',
  ENTER_LIVE_ROOM: 'experience-enter-live',
  SEND_CHAT_BARRAGE: 'experience-send-message',
  FOLLOW_ANCHOR: 'experience-follow-anchor'
};

export const env = getUrlParams('env') || 'prod';
