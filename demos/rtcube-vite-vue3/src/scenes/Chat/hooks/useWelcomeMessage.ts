import { onUnmounted, watch } from 'vue';
import { useChatContext } from '@tencentcloud/chat-uikit-vue3';
import { reportEvent } from '@/utils/aegis';
import {
  AEGIS_EVENTS,
  AEGIS_PAGES,
  AEGIS_PLATFORMS,
  AEGIS_SCENES,
  AEGIS_SUB_SCENES,
  type AegisSubScene,
} from '@/constants/aegis';

// The conversation the GitHub demo opens by default.
// This prop is injected into <Chat> by publish-github.js, so the welcome
// message is only sent when the default conversation is actually opened.
const DEFAULT_OPEN_CONVERSATION_ID = 'C2Cadministrator';

// Module-level flag ensures the welcome message is sent only once per app
// session, even when switching between General and Medical chat scenes.
let welcomeMessageSent = false;

const WELCOME_TEXT = `欢迎体验 Chat Vue3 桌面端WEB应用 Demo～

您可以按照以下顺序体验 IM 的核心功能：
1. 在输入框内发送一条文本消息。
2. 输入框上的工具栏支持语音通话、视频通话、图片、视频、文件发送等扩展功能。
3. 如果您想添加好友，可以前往联系人页面点击"添加好友/群聊"。`;

/**
 * Send a welcome message once when the default conversation
 * (C2Cadministrator) becomes active. Re-arms the timer on conversation
 * switches and never sends twice per app session.
 */
export function useWelcomeMessage(subScene: AegisSubScene = AEGIS_SUB_SCENES.GENERAL) {
  const { activeConversation, sendMessage } = useChatContext();

  let timer: ReturnType<typeof setTimeout> | null = null;

  const stopWatch = watch(
    () => activeConversation.value?.conversationID,
    (conversationID) => {
      if (timer) clearTimeout(timer);
      if (!conversationID || welcomeMessageSent) return;
      // Wait for the conversation to settle before sending the welcome message
      timer = setTimeout(() => {
        if (welcomeMessageSent) return;
        if (activeConversation.value?.conversationID !== DEFAULT_OPEN_CONVERSATION_ID) return;
        sendMessage({
          type: 'textMessage',
          text: WELCOME_TEXT,
        });
        welcomeMessageSent = true;
        reportEvent(
          AEGIS_EVENTS.WELCOME_MESSAGE_SENT,
          AEGIS_PLATFORMS.WEB,
          AEGIS_PAGES.DETAIL,
          AEGIS_SCENES.CHAT,
          subScene,
        );
      }, 1000);
    },
    { immediate: true },
  );

  onUnmounted(() => {
    stopWatch();
    if (timer) clearTimeout(timer);
  });
}
