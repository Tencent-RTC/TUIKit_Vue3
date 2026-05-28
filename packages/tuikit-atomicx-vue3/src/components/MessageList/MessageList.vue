<script lang="ts" setup>
import {
  ref,
  onMounted,
  onUnmounted,
  nextTick,
  watch,
  provide,
  useSlots,
  computed,
} from 'vue';
import type { Component } from 'vue';
import { MessageStatus } from '@atomicxcore/core';
import cs from 'classnames';
import { ObserverView } from '../../baseComp/ObserverView';
import { View } from '../../baseComp/View';
import { useChatContext } from '../../chat-store';
import { useChatUIState } from '../../context/useChatUIState';
import { useReadReceipt } from '../../hooks/useReadReceipt/useReadReceipt';
import { useScroll } from '../../hooks/useScroll';
import { isCallMessage, isCreateGroupMessage } from '../../utils/call';
import { throttle } from '../../utils/lodash';
import { Message as DefaultMessage } from './Message';
import { MessageForward } from './MessageForward';
import { MessageListContextSymbol } from './MessageListContext';
import { MessageTimeDivider as DefaultMessageTimeDivider } from './MessageTimeDivider';
import { ScrollToBottom } from './ScrollToBottom';
import type { MessageAction } from '../../hooks/useMessageActions';
import type { MessageInfo, MessageType } from '@atomicxcore/core';
import { TUIToast, useUIKit } from '@tencentcloud/uikit-base-component-vue3';

// Define message chunk interface
interface MessageChunk {
  timestamp: number; // Milliseconds
  messages: MessageInfo[];
  key: string;
}

interface MessageListProps {
  /** channel */
  channel?: string | undefined;
  alignment?: 'left' | 'right' | 'two-sided';
  /** max time between message group (in seconds) */
  messageAggregationTime?: number | undefined;
  /** enable read receipt */
  enableReadReceipt?: boolean | undefined;
  /** message actions e.g. recall, delete, etc. */
  messageActionList?: MessageAction[] | undefined;
  /** custom filter function */
  filter?: ((message: MessageInfo) => boolean) | undefined;
  /** custom message component */
  Message?: Component | undefined;
  /** custom message timeline component */
  MessageTimeDivider?: Component | undefined;
  /** custom renderers to override built-in message bubble content by MessageType */
  messageRenderers?: Record<MessageType, Component> | undefined;
}

const props = withDefaults(defineProps<MessageListProps>(), {
  /** props */
  channel: 'default',
  alignment: 'two-sided',
  messageAggregationTime: 5 * 60,
  enableReadReceipt: false,
  messageActionList: undefined,
  filter: undefined,
  /** custom components */
  Message: undefined,
  MessageTimeDivider: undefined,
  messageRenderers: undefined,
});

const slots = useSlots();
provide(MessageListContextSymbol, {
  slots,
  get messageRenderers() {
    return props.messageRenderers;
  },
});

const { t } = useUIKit();

const NEAR_BOTTOM_THRESHOLD = 150;
const isNearBottom = ref(true);
const newMessageCount = ref(0);
const didInitialScroll = ref(false);
const loadingOlder = ref(false);
const scrollContainer = ref<HTMLElement | null>(null);

const chatUIState = useChatUIState(props.channel);
const {
  activeConversationID,
  messageList,
  hasNewerMessages,
  clearConversationUnreadCount,
  loadMessages,
  loadOlderMessages,
  messageListOnEvent,
  setActiveConversation,
} = useChatContext(props.channel);
const {
  enableReadReceipt, highlightMessage, recalledMessageIDSet,
  listMode,
  pendingLocateMessage, setPendingLocateMessage,
} = chatUIState;

provide('channel', props.channel);

const { scrollToBottom, scrollToMessage } = useScroll();
const {
  observeMessageList,
  resetProcessedMessages,
} = useReadReceipt({
  enabled: props.enableReadReceipt ?? false,
  channel: props.channel,
  containerSelector: '#messageScrollList',
  getMessageIDFromDom: dom => (dom as HTMLElement).dataset.messageId || '',
});

const enableMessageAggregation = computed(() => props.messageAggregationTime && props.messageAggregationTime > 0);

