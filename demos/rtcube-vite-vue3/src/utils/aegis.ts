/**
 * Aegis Data Reporting Service
 *
 * Simplified reporting with structured ext1 field.
 * ext1 format: part1 | part2 | part3 | ...
 *
 * Events:
 * - scene_select: Main scene selection event (chat/call/room/live)
 *   - home: "home | scene | subScene" (e.g., "home | chat | medical")
 *   - detail: "detail | targetScene" (e.g., "detail | call")
 *
 * - industry_switcher_click: Sub-scene switch within chat
 *   - "detail | chat | subScene" (e.g., "detail | chat | medical")
 *
 * - link_click: Link click event (unified for docs, console, external links)
 *   - home: "home | product | platform | url" (e.g., "home | chat | web | https://...")
 *   - detail: "detail | scene | linkType | url" (e.g., "detail | chat | doc | https://...")
 *
 * - qrcode_view: QR code view event
 *   - home: "home | platform" (e.g., "home | android", "home | miniprogram")
 *   - detail: "detail | scene | platform" (e.g., "detail | chat | android", "detail | chat | miniprogram")
 *
 * - page_leave: Page leave with duration
 *   - "page | scene | subScene | durationMs" (e.g., "detail | chat | general | 12345")
 *
 * - medical_picker_click: Medical picker tool click
 *   - "detail | chat | medical | picker_type" (e.g., "detail | chat | medical | file")
 *
 * - medical_showroom_click: Medical showroom button click
 *   - "detail | chat | medical | showroom"
 *
 * @see https://aegis.woa.com/sdk/web.html
 * @see ../constants/aegis.ts for event constants
 * @see docs/aegis-events.md for full event documentation
 */

// ============================================================================
// AEGIS REPORTING - START (Remove this section for GitHub demo)
// ============================================================================

import Aegis from 'aegis-web-sdk';
import {
  AEGIS_EVENTS,
  AEGIS_PAGES,
  AEGIS_SCENES,
  AEGIS_SUB_SCENES,
  AEGIS_MEDICAL_ACTIONS,
} from '@/constants/aegis';

const AEGIS_PROJECT_ID = 'iHWefAYqnBxsjcoxZS';

// Only report on production domain
const ALLOWED_REPORT_URL = 'https://web.sdk.qcloud.com/im/demo/release/vue3/index.html';

let aegisInstance: Aegis | null = null;

/**
 * Check if current page is allowed to report
 * Only report when running on the production domain
 */
function isReportAllowed(): boolean {
  const currentUrl = window.location.href;
  return currentUrl.startsWith(ALLOWED_REPORT_URL.replace('/index.html', ''));
}

/**
 * Initialize Aegis SDK instance
 * Only initializes when running on the allowed production domain
 */
export function initAegis(uin?: string): Aegis | null {
  if (aegisInstance) {
    return aegisInstance;
  }

  // Only initialize Aegis on production domain
  if (!isReportAllowed()) {
    return null;
  }

  aegisInstance = new Aegis({
    id: AEGIS_PROJECT_ID,
    uin: uin || '',
    reportApiSpeed: true,
    reportAssetSpeed: true,
    spa: true,
    hostUrl: 'https://rumt-zh.com',
  });

  return aegisInstance;
}

/**
 * Get Aegis instance (initialize if not exists)
 */
export function getAegis(): Aegis | null {
  if (!aegisInstance) {
    return initAegis();
  }
  return aegisInstance;
}

/**
 * Update user ID for reporting
 */
export function setAegisUin(uin: string): void {
  const aegis = getAegis();
  if (aegis) {
    aegis.setConfig({ uin });
  }
}

/**
 * Build ext1 string by joining parts with ' | '
 * @param parts - Array of string parts to join
 * @returns Formatted ext1 string (e.g., "home | chat | medical")
 */
function buildExt1(...parts: (string | undefined)[]): string {
  return parts.filter(Boolean).join(' | ');
}

/**
 * Report custom event with structured ext1
 * @param eventName - Event name
 * @param ext1Parts - Parts to join for ext1 (e.g., ['home', 'chat', 'medical'])
 */
export function reportEvent(eventName: string, ...ext1Parts: (string | undefined)[]): void {
  const aegis = getAegis();
  if (aegis) {
    aegis.reportEvent({
      name: eventName,
      ext1: buildExt1(...ext1Parts),
    });
  }
}

/**
 * Destroy Aegis instance
 */
export function destroyAegis(): void {
  if (aegisInstance) {
    aegisInstance.destroy();
    aegisInstance = null;
  }
}

/**
 * Create a scene duration tracker
 * Reports page leave event with duration
 * ext1 format: page | scene | subScene | durationMs
 * @param page - Page name (e.g., 'detail')
 * @param scene - Scene name (e.g., 'chat', 'call', 'room', 'live')
 * @param subScene - Sub-scene name (e.g., 'general', 'medical')
 * @returns Object with cleanup function
 */
