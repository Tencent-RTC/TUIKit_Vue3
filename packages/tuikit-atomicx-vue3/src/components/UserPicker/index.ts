import UserPickerComponent from './UserPicker.vue';
import type {
  UserPickerProps,
  UserPickerRef,
  UserPickerRow,
  UserPickerNode,
  UserPickerDataSource,
  UserPickerResult,
} from './type';
import { addI18n } from '../../i18n';
import { resources } from './i18n';

addI18n('en-US', { translation: { UserPicker: resources['en-US'] } });
addI18n('zh-CN', { translation: { UserPicker: resources['zh-CN'] } });

const UserPicker = UserPickerComponent;

export { UserPicker };
export type {
  UserPickerProps,
  UserPickerRef,
  UserPickerRow,
  UserPickerNode,
  UserPickerDataSource,
  UserPickerResult,
};
