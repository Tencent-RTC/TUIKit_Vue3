import { computed, reactive } from 'vue';
import { TUIRole, TUIMediaDevice } from '@tencentcloud/tuiroom-engine-js';
import { IconAllMembersShareScreen, IconHostShareScreen } from '@tencentcloud/uikit-base-component-vue3';
import { ActionType, RoomAction } from '../../types';
import { useI18n } from '../../locales';
// import TUIMessageBox from '@/core/components/common/base/MessageBox';
import useRoomEngine from '../useRoomEngine';
import useUserState from '../../states/UserState/index';
import { useRoomState } from '../../states/RoomState';

const { userWithScreenOn } = useUserState()
const { currentRoom } = useRoomState();

export default function useRoomScreenAction(): ActionType<RoomAction> {
  const { t } = useI18n();
  const roomEngine = useRoomEngine();
  let stateForScreenShare = false;
  async function toggleAllScreenShare() {
    await roomEngine.instance?.disableDeviceForAllUserByAdmin({
      isDisable: stateForScreenShare,
      device: TUIMediaDevice.kScreen,
    });
  }

  function toggleRoomScreen() {
    stateForScreenShare = !currentRoom.value?.isScreenShareDisableForAllUser;
    if (!userWithScreenOn.value || userWithScreenOn.value.userRole !== TUIRole.kGeneralUser) {
      toggleAllScreenShare();
      return;
    }
    TUIMessageBox({
      title: t(
        'Is it turned on that only the host/admin can share the screen?'
      ),
      message: t(
        "Other member is sharing the screen is now, the member's sharing will be terminated after you turning on"
      ),
      confirmButtonText: t('Confirm'),
      cancelButtonText: t('Cancel'),
      callback: async action => {
        if (action === 'confirm') {
          await roomEngine.instance?.closeRemoteDeviceByAdmin({
            userId: userWithScreenOn.value?.userId as string,
            device: TUIMediaDevice.kScreen,
          });
          toggleAllScreenShare();
        }
      },
    });
  }

  const roomScreenAction = reactive({
    key: RoomAction.ScreenAction,
    label: computed(() =>
      currentRoom.value?.isScreenShareDisableForAllUser
        ? t('All members can share screen')
        : t('Screen sharing for host/admin only')
    ),
    icon: computed(() =>
      currentRoom.value?.isScreenShareDisableForAllUser
        ? IconAllMembersShareScreen
        : IconHostShareScreen
    ),
    handler: toggleRoomScreen,
  });

  return roomScreenAction;
}
