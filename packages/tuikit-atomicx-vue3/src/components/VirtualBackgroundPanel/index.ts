import { addI18n } from '../../i18n';
import { enResource, zhResource } from './i18n';
import VirtualBackgroundPanelComponent from './VirtualBackgroundPanel.vue';

const VirtualBackgroundPanel = VirtualBackgroundPanelComponent;

addI18n('en-US', { translation: enResource });
addI18n('zh-CN', { translation: zhResource });
export {
  VirtualBackgroundPanel,
};
