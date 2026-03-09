import type { Component } from 'vue';
import { TUIErrorCode } from '@tencentcloud/tuiroom-engine-js';
import { IconSetAdmin, IconRevokeAdmin, useUIKit, TUIToast } from '@tencentcloud/uikit-base-component-vue3';
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
    handler: async () => {
      try {
        await promoteToParticipant({ userId: targetParticipant.userId });
      } catch (_error) {
        if (_error && typeof _error === 'object' && 'code' in _error && _error?.code === TUIErrorCode.ERR_ALL_SEAT_OCCUPIED) {
          TUIToast.error({
            message: t('ParticipantList.ParticipantCountLimit'),
          });
          return;
        }
        TUIToast.error({
          message: t('ParticipantList.PromoteToParticipantFailed'),
        });
      }
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
    handler: async () => {
      try {
        await demoteToAudience({ userId: targetParticipant.userId });
      } catch (_error) {
        TUIToast.error({
          message: t('ParticipantList.DemoteToAudienceFailed'),
        });
      }
    },
  };
}
