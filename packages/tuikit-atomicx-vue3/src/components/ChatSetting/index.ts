import ChatSettingComponent from './ChatSetting.vue';
import { addI18n } from '../../i18n';
import { resources } from './i18n';

addI18n('zh-CN', { translation: { ChatSetting: resources['zh-CN'] } });
addI18n('en-US', { translation: { ChatSetting: resources['en-US'] } });

const ChatSetting = ChatSettingComponent;

export { ChatSetting };
