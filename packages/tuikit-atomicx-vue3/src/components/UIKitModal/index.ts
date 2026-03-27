import { addI18n } from '../../i18n';
import { enResource, zhResource } from './i18n';
import { UIKitModal as UIKitModalComponent } from './UIKitModal';
import { useRoomModal as useRoomModalFunction } from './useRoomModal';


addI18n('en-US', { translation: enResource });
addI18n('zh-CN', { translation: zhResource });


const UIKitModal = UIKitModalComponent;
const useRoomModal = useRoomModalFunction;


export { UIKitModal, useRoomModal };
