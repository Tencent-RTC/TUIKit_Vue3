import { reactive, computed, defineComponent } from 'vue';
import { TUIMediaDevice } from '@tencentcloud/tuiroom-engine-electron';
import { TUIToast, TOAST_TYPE, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import TUIMessageBox from '../../baseComp/MessageBox';
import { useRoomState } from '../../states/RoomState';
import { useRoomEngine } from '../useRoomEngine';
// import { MESSAGE_DURATION } from '../../../../constants/message';

const { currentRoom } = useRoomState();

export default function useRoomAudioAction() {
  const { t } = useUIKit();
  const roomEngine = useRoomEngine();
  let stateForAllAudio = false;

  // todo: 测试在点击确定期间有其他管理员改变状态的 case

  function toggleRoomAudio() {
    stateForAllAudio = !currentRoom.value?.isAllMicrophoneDisabled;
    TUIMessageBox({
      title: currentRoom.value?.isAllMicrophoneDisabled
        ? t('ParticipantList.UnmuteAll')
        : t('ParticipantList.MuteAllTip'),
      message: currentRoom.value?.isAllMicrophoneDisabled
        ? t('ParticipantList.UnmuteAllDesc')
        : t('ParticipantList.MicDisabledTip'),
      confirmButtonText: t('ParticipantList.Confirm'),
      cancelButtonText: t('ParticipantList.Cancel'),
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
        ? t('ParticipantList.AudioDisabled')
        : t('ParticipantList.AudioEnabled');
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
        ? t('ParticipantList.UnmuteAll')
        : t('ParticipantList.MuteAll'),
    ),
    handler: toggleRoomAudio,
  });
  return roomAudioAction;
}
