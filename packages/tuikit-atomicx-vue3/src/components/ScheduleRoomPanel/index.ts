import { addI18n } from '../../i18n';
import { enResource, zhResource } from './i18n';
import ScheduledRoomList from './ScheduledRoomList.vue';
import ScheduleRoomPanel from './ScheduleRoomPanel.vue';

addI18n('en-US', { translation: enResource });
addI18n('zh-CN', { translation: zhResource });
export {
  ScheduleRoomPanel,
  ScheduledRoomList,
};
