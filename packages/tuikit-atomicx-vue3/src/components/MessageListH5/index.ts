import { addI18n } from '../../i18n';
import { resources } from './i18n';
import { Message as MessageComponent } from './Message';
import { CustomMessage as CustomMessageComponent } from './Message/CustomMessage';
import MessageListH5Component from './MessageListH5.vue';

addI18n('en-US', { translation: { ...resources['en-US'] } });
addI18n('zh-CN', { translation: { ...resources['zh-CN'] } });

const CustomMessage = CustomMessageComponent;
const Message = MessageComponent;
const MessageListH5 = MessageListH5Component;

export {
  CustomMessage,
  Message,
  MessageListH5,
};
