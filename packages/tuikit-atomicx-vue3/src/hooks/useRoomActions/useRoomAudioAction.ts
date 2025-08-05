import { TUIMediaDevice } from '@tencentcloud/tuiroom-engine-js';
import { RoomAction } from '../../types';
import { useI18n } from '../../locales';
import TUIMessageBox from '../../baseComp/MessageBox';
import { TUIToast, TOAST_TYPE } from '@tencentcloud/uikit-base-component-vue3';
import { useRoomEngine } from '../useRoomEngine';
// import { MESSAGE_DURATION } from '../../../../constants/message';
import { reactive, computed, defineComponent } from 'vue';
import { useRoomState } from '../../states/RoomState';

const { currentRoom } = useRoomState();

export default function useRoomAudioAction() {
  const { t } = useI18n();
  const roomEngine = useRoomEngine();
  let stateForAllAudio = false;

  // todo: 测试在点击确定期间有其他管理员改变状态的 case

  function toggleRoomAudio() {
    stateForAllAudio = !currentRoom.value?.isMicrophoneDisableForAllUser;
    TUIMessageBox({
      title: currentRoom.value?.isMicrophoneDisableForAllUser
        ? t('Enable all audios')
        : t('All current and new members will be muted'),
      message: currentRoom.value?.isMicrophoneDisableForAllUser
        ? t('After unlocking, users can freely turn on the microphone')
        : t('Members will not be able to open the microphone'),
      confirmButtonText: t('Confirm'),
      cancelButtonText: t('Cancel'),
      callback: async action => {
        if (action === 'confirm') {
          doToggleRoomAudio();
        }
      },
    });
  }

  async function doToggleRoomAudio() {
    if (currentRoom.value?.isMicrophoneDisableForAllUser === stateForAllAudio) {
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
      currentRoom.value?.isMicrophoneDisableForAllUser
        ? t('Lift all mute')
        : t('All mute')
    ),
    handler: toggleRoomAudio,
  });
  return roomAudioAction;
}
