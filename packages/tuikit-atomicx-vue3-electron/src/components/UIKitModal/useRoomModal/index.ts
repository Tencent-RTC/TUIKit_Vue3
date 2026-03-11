import { addI18n } from '../../../i18n';
import { enResource, zhResource } from './i18n';
import { useRoomModal as useRoomModalFunction } from './useRoomModal';

const useRoomModal = useRoomModalFunction;

addI18n('en-US', { translation: enResource });
addI18n('zh-CN', { translation: zhResource });
export {
  useRoomModal,
};
