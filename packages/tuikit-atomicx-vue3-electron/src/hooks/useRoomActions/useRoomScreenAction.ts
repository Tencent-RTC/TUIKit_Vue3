import { computed, reactive } from 'vue';
import { TUIRole, TUIMediaDevice } from '@tencentcloud/tuiroom-engine-electron';
import { IconAllMembersShareScreen, IconHostShareScreen, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import TUIMessageBox from '../../baseComp/MessageBox';
import { useRoomState } from '../../states/RoomState';
import useUserState from '../../states/UserState/index';
import useRoomEngine from '../useRoomEngine';

const { userWithScreenOn } = useUserState();
const { currentRoom } = useRoomState();

export default function useRoomScreenAction(): ActionType<RoomAction> {
  const { t } = useUIKit();
  const roomEngine = useRoomEngine();
  let stateForScreenShare = false;
  async function toggleAllScreenShare() {
    await roomEngine.instance?.disableDeviceForAllUserByAdmin({
      isDisable: stateForScreenShare,
      device: TUIMediaDevice.kScreen,
    });
  }

  function toggleRoomScreen() {
    stateForScreenShare = !currentRoom.value?.isAllScreenShareDisabled;
    if (!userWithScreenOn.value || userWithScreenOn.value.userRole !== TUIRole.kGeneralUser) {
      toggleAllScreenShare();
      return;
    }
    TUIMessageBox({
      title: t(
        'ParticipantList.ConfirmHostAdminOnlyShare',
      ),
      message: t(
        'ParticipantList.TerminateOtherShare',
      ),
      confirmButtonText: t('ParticipantList.Confirm'),
      cancelButtonText: t('ParticipantList.Cancel'),
      callback: async (action) => {
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
      currentRoom.value?.isAllScreenShareDisabled
        ? t('ParticipantList.AllCanShare')
        : t('ParticipantList.HostAdminOnlyShare'),
    ),
    icon: computed(() =>
      currentRoom.value?.isAllScreenShareDisabled
        ? IconAllMembersShareScreen
        : IconHostShareScreen,
    ),
    handler: toggleRoomScreen,
  });

  return roomScreenAction;
}
