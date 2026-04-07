import { computed, reactive, markRaw } from 'vue';
import { TUIToast, TOAST_TYPE, IconChatForbidden, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
// import { MESSAGE_DURATION } from '../../../../constants/message';
import useRoomEngine from '../useRoomEngine';
import { UserInfo, UserAction, ActionType } from '../../types';

const roomEngine = useRoomEngine();
const { t } = useUIKit();
export default function useChatAction(
  userInfo: UserInfo
): ActionType<UserAction> {
  async function disableUserChat() {
    const { isMessageDisabled } = userInfo;
    try {
      await roomEngine.instance?.disableSendingMessageByAdmin({
        userId: userInfo.userId,
        isDisable: !isMessageDisabled,
      });
    } catch (error) {
      TUIToast({
        type: TOAST_TYPE.ERROR,
        message: t('ParticipantList.DisableChatFailed'),
        // duration: MESSAGE_DURATION.NORMAL,
      });
    }
  }

  const chatControl = reactive({
    key: UserAction.ChatAction,
    icon: markRaw(IconChatForbidden),
    label: computed(() =>
      userInfo.isMessageDisabled ? t('ParticipantList.EnableChat') : t('ParticipantList.DisableChat')
    ),
    handler: disableUserChat,
  });

  return chatControl;
}