// Message aggregation logic
const messageChunks = computed(() => {
  if (!messageList.value) {
    return [];
  }

  // Apply filter first
  const filteredMessageList = props.filter
    ? messageList.value.filter(props.filter)
    : messageList.value.filter(message => message.status !== MessageStatus.Deleted);

  // Clear logic for messageAggregationTime: enable message aggregation when value > 0, otherwise disable
  if (!props.messageAggregationTime || props.messageAggregationTime <= 0) {
    // No message aggregation, each message becomes a separate chunk
    return filteredMessageList.map(message => ({
      timestamp: message.timestamp ? message.timestamp.getTime() : 0,
      messages: [message],
      key: `chunk-${message.msgID}`,
    }));
  }

  // Perform message aggregation
  const chunks: MessageChunk[] = [];
  // Convert seconds to milliseconds to match Date.getTime() unit
  const MAX_TIME_BETWEEN_MESSAGE_GROUP = props.messageAggregationTime * 1000;

  filteredMessageList.forEach((message, index, messages) => {
    const messageTime = message.timestamp ? message.timestamp.getTime() : 0;
    const prevChunk = chunks.length > 0 ? chunks[chunks.length - 1] : undefined;
    const prevMessage = index > 0 ? messages[index - 1] : undefined;

    const shouldCreateNewChunk = !prevChunk
      || messageTime - prevChunk.timestamp > MAX_TIME_BETWEEN_MESSAGE_GROUP
      || prevChunk.messages[0].from.userID !== message.from.userID
      || message.status === MessageStatus.Recalled
      || (prevMessage && prevMessage.status === MessageStatus.Recalled)
      || message.status === MessageStatus.Deleted
      || (prevMessage && prevMessage.status === MessageStatus.Deleted)
      || message.status === MessageStatus.Violation
      || (prevMessage && prevMessage.status === MessageStatus.Violation)
      || isCallMessage(message)
      || (prevMessage && isCallMessage(prevMessage))
      || (prevMessage && isCreateGroupMessage(prevMessage));

    if (shouldCreateNewChunk) {
      chunks.push({
        timestamp: messageTime,
        messages: [message],
        key: `chunk-${message.msgID}`,
      });
    } else {
      prevChunk.messages.push(message);
    }
  });

  return chunks;
});

// Monitor scroll events
const handleScroll = throttle(() => {
  const el = scrollContainer.value;
  if (!el) return;
  const wasNearBottom = isNearBottom.value;
  isNearBottom.value = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_THRESHOLD;
  if (isNearBottom.value && listMode.value === 'latest') {
    if (newMessageCount.value > 0) {
      newMessageCount.value = 0;
    }
    // Clear unread on edge: user scrolled back to bottom
    if (!wasNearBottom && activeConversationID.value) {
      clearConversationUnreadCount(activeConversationID.value).catch(() => {});
    }
  }
}, 100);

// Initialize message list
const initializeMessageList = async () => {
  didInitialScroll.value = false;
  newMessageCount.value = 0;
  resetProcessedMessages();

  const locateInfo = pendingLocateMessage.value;
  if (locateInfo && locateInfo.conversationID === activeConversationID.value) {
    listMode.value = 'fragment';
    await loadMessages({
      messageListType: 'history',
      cursor: {
        msgID: locateInfo.messageID,
        sequence: locateInfo.sequence,
        timestamp: locateInfo.time != null ? new Date(locateInfo.time * 1000) : undefined,
      } as any,
      direction: 'both',
    })
    .then(() => {
      listMode.value = 'fragment';
      nextTick(() => {
        scrollToMessage(scrollContainer.value, locateInfo.messageID, {
          block: 'center',
          behavior: 'instant',
        }).catch(() => {});
        highlightMessage({ messageID: locateInfo.messageID, duration: 3000 });
        setPendingLocateMessage(null);
        didInitialScroll.value = true;
        observeMessageList();
      });
    })
    .catch(() => {
      setPendingLocateMessage(null);
      TUIToast.error({
        message: t('MessageList.origin_message_has_been_recalled'),
      });
      if (!didInitialScroll.value) {
        loadMessages();
      }
    });
  } else {
    listMode.value = 'latest';
    await loadMessages();
    await nextTick();
    await nextTick();
    scrollToBottom(scrollContainer.value, 'auto');
    didInitialScroll.value = true;
    observeMessageList();
  }
};

