import LiveStreamView from './index.vue';
import DefaultStreamViewUI from './DefaultStreamViewUI.vue';
import { addI18n } from '../../i18n';
import { enUSResource, zhCNResource } from './i18n';
addI18n('en-US', { translation: enUSResource });
addI18n('zh-CN', { translation: zhCNResource });

export { LiveStreamView, DefaultStreamViewUI };
