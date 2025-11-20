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
import cs from 'classnames';
import { ObserverView } from '../../baseComp/ObserverView';
import { View } from '../../baseComp/View';
import { useScroll } from '../../hooks/useScroll';
import { useMessageListState } from '../../states/MessageListState';
import { throttle } from '../../utils/lodash';
import { Message as DefaultMessage } from './Message';
import { MessageForward } from './MessageForward';
import { MessageListContextSymbol } from './MessageListContext';
import { MessageTimeDivider as DefaultMessageTimeDivider } from './MessageTimeDivider';
import { ScrollToBottom } from './ScrollToBottom';
import type { MessageAction } from '../../hooks/useMessageActions';
import type { IMessageModel as MessageModel } from '@tencentcloud/chat-uikit-engine';

// Define message chunk interface
interface MessageChunk {
  timestamp: number;
  messages: MessageModel[];
  key: string;
}

interface MessageListProps {
  alignment?: 'left' | 'right' | 'two-sided';
  /** max time between message group */
  messageAggregationTime?: number | undefined;
  /** enable read receipt */
  enableReadReceipt?: boolean | undefined;
  /** message actions e.g. recall, delete, etc. */
  messageActionList?: MessageAction[] | undefined;
  /** custom filter function */
  filter?: ((message: MessageModel) => boolean) | undefined;
  /** custom message component */
  Message?: Component | undefined;
  /** custom message timeline component */
  MessageTimeDivider?: Component | undefined;
}

const props = withDefaults(defineProps<MessageListProps>(), {
  /** props */
  alignment: 'two-sided',
  messageAggregationTime: 5 * 60,
  enableReadReceipt: false,
  messageActionList: undefined,
  filter: undefined,
  /** custom components */
  Message: undefined,
  MessageTimeDivider: undefined,
});

const slots = useSlots();
provide(MessageListContextSymbol, { slots });

const autoScrollThreshold = 150;
const isFinishFirstRender = ref<boolean>(false);
const distanceToBottom = ref<number>(0);
const isLoadingHistory = ref<boolean>(false);
const scrollContainer = ref<HTMLElement | null>(null);
const isScrollToBottomVisible = ref<boolean>(false);

const storeDistanceToBottom = ref<number>(0);

const {
  messageList,
  loadMoreOlderMessage,
  activeConversationID,
  isDisableScroll,
  setIsDisableScroll,
  setEnableReadReceipt,
} = useMessageListState();

const { scrollToBottom } = useScroll();

const enableMessageAggregation = computed(() => props.messageAggregationTime && props.messageAggregationTime > 0);

// Message aggregation logic
const messageChunks = computed(() => {
  if (!messageList.value) {
    return [];
  }
  // Apply filter first
  const filteredMessageList = props.filter
    ? messageList.value.filter(props.filter)
    : messageList.value.filter(message => !message.isDeleted);

  // Clear logic for messageAggregationTime: enable message aggregation when value > 0, otherwise disable
  if (!props.messageAggregationTime || props.messageAggregationTime <= 0) {
    // No message aggregation, each message becomes a separate chunk
    return filteredMessageList.map(message => ({
      timestamp: message.time,
      messages: [message],
      key: `chunk-${message.ID}`,
    }));
  }

  // Perform message aggregation
  const chunks: MessageChunk[] = [];
  const MAX_TIME_BETWEEN_MESSAGE_GROUP = props.messageAggregationTime;

  filteredMessageList.forEach((message, index, messages) => {
    const messageTime = message.time;
    const lastChunk = chunks.length > 0 ? chunks[chunks.length - 1] : undefined;
    const lastMessage = index > 0 ? messages[index - 1] : undefined;

    const shouldCreateNewChunk = !lastChunk
      || messageTime - lastChunk.timestamp > MAX_TIME_BETWEEN_MESSAGE_GROUP
      || lastChunk.messages[0].from !== message.from
      || message.isRevoked
      || (lastMessage && lastMessage.isRevoked)
      || message.status === 'fail'
      || (lastMessage && lastMessage.status === 'fail')
      || message.hasRiskContent
      || (lastMessage && lastMessage.hasRiskContent);

    if (shouldCreateNewChunk) {
      chunks.push({
        timestamp: messageTime,
        messages: [message],
        key: `chunk-${message.ID}`,
      });
    } else {
      lastChunk.messages.push(message);
    }
  });

  return chunks;
});

// Monitor scroll events
const handleScroll = throttle(() => {
  if (!scrollContainer.value) {
    return;
  }

  distanceToBottom.value
    = scrollContainer.value.scrollHeight
      - scrollContainer.value.scrollTop
      - scrollContainer.value.clientHeight;

  if (distanceToBottom.value > autoScrollThreshold) {
    setIsDisableScroll(true);
    isScrollToBottomVisible.value = true;
  }

  // Reset user scroll state if scrolled near bottom
  if (distanceToBottom.value < autoScrollThreshold) {
    setIsDisableScroll(false);
    isScrollToBottomVisible.value = false;
  }
}, 100);

