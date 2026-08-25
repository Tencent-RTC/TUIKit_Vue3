/**
 * Product and platform configuration constants
 */

import { DOC_URLS, QR_CODE_URLS } from './urls';
import { PRODUCT_IDS, SCENE_IDS } from './scenes';

// Re-export for backward compatibility
export { PRODUCT_IDS, SCENE_IDS };

// Platform IDs
export const PLATFORM_IDS = {
  android: 'android',
  ios: 'ios',
  web: 'web',
  miniprogram: 'miniprogram',
} as const;

// Platform experience QR code data
export interface PlatformExperienceData {
  id: string;
  name: string;
  nameKey?: string;
  qrCode: string;
}

export const PLATFORM_EXPERIENCE_DATA: PlatformExperienceData[] = [
  {
    id: PLATFORM_IDS.android,
    name: 'Android',
    qrCode: QR_CODE_URLS.android,
  },
  {
    id: PLATFORM_IDS.ios,
    name: 'iOS',
    qrCode: QR_CODE_URLS.ios,
  },
  {
    id: PLATFORM_IDS.miniprogram,
    name: 'platform.miniProgram', // i18n key
    nameKey: 'platform.miniProgram',
    qrCode: QR_CODE_URLS.miniprogram,
  },
];

// Quick access product documentation links
export interface ProductDocLink {
  platform: string;
  platformKey?: string;
  url: string;
}

export interface QuickAccessProductData {
  id: string;
  nameKey: string;
  descKey: string;
  links: ProductDocLink[];
}

export const QUICK_ACCESS_PRODUCTS_DATA: QuickAccessProductData[] = [
  {
    id: PRODUCT_IDS.chat,
    nameKey: 'quickAccess.chat',
    descKey: 'quickAccess.chatDesc',
    links: [
      { platform: 'Web', url: DOC_URLS.chatkit.platforms.web },
      { platform: 'Android', url: DOC_URLS.chatkit.platforms.android },
      { platform: 'iOS', url: DOC_URLS.chatkit.platforms.ios },
      { platform: 'quickAccess.miniProgram', platformKey: 'quickAccess.miniProgram', url: DOC_URLS.chatkit.platforms.miniprogram },
    ],
  },
  {
    id: PRODUCT_IDS.call,
    nameKey: 'quickAccess.call',
    descKey: 'quickAccess.callDesc',
    links: [
      { platform: 'Web', url: DOC_URLS.callkit.platforms.web },
      { platform: 'Android', url: DOC_URLS.callkit.platforms.android },
      { platform: 'iOS', url: DOC_URLS.callkit.platforms.ios },
      { platform: 'quickAccess.miniProgram', platformKey: 'quickAccess.miniProgram', url: DOC_URLS.callkit.platforms.miniprogram },
    ],
  },
  {
    id: PRODUCT_IDS.room,
    nameKey: 'quickAccess.room',
    descKey: 'quickAccess.roomDesc',
    links: [
      { platform: 'Web', url: DOC_URLS.roomkit.platforms.web },
      { platform: 'Android', url: DOC_URLS.roomkit.platforms.android },
      { platform: 'iOS', url: DOC_URLS.roomkit.platforms.ios },
      { platform: 'quickAccess.miniProgram', platformKey: 'quickAccess.miniProgram', url: DOC_URLS.roomkit.platforms.miniprogram },
    ],
  },
  {
    id: PRODUCT_IDS.live,
    nameKey: 'quickAccess.live',
    descKey: 'quickAccess.liveDesc',
    links: [
      { platform: 'Web', url: DOC_URLS.live.platforms.web },
      { platform: 'Android', url: DOC_URLS.live.platforms.android },
      { platform: 'iOS', url: DOC_URLS.live.platforms.ios },
    ],
  },
];
