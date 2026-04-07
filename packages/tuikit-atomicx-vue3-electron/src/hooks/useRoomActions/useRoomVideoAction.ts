import { reactive, computed, defineComponent } from 'vue';
import { TUIMediaDevice } from '@tencentcloud/tuiroom-engine-electron';
import { TUIToast, TOAST_TYPE, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import TUIMessageBox from '../../baseComp/MessageBox';
import { useRoomState } from '../../states/RoomState';
import useRoomEngine from '../useRoomEngine';

export default function useRoomVideoAction() {
  const { t } = useUIKit();
  const { currentRoom } = useRoomState();
  const roomEngine = useRoomEngine();

  let stateForAllVideo = false;

  function toggleRoomVideo() {
    stateForAllVideo = !currentRoom.value?.isAllCameraDisabled;
    TUIMessageBox({
      title: currentRoom.value?.isAllCameraDisabled
        ? t('ParticipantList.EnableAllVideo')
        : t('ParticipantList.DisableAllVideoTip'),
      message: currentRoom.value?.isAllCameraDisabled
        ? t('ParticipantList.EnableAllVideoDesc')
        : t('ParticipantList.CameraDisabledTip'),
      confirmButtonText: t('ParticipantList.Confirm'),
      cancelButtonText: t('ParticipantList.Cancel'),
      callback: async (action) => {
        if (action === 'confirm') {
          doToggleRoomVideo();
        }
      },
    });
  }

  async function doToggleRoomVideo() {
    if (currentRoom.value?.isAllCameraDisabled === stateForAllVideo) {
      const tipMessage = stateForAllVideo
        ? t('ParticipantList.VideoDisabled')
        : t('ParticipantList.VideoEnabled');
      TUIToast({
        type: TOAST_TYPE.SUCCESS,
        message: tipMessage,
        // duration: MESSAGE_DURATION.NORMAL,
      });
      return;
    }
    await roomEngine.instance?.disableDeviceForAllUserByAdmin({
      isDisable: stateForAllVideo,
      device: TUIMediaDevice.kCamera,
    });
  }

  const roomVideoAction = reactive({
    key: RoomAction.VideoAction,
    icon: defineComponent({}),
    label: computed(() =>
      currentRoom.value?.isAllCameraDisabled
        ? t('ParticipantList.EnableAllVideo')
        : t('ParticipantList.DisableAllVideo'),
    ),
    handler: toggleRoomVideo,
  });

  return roomVideoAction;
}
