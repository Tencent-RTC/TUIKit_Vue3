import { addI18n } from '../../i18n';
import FreeBeautyPanelComponent from './FreeBeautyPanel.vue';
import { enResource, zhResource } from './i18n';

const FreeBeautyPanel = FreeBeautyPanelComponent;

addI18n('en-US', { translation: enResource });
addI18n('zh-CN', { translation: zhResource });
export {
  FreeBeautyPanel,
};
