import { i18next } from '@tencentcloud/uikit-base-component-vue3';

import { resource as enResource } from './en-US/index';
import { resource as zhResource } from './zh-CN/index';

const addI18n = (lng: string, resource: any, deep = true, overwrite = false) => {
  i18next.addResourceBundle(lng, 'translation', resource.translation, deep, overwrite);
};

export { enResource, zhResource, addI18n };
