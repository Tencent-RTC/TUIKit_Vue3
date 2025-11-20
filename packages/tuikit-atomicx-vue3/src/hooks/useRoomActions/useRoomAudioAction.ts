import { reactive, computed, defineComponent } from 'vue';
import { TUIMediaDevice } from '@tencentcloud/tuiroom-engine-js';
import { TUIToast, TOAST_TYPE } from '@tencentcloud/uikit-base-component-vue3';
import TUIMessageBox from '../../baseComp/MessageBox';
import { useI18n } from '../../locales';
import { useRoomState } from '../../states/RoomState';
import { useRoomEngine } from '../useRoomEngine';
// import { MESSAGE_DURATION } from '../../../../constants/message';

const { currentRoom } = useRoomState();

export default function useRoomAudioAction() {
  const { t } = useI18n();
  const roomEngine = useRoomEngine();
  let stateForAllAudio = false;

  // todo: 测试在点击确定期间有其他管理员改变状态的 case

  function toggleRoomAudio() {
    stateForAllAudio = !currentRoom.value?.isAllMicrophoneDisabled;
    TUIMessageBox({
      title: currentRoom.value?.isAllMicrophoneDisabled
        ? t('Enable all audios')
        : t('All current and new members will be muted'),
      message: currentRoom.value?.isAllMicrophoneDisabled
        ? t('After unlocking, users can freely turn on the microphone')
        : t('Members will not be able to open the microphone'),
      confirmButtonText: t('Confirm'),
      cancelButtonText: t('Cancel'),
      callback: async (action) => {
        if (action === 'confirm') {
          doToggleRoomAudio();
        }
      },
    });
  }

  async function doToggleRoomAudio() {
    if (currentRoom.value?.isAllMicrophoneDisabled === stateForAllAudio) {
      const tipMessage = stateForAllAudio
        ? t('All audios disabled')
        : t('All audios enabled');
      TUIToast({
        type: TOAST_TYPE.SUCCESS,
        message: tipMessage,
        // duration: MESSAGE_DURATION.NORMAL,
      });
      return;
    }
    await roomEngine.instance?.disableDeviceForAllUserByAdmin({
      isDisable: stateForAllAudio,
      device: TUIMediaDevice.kMicrophone,
    });
  }

  const roomAudioAction = reactive({
    key: RoomAction.AudioAction,
    icon: defineComponent({}),
    label: computed(() =>
      currentRoom.value?.isAllMicrophoneDisabled
        ? t('Lift all mute')
        : t('All mute'),
    ),
    handler: toggleRoomAudio,
  });
  return roomAudioAction;
}
