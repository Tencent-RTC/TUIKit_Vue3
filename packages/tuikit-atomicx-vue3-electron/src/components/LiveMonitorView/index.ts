import LiveMonitorView from './LiveMonitorView.vue';
import { addI18n } from '../../i18n';
import { enResource, zhResource } from './i18n/index';
addI18n('en-US', { translation: enResource });
addI18n('zh-CN', { translation: zhResource });
export { LiveMonitorView };
