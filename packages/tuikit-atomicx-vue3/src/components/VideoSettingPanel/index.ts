import VideoSettingPanelPC from './index.vue';
import { addI18n } from '../../i18n';
import { enResource, zhResource } from './i18n';

addI18n('en-US', { translation: enResource });
addI18n('zh-CN', { translation: zhResource });

const VideoSettingPanel = VideoSettingPanelPC;

export { VideoSettingPanel };
