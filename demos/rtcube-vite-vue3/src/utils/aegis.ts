/**
 * Aegis Data Reporting Service
 *
 * This module provides data reporting functionality using Tencent Aegis SDK.
 * For GitHub demo version, this entire file should be removed or replaced with a stub.
 *
 * @see https://aegis.woa.com/sdk/web.html
 */

// ============================================================================
// AEGIS REPORTING - START (Remove this section for GitHub demo)
// ============================================================================

import Aegis from 'aegis-web-sdk';

const AEGIS_PROJECT_ID = 'iHWefAYqnBxsjcoxZS';

let aegisInstance: Aegis | null = null;

/**
 * Initialize Aegis SDK instance
 */
export function initAegis(uin?: string): Aegis {
  if (aegisInstance) {
    return aegisInstance;
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
 * Report custom event
 * @param eventName - Event name
 * @param ext1 - Extra parameter 1 (optional)
 * @param ext2 - Extra parameter 2 (optional)
 * @param ext3 - Extra parameter 3 (optional)
 */
export function reportEvent(
  eventName: string,
  ext1?: string,
  ext2?: string,
  ext3?: string
): void {
  const aegis = getAegis();
  if (aegis) {
    aegis.reportEvent({
      name: eventName,
      ext1: ext1 || '',
      ext2: ext2 || '',
      ext3: ext3 || '',
    });
  }
}

/**
 * Report scene selection event
 * @param scene - Scene name (chatkit, callkit, roomkit, live)
 * @param source - Source page (home, detail-bar)
 */
export function reportSceneSelect(scene: string, source: string): void {
  reportEvent('scene_select', scene, source);
}

/**
 * Report sidebar navigation click event
 * @param action - Action type (e.g., 'doc_click', 'console_click', 'buy_click')
 * @param scene - Current scene
 * @param target - Target URL or description
 */
export function reportSidebarClick(
  action: string,
  scene: string,
  target?: string
): void {
  reportEvent('sidebar_click', action, scene, target);
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
 * Report diversion (traffic guidance) click event
 * @param action - Action type (e.g., 'platform_qrcode_view', 'quick_access_click', 'capability_card_click')
 * @param target - Target name (e.g., 'android', 'ios', 'chat', 'call')
 * @param extra - Extra info (e.g., URL, platform name)
 */
export function reportDiversionClick(
  action: string,
  target: string,
  extra?: string
): void {
  reportEvent('diversion_click', action, target, extra);
}

/**
 * Report scene page leave event with duration
 * @param scene - Scene name (e.g., 'call', 'chat', 'live', 'room')
 * @param durationMs - Duration in milliseconds
 * @param from - Leave trigger (e.g., 'navigation', 'beforeunload', 'visibilitychange')
 */
export function reportSceneLeave(
  scene: string,
  durationMs: number,
  from: string
): void {
  reportEvent('rtcube_page_leave', scene, String(durationMs), from);
}

/**
 * Create a scene duration tracker
 * @param scene - Scene name
 * @returns Object with cleanup function
 */
export function createSceneDurationTracker(scene: string): {
  cleanup: () => void;
} {
  const enterTime = Date.now();
  let hasReported = false;

  const reportLeave = (from: string) => {
    if (hasReported) return;
    hasReported = true;
    const durationMs = Date.now() - enterTime;
    reportSceneLeave(scene, durationMs, from);
  };

  // Fallback 1: page close/refresh
  const handleBeforeUnload = () => {
    reportLeave('beforeunload');
  };

  // Fallback 2: tab switch or minimize
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      reportLeave('visibilitychange');
      // Reset hasReported to allow re-reporting when visible again
      hasReported = false;
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  document.addEventListener('visibilitychange', handleVisibilityChange);

  return {
    cleanup: () => {
      reportLeave('navigation');
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    },
  };
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
  reportSidebarClick,
  reportDiversionClick,
  reportSceneLeave,
  createSceneDurationTracker,
  destroyAegis,
};