export function createSceneDurationTracker(
  page: string,
  scene: string,
  subScene?: string
): {
  cleanup: () => void;
} {
  const enterTime = Date.now();
  let hasReported = false;

  const reportLeave = () => {
    if (hasReported) return;
    hasReported = true;
    const durationMs = Date.now() - enterTime;
    // Report with ext1 format: page | scene | subScene | durationMs
    reportEvent(AEGIS_EVENTS.PAGE_LEAVE, page, scene, subScene, String(durationMs));
  };

  // Fallback 1: page close/refresh
  const handleBeforeUnload = () => {
    reportLeave();
  };

  // Fallback 2: tab switch or minimize
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      reportLeave();
      // Reset hasReported to allow re-reporting when visible again
      hasReported = false;
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  document.addEventListener('visibilitychange', handleVisibilityChange);

  return {
    cleanup: () => {
      reportLeave();
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    },
  };
}

// ============================================================================
// Convenience functions for specific events
// ============================================================================

/**
 * Report scene_select event - Main scene selection
 * ext1 format:
 *   - home: "home | scene | subScene" (e.g., "home | chat | medical")
 *   - detail: "detail | targetScene" (e.g., "detail | call")
 * @param page - Page name ('home' or 'detail')
 * @param scene - Scene name (e.g., 'chat', 'call', 'room', 'live')
 * @param subScene - Sub-scene name (optional, only for home page)
 */
export function reportSceneSelect(page: string, scene: string, subScene?: string): void {
  reportEvent(AEGIS_EVENTS.SCENE_SELECT, page, scene, subScene);
}

/**
 * Report industry_switcher_click event - Sub-scene switch within chat
 * ext1 format: "detail | chat | subScene" (e.g., "detail | chat | medical")
 * @param subScene - Sub-scene name ('general' or 'medical')
 */
export function reportIndustrySwitcherClick(subScene: string): void {
  reportEvent(AEGIS_EVENTS.INDUSTRY_SWITCHER_CLICK, AEGIS_PAGES.DETAIL, AEGIS_SCENES.CHAT, subScene);
}

/**
 * Report link_click event - Unified link click event
 * ext1 format:
 *   - home: "home | product | platform | url"
 *   - detail: "detail | scene | linkType | url"
 *   - detail capability: "detail | scene | capabilityId | platform | url"
 * @param parts - Parts to join for ext1
 */
export function reportLinkClick(...parts: (string | undefined)[]): void {
  reportEvent(AEGIS_EVENTS.LINK_CLICK, ...parts);
}

/**
 * Report qrcode_view event - QR code view
 * ext1 format:
 *   - home: "home | platform"
 *   - detail: "detail | scene | platform"
 * @param page - Page name ('home' or 'detail')
 * @param scene - Scene name (optional for home, required for detail)
 * @param platform - Platform name ('android', 'ios', 'miniprogram')
 */
export function reportQrcodeView(page: string, scene?: string, platform?: string): void {
  if (page === AEGIS_PAGES.HOME) {
    reportEvent(AEGIS_EVENTS.QRCODE_VIEW, page, scene); // scene is actually platform for home
  } else {
    reportEvent(AEGIS_EVENTS.QRCODE_VIEW, page, scene, platform);
  }
}

/**
 * Report medical_picker_click event - Medical picker tool click
 * ext1 format: "detail | chat | medical | picker_type"
 * @param pickerType - Picker type (e.g., 'file', 'image', 'emoji', 'video_call', etc.)
 */
export function reportMedicalPickerClick(pickerType: string): void {
  reportEvent(AEGIS_EVENTS.MEDICAL_PICKER_CLICK, AEGIS_PAGES.DETAIL, AEGIS_SCENES.CHAT, AEGIS_SUB_SCENES.MEDICAL, pickerType);
}

/**
 * Report medical_showroom_click event - Medical showroom button click
 * ext1 format: "detail | chat | medical | showroom"
 */
export function reportMedicalShowroomClick(): void {
  reportEvent(AEGIS_EVENTS.MEDICAL_SHOWROOM_CLICK, AEGIS_PAGES.DETAIL, AEGIS_SCENES.CHAT, AEGIS_SUB_SCENES.MEDICAL, AEGIS_MEDICAL_ACTIONS.SHOWROOM);
}

// ============================================================================
// AEGIS REPORTING - END
// ============================================================================

export default {
  initAegis,
  getAegis,
  setAegisUin,
  reportEvent,
  reportSceneSelect,
  reportIndustrySwitcherClick,
  reportLinkClick,
  reportQrcodeView,
  reportMedicalPickerClick,
  reportMedicalShowroomClick,
  createSceneDurationTracker,
  destroyAegis,
};
