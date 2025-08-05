import LiveListPC from './LiveList.vue';
import LiveListH5 from './LiveListH5.vue';
import { addI18n } from '../../i18n';
import { enResource, zhResource } from './i18n/index';
import { isMobile } from '../../utils/environment';

addI18n('en-US', { translation: enResource });
addI18n('zh-CN', { translation: zhResource });

const LiveList = isMobile ? LiveListH5 : LiveListPC;

export { LiveList };
