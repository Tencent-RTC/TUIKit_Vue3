import { i18next } from '@tencentcloud/uikit-base-component-vue3';

import enUS from './en-US';
import zhCN from './zh-CN';

const resources = {
  'en-US': enUS,
  'zh-CN': zhCN,
};

Object.entries(resources).forEach(([lng, resource]) => {
  i18next.addResourceBundle(lng, 'translation', { MessageInput: resource }, true, false);
});
