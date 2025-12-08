import { MessageList as MessageListEn, CallMessage as CallMessageEn, Emoji as EmojiEn } from './en-US';
import { MessageList as MessageListZh, CallMessage as CallMessageZh, Emoji as EmojiZh } from './zh-CN';

const resources = {
  'en-US': { MessageList: MessageListEn, CallMessage: CallMessageEn, Emoji: EmojiEn},
  'zh-CN': { MessageList: MessageListZh, CallMessage: CallMessageZh, Emoji: EmojiZh },
};

export { resources };
