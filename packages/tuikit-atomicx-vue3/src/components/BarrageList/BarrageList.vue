<!-- eslint-disable import/extensions -->
<script lang="ts" setup>
import { ref, onMounted, onUnmounted, nextTick, watch, provide, useSlots, withDefaults, defineProps } from 'vue';
import type { Component, CSSProperties } from 'vue';
import { ObserverView } from '../../baseComp/ObserverView';
import { throttle } from '../../utils/lodash';
import { useScroll } from '../../hooks/useScroll';
import { useBarrageListState } from '../../states/BarrageListState';
import { Message as DefaultMessage } from './Message';
import { MessageForward } from './MessageForward';
import { MessageListContextSymbol } from './MessageListContext';
import type { IMessageModel } from '@tencentcloud/chat-uikit-engine';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import UserActionMenu from './ClickAction/UserActionMenu.vue';
import { useLoginState } from '../../states/LoginState';
import { useLiveState } from '../../states/LiveState';

const { t } = useUIKit();

interface IMessageListProps {
  /** message actions e.g. recall, delete, etc. */
  // messageActionList?: IMessageAction[] | undefined;
  /** max time between message group */
  messageAggregationTime?: number | undefined;
  /** custom filter function */
  filter?: ((message: IMessageModel) => boolean) | undefined;
  /** custom message component */
  Message?: Component | undefined;
  /** custom message timeline component */
  MessageTimeDivider?: Component | undefined;
  /** custom local notification message component */
  LocalNoticeMessage?: Component | undefined;
  containerStyle?: CSSProperties | undefined;
  itemStyle?: CSSProperties | undefined;
  height?: string;
  style?: CSSProperties;
}

const props = withDefaults(defineProps<IMessageListProps>(), {
  /** props */
  filter: undefined,
  enableReadReceipt: false,
  messageAggregationTime: 5 * 60,
  /** custom components */
  Message: undefined,
  MessageTimeDivider: undefined,
  LocalNoticeMessage: undefined,
});

const slots = useSlots();
const { loginUserInfo } = useLoginState();
const { currentLive } = useLiveState();
const currentMessage = ref<IMessageModel>({} as IMessageModel);
const showActionMenu = ref<boolean>(false);
const actionMenuStyle = ref<CSSProperties>({});

const nickClickTarget = ref<HTMLElement | null>(null);

// Calculate action menu position to prevent overflow beyond scrollContainer boundaries
const calculateActionMenuPosition = (targetRect: DOMRect) => {
  if (!scrollContainer.value) {
    return {
      position: 'fixed' as const,
      top: `${targetRect.bottom + 5}px`,
      left: `${targetRect.left}px`,
      zIndex: 1000,
    };
  }

  const scrollContainerRect = scrollContainer.value.getBoundingClientRect();
  const menuHeight = 120; // Estimated menu height
  const padding = 10; // Container padding
  const gap = 5; // Gap from target element

  // Calculate initial position (prefer below target element)
  let top = targetRect.bottom + gap;

  // Check bottom boundary
  if (top + menuHeight > scrollContainerRect.bottom - padding) {
    // If insufficient space below, show above target element
    top = targetRect.top - menuHeight - gap;
  }

  // Check top boundary
  if (top < scrollContainerRect.top + padding) {
    top = scrollContainerRect.top + padding;
  }

  return {
    position: 'fixed' as const,
    top: `${top}px`,
    left: `${targetRect.left}px`,
    zIndex: 1000,
  };
};

provide(MessageListContextSymbol, {
  slots,
  nickClick: (payload: { message: IMessageModel; event: MouseEvent }) => {
    const { message, event } = payload;
    const isOwner = loginUserInfo.value?.userId === currentLive.value?.liveOwner.userId;
    const isMe = loginUserInfo.value?.userId === message.from;
    if (!isOwner || isMe) {
      return;
    }
    currentMessage.value = message;
    nickClickTarget.value = event.currentTarget as HTMLElement;
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    actionMenuStyle.value = calculateActionMenuPosition(rect);
    showActionMenu.value = true;
  },
});

const autoScrollThreshold = 150;
const isFinishFirstRender = ref<boolean>(false);
const isDisableAutoScroll = ref<boolean>(false);
const distanceToBottom = ref<number>(0);
const isLoadingHistory = ref<boolean>(false);
const scrollContainer = ref<HTMLElement | null>(null);

const { messageGroupTip, messageList, loadMoreMessage, currentConversationID } = useBarrageListState();

const { scrollToBottom } = useScroll();

