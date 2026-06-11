import { MessageType, MessageStatus, ConversationType } from '@atomicxcore/core';
import { safeJSONParse } from '../../../utils';
import { transformTextWithEmojiKeyToName } from '../../../utils/emoji';
import { isCallMessage, isCreateGroupMessage, parseCallMessageText } from '../../../utils/call';
import { resolveGroupTipMessage } from '../../../utils/resolveGroupTipMessage';
import type { ConversationInfo, MessageInfo, TextMessageInfo, TipsMessageInfo, CustomMessageInfo } from '@atomicxcore/core';

export const generateHighlightTitle = (
  conversation: ConversationInfo,
  highlightMatchString?: string,
) => {
  const title = conversation?.title || '';
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

export const getLatestMessagePreview = (conversation: ConversationInfo, t: (key: string) => string) => {
  const { draft: draftText } = conversation || {};

  // Handle draft message
  if (draftText) {
    if (typeof draftText === 'string') {
      return draftText;
    }
    const draftInfo = safeJSONParse(draftText, { abstract: '' });
    return draftInfo.abstract;
  }

  // Handle special operation type messages (engine-lite specific field, accessed via cast)
  // const convAny = conversation as any;
  // const OPERATION_MESSAGES: Record<number, string> = {
  //   4: t('TUIConversation.you_have_been_removed_from_the_group'),
  //   5: t('TUIConversation.the_group_chat_has_been_disbanded'),
  //   8: t('TUIConversation.you_have_left_the_group_chat'),
  // };
  // if (convAny.operationType && OPERATION_MESSAGES[convAny.operationType]) {
  //   return OPERATION_MESSAGES[convAny.operationType];
  // }
  const lastMessage = conversation.lastMessage;

  if (!lastMessage) {
    return '';
  }

  const isGroupConversation = conversation.type === ConversationType.Group;

  let messageContent = '';

  if (lastMessage.status === MessageStatus.Recalled) {
    messageContent = t('TUIConversation.recalled_a_message');
  } else {
    switch (lastMessage.messageType) {
      case MessageType.Text:
        messageContent = transformTextWithEmojiKeyToName(lastMessage?.messagePayload?.text || '');
        break;
      case MessageType.Image:
        messageContent = `[${t('TUIConversation.Image')}]`;
        break;
      case MessageType.Audio:
        messageContent = `[${t('TUIConversation.Audio')}]`;
        break;
      case MessageType.Video:
        messageContent = `[${t('TUIConversation.Video')}]`;
        break;
      case MessageType.File:
        messageContent = `[${t('TUIConversation.File')}]`;
        break;
      case MessageType.Custom: {
        if (isCallMessage(lastMessage)) {
          try {
            messageContent = parseCallMessageText(lastMessage, t);
          } catch {
            messageContent = `[${t('TUIConversation.call_message')}]`;
          }
        } else if (isCreateGroupMessage(lastMessage)) {
          messageContent = `${lastMessage.from.nickname || lastMessage.from.userID} ${t('MessageList.create_group')}`;
        } else {
          const customData = (lastMessage as CustomMessageInfo).messagePayload?.customData;
          const parsed = safeJSONParse(customData, {});
          messageContent = parsed?.description || `[${t('TUIConversation.Custom')}]`;
        }
        break;
      }
      case MessageType.Face:
        messageContent = `[${t('TUIConversation.Face')}]`;
        break;
      case MessageType.Merged:
        messageContent = `[${t('TUIConversation.Chat History')}]`;
        break;
      case MessageType.Tips:
        messageContent = resolveGroupTipMessage(lastMessage as TipsMessageInfo).text;
        break;
      default:
        messageContent = `[${t('TUIConversation.unknown_message')}]`;
        break;
    }
  }

  if (isGroupConversation) {
    if (lastMessage.messageType === MessageType.Tips || isCreateGroupMessage(lastMessage)) {
      return messageContent;
    } else {
      const { from } = lastMessage;
      const isSelf = lastMessage.isSentBySelf;
      const senderName = isSelf
        ? t('TUIConversation.me')
        : from.friendRemark || from.nameCard || from.nickname || from.userID;
      return senderName ? `${senderName}: ${messageContent}` : messageContent;
    }
  }

  return messageContent;
};
