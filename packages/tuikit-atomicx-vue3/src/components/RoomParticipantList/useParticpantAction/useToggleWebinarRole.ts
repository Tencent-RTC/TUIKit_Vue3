import type { Component } from 'vue';
import { IconSetAdmin, IconRevokeAdmin, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useRoomParticipantState } from '../../../states/RoomParticipantState';
import type { RoomParticipant, RoomUser } from '../../../types';

const { t } = useUIKit();
const { promoteToParticipant, demoteToAudience } = useRoomParticipantState();

export function usePromoteToParticipantAction(
  { targetParticipant }: { targetParticipant: RoomParticipant | RoomUser },
): {
    key: string;
    icon: Component;
    label: string;
    handler: () => void;
  } {
  return {
    key: 'promoteToParticipant',
    icon: IconSetAdmin,
    label: t('ParticipantList.PromoteToParticipant'),
    handler: () => {
      promoteToParticipant({ userId: targetParticipant.userId });
    },
  };
}

export function useDemoteToAudienceAction(
  { targetParticipant }: { targetParticipant: RoomParticipant | RoomUser },
): {
    key: string;
    icon: Component;
    label: string;
    handler: () => void;
  } {
  return {
    key: 'demoteToAudience',
    icon: IconRevokeAdmin,
    label: t('ParticipantList.DemoteToAudience'),
    handler: () => {
      demoteToAudience({ userId: targetParticipant.userId });
    },
  };
}
