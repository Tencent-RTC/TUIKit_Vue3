import { addI18n } from '../../i18n';
import { enResource, zhResource } from './i18n';

addI18n('en-US', { translation: enResource });
addI18n('zh-CN', { translation: zhResource });

export { UIKitModal } from './UIKitModal';
export { useLiveErrorModal } from './liveErrorModal';
export { useRoomModal } from './useRoomModal';
