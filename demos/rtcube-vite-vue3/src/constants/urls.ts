/**
 * External URL constants
 */

// QR Code URLs for mobile platforms
export const QR_CODE_URLS = {
  android: 'https://main.qcloudimg.com/raw/8a603ced0a61983018c794df842f7029.png',
  ios: 'https://qcloudimg.tencent-cloud.cn/raw/5770ec5efefb8f1f558610ce9a860343.png',
  miniprogram: 'https://qcloudimg.tencent-cloud.cn/raw/7b28159446ac4d7773d015965f7fd206/gh_1ab7f88de371_1280.jpg',
} as const;

// Console URLs
export const CONSOLE_URLS = {
  trtc: 'https://console.cloud.tencent.com/trtc',
  im: 'https://console.cloud.tencent.com/im',
} as const;

// Promotion URLs
export const PROMO_URLS = {
  imNew: 'https://cloud.tencent.com/act/pro/imnew?from=16262',
} as const;

// Documentation URLs
export const DOC_URLS = {
  // CallKit docs
  callkit: {
    productIntro: 'https://cloud.tencent.com/product/calling',
    quickStart: 'https://cloud.tencent.com/document/product/647/78731',
    apiReference: 'https://cloud.tencent.com/document/product/647/78756',
    faq: 'https://cloud.tencent.com/document/product/647/78769',
    platforms: {
      web: 'https://cloud.tencent.com/document/product/647/78731',
      android: 'https://cloud.tencent.com/document/product/647/78729',
      ios: 'https://cloud.tencent.com/document/product/647/78730',
      miniprogram: 'https://cloud.tencent.com/document/product/647/78733',
    },
  },
  // RoomKit docs
  roomkit: {
    productIntro: 'https://cloud.tencent.com/document/product/647/81959',
    quickStart: 'https://cloud.tencent.com/document/product/647/81962',
    apiReference: 'https://cloud.tencent.com/document/product/647/81969',
    faq: 'https://cloud.tencent.com/document/product/647/81977',
    platforms: {
      web: 'https://cloud.tencent.com/document/product/647/81962',
      android: 'https://cloud.tencent.com/document/product/647/81961',
      ios: 'https://cloud.tencent.com/document/product/647/84237',
      miniprogram: 'https://cloud.tencent.com/document/product/647/97754',
    },
  },
  // LiveKit docs
  live: {
    productIntro: 'https://cloud.tencent.com/document/product/647/105438',
    quickStart: 'https://cloud.tencent.com/document/product/647/113798',
    apiReference: 'https://cloud.tencent.com/document/product/647/124656',
    platforms: {
      web: 'https://cloud.tencent.com/document/product/647/123049',
      android: 'https://cloud.tencent.com/document/product/647/122992',
      ios: 'https://cloud.tencent.com/document/product/647/122993',
    },
  },
  // ChatKit docs
  chatkit: {
    productIntro: 'https://cloud.tencent.com/product/im',
    quickStart: 'https://cloud.tencent.com/document/product/269/123276',
    apiReference: 'https://cloud.tencent.com/document/product/269/37411',
    platforms: {
      web: 'https://cloud.tencent.com/document/product/269/123108',
      android: 'https://cloud.tencent.com/document/product/269/37059',
      ios: 'https://cloud.tencent.com/document/product/269/37060',
      miniprogram: 'https://cloud.tencent.com/document/product/269/124305',
    },
  },
} as const;
