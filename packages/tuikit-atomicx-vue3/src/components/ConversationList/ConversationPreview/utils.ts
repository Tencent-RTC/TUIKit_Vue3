import TUIChatEngine from '@tencentcloud/chat-uikit-engine';
import { MessageType, ConversationType } from '../../../types/engine';
import { transformTextWithEmojiKeyToName, safeJSONParse } from '../../../utils';
import { parseCallMessageText } from '../../../utils/call';
import { resolveGroupTipMessage } from '../../MessageList/Message/GroupTipMessage/resolveGroupTipMessage';
import type { ConversationModel, MessageModel } from '../../../types/engine';

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
  const { draftText } = conversation || {};

  // Handle draft message
  if (draftText) {
    if (typeof draftText === 'string') {
      return draftText;
    }
    const draftInfo = safeJSONParse(draftText, { abstract: '' });
    return draftInfo.abstract;
  }

  // Handle special operation type messages
  const OPERATION_MESSAGES: Record<number, string> = {
    4: t('TUIConversation.you_have_been_removed_from_the_group'),
    5: t('TUIConversation.the_group_chat_has_been_disbanded'),
    8: t('TUIConversation.you_have_left_the_group_chat'),
  };
  if (conversation.operationType && OPERATION_MESSAGES[conversation.operationType]) {
    return OPERATION_MESSAGES[conversation.operationType];
  }

  const { lastMessage } = conversation;

  if (!lastMessage) {
    return '';
  }

  const isGroupConversation = conversation.type === ConversationType.GROUP;
  const typedLastMessage = lastMessage as unknown as MessageModel;
  const { type, payload } = typedLastMessage;

  let messageContent = '';

  if (lastMessage?.isRevoked) {
    messageContent = t('TUIConversation.recalled_a_message');
  } else {
    switch (type) {
      case MessageType.TEXT:
        messageContent = transformTextWithEmojiKeyToName(payload.text || '');
        break;
      case MessageType.IMAGE:
        messageContent = `[${t('TUIConversation.Image')}]`;
        break;
      case MessageType.AUDIO:
        messageContent = `[${t('TUIConversation.Audio')}]`;
        break;
      case MessageType.VIDEO:
        messageContent = `[${t('TUIConversation.Video')}]`;
        break;
      case MessageType.FILE:
        messageContent = `[${t('TUIConversation.File')}]`;
        break;
      case MessageType.CUSTOM: {
        const data = safeJSONParse(payload?.data, { businessID: undefined });
        // Handle CallKit signaling message
        if (data?.businessID === 1) {
          try {
            messageContent = parseCallMessageText(typedLastMessage, t);
          } catch {
            messageContent = `[${t('TUIConversation.call_message')}]`;
          }
        } else {
          messageContent = `[${t('TUIConversation.Custom')}]`;
        }
        break;
      }
      case MessageType.LOCATION:
        messageContent = `[${t('TUIConversation.Location')}]`;
        break;
      case MessageType.FACE:
        messageContent = `[${t('TUIConversation.Face')}]`;
        break;
      case MessageType.MERGER:
        messageContent = `[${t('TUIConversation.Chat History')}]`;
        break;
      case MessageType.GRP_TIP:
        return resolveGroupTipMessage(typedLastMessage)?.text;
      default:
        messageContent = `[${t('TUIConversation.unknown_message')}]`;
        break;
    }
  }

  if (isGroupConversation) {
    let senderName = '';
    if (lastMessage?.fromAccount === TUIChatEngine.getMyUserID()) {
      senderName = t('TUIConversation.me');
    } else {
      // Priority: friendRemark > nameCard > nick > userID
      senderName = conversation.remark
        || typedLastMessage?.nameCard
        || lastMessage?.nick
        || lastMessage.fromAccount;
    }
    return senderName ? `${senderName}: ${messageContent}` : messageContent;
  }

  return messageContent;
};
