import { reactive, markRaw } from 'vue';
import useRoomEngine from '../useRoomEngine';
import { useI18n } from '../../locales';
import TUIMessageBox from '../../baseComp/MessageBox';
import { UserInfo, UserAction } from '../../types';
import { IconKickOut } from '@tencentcloud/uikit-base-component-vue3';
import useUserState from '../../states/UserState/index';

const roomEngine = useRoomEngine();
const { t } = useI18n();
const { getDisplayName } = useUserState();
export default function useKickUserAction(userInfo: UserInfo) {
  async function kickUserFunc() {
    TUIMessageBox({
      title: t('Note'),
      message: t('whether to kick sb off the room', {
        name: getDisplayName(userInfo),
      }),
      confirmButtonText: t('Confirm'),
      cancelButtonText: t('Cancel'),
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
    label: t('Kick out'),
    handler: kickUserFunc,
  });
  return kickUser;
}
