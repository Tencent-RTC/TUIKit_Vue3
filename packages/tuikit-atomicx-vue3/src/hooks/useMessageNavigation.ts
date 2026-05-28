/**
 * useMessageNavigation — 统一的消息定位跳转高亮能力
 *
 * 两条路径：
 * 1. 目标消息已在列表中 → 直接滚动 + 高亮
 * 2. 目标消息不在列表中 → 加载消息（loadMessages with cursor）→ 滚动 + 高亮
 *
 * 使用方：TextMessage.vue（引用跳转）等已在会话内的场景。
 * 跨会话跳转（Search）通过 setPendingLocateMessage + setActiveConversation 走 MessageList 初始化路径。
 */
import { inject, nextTick } from 'vue';
import type { MessageInfo } from '@atomicxcore/core';
import { useChatContext } from '../chat-store';
import { useChatUIState } from '../context/useChatUIState';
import { useScroll } from './useScroll';
import { TUIToast, useUIKit } from '@tencentcloud/uikit-base-component-vue3';

export interface NavigateToMessageOptions {
  /** 目标消息 ID */
  messageID: string;
  /** 用于 loadMessages cursor 的信息（消息不在列表时需要） */
  cursor?: MessageInfo;
  /** 高亮持续时间，默认 3000ms */
  highlightDuration?: number;
}

export function useMessageNavigation(channel?: string) {
  const resolvedChannel = channel ?? (inject('channel', 'default') as string);
  const { highlightMessage, listMode } = useChatUIState(resolvedChannel);
  const { scrollToMessage } = useScroll();
  const { t } = useUIKit();
  const { messageList, loadMessages } = useChatContext(resolvedChannel);

  async function navigateToMessage(options: NavigateToMessageOptions) {
    const { messageID, cursor, highlightDuration = 3000 } = options;

    const currentMessageList = messageList.value ?? [];
    const isInList = currentMessageList.some((msg: MessageInfo) => msg.msgID === messageID);

    // 获取滚动容器：fallback 到 DOM 查询
    const container = document.querySelector('#messageScrollList') as HTMLElement | null;

    if (isInList) {
      // Path 1: 消息已在列表中，直接滚动 + 高亮
      await nextTick();
      await scrollToMessage(container, messageID, {
        block: 'center',
        skipIfVisible: false,
        behavior: 'instant',
      }).catch(() => {});
      highlightMessage({ messageID, duration: highlightDuration });
    } else if (cursor) {
      // Path 2: 消息不在列表中，切换到 fragment 模式 → 加载 + 滚动 + 高亮
      await loadMessages({
        messageListType: 'history',
        cursor: cursor,
        direction: 'both',
      })
        .then(() => {
          listMode.value = 'fragment';
          nextTick(() => {
            scrollToMessage(container, messageID, {
              block: 'center',
              skipIfVisible: false,
              behavior: 'instant',
            }).catch(() => {});
            highlightMessage({ messageID, duration: highlightDuration });
          });
        })
        .catch(() => {
          TUIToast.error({
            message: t('MessageList.origin_message_has_been_recalled'),
          });
        });
    }
  }

  return { navigateToMessage };
}
