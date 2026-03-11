import type { Component } from 'vue';
import { computed, reactive, markRaw } from 'vue';
import { TUIToast, TOAST_TYPE, IconChatForbidden, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useRoomParticipantState } from '../../../states/RoomParticipantState';
import type { RoomParticipant } from '../../../types';

const { t } = useUIKit();
const { muteParticipantMessage } = useRoomParticipantState();
export function useMessageAction(
  { targetParticipant }: { targetParticipant: RoomParticipant },
): {
    key: string;
    icon: Component;
    label: string;
    handler: () => void;
  } {
  async function disableUserChat() {
    const { isMessageDisabled } = targetParticipant;
    try {
      await muteParticipantMessage({
        userId: targetParticipant.userId,
        mute: !isMessageDisabled,
      });
    } catch (error: any) {
      TUIToast({
        type: TOAST_TYPE.ERROR,
        message: t('ParticipantList.DisableChatFailed'),
      });
    }
  }

  const chatControl = reactive({
    key: 'chatAction',
    icon: markRaw(IconChatForbidden),
    label: computed(() =>
      targetParticipant.isMessageDisabled ? t('ParticipantList.EnableChat') : t('ParticipantList.DisableChat'),
    ),
    handler: disableUserChat,
  });

  return chatControl;
}
