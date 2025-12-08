import type { Component } from 'vue';
import { computed, reactive } from 'vue';
import { IconAllMembersShareScreen, IconHostShareScreen, TUIMessageBox, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useRoomParticipantState } from '../../../states/RoomParticipantState';
import { useRoomState } from '../../../states/RoomState';
import { DeviceType, RoomParticipantRole } from '../../../types';

const { participantWithScreen, disableAllDevices, closeParticipantDevice } = useRoomParticipantState();
const { currentRoom } = useRoomState();

export default function useRoomScreenAction(): {
  key: string;
  label: string;
  icon: Component;
  handler: () => void;
} {
  const { t } = useUIKit();
  let stateForScreenShare = false;
  async function toggleAllScreenShare() {
    await disableAllDevices({
      deviceType: DeviceType.ScreenShare,
      disable: stateForScreenShare,
    });
  }

  function toggleRoomScreen() {
    stateForScreenShare = !currentRoom.value?.isAllScreenShareDisabled;
    if (!participantWithScreen.value || participantWithScreen.value.role === RoomParticipantRole.GeneralUser) {
      toggleAllScreenShare();
      return;
    }
    TUIMessageBox.confirm({
      title: t(
        'ParticipantList.ConfirmHostAdminOnlyShare',
      ),
      content: t(
        'ParticipantList.TerminateOtherShare',
      ),
      confirmText: t('ParticipantList.Confirm'),
      cancelText: t('ParticipantList.Cancel'),
      callback: async (action) => {
        if (action === 'confirm') {
          await closeParticipantDevice({
            userId: participantWithScreen.value?.userId as string,
            deviceType: DeviceType.ScreenShare,
          });
          toggleAllScreenShare();
        }
      },
    });
  }

  const roomScreenAction = reactive({
    key: 'AllScreenShareAction',
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
