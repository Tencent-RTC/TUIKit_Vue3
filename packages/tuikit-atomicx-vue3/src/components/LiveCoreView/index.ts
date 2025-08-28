import { addI18n } from '../../i18n';
import DefaultStreamViewUI from './DefaultStreamViewUI.vue';
import { enUSResource, zhCNResource } from './i18n';
import LiveCoreView from './index.vue';

addI18n('en-US', { translation: enUSResource });
addI18n('zh-CN', { translation: zhCNResource });

export { LiveCoreView, DefaultStreamViewUI };
