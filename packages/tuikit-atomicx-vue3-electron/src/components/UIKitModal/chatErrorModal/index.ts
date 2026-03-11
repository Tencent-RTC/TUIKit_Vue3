import { addI18n } from '../../../i18n';
import {
  ChatErrorModalId,
  showChatErrorModalById,
  handleChatErrorWithModal,
} from './chatErrorModal';
import { enResource, zhResource } from './i18n';

addI18n('en-US', { translation: enResource });
addI18n('zh-CN', { translation: zhResource });

export {
  ChatErrorModalId,
  showChatErrorModalById,
  handleChatErrorWithModal,
};