// Monitor scroll events
const handleScroll = throttle(() => {
  if (!scrollContainer.value) {
    return;
  }

  distanceToBottom.value =
    scrollContainer.value.scrollHeight - scrollContainer.value.scrollTop - scrollContainer.value.clientHeight;

  if (distanceToBottom.value > autoScrollThreshold) {
    isDisableAutoScroll.value = true;
  }

  // Reset user scroll state if scrolled near bottom
  if (distanceToBottom.value < autoScrollThreshold) {
    isDisableAutoScroll.value = false;
  }
}, 100);

// Initialize message list
const initializeMessageList = async () => {
  isFinishFirstRender.value = false;
  isDisableAutoScroll.value = false;
};

// Load more history messages
const loadMoreHistory = async () => {
  // Skip if initial loading or already loading
  if (!isFinishFirstRender.value || isLoadingHistory.value || !messageList.value?.length) {
    return;
  }

  isLoadingHistory.value = true;

  // Record current distance from bottom
  if (!scrollContainer.value) {
    isLoadingHistory.value = false;
    return;
  }

  // Calculate distance from bottom before loading
  const distanceFromBottom =
    scrollContainer.value.scrollHeight - scrollContainer.value.scrollTop - scrollContainer.value.clientHeight;

  // Load more messages
  await loadMoreMessage();

  // Wait for DOM update
  await nextTick();

  // Restore scroll position to maintain the same distance from bottom
  if (scrollContainer.value) {
    const newScrollTop = scrollContainer.value.scrollHeight - scrollContainer.value.clientHeight - distanceFromBottom;

    // Ensure scroll position is within valid range
    scrollContainer.value.scrollTop = Math.max(
      0,
      Math.min(scrollContainer.value.scrollHeight - scrollContainer.value.clientHeight, newScrollTop)
    );
  }

  isLoadingHistory.value = false;
};

watch(currentConversationID, () => {
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
  }

  if (!oldMessages || !newMessages || !newMessages.length) {
    return;
  }

  const newLastMessage = newMessages[newMessages.length - 1];
  const oldLastMessage = oldMessages[oldMessages.length - 1];
  if (newLastMessage?.ID !== oldLastMessage?.ID) {
    const shouldAutoScroll =
      newLastMessage.flow === 'out' || (!isDisableAutoScroll.value && distanceToBottom.value < autoScrollThreshold);
    if (shouldAutoScroll) {
      scrollToBottom({ behavior: 'smooth' });
    } else {
      // TODO: new message notification
    }
  }
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
  <div class="message-list" :style="{ height: props.height, ...props.style }">
    <div id="messageScrollList" ref="scrollContainer" class="message-list-container" :style="props.containerStyle">
      <ObserverView
        root="#messageScrollList"
        :rootMargin="'50px 0px 0px 0px'"
        :threshold="0.1"
        @on-show="loadMoreHistory"
      >
        <div id="loadMore"></div>
      </ObserverView>

      <div class="message-chunk">
        <template v-for="message in messageList" :key="message.ID + message.isRevoked">
          <component
            :style="props.itemStyle"
            :is="props.Message || DefaultMessage"
            :message="message"
            :is-last-in-chunk="true"
          />
        </template>
      </div>
      <div class="empty-message" v-if="!messageList?.length">{{ t('No message yet') }}</div>
    </div>
    <div class="message-group-tip" v-if="messageGroupTip">
      <div class="message-group-tip-name">{{ messageGroupTip?.nameCard || messageGroupTip?.userName || messageGroupTip?.userId }}</div>
      <div class="message-group-tip-action">
        {{ messageGroupTip?.displayAction === 'enter' ? t('Come in') : t('Leave') }}
      </div>
    </div>
  </div>
  <MessageForward />
  <UserActionMenu
    v-if="showActionMenu"
    :user-id="currentMessage.from"
    :user-name="currentMessage.nameCard || currentMessage.nick || currentMessage.from"
    :avatar-url="currentMessage.avatar"
    :style="actionMenuStyle"
    :click-target="nickClickTarget"
    @close="showActionMenu = false"
  />
</template>

<style lang="scss" scoped>
@use '../../styles/mixins/_scrollbar.scss' as scrollbar;

.message-list {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: var(--bg-color-operate);
}
.message-list-container {
  flex: 1;
  height: 100%;
  padding: 10px;
  @include scrollbar.scrollbar-thin();
}
.message-chunk--container {
  margin-top: 10px;
}
.message-chunk {
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 0;
}
.empty-message {
  text-align: center;
  color: var(--text-color-secondary);
  font-size: 14px;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
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

.message-group-tip {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 4px;
  padding: 10px;
  font-size: 12px;
  font-weight: 400;
  word-spacing: 0.2em;
  letter-spacing: 0.1em;

  .message-group-tip-name {
    color: var(--text-color-link);
  }
  .message-group-tip-action {
  }
}
</style>
