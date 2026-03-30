/**
 * Sidebar configuration constants
 */

import { DOC_URLS, CONSOLE_URLS, PROMO_URLS, QR_CODE_URLS } from './urls';

// Sidebar document item interface
export interface SidebarDocItem {
  nameKey: string;
  name: string;
  url: string;
}

// Sidebar console panel interface
export interface SidebarConsolePanel {
  isShow: boolean;
  url: string;
}

// Extended capability item interface
export interface ExtendedCapabilityItem {
  id: string;
  nameKey: string;
  name: string;
  descKey: string;
  docsUrl: string;
  platformDocs: {
    web?: string;
    android?: string;
    ios?: string;
    miniprogram?: string;
  };
}

// Mobile experience item interface
export interface MobileExperienceItem {
  id: string;
  nameKey: string;
  name: string;
  qrcodeUrl: string;
}

// Extended capability definitions for each scene
const EXTENDED_CAPABILITY_CALL: ExtendedCapabilityItem = {
  id: 'call',
  nameKey: 'sidebar.extended.call',
  name: '通话 Call',
  descKey: 'sidebar.extended.callDesc',
  docsUrl: DOC_URLS.callkit.quickStart,
  platformDocs: DOC_URLS.callkit.platforms,
};

const EXTENDED_CAPABILITY_ROOM: ExtendedCapabilityItem = {
  id: 'room',
  nameKey: 'sidebar.extended.room',
  name: '会议 Room',
  descKey: 'sidebar.extended.roomDesc',
  docsUrl: DOC_URLS.roomkit.quickStart,
  platformDocs: DOC_URLS.roomkit.platforms,
};

const EXTENDED_CAPABILITY_LIVE: ExtendedCapabilityItem = {
  id: 'live',
  nameKey: 'sidebar.extended.live',
  name: '直播 Live',
  descKey: 'sidebar.extended.liveDesc',
  docsUrl: DOC_URLS.live.platforms.web,
  platformDocs: DOC_URLS.live.platforms,
};

const EXTENDED_CAPABILITY_CHAT: ExtendedCapabilityItem = {
  id: 'chat',
  nameKey: 'sidebar.extended.chat',
  name: '聊天 Chat',
  descKey: 'sidebar.extended.chatDesc',
  docsUrl: DOC_URLS.chatkit.quickStart,
  platformDocs: DOC_URLS.chatkit.platforms,
};

// Extended capabilities for each scene (showing the other 3 scenes)
export const CALLKIT_EXTENDED_CAPABILITIES: ExtendedCapabilityItem[] = [
  EXTENDED_CAPABILITY_CHAT,
  EXTENDED_CAPABILITY_ROOM,
  EXTENDED_CAPABILITY_LIVE,
];

export const ROOMKIT_EXTENDED_CAPABILITIES: ExtendedCapabilityItem[] = [
  EXTENDED_CAPABILITY_CHAT,
  EXTENDED_CAPABILITY_CALL,
  EXTENDED_CAPABILITY_LIVE,
];

export const LIVE_EXTENDED_CAPABILITIES: ExtendedCapabilityItem[] = [
  EXTENDED_CAPABILITY_CHAT,
  EXTENDED_CAPABILITY_CALL,
  EXTENDED_CAPABILITY_ROOM,
];

export const CHATKIT_EXTENDED_CAPABILITIES: ExtendedCapabilityItem[] = [
  EXTENDED_CAPABILITY_CALL,
  EXTENDED_CAPABILITY_ROOM,
  EXTENDED_CAPABILITY_LIVE,
];

// Mobile experience configuration (shared by all scenes)
export const MOBILE_EXPERIENCE: MobileExperienceItem[] = [
  {
    id: 'android',
    nameKey: 'sidebar.mobile.android',
    name: 'Android',
    qrcodeUrl: QR_CODE_URLS.android,
  },
  {
    id: 'ios',
    nameKey: 'sidebar.mobile.ios',
    name: 'iOS',
    qrcodeUrl: QR_CODE_URLS.ios,
  },
  {
    id: 'miniprogram',
    nameKey: 'sidebar.mobile.miniprogram',
    name: '小程序',
    qrcodeUrl: QR_CODE_URLS.miniprogram,
  },
];

