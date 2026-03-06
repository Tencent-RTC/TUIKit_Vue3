import type { ConversationModel, MessageType } from '../../types/engine';

// iOS push config
interface OfflinePushApnsInfo {
  sound?: string;
  ignoreIOSBadge?: boolean;
  disableVoipPush?: boolean;
  image?: string;
}

// Android vendor channel config
interface OfflinePushAndroidInfo {
  sound?: string;
  XiaoMiChannelID?: string;
  OPPOChannelID?: string;
  FCMChannelID?: string;
  VIVOClassification?: number;
  VIVOCategory?: string;
  HuaWeiCategory?: string;
  HuaWeiImage?: string;
  HonorImage?: string;
  GoogleImage?: string;
}

// Final offlinePushInfo object sent with CHAT messages
interface ChatOfflinePushInfo {
  title?: string;
  description?: string;
  extension?: string;
  androidInfo?: OfflinePushAndroidInfo;
  apnsInfo?: OfflinePushApnsInfo;
}

// Call scene offlinePushInfo (flat structure per TUICallKit SDK)
interface CallOfflinePushInfo {
  title?: string;
  description?: string;
  iOSSound?: string;
  androidSound?: string;
  androidOPPOChannelID?: string;
  androidXiaoMiChannelID?: string;
  androidFCMChannelID?: string;
  ignoreIOSBadge?: string;
  isDisablePush?: string;
}

// Context passed to createChatOfflinePushInfo / createCallOfflinePushInfo
interface OfflinePushInfoContext {
  conversation: ConversationModel;
  messageType: MessageType;
  payload?: Record<string, any>;
}

// CHAT scene static config
interface ChatOfflinePushInfoStaticConfig {
  androidInfo?: OfflinePushAndroidInfo;
  apnsInfo?: OfflinePushApnsInfo;
}

// User-facing config type
interface OfflinePushInfoConfig {
  // CHAT scene: static config only (factory function reserved for future)
  chatOfflinePushInfo?: ChatOfflinePushInfoStaticConfig;
  // CALL scene: static config only
  callOfflinePushInfo?: CallOfflinePushInfo;
}

export type {
  OfflinePushAndroidInfo,
  OfflinePushApnsInfo,
  ChatOfflinePushInfo,
  ChatOfflinePushInfoStaticConfig,
  CallOfflinePushInfo,
  OfflinePushInfoContext,
  OfflinePushInfoConfig,
}