// Initialize message list
const initializeMessageList = async () => {
  isFinishFirstRender.value = false;
  setIsDisableScroll(false);
  isScrollToBottomVisible.value = false;
};

// Load more history messages
const loadMoreHistory = async () => {
  // Skip if initial loading or already loading
  if (!isFinishFirstRender.value || isLoadingHistory.value || !messageList.value?.length) {
    return;
  }

  setIsDisableScroll(true);
  isLoadingHistory.value = true;

  // Record current distance from bottom
  if (!scrollContainer.value) {
    isLoadingHistory.value = false;
    return;
  }

  // Calculate distance from bottom before loading
  storeDistanceToBottom.value = scrollContainer.value.scrollHeight
    - scrollContainer.value.scrollTop
    - scrollContainer.value.clientHeight;

  // Load more messages
  await loadMoreOlderMessage();

  // Wait for DOM update
  await nextTick();

  // Restore scroll position to maintain the same distance from bottom
  if (scrollContainer.value) {
    const newScrollTop = scrollContainer.value.scrollHeight
      - scrollContainer.value.clientHeight
      - storeDistanceToBottom.value;

    // Ensure scroll position is within valid range
    scrollContainer.value.scrollTop = Math.max(0, Math.min(
      scrollContainer.value.scrollHeight - scrollContainer.value.clientHeight,
      newScrollTop,
    ));
  }

  isLoadingHistory.value = false;
};

watch(activeConversationID, () => {
  initializeMessageList();
});

// Monitor message list changes
watch(messageList, (newMessages, oldMessages) => {
  if (oldMessages === undefined && newMessages && !isFinishFirstRender.value) {
    // Switch to a new conversation
    nextTick(() => {
      scrollToBottom({ behavior: 'instant' });
      isFinishFirstRender.value = true;
    });
    return;
  }

  if (!oldMessages || !newMessages || !newMessages.length) {
    return;
  }

  const newLastMessage = newMessages[newMessages.length - 1];
  const oldLastMessage = oldMessages[oldMessages.length - 1];

  if (newLastMessage?.ID !== oldLastMessage?.ID) {
    // new message coming
    const shouldAutoScroll = newLastMessage.flow === 'out'
      || (!isDisableScroll.value && distanceToBottom.value < autoScrollThreshold);

    if (shouldAutoScroll) {
      scrollToBottom({ behavior: 'smooth' });
    } else {
      // TODO: new message notification
    }
  }
}, {
  immediate: true,
});

watch(() => props.enableReadReceipt, (newEnableReadReceipt) => {
  setEnableReadReceipt(newEnableReadReceipt);
}, {
  immediate: true,
});

onMounted(() => {
  if (scrollContainer.value) {
    scrollContainer.value.addEventListener('scroll', handleScroll);
  }
  initializeMessageList();
});

onUnmounted(() => {
  if (scrollContainer.value) {
    scrollContainer.value.removeEventListener('scroll', handleScroll);
  }
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
        root="#messageScrollList"
        :rootMargin="'50px 0px 0px 0px'"
        :threshold="0.1"
        @on-show="loadMoreHistory"
      >
        <div id="loadMore" />
      </ObserverView>

      <View
        v-for="(chunk, chunkIndex) in messageChunks"
        :key="chunk.key"
        :class="cs('message-chunk--container')"
      >
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
            :key="message.ID"
          >
            <component
              :is="props.Message || DefaultMessage"
              :message="message"
              :alignment="props.alignment"
              :messageActionList="props.messageActionList"
              :isAggregated="Boolean(enableMessageAggregation && messageIndex !== chunk.messages.length - 1)"
              :is-first-in-chunk="Boolean(messageIndex === 0)"
              :is-last-in-chunk="Boolean(messageIndex === chunk.messages.length - 1)"
              :isHiddenMessageAvatar="
                Boolean(
                  alignment === 'two-sided'
                    ? (enableMessageAggregation && messageIndex !== chunk.messages.length - 1 || message.flow === 'out')
                    : (enableMessageAggregation && messageIndex !== chunk.messages.length - 1 )
                )
              "
              :isHiddenMessageMeta="
                Boolean(
                  enableMessageAggregation && messageIndex !== chunk.messages.length - 1
                )
              "
            />
          </template>
        </div>
      </View>
    </div>
    <MessageForward />
    <ScrollToBottom
      v-if="isScrollToBottomVisible"
      :class="cs('scroll-to-bottom')"
      @click="scrollToBottom({ behavior: 'smooth' })"
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
  margin-top: 10px;
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
