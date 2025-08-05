import { TUIMediaDevice } from '@tencentcloud/tuiroom-engine-js';
import { RoomAction } from '../../types';
import { useI18n } from '../../locales';
import { useRoomState } from '../../states/RoomState';
import TUIMessageBox from '../../baseComp/MessageBox';
import { TUIToast, TOAST_TYPE } from '@tencentcloud/uikit-base-component-vue3';
import { useRoomEngine } from '../useRoomEngine';
// import { MESSAGE_DURATION } from '@/core/constants/message';
import { computed, defineComponent, reactive } from 'vue';

export default function useRoomVideoAction() {
  const { t } = useI18n();
  const { currentRoom } = useRoomState();
  const roomEngine = useRoomEngine();

  let stateForAllVideo = false;

  function toggleRoomVideo() {
    stateForAllVideo = !currentRoom.value?.isCameraDisableForAllUser;
    TUIMessageBox({
      title: currentRoom.value?.isCameraDisableForAllUser
        ? t('Enable all videos')
        : t('All and new members will be banned from the camera'),
      message: currentRoom.value?.isCameraDisableForAllUser
        ? t('After unlocking, users can freely turn on the camera')
        : t('Members will not be able to open the camera'),
      confirmButtonText: t('Confirm'),
      cancelButtonText: t('Cancel'),
      callback: async action => {
        if (action === 'confirm') {
          doToggleRoomVideo();
        }
      },
    });
  }

  async function doToggleRoomVideo() {
    if (currentRoom.value?.isCameraDisableForAllUser === stateForAllVideo) {
      const tipMessage = stateForAllVideo
        ? t('All videos disabled')
        : t('All videos enabled');
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
      currentRoom.value?.isCameraDisableForAllUser
        ? t('Lift stop all video')
        : t('All stop video')
    ),
    handler: toggleRoomVideo,
  });

  return roomVideoAction;
}
