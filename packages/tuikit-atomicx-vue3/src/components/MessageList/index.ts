import { addI18n } from '../../i18n';
import { resources } from './i18n';
import { Message as MessageComponent } from './Message';
import { CustomMessage as CustomMessageComponent } from './Message/CustomMessage';
import MessageListComponent from './MessageList.vue';

addI18n('en-US', { translation: { ...resources['en-US'] } });
addI18n('zh-CN', { translation: { ...resources['zh-CN'] } });

const CustomMessage = CustomMessageComponent;
const Message = MessageComponent;
const MessageList = MessageListComponent;

export {
  CustomMessage,
  Message,
  MessageList,
};
