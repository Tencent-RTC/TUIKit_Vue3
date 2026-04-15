import { MessageList as MessageListEn, CallMessage as CallMessageEn, RoomMessage as RoomMessageEn, Emoji as EmojiEn } from './en-US';
import { MessageList as MessageListZh, CallMessage as CallMessageZh, RoomMessage as RoomMessageZh, Emoji as EmojiZh } from './zh-CN';

const resources = {
  'en-US': { MessageList: MessageListEn, CallMessage: CallMessageEn, RoomMessage: RoomMessageEn, Emoji: EmojiEn },
  'zh-CN': { MessageList: MessageListZh, CallMessage: CallMessageZh, RoomMessage: RoomMessageZh, Emoji: EmojiZh },
};

export { resources };
