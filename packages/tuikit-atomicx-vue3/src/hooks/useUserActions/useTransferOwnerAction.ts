import { reactive, markRaw } from 'vue';
import { TUIRole } from '@tencentcloud/tuiroom-engine-js';
import { TUIToast, TOAST_TYPE } from '@tencentcloud/uikit-base-component-vue3';
// import { MESSAGE_DURATION } from '@/core/constants/message';
import useRoomEngine from '../useRoomEngine';
import { useI18n } from '../../locales';
import { IconTransferOwner } from '@tencentcloud/uikit-base-component-vue3';
import TUIMessageBox from '../../baseComp/MessageBox';
// import eventBus from '@/core/hooks/useMitt';
import { UserInfo, UserAction, DeviceStatus } from '../../types';
import { useRoomState } from '../../states/RoomState';
import useUserState from '../../states/UserState/index';

const roomEngine = useRoomEngine();
const { t } = useI18n();
const { localUser,getDisplayName } = useUserState();
const { currentRoom } = useRoomState();
export default function useTransferOwnerAction(userInfo: UserInfo) {
  function transferOwnerFunc() {
    TUIMessageBox({
      title: t('Transfer the roomOwner to sb', {
        name: getDisplayName(userInfo),
      }),
      message: t(
        'After transfer the room owner, you will become a general user'
      ),
      confirmButtonText: t('Confirm transfer'),
      cancelButtonText: t('Cancel'),
      callback: async action => {
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
          localUser.value?.screenStatus === DeviceStatus.On &&
          currentRoom.value?.isScreenShareDisableForAllUser
        ) {
          // eventBus.emit('ScreenShare:stopScreenShare');
        }
        await roomEngine.instance?.changeUserRole({
          userId: userInfo.userId,
          userRole: TUIRole.kRoomOwner,
        });
        TUIToast({
          type: TOAST_TYPE.SUCCESS,
          message: t('The room owner has been transferred to sb', {
            name: getDisplayName(userInfo),
          }),
          // duration: MESSAGE_DURATION.NORMAL,
        });
      } catch (error) {
        TUIToast({
          type: TOAST_TYPE.ERROR,
          message: t('Make host failed, please try again.'),
          // duration: MESSAGE_DURATION.NORMAL,
        });
      }
    }
  }

  const transferOwner = reactive({
    key: UserAction.TransferOwnerAction,
    icon: markRaw(IconTransferOwner),
    label: t('Make host'),
    handler: transferOwnerFunc,
  });
  return transferOwner;
}
