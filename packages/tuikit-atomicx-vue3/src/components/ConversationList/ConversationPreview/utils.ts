import TUIChatEngine from '@tencentcloud/chat-uikit-engine';
import type { ConversationModel } from '../../../types';

export const generateHighlightTitle = (
  conversation: ConversationModel,
  highlightMatchString?: string,
) => {
  const title = conversation?.getShowName?.();
  if (!highlightMatchString) {
    return [{ text: title, isHighlight: false }];
  }

  const regex = new RegExp(`(${highlightMatchString})`, 'gi');
  const parts = title.split(regex);

  return parts.map(part => ({
    text: part,
    isHighlight: part.toLowerCase() === highlightMatchString.toLowerCase(),
  }));
};

export const getLatestMessagePreview = (conversation: ConversationModel, t: (key: string) => string) => {
  const { lastMessage } = conversation || {};
  if (!lastMessage) {
    return '';
  }

  const { type, payload } = lastMessage;
  const { nick, userID } = lastMessage.nick || lastMessage?.from || {};

  const senderName = nick || userID || '';

  switch (type) {
    case TUIChatEngine.TYPES.MSG_TEXT:
      return payload.text || '';
    case TUIChatEngine.TYPES.MSG_IMAGE:
      return `[${t('TUIConversation.Image')}]`;
    case TUIChatEngine.TYPES.MSG_AUDIO:
      return `[${t('TUIConversation.Audio')}]`;
    case TUIChatEngine.TYPES.MSG_VIDEO:
      return `[${t('TUIConversation.Video')}]`;
    case TUIChatEngine.TYPES.MSG_FILE:
      return `[${t('TUIConversation.File')}]`;
    case TUIChatEngine.TYPES.MSG_CUSTOM:
      return `[${t('TUIConversation.Custom')}]`;
    case TUIChatEngine.TYPES.MSG_LOCATION:
      return `[${t('TUIConversation.Location')}]`;
    case TUIChatEngine.TYPES.MSG_FACE:
      return `[${t('TUIConversation.Emoji')}]`;
    case TUIChatEngine.TYPES.MSG_MERGER:
      return `[${t('TUIConversation.Chat History')}]`;
    default:
      return senderName ? `${senderName}: ${payload?.text || ''}` : payload?.text || '';
  }
};
