/**
 * Aegis event names
 */
export const AEGIS_EVENTS = {
  /** Main scene selection (chat/call/room/live) */
  SCENE_SELECT: 'scene_select',
  /** Sub-scene switch within chat (general/medical) */
  INDUSTRY_SWITCHER_CLICK: 'industry_switcher_click',
  /** Link click (doc/console/external_link) */
  LINK_CLICK: 'link_click',
  /** QR code view */
  QRCODE_VIEW: 'qrcode_view',
  /** Page leave with duration */
  PAGE_LEAVE: 'page_leave',
  /** Medical picker click */
  MEDICAL_PICKER_CLICK: 'medical_picker_click',
  /** Medical showroom click */
  MEDICAL_SHOWROOM_CLICK: 'medical_showroom_click',
  /** Welcome message sent in the default conversation */
  WELCOME_MESSAGE_SENT: 'welcome_message_sent',
} as const;

export type AegisEvent = (typeof AEGIS_EVENTS)[keyof typeof AEGIS_EVENTS];

// ============================================================================
// Page Names
// ============================================================================

/**
 * Page names for ext1 reporting
 */
export const AEGIS_PAGES = {
  HOME: 'home',
  DETAIL: 'detail',
} as const;

export type AegisPage = (typeof AEGIS_PAGES)[keyof typeof AEGIS_PAGES];

// ============================================================================
// Scene Names (for reporting)
// ============================================================================

/**
 * Scene names for ext1 reporting
 * Note: These are different from SCENE_IDS (chatkit/callkit/roomkit)
 *       used for routing - these are simplified names for reporting
 */
export const AEGIS_SCENES = {
  CHAT: 'chat',
  CALL: 'call',
  ROOM: 'room',
  LIVE: 'live',
} as const;

export type AegisScene = (typeof AEGIS_SCENES)[keyof typeof AEGIS_SCENES];

// ============================================================================
// Sub-Scene Names
// ============================================================================

/**
 * Sub-scene names for ext1 reporting (currently only for chat)
 */
export const AEGIS_SUB_SCENES = {
  GENERAL: 'general',
  MEDICAL: 'medical',
} as const;

export type AegisSubScene = (typeof AEGIS_SUB_SCENES)[keyof typeof AEGIS_SUB_SCENES];

// ============================================================================
// Link Types
// ============================================================================

/**
 * Link types for link_click event
 */
export const AEGIS_LINK_TYPES = {
  DOC: 'doc',
  CONSOLE: 'console',
  EXTERNAL_LINK: 'external_link',
} as const;

export type AegisLinkType = (typeof AEGIS_LINK_TYPES)[keyof typeof AEGIS_LINK_TYPES];

// ============================================================================
// Platform Names
// ============================================================================

/**
 * Platform names for ext1 reporting
 */
export const AEGIS_PLATFORMS = {
  WEB: 'web',
  ANDROID: 'android',
  IOS: 'ios',
  FLUTTER: 'flutter',
  RN: 'rn',
  UNI_APP: 'uni-app',
  ELECTRON: 'electron',
  MINIPROGRAM: 'miniprogram',
} as const;

export type AegisPlatform = (typeof AEGIS_PLATFORMS)[keyof typeof AEGIS_PLATFORMS];

// ============================================================================
// Medical Picker Types
// ============================================================================

/**
 * Medical picker types for medical_picker_click event
 */
export const AEGIS_MEDICAL_PICKER_TYPES = {
  FILE: 'file',
  IMAGE: 'image',
  EMOJI: 'emoji',
  VIDEO_CALL: 'video_call',
  AUDIO_CALL: 'audio_call',
  MEDICAL_RECORD: 'medical_record',
  PRESCRIPTION: 'prescription',
  QUICK_REPLY: 'quick_reply',
  QUICK_RATE: 'quick_rate',
} as const;

export type AegisMedicalPickerType = (typeof AEGIS_MEDICAL_PICKER_TYPES)[keyof typeof AEGIS_MEDICAL_PICKER_TYPES];

// ============================================================================
// Medical Action Types
// ============================================================================

/**
 * Medical action types
 */
export const AEGIS_MEDICAL_ACTIONS = {
  SHOWROOM: 'showroom',
} as const;

export type AegisMedicalAction = (typeof AEGIS_MEDICAL_ACTIONS)[keyof typeof AEGIS_MEDICAL_ACTIONS];

// ============================================================================
// Sidebar Types (for link_click reporting)
// ============================================================================

/**
 * Sidebar identifier for reporting
 */
export const AEGIS_SIDEBARS = {
  SIDEBAR: 'sideBar',
} as const;

export type AegisSidebar = (typeof AEGIS_SIDEBARS)[keyof typeof AEGIS_SIDEBARS];

// ============================================================================
// Product IDs (for home page reporting)
// ============================================================================

/**
 * Product IDs for home page link_click event
 */
export const AEGIS_PRODUCTS = {
  CHAT: 'chat',
  CALL: 'call',
  ROOM: 'room',
  LIVE: 'live',
} as const;

export type AegisProduct = (typeof AEGIS_PRODUCTS)[keyof typeof AEGIS_PRODUCTS];

// ============================================================================
// Helper: Scene ID to Aegis Scene mapping
// ============================================================================

/**
 * Map scene ID (routing) to aegis scene name (reporting)
 * e.g., 'chatkit' -> 'chat'
 */
export const SCENE_ID_TO_AEGIS_SCENE: Record<string, AegisScene> = {
  chatkit: AEGIS_SCENES.CHAT,
  callkit: AEGIS_SCENES.CALL,
  roomkit: AEGIS_SCENES.ROOM,
  live: AEGIS_SCENES.LIVE,
};

/**
 * Get aegis scene name from scene ID
 * @param sceneId - Scene ID used in routing (e.g., 'chatkit')
 * @returns Aegis scene name (e.g., 'chat')
 */
export function getAegisScene(sceneId: string): AegisScene | undefined {
  return SCENE_ID_TO_AEGIS_SCENE[sceneId];
}

// ============================================================================
// Re-export all constants for convenience
// ============================================================================

export const AEGIS = {
  EVENTS: AEGIS_EVENTS,
  PAGES: AEGIS_PAGES,
  SCENES: AEGIS_SCENES,
  SUB_SCENES: AEGIS_SUB_SCENES,
  LINK_TYPES: AEGIS_LINK_TYPES,
  PLATFORMS: AEGIS_PLATFORMS,
  MEDICAL_PICKER_TYPES: AEGIS_MEDICAL_PICKER_TYPES,
  MEDICAL_ACTIONS: AEGIS_MEDICAL_ACTIONS,
  SIDEBARS: AEGIS_SIDEBARS,
  PRODUCTS: AEGIS_PRODUCTS,
} as const;
