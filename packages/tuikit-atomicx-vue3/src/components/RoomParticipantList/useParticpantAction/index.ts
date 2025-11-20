import { computed } from 'vue';
import type { ComputedRef, CSSProperties } from 'vue';
import { useRoomParticipantState } from '../../../states/RoomParticipantState';
import { RoomParticipantRole, DeviceStatus } from '../../../types';
import { useSetAdminAction, useRevokeAdminAction } from './useAdminAction';
import { useMuteAudioAction, useUnmuteAudioAction } from './useAudioAction';
import { useKickAction } from './useKickAction';
import { useMessageAction } from './useMessageAction';
import { useNameCardAction } from './useNameCardAction';
import { useTransferOwnerAction } from './useTransferOwnerAction';
import { useMuteVideoAction, useUnmuteVideoAction } from './useVideoAction';
import type { RoomParticipant } from '../../../types';
import type { TUIIcon } from '@tencentcloud/uikit-base-component-vue3';

const {
  localParticipant,
} = useRoomParticipantState();

export function useParticipantAction({ targetParticipant }: { targetParticipant: RoomParticipant }): {
  controlList: ComputedRef<{ key: string; label: string; handler: () => void; icon?: typeof TUIIcon; style?: CSSProperties }[]>;
} {
  const canOperate = computed(() => {
    if (!localParticipant.value) {
      return false;
    }
    const isLocalOwner = localParticipant.value.role === RoomParticipantRole.Owner;
    const isLocalAdmin = localParticipant.value.role === RoomParticipantRole.Admin;
    const isTargetGeneralUser = targetParticipant.role === RoomParticipantRole.GeneralUser;
    return isLocalOwner || (isLocalAdmin && isTargetGeneralUser);
  });

  const isTargetParticipantLocal = computed(() => targetParticipant.userId === localParticipant.value?.userId);

  const canKick = computed(() => canOperate.value && targetParticipant.role === RoomParticipantRole.GeneralUser);

  const canTransferOwner = computed(() => localParticipant.value?.role === RoomParticipantRole.Owner && !isTargetParticipantLocal.value);

  const canSetAdmin = computed(() => localParticipant.value?.role === RoomParticipantRole.Owner && !isTargetParticipantLocal.value && targetParticipant.role === RoomParticipantRole.GeneralUser);

  const canRevokeAdmin = computed(() => localParticipant.value?.role === RoomParticipantRole.Owner && !isTargetParticipantLocal.value && targetParticipant.role === RoomParticipantRole.Admin);

  const nameCardAction = useNameCardAction({ targetParticipant });
  const messageAction = useMessageAction({ targetParticipant });
  const kickAction = useKickAction({ targetParticipant });

  const hasAudio = computed(() => targetParticipant.microphoneStatus === DeviceStatus.On);
  const hasVideo = computed(() => targetParticipant.cameraStatus === DeviceStatus.On);

  const controlList = computed(() => {
    const controlListResult: { key: string; label: string; handler: () => void }[] = [];
    if (!canOperate.value) {
      return controlListResult;
    }
    if (!isTargetParticipantLocal.value) {
      if (hasAudio.value && !isTargetParticipantLocal.value) {
        const muteAudioAction = useMuteAudioAction({ targetParticipant });
        controlListResult.push(muteAudioAction);
      } else {
        const unmuteAudioAction = useUnmuteAudioAction({ targetParticipant });
        controlListResult.push(unmuteAudioAction);
      }
      if (hasVideo.value) {
        const muteVideoAction = useMuteVideoAction({ targetParticipant });
        controlListResult.push(muteVideoAction);
      } else {
        const unmuteVideoAction = useUnmuteVideoAction({ targetParticipant });
        controlListResult.push(unmuteVideoAction);
      }
    }
    if (canTransferOwner.value) {
      const transferOwnerAction = useTransferOwnerAction({ targetParticipant });
      controlListResult.push(transferOwnerAction);
    }
    if (canSetAdmin.value) {
      const setAdminAction = useSetAdminAction({ targetParticipant });
      controlListResult.push(setAdminAction);
    }
    if (canRevokeAdmin.value) {
      const revokeAdminAction = useRevokeAdminAction({ targetParticipant });
      controlListResult.push(revokeAdminAction);
    }
    controlListResult.push(nameCardAction);
    if (!isTargetParticipantLocal.value) {
      controlListResult.push(messageAction);
    }
    if (canKick.value) {
      controlListResult.push(kickAction);
    }
    return controlListResult;
  });

  return {
    controlList,
  };
}
