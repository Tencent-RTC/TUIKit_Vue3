import type { Component } from 'vue';
import { computed } from 'vue';
import {
  IconAudioOpen,
  IconAudioClose,
  TUIToast,
  TOAST_TYPE,
  useUIKit,
} from '@tencentcloud/uikit-base-component-vue3';
import { useRoomParticipantState } from '../../../states/RoomParticipantState';
import { DeviceType } from '../../../types';
import type { RoomParticipant } from '../../../types';

const { t } = useUIKit();

export function useMuteAudioAction(
  { targetParticipant }: { targetParticipant: RoomParticipant },
): {
    key: string;
    icon: Component;
    label: string;
    handler: () => void;
  } {
  const { closeParticipantDevice } = useRoomParticipantState();
  async function muteUserAudio() {
    await closeParticipantDevice({
      userId: targetParticipant.userId,
      deviceType: DeviceType.Microphone,
    });
  }
  return {
    key: 'muteAudio',
    icon: IconAudioOpen,
    label: t('ParticipantList.Mute'),
    handler: muteUserAudio,
  };
}

export function useUnmuteAudioAction(
  { targetParticipant }: { targetParticipant: RoomParticipant },
): {
    key: string;
    icon: Component;
    label: string;
    handler: () => void;
  } {
  const { inviteToOpenDevice } = useRoomParticipantState();
  const displayName = computed(() => targetParticipant.nameCard || targetParticipant.userName || targetParticipant.userId);

  async function unmuteUserAudio() {
    // TODO: 补充已经发送了请求的情况
    // if (userInfo.microphoneStatus === DeviceStatus.OffInvitationPending) {
    //   TUIToast({
    //     type: TOAST_TYPE.INFO,
    //     message: `${t('An invitation to open the microphone has been sent to someone', { name: displayName.value })}`,
    //     // duration: MESSAGE_DURATION.NORMAL,
    //   });
    //   return;
    // }
    await inviteToOpenDevice({ userId: targetParticipant.userId, device: DeviceType.Microphone, timeout: 30 });
    TUIToast({
      type: TOAST_TYPE.INFO,
      message: `${t('ParticipantList.InviteMicSent', { name: displayName.value })}`,
    });
  }

  return {
    key: 'unmuteAudio',
    icon: IconAudioClose,
    label: t('ParticipantList.Unmute'),
    handler: unmuteUserAudio,
  };
}