// Load more older messages
const handleLoadOlder = async () => {
  if (loadingOlder.value || listMode.value === 'fragment') return;
  const el = scrollContainer.value;
  if (!el || !messageList.value?.length) return;
  const oldScrollHeight = el.scrollHeight;
  loadingOlder.value = true;
  try {
    await loadOlderMessages();
    await nextTick();
    if (scrollContainer.value) {
      scrollContainer.value.scrollTop = scrollContainer.value.scrollHeight - oldScrollHeight;
    }
  } finally {
    loadingOlder.value = false;
  }
};

const handleBackToLatest = async () => {
  if (!activeConversationID.value) return;
  listMode.value = 'latest';
  newMessageCount.value = 0;
  await loadMessages();
  await nextTick();
  scrollToBottom(scrollContainer.value, 'instant');
  observeMessageList();
};

let unsubscribeEvent: (() => void) | null = null;

function handleNewMessage(message: MessageInfo) {
  // 自己发的消息：fragment 模式先切回 latest，latest 模式直接滚底
  if (message.isSentBySelf) {
    if (listMode.value === 'fragment') {
      handleBackToLatest();
    } else {
      nextTick(() => scrollToBottom(scrollContainer.value, 'smooth'));
    }
    return;
  }

  // Other's message
  if (activeConversationID.value) {
    clearConversationUnreadCount(activeConversationID.value).catch(() => {});
  }
  if (listMode.value === 'fragment') {
    newMessageCount.value++;
    return;
  }
  if (isNearBottom.value) {
    nextTick(() => scrollToBottom(scrollContainer.value, 'smooth'));
  } else {
    newMessageCount.value++;
  }
}

watch(activeConversationID, () => {
  recalledMessageIDSet.value = new Set();
  if (unsubscribeEvent) {
    unsubscribeEvent();
  }
  unsubscribeEvent = messageListOnEvent((event) => {
    if (event.type === 'onReceiveNewMessage') {
      handleNewMessage(event.message);
    }
  });
  initializeMessageList();
});

// Same-conversation search locate
watch(pendingLocateMessage, (locateInfo) => {
  if (!locateInfo) return;
  if (locateInfo.conversationID === activeConversationID.value) {
    initializeMessageList();
  }
});

// Fragment 模式下翻到最新时，自动切回 latest
watch(hasNewerMessages, (hasNewer) => {
  if (hasNewer === false && listMode.value === 'fragment') {
    listMode.value = 'latest';
    newMessageCount.value = 0;
    nextTick(() => scrollToBottom(scrollContainer.value, 'auto'));
  }
});

// Populate recalledMessageIDSet by scanning messageList for recalled messages.
// UIContext only holds the container (and keeps it append-only across the app
// lifecycle); MessageList owns the filling logic because only it has access to
// the messageList data source. Mirrors the legacy MessageListState behaviour
// of `if (message.isRevoked) recalledMessageIDSet.add(message.ID)`, mapped to
// the new API where `msgID` replaces `ID` and `MessageStatus.Recalled` replaces
// the `isRevoked` boolean.
watch(messageList, (currentMessageList) => {
  if (!currentMessageList?.length) {
    return;
  }
  let updated: Set<string> | null = null;
  for (const message of currentMessageList) {
    if (message.status === MessageStatus.Recalled || message.status === MessageStatus.Deleted) {
      if (updated === null) {
        updated = new Set(recalledMessageIDSet.value);
      }
      updated.add(message.msgID);
    }
  }
  if (updated !== null) {
    recalledMessageIDSet.value = updated;
  }
}, { immediate: true });

watch(() => props.enableReadReceipt, (newEnableReadReceipt) => {
  enableReadReceipt.value = newEnableReadReceipt;
}, {
  immediate: true,
});

onMounted(() => {
  if (scrollContainer.value) {
    scrollContainer.value.addEventListener('scroll', handleScroll, { passive: true });
  }
  unsubscribeEvent = messageListOnEvent((event) => {
    if (event.type === 'onReceiveNewMessage') {
      handleNewMessage(event.message);
    }
  });
  initializeMessageList();
});

