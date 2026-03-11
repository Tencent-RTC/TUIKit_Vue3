import LiveAudienceListPC from './LiveAudienceList.vue';
import LiveAudienceListH5 from './LiveAudienceListH5.vue';
import { addI18n } from '../../i18n';
import { enResource, zhResource } from './i18n';
import { isMobile } from '../../utils/environment';

const MAX_AUDIENCE_COUNT = 200;
const LiveAudienceList = isMobile ? LiveAudienceListH5 : LiveAudienceListPC;

addI18n('en-US', { translation: enResource });
addI18n('zh-CN', { translation: zhResource });

export { LiveAudienceList, MAX_AUDIENCE_COUNT };
