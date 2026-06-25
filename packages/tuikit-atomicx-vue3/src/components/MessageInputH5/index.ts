import { addI18n } from '../../i18n';
import MessageInputH5Component from './MessageInputH5.vue';
import { resources } from './i18n';

addI18n('en-US', { translation: {
  MessageInput: resources['en-US'].MessageInput,
  OfflinePush: resources['en-US'].OfflinePush,
  ConferencePicker: resources['en-US'].ConferencePicker,
} });
addI18n('zh-CN', { translation: {
  MessageInput: resources['zh-CN'].MessageInput,
  OfflinePush: resources['zh-CN'].OfflinePush,
  ConferencePicker: resources['zh-CN'].ConferencePicker,
} });

const MessageInputH5 = MessageInputH5Component;

export {
  MessageInputH5,
};
