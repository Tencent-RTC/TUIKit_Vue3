import { StoreName, TUIStore } from '@tencentcloud/chat-uikit-engine-lite';
import { ConversationType, MessageType } from '../../types/engine';
import { transformTextWithEmojiKeyToName } from '../../utils/emoji';
import type { ChatOfflinePushInfo, OfflinePushAndroidInfo, OfflinePushApnsInfo } from './types';
import type { ConversationModel } from '../../types/engine';

/**
 * Generate push notification title based on conversation type
 * - C2C: Use current user's nickname (fallback to userID)
 * - GROUP: Use conversation's display name
 */
export function genTitle(conversation: ConversationModel): string {
  const userProfile = TUIStore.getData(StoreName.USER, 'userProfile');

  if (conversation.type === ConversationType.C2C) {
    return userProfile?.nick || userProfile?.userID || '';
  }

  return conversation.getShowName?.() || '';
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
  if (messageType === MessageType.TEXT) {
    return transformTextWithEmojiKeyToName(payload?.text || '');
  }

  if (messageType === MessageType.CUSTOM && payload.description) {
    return payload.description;
  }

  // Priority 3: i18n default description
  const typeDescMap: Record<string, string> = {
    [MessageType.TEXT]: 'OfflinePush.text',
    [MessageType.IMAGE]: 'OfflinePush.image',
    [MessageType.VIDEO]: 'OfflinePush.video',
    [MessageType.FILE]: 'OfflinePush.file',
    [MessageType.AUDIO]: 'OfflinePush.audio',
    [MessageType.FACE]: 'OfflinePush.face',
    [MessageType.LOCATION]: 'OfflinePush.location',
    [MessageType.MERGER]: 'OfflinePush.merger',
    [MessageType.CUSTOM]: 'OfflinePush.custom',
  };

  const i18nKey = typeDescMap[messageType] || 'OfflinePush.custom';
  return t(i18nKey);
}

/**
 * Generate extension JSON with entity info for client-side routing
 * Contains: sender, nickName, chatType, version, action
 */
export function genExtension(conversation: ConversationModel): string {
  const userProfile = TUIStore.getData(StoreName.USER, 'userProfile');

  const entity = {
    sender: conversation.type === ConversationType.GROUP
      ? conversation.groupProfile?.groupID
      : userProfile?.userID,
    nickName: userProfile?.nick || '',
    chatType: conversation.type === ConversationType.GROUP ? 2 : 1,
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
  conversation: ConversationModel,
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
