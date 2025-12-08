<!-- eslint-disable import/extensions -->
<script lang="ts" setup>
import { ref, onMounted, onUnmounted, nextTick, watch, provide, useSlots, withDefaults, defineProps } from 'vue';
import type { Component, CSSProperties } from 'vue';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useScroll } from '../../hooks/useScroll';
import { useLiveListState } from '../../states/LiveListState';
import { useLoginState } from '../../states/LoginState';
import { throttle } from '../../utils/lodash';
import { useBarrageListState } from './BarrageListState';
import UserActionMenu from './ClickAction/UserActionMenu.vue';
import { Message as DefaultMessage } from './Message';
import { MessageListContextSymbol } from './MessageListContext';
import type { Barrage } from '../../types/barrage';

const { t } = useUIKit();

interface IMessageListProps {
  Message?: Component | undefined;
  containerStyle?: CSSProperties | undefined;
  itemStyle?: CSSProperties | undefined;
  height?: string;
  style?: CSSProperties;
}

const props = withDefaults(defineProps<IMessageListProps>(), {
  Message: undefined,
});

const slots = useSlots();
const { loginUserInfo } = useLoginState();
const { currentLive } = useLiveListState();
const currentMessage = ref<Barrage>();
const showActionMenu = ref<boolean>(false);
const actionMenuStyle = ref<CSSProperties>({});

const nickClickTarget = ref<HTMLElement | null>(null);
const autoScrollThreshold = 150;
const isFinishFirstRender = ref<boolean>(false);
const isDisableAutoScroll = ref<boolean>(false);
const distanceToBottom = ref<number>(0);
const scrollContainer = ref<HTMLElement | null>(null);

const { messageList, messageGroupTip } = useBarrageListState();

const { scrollToBottom } = useScroll();

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
  nickClick: (data: { message: Barrage; event: MouseEvent }) => {
    const { message, event } = data;
    const isOwner = loginUserInfo.value?.userId === currentLive.value?.liveOwner.userId;
    const isMe = loginUserInfo.value?.userId === message.sender.userId;
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

// Monitor scroll events
const handleScroll = throttle(() => {
  if (!scrollContainer.value) {
    return;
  }

  distanceToBottom.value
    = scrollContainer.value.scrollHeight - scrollContainer.value.scrollTop - scrollContainer.value.clientHeight;

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

watch(() => currentLive.value?.liveId, () => {
  initializeMessageList();
});

watch(() => messageList.value?.length, (length) => {
  const newMessage = messageList.value[length - 1];
  const oldMessage = messageList.value[length - 2];

  if (oldMessage === undefined && newMessage && !isFinishFirstRender.value) {
    // Switch to a new conversation
    nextTick(() => {
      scrollToBottom({ behavior: 'instant' });
      isFinishFirstRender.value = true;
    });
  }

  if (!oldMessage || !newMessage || !length) {
    return;
  }

  if (newMessage?.sequence !== oldMessage?.sequence) {
    const shouldAutoScroll
      = newMessage.sender.userId === loginUserInfo.value?.userId || (!isDisableAutoScroll.value && distanceToBottom.value < autoScrollThreshold);
    if (shouldAutoScroll) {
      scrollToBottom({ behavior: 'smooth' });
    } else {
      // TODO: new message notification
    }
  }
});

const handleTouchStart = () => {
  const activeElement = document.activeElement as HTMLElement;
  if (activeElement && typeof activeElement.blur === 'function') {
    activeElement.blur();
  }
};

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
    <div
      id="messageScrollList"
      ref="scrollContainer"
      class="message-list-container"
      :style="props.containerStyle"
      @touchstart="handleTouchStart"
    >
      <div class="message-chunk">
        <template v-for="message in messageList" :key="message.sequence + message.timestampInSecond">
          <component
            :is="props.Message || DefaultMessage"
            :style="props.itemStyle"
            :message="message"
            :is-last-in-chunk="true"
          />
        </template>
      </div>
      <div v-if="messageGroupTip" class="message-group-tip">
        <div class="message-group-tip-name">
          {{ messageGroupTip?.nameCard || messageGroupTip?.userName || messageGroupTip?.userId }}
        </div>
        <div class="message-group-tip-action">
          {{ messageGroupTip?.displayAction === 'enter' ? t('Come in') : t('Leave') }}
        </div>
      </div>
    </div>
    <UserActionMenu
      v-if="showActionMenu && currentMessage"
      :user-id="currentMessage?.sender.userId"
      :user-name="currentMessage?.sender.nameCard || currentMessage?.sender.userName || currentMessage?.sender.userId"
      :avatar-url="currentMessage?.sender.avatarUrl"
      :style="actionMenuStyle"
      :click-target="nickClickTarget"
      @close="showActionMenu = false"
    />
  </div>
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
  gap: 12px;
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
    color: var(--uikit-color-theme-8);
  }

  .message-group-tip-action {}
}

:deep(.message-bubble) {
  background-color: var(--uikit-color-black-6);
  border-radius: 12px;
  padding: 2px 6px;
}

:deep(.message-chunk) {
  gap: 4px;
}
</style>