onUnmounted(() => {
  if (scrollContainer.value) {
    scrollContainer.value.removeEventListener('scroll', handleScroll);
  }
  if (unsubscribeEvent) {
    unsubscribeEvent();
    unsubscribeEvent = null;
  }
});

defineExpose({
  scrollToBottom: (behavior?: ScrollBehavior) => scrollToBottom(scrollContainer.value, behavior),
});
</script>

<template>
  <div class="message-list">
    <div
      id="messageScrollList"
      ref="scrollContainer"
      class="message-list-container"
    >
      <ObserverView
        v-if="listMode === 'latest'"
        root="#messageScrollList"
        :rootMargin="'50px 0px 0px 0px'"
        :threshold="0.1"
        @on-show="handleLoadOlder"
      >
        <div id="loadMore" />
      </ObserverView>

      <View
        v-for="(chunk, chunkIndex) in messageChunks"
        :key="chunk.key"
        :class="cs('message-chunk--container')"
      >
        <!-- <div>11</div> -->
        <!-- Time Divider -->
        <component
          :is="props.MessageTimeDivider || DefaultMessageTimeDivider"
          :previousMessage="chunkIndex > 0 ? messageChunks[chunkIndex-1].messages[0] : undefined"
          :currentMessage="chunk.messages[0]"
        />

        <!-- Message Chunk -->
        <div class="message-chunk">
          <template
            v-for="(message, messageIndex) in chunk.messages"
            :key="message.msgID"
          >
            <component
              :is="props.Message || DefaultMessage"
              :message="message"
              :alignment="props.alignment"
              :messageActionList="props.messageActionList"
              :isAggregated="Boolean(enableMessageAggregation && messageIndex !== 0)"
              :is-first-in-chunk="Boolean(messageIndex === 0)"
              :is-last-in-chunk="Boolean(messageIndex === chunk.messages.length - 1)"
              :isHiddenMessageAvatar="
                Boolean(enableMessageAggregation && messageIndex !== 0)
              "
              :removeAvatar="
                Boolean(alignment === 'two-sided' && message.isSentBySelf)
              "
              :is-hidden-message-nick="
                Boolean(
                  (alignment === 'two-sided'
                    ? enableMessageAggregation && messageIndex !== 0 || message.isSentBySelf
                    : enableMessageAggregation && messageIndex !== 0)
                )
              "
            />
          </template>
        </div>
      </View>
      <div style="height: 10px;" />
    </div>
    <MessageForward />
    <ScrollToBottom
      v-if="listMode === 'fragment' || (!isNearBottom && listMode === 'latest')"
      :class="cs('scroll-to-bottom')"
      @click="listMode === 'fragment' ? handleBackToLatest() : scrollToBottom(scrollContainer, 'smooth')"
    />
  </div>
</template>

<style lang="scss" scoped>
@use '../../styles/mixins/_scrollbar.scss' as scrollbar;

.message-list {
  position: relative;
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  overflow: hidden;
  background-color: var(--bg-color-operate);
}
.message-list-container {
  flex: 1;
  height: 100%;
  padding: 0 10px;
  overflow: auto;
  @include scrollbar.scrollbar-hidden();
}
.message-chunk--container {
  margin-top: 25px;
}
.message-chunk {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.message-action-mask {
  position: absolute;
  width: 100%;
  height: 100%;
  background: transparent;
}
.message-action-container {
  position: absolute;
}

.highlight-shadow {
  @keyframes shadow-blink {
    50% {
      box-shadow: rgba(255, 156, 25, 1) 0 0 10px 0;
    }
  }

  & {
    box-shadow: rgba(255, 156, 25, 0) 0 0 10px 0;
    animation: shadow-blink 1s linear 3;
  }
}

.new-message-notification {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: var(--primary-color, #006eff);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 10;
  transition: all 0.3s ease;

  &:hover {
    background-color: var(--primary-color-hover, #0057cc);
  }
}

.scroll-to-bottom {
  position: absolute;
  bottom: 95px;
  right: 8px;
}
</style>
