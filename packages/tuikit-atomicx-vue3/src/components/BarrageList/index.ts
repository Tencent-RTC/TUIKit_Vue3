import BarrageListPC from './BarrageList.vue';
import BarrageListH5 from './BarrageListH5.vue';
import { addI18n } from '../../i18n';
import { enResource, zhResource } from './i18n';
import { isMobile } from '../../utils/environment';

const BarrageList = isMobile ? BarrageListH5 : BarrageListPC;
addI18n('en-US', { translation: enResource });
addI18n('zh-CN', { translation: zhResource });

export { BarrageList };
