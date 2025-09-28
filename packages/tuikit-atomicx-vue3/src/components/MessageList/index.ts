import { Message as MessageComponent } from './Message';
import MessageListComponent from './MessageList.vue';
import { addI18n } from '../../i18n';
import { resources } from './i18n';

addI18n('en-US', { translation: { ...resources['en-US'] } });
addI18n('zh-CN', { translation: { ...resources['zh-CN'] } });

const Message = MessageComponent;
const MessageList = MessageListComponent;

export {
  Message,
  MessageList,
};
