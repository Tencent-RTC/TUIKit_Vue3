import { reactive, markRaw } from 'vue';
import useRoomEngine from '../useRoomEngine';
import TUIMessageBox from '../../baseComp/MessageBox';
import { UserInfo, UserAction } from '../../types';
import { IconKickOut, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import useUserState from '../../states/UserState/index';

const roomEngine = useRoomEngine();

export default function useKickUserAction(userInfo: UserInfo) {
  const { t } = useUIKit();
  const { getDisplayName } = useUserState();
  async function kickUserFunc() {
    TUIMessageBox({
      title: t('ParticipantList.Note'),
      message: t('ParticipantList.ConfirmKick', {
        name: getDisplayName(userInfo),
      }),
      confirmButtonText: t('ParticipantList.Confirm'),
      cancelButtonText: t('ParticipantList.Cancel'),
      callback: async action => {
        if (action === 'confirm') {
          await roomEngine.instance?.kickRemoteUserOutOfRoom({
            userId: userInfo.userId,
          });
        }
      },
    });
  }
  const kickUser = reactive({
    key: UserAction.KickOutOfRoomAction,
    icon: markRaw(IconKickOut),
    label: t('ParticipantList.KickOut'),
    handler: kickUserFunc,
  });
  return kickUser;
}
