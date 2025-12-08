import type { Component } from 'vue';
import { reactive, markRaw, computed } from 'vue';
import { TUIToast, TOAST_TYPE, IconTransferOwner, TUIMessageBox, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useDeviceState } from '../../../states/DeviceState';
import { useRoomParticipantState } from '../../../states/RoomParticipantState';
import { useRoomState } from '../../../states/RoomState';
import { DeviceStatus, RoomParticipantRole } from '../../../types';
import type { RoomParticipant } from '../../../types';

const { currentRoom } = useRoomState();
const { t } = useUIKit();
const { localParticipant, transferOwner } = useRoomParticipantState();
const { stopScreenShare } = useDeviceState();
export function useTransferOwnerAction(
  { targetParticipant }: { targetParticipant: RoomParticipant },
): {
    key: string;
    icon: Component;
    label: string;
    handler: () => void;
  } {
  const displayName = computed(() => targetParticipant.nameCard || targetParticipant.userName || targetParticipant.userId);

  function transferOwnerFunc() {
    TUIMessageBox.confirm({
      title: t('ParticipantList.TransferHostTo', {
        name: displayName.value,
      }),
      content: t(
        'ParticipantList.TransferHostWarning',
      ),
      confirmText: t('ParticipantList.ConfirmTransfer'),
      cancelText: t('ParticipantList.Cancel'),
      callback: async (action) => {
        if (action === 'confirm') {
          handleTransferOwner();
        }
      },
    });
  }

  async function handleTransferOwner() {
    if (localParticipant.value?.role === RoomParticipantRole.Owner) {
      try {
        // todo: 测试这里的开着屏幕分享转交房主，是否停止屏幕分享
        if (
          localParticipant.value?.screenShareStatus === DeviceStatus.On
          && currentRoom.value?.isAllScreenShareDisabled
        ) {
          stopScreenShare();
        }
        await transferOwner({
          userId: targetParticipant.userId,
        });
        TUIToast({
          type: TOAST_TYPE.SUCCESS,
          message: t('ParticipantList.TransferHostSuccess', {
            name: displayName.value,
          }),
        });
      } catch (error: any) {
        TUIToast({
          type: TOAST_TYPE.ERROR,
          message: t('ParticipantList.TransferHostFailed'),
        });
      }
    }
  }

  const transferOwnerAction = reactive({
    key: 'transferOwner',
    icon: markRaw(IconTransferOwner),
    label: t('ParticipantList.TransferHost'),
    handler: transferOwnerFunc,
  });
  return transferOwnerAction;
}
