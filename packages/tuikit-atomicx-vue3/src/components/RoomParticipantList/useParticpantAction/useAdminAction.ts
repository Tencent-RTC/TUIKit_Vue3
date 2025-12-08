import type { Component } from 'vue';
import { computed } from 'vue';
import { TUIToast, TOAST_TYPE, IconSetAdmin, IconRevokeAdmin, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useRoomParticipantState } from '../../../states/RoomParticipantState';
import type { RoomParticipant } from '../../../types';

const { t } = useUIKit();
const { setAdmin, revokeAdmin } = useRoomParticipantState();

export function useSetAdminAction(
  { targetParticipant }: { targetParticipant: RoomParticipant },
): {
    key: string;
    icon: Component;
    label: string;
    handler: () => void;
  } {
  const displayName = computed(() => targetParticipant.nameCard || targetParticipant.userName || targetParticipant.userId);

  return {
    key: 'setAdmin',
    icon: IconSetAdmin,
    label: t('ParticipantList.SetAdmin'),
    handler: () => {
      setAdmin({ userId: targetParticipant.userId });
      TUIToast({
        type: TOAST_TYPE.SUCCESS,
        message: t('ParticipantList.SetAdminSuccess', { name: displayName.value }),
      });
    },
  };
}

export function useRevokeAdminAction(
  { targetParticipant }: { targetParticipant: RoomParticipant },
): {
    key: string;
    icon: Component;
    label: string;
    handler: () => void;
  } {
  const displayName = computed(() => targetParticipant.nameCard || targetParticipant.userName || targetParticipant.userId);

  return {
    key: 'revokeAdmin',
    icon: IconRevokeAdmin,
    label: t('ParticipantList.RemoveAdmin'),
    handler: () => {
      revokeAdmin({ userId: targetParticipant.userId });
      TUIToast({
        type: TOAST_TYPE.SUCCESS,
        message: t('ParticipantList.RemoveAdminSuccess', { name: displayName.value }),
      });
    },
  };
}
