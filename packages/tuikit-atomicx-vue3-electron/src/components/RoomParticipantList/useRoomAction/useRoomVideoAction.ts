import { computed, reactive } from 'vue';
import { TUIToast, TOAST_TYPE, useUIKit, TUIMessageBox } from '@tencentcloud/uikit-base-component-vue3';
import { useRoomParticipantState } from '../../../states/RoomParticipantState';
import { useRoomState } from '../../../states/RoomState';
import { DeviceType } from '../../../types';

const { currentRoom } = useRoomState();

const { disableAllDevices } = useRoomParticipantState();

export default function useRoomVideoAction(): {
  key: string;
  label: string;
  handler: () => void;
} {
  const { t } = useUIKit();
  let stateForAllVideo = false;

  function toggleRoomVideo() {
    stateForAllVideo = !currentRoom.value?.isAllCameraDisabled;
    TUIMessageBox.confirm({
      title: currentRoom.value?.isAllCameraDisabled
        ? t('ParticipantList.EnableAllVideo')
        : t('ParticipantList.DisableAllVideoTip'),
      content: currentRoom.value?.isAllCameraDisabled
        ? t('ParticipantList.EnableAllVideoDesc')
        : t('ParticipantList.CameraDisabledTip'),
      confirmText: t('ParticipantList.Confirm'),
      cancelText: t('ParticipantList.Cancel'),
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
      });
      return;
    }
    await disableAllDevices({
      deviceType: DeviceType.Camera,
      disable: stateForAllVideo,
    });
  }

  const roomVideoAction = reactive({
    key: 'AllVideoAction',
    label: computed(() =>
      currentRoom.value?.isAllCameraDisabled
        ? t('ParticipantList.EnableAllVideo')
        : t('ParticipantList.DisableAllVideo'),
    ),
    handler: toggleRoomVideo,
  });

  return roomVideoAction;
}
