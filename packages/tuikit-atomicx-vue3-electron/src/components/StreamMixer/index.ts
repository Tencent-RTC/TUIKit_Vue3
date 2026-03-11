import { addI18n } from '../../i18n';
import { enUSResource, zhCNResource } from './i18n';
import StreamMixerComp from './index.vue';

addI18n('en-US', { translation: enUSResource });
addI18n('zh-CN', { translation: zhCNResource });

const StreamMixer = StreamMixerComp;
export { StreamMixer };

// Re-export types for external consumers
export type { TUIUserOnSeatInfo, TUISeatLayoutTemplate, TUICoHostLayoutTemplate } from './type';
