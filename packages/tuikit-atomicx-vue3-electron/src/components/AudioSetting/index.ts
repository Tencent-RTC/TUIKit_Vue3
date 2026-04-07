import { addI18n } from '../../i18n';
import { enResource, zhResource } from './i18n';
import AudioSetting from './index.vue';

addI18n('en-US', { translation: enResource });
addI18n('zh-CN', { translation: zhResource });

export { AudioSetting };
export default AudioSetting;
