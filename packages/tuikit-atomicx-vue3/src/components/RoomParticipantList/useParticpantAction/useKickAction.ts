import type { Component } from 'vue';
import { reactive, markRaw, computed } from 'vue';
import { useUIKit, IconKickOut, TUIMessageBox } from '@tencentcloud/uikit-base-component-vue3';
import { useRoomParticipantState } from '../../../states/RoomParticipantState';
import type { RoomParticipant } from '../../../types';

const { t } = useUIKit();
const { kickParticipant } = useRoomParticipantState();
export function useKickAction(
  { targetParticipant }: { targetParticipant: RoomParticipant },
): {
    key: string;
    icon: Component;
    label: string;
    handler: () => void;
  } {
  const displayName = computed(() => targetParticipant.nameCard || targetParticipant.userName || targetParticipant.userId);

  async function kickUserFunc() {
    TUIMessageBox.confirm({
      title: t('ParticipantList.Note'),
      content: t('ParticipantList.ConfirmKick', {
        name: displayName.value,
      }),
      confirmText: t('ParticipantList.Confirm'),
      cancelText: t('ParticipantList.Cancel'),
      callback: async (action) => {
        if (action === 'confirm') {
          await kickParticipant({
            userId: targetParticipant.userId,
          });
        }
      },
    });
  }
  const kickAction = reactive({
    key: 'kick',
    icon: markRaw(IconKickOut),
    label: t('ParticipantList.KickOut'),
    style: {
      color: '#FF0000',
    },
    handler: kickUserFunc,
  });
  return kickAction;
}
