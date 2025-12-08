import { addI18n } from '../../i18n';
import { enResource, zhResource } from './i18n';
import ScheduledRoomListComponent from './ScheduledRoomList.vue';
import ScheduleRoomPanelComponent from './ScheduleRoomPanel.vue';

const ScheduledRoomList = ScheduledRoomListComponent;
const ScheduleRoomPanel = ScheduleRoomPanelComponent;

addI18n('en-US', { translation: enResource });
addI18n('zh-CN', { translation: zhResource });
export {
  ScheduleRoomPanel,
  ScheduledRoomList,
};