// CallKit sidebar configuration
export const CALLKIT_SIDEBAR_CONFIG = {
  src: [
    {
      nameKey: 'sidebar.docs.productIntro',
      name: '产品简介',
      url: DOC_URLS.callkit.productIntro,
    },
    {
      nameKey: 'sidebar.docs.quickStart',
      name: '快速接入',
      url: DOC_URLS.callkit.quickStart,
    },
    {
      nameKey: 'sidebar.docs.apiReference',
      name: 'API参考',
      url: DOC_URLS.callkit.apiReference,
    },
    {
      nameKey: 'sidebar.docs.faq',
      name: '常见问题',
      url: DOC_URLS.callkit.faq,
    },
  ] as SidebarDocItem[],
  consolePanel: {
    isShow: true,
    url: CONSOLE_URLS.trtc,
  } as SidebarConsolePanel,
  extendedCapabilities: {
    isShow: true,
    items: CALLKIT_EXTENDED_CAPABILITIES,
  },
  mobileExperience: {
    isShow: true,
    items: MOBILE_EXPERIENCE,
  },
};

// RoomKit sidebar configuration
export const ROOMKIT_SIDEBAR_CONFIG = {
  src: [
    {
      nameKey: 'sidebar.docs.productIntro',
      name: '产品简介',
      url: DOC_URLS.roomkit.productIntro,
    },
    {
      nameKey: 'sidebar.docs.quickStart',
      name: '快速接入',
      url: DOC_URLS.roomkit.quickStart,
    },
    {
      nameKey: 'sidebar.docs.apiReference',
      name: 'API参考',
      url: DOC_URLS.roomkit.apiReference,
    },
    {
      nameKey: 'sidebar.docs.faq',
      name: '常见问题',
      url: DOC_URLS.roomkit.faq,
    },
  ] as SidebarDocItem[],
  consolePanel: {
    isShow: true,
    url: CONSOLE_URLS.trtc,
  } as SidebarConsolePanel,
  extendedCapabilities: {
    isShow: true,
    items: ROOMKIT_EXTENDED_CAPABILITIES,
  },
  mobileExperience: {
    isShow: true,
    items: MOBILE_EXPERIENCE,
  },
};

// LiveKit sidebar configuration
export const LIVE_SIDEBAR_CONFIG = {
  src: [
    {
      nameKey: 'sidebar.docs.productIntro',
      name: '产品简介',
      url: DOC_URLS.live.productIntro,
    },
    {
      nameKey: 'sidebar.docs.quickStart',
      name: '快速接入',
      url: DOC_URLS.live.quickStart,
    },
    {
      nameKey: 'sidebar.docs.apiReference',
      name: 'API参考',
      url: DOC_URLS.live.apiReference,
    },
  ] as SidebarDocItem[],
  consolePanel: {
    isShow: true,
    url: CONSOLE_URLS.trtc,
  } as SidebarConsolePanel,
  extendedCapabilities: {
    isShow: true,
    items: LIVE_EXTENDED_CAPABILITIES,
  },
  mobileExperience: {
    isShow: true,
    items: MOBILE_EXPERIENCE,
  },
};

// ChatKit sidebar configuration
export const CHATKIT_SIDEBAR_CONFIG = {
  src: [
    {
      nameKey: 'sidebar.docs.productIntro',
      name: '产品简介',
      url: DOC_URLS.chatkit.productIntro,
    },
    {
      nameKey: 'sidebar.docs.quickStart',
      name: '快速接入',
      url: DOC_URLS.chatkit.quickStart,
    },
    {
      nameKey: 'sidebar.docs.apiReference',
      name: 'API参考',
      url: DOC_URLS.chatkit.apiReference,
    },
  ] as SidebarDocItem[],
  consolePanel: {
    isShow: true,
    url: CONSOLE_URLS.im,
  } as SidebarConsolePanel,
  choose: {
    isShow: true,
    url: PROMO_URLS.imNew,
  },
  extendedCapabilities: {
    isShow: true,
    items: CHATKIT_EXTENDED_CAPABILITIES,
  },
  mobileExperience: {
    isShow: true,
    items: MOBILE_EXPERIENCE,
  },
};
