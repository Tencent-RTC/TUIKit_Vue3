import { reactive, markRaw } from 'vue';
import { TUIRole } from '@tencentcloud/tuiroom-engine-electron';
import { TUIToast, TOAST_TYPE, IconTransferOwner, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
// import { MESSAGE_DURATION } from '@/core/constants/message';
import TUIMessageBox from '../../baseComp/MessageBox';
// import eventBus from '@/core/hooks/useMitt';
import { useRoomState } from '../../states/RoomState';
import useUserState from '../../states/UserState/index';
import { UserAction, DeviceStatus } from '../../types';
import useRoomEngine from '../useRoomEngine';
import type { UserInfo } from '../../types';

const roomEngine = useRoomEngine();

export default function useTransferOwnerAction(userInfo: UserInfo) {
  const { t } = useUIKit();
  const { localUser, getDisplayName } = useUserState();
  const { currentRoom } = useRoomState();
  function transferOwnerFunc() {
    TUIMessageBox({
      title: t('ParticipantList.TransferHostTo', {
        name: getDisplayName(userInfo),
      }),
      message: t(
        'ParticipantList.TransferHostWarning',
      ),
      confirmButtonText: t('ParticipantList.ConfirmTransfer'),
      cancelButtonText: t('ParticipantList.Cancel'),
      callback: async (action) => {
        if (action === 'confirm') {
          handleTransferOwner();
        }
      },
    });
  }

  /**
   * Transfer host to user
   */
  async function handleTransferOwner() {
    const roomInfo = await roomEngine.instance?.fetchRoomInfo();
    if (roomInfo?.roomOwner === localUser.value?.userId) {
      try {
        // todo: 测试这里的开着屏幕分享转交房主，是否停止屏幕分享
        if (
          localUser.value?.screenStatus === DeviceStatus.On
          && currentRoom.value?.isScreenShareDisableForAllUser
        ) {
          // eventBus.emit('ScreenShare:stopScreenShare');
        }
        await roomEngine.instance?.changeUserRole({
          userId: userInfo.userId,
          userRole: TUIRole.kRoomOwner,
        });
        TUIToast({
          type: TOAST_TYPE.SUCCESS,
          message: t('ParticipantList.TransferHostSuccess', {
            name: getDisplayName(userInfo),
          }),
          // duration: MESSAGE_DURATION.NORMAL,
        });
      } catch (error) {
        TUIToast({
          type: TOAST_TYPE.ERROR,
          message: t('ParticipantList.TransferHostFailed'),
          // duration: MESSAGE_DURATION.NORMAL,
        });
      }
    }
  }

  const transferOwner = reactive({
    key: UserAction.TransferOwnerAction,
    icon: markRaw(IconTransferOwner),
    label: t('ParticipantList.TransferHost'),
    handler: transferOwnerFunc,
  });
  return transferOwner;
}
