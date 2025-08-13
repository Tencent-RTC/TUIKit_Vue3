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
  
  return parts.map((part) => ({
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
      return `[${t('TUIChat.Image')}]`;
    case TUIChatEngine.TYPES.MSG_AUDIO:
      return `[${t('TUIChat.Audio')}]`;
    case TUIChatEngine.TYPES.MSG_VIDEO:
      return `[${t('TUIChat.Video')}]`;
    case TUIChatEngine.TYPES.MSG_FILE:
      return `[${t('TUIChat.File')}]`;
    case TUIChatEngine.TYPES.MSG_CUSTOM:
      return `[${t('TUIChat.Custom')}]`;
    case TUIChatEngine.TYPES.MSG_LOCATION:
      return `[${t('TUIChat.Location')}]`;
    case TUIChatEngine.TYPES.MSG_FACE:
      return `[${t('TUIChat.Emoji')}]`;
    case TUIChatEngine.TYPES.MSG_MERGER:
      return `[${t('TUIChat.Chat History')}]`;
    default:
      return senderName ? `${senderName}: ${payload?.text || ''}` : payload?.text || '';
  }
};