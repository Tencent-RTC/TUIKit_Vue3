import BarrageInputPC from './BarrageInput.vue';
import BarrageInputH5 from './BarrageInputH5.vue';
import { addI18n } from '../../i18n';
import { enResource, zhResource } from './i18n';
import { isMobile } from '../../utils/environment';

addI18n('en-US', { translation: enResource });
addI18n('zh-CN', { translation: zhResource });

const BarrageInput = isMobile ? BarrageInputH5 : BarrageInputPC;
export { BarrageInput, BarrageInputH5 };
