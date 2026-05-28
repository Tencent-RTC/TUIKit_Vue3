// import { StoreName, TUIStore } from '@tencentcloud/chat-uikit-engine-lite';
// import { ConversationType, MessageType } from '../../types/engine';
import { transformTextWithEmojiKeyToName } from '../../utils/emoji';
import type { ChatOfflinePushInfo, OfflinePushAndroidInfo, OfflinePushApnsInfo } from './types';
// import type { ConversationModel } from '../../types/engine';
import { useLoginStore } from '../../chat-store';
import { ConversationType } from '@atomicxcore/core';
import type { ConversationInfo, MessageType } from '@atomicxcore/core';

/**
 * Generate push notification title based on conversation type
 * - C2C: Use current user's nickname (fallback to userID)
 * - GROUP: Use conversation's display name
 */
export function genTitle(conversation: ConversationInfo): string {
  const loginStore = useLoginStore();
  const userProfile = loginStore.loginUserInfo.value;

  if (conversation.type === ConversationType.C2C) {
    return userProfile?.nickname || userProfile?.userID || '';
  }

  return conversation.title || conversation.conversationID || '';
}

/**
 * Generate push notification description with 3-tier fallback:
 * 1. TEXT message → message text content (with emoji key → name transform)
 * 2. CUSTOM message → payload.description
 * 3. Other types → i18n default (e.g. [Image] / [图片])
 */
export function genDescription(
  messageType: MessageType,
  payload: Record<string, any>,
  t: (key: string) => string,
): string {
  if (messageType === 'text') {
    return transformTextWithEmojiKeyToName(payload?.text || '');
  }

  if (messageType === 'custom' && payload.description) {
    return payload.description;
  }

  // Priority 3: i18n default description
  const typeDescMap: Record<string, string> = {
    ['text']: 'OfflinePush.text',
    ['image']: 'OfflinePush.image',
    ['video']: 'OfflinePush.video',
    ['file']: 'OfflinePush.file',
    ['audio']: 'OfflinePush.audio',
    ['face']: 'OfflinePush.face',
    ['location']: 'OfflinePush.location',
    ['merger']: 'OfflinePush.merger',
    ['custom']: 'OfflinePush.custom',
  };

  const i18nKey = typeDescMap[messageType] || 'OfflinePush.custom';
  return t(i18nKey);
}

/**
 * Generate extension JSON with entity info for client-side routing
 * Contains: sender, nickName, chatType, version, action
 */
export function genExtension(conversation: ConversationInfo): string {
  const loginStore = useLoginStore();
  const userProfile = loginStore.loginUserInfo.value;

  const entity = {
    sender: conversation.type === ConversationType.Group
      ? conversation.conversationID.split('GROUP')[1]
      : userProfile?.userID,
    nickName: userProfile?.nickname || '',
    chatType: conversation.type === ConversationType.Group ? 2 : 1,
    version: 1,
    action: 1,
  };

  return JSON.stringify({ entity });
}

/**
 * Build complete offlinePushInfo from context and static config
 * Orchestrates genTitle, genDescription, genExtension with static config merge
 */
export function buildChatOfflinePushInfo(
  conversation: ConversationInfo,
  messageType: MessageType,
  payload: Record<string, any>,
  t: (key: string) => string,
  androidInfo?: OfflinePushAndroidInfo,
  apnsInfo?: OfflinePushApnsInfo,
): ChatOfflinePushInfo {
  return {
    title: genTitle(conversation),
    description: genDescription(messageType, payload, t),
    extension: genExtension(conversation),
    androidInfo,
    apnsInfo,
  };
}
