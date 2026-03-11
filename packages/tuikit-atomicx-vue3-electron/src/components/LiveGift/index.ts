import { addI18n } from '../../i18n';
import { isMobile } from '../../utils';
import { enResource, zhResource } from './i18n';
import { LiveGiftPC } from './LiveGiftPC';
import { LiveGiftH5 } from './LiveGiftH5';

addI18n('en-US', { translation: enResource });
addI18n('zh-CN', { translation: zhResource });

const LiveGift = isMobile ? LiveGiftH5 : LiveGiftPC;

export { LiveGift };
