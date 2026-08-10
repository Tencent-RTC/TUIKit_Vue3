<script lang="ts" setup>
import { ref, computed, inject } from 'vue';
import type { Component, StyleValue } from 'vue';
import { MessageType, ConversationType, MessageStatus } from '@atomicxcore/core';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import cs from 'classnames';
import { View } from '../../../../baseComp/View';
import { useChatContext } from '../../../../chat-store/context/useChatContext';
import { useChatUIState } from '../../../../context/useChatUIState';
import { isCallMessage, isCreateGroupMessage } from '../../../../utils/call';
import { getTimeStampAuto } from '../../../../utils/time';
import { Avatar } from '../../../Avatar';
import { useMessageListContext } from '../../MessageListContext';
import { ReadReceiptInfo } from '../../ReadReceiptInfo';
import { AudioMessage } from '../AudioMessage';
import { CustomMessage } from '../CustomMessage';
import { FaceMessage } from '../FaceMessage';
import { FileMessage } from '../FileMessage';
import { GroupTipMessage } from '../GroupTipMessage';
import { ImageMessage } from '../ImageMessage';
// import { LocationMessage } from '../LocationMessage';
import { MergerMessage } from '../MergerMessage';
import { RecalledMessage } from '../RecalledMessage';
import { TextMessage } from '../TextMessage';
import { VideoMessage } from '../VideoMessage';
import { MessageBubble } from './MessageBubble';
import { MessageStatusIcon } from './MessageMeta';
import { useMessageLayoutClasses } from './useMessageLayoutClasses';
import type { MessageAction } from '../../../../hooks/useMessageActions';
// import type { MessageModel } from '../../../../types/engine';
import type { MessageInfo } from '@atomicxcore/core';

interface MessageLayoutProps {
  message: MessageInfo;
  nick?: string;
  isAggregated?: boolean;
  isHiddenMessageAvatar?: boolean;
  removeAvatar?: boolean;
  isHiddenMessageNick?: boolean;
  isFirstInChunk?: boolean;
  isLastInChunk?: boolean;
  alignment?: 'left' | 'right' | 'two-sided';
  messageActionList?: MessageAction[];
  messageAvatar?: Component;
  className?: string;
  style?: StyleValue;
}

const props = withDefaults(defineProps<MessageLayoutProps>(), {
  message: () => ({}) as MessageInfo,
  alignment: 'two-sided',
  nick: undefined,
  isAggregated: false,
  isHiddenMessageAvatar: false,
  removeAvatar: false,
  isHiddenMessageNick: false,
  isFirstInChunk: undefined,
  isLastInChunk: undefined,
  messageActionList: undefined,
  messageAvatar: undefined,
  className: '',
  style: undefined,
});

const { t } = useUIKit();
const isHovered = ref(false);
const isReadReceiptInfoOpen = ref(false);
const { activeConversation } = useChatContext();

const shouldRenderAsGroupTip = computed(() => {
  if (props.message.messageType === MessageType.Custom && isCreateGroupMessage(props.message)) {
    return true;
  }
  if (
    props.message.messageType === MessageType.Custom
    && isCallMessage(props.message)
    && props.message.conversationType === ConversationType.Group
  ) {
    return true;
  }
  return false;
});

const showName = computed(() => {
  if (props.nick) {
    return props.nick;
  }
  if (props.message.conversationType === ConversationType.C2C) {
    if (!props.message.isSentBySelf) {
      return activeConversation.value?.title || props.message.from.nickname || props.message.from.userID;
    } else {
      return props.message.from.nickname || props.message.from.userID;
    }
  }
  return props.message.from.nameCard || props.message.from.nickname || props.message.from.userID;
});

const MessageComponentsFactory: Record<MessageType, Component | null> = {
  [MessageType.Unknown]: null,
  [MessageType.Stream]: null,
  // [MessageType.Location]: LocationMessage,
  [MessageType.Text]: TextMessage,
  [MessageType.Image]: ImageMessage,
  [MessageType.Audio]: AudioMessage,
  [MessageType.Video]: VideoMessage,
  [MessageType.File]: FileMessage,
  [MessageType.Face]: FaceMessage,
  [MessageType.Merged]: MergerMessage,
  [MessageType.Custom]: CustomMessage,
  [MessageType.Tips]: GroupTipMessage,
};

const channel = inject('channel', 'default') as string;
const { highlightMessageIDSet } = useChatUIState(channel);
const isHighlighted = computed(() => highlightMessageIDSet.value.has(props.message.msgID));

const messageListContext = useMessageListContext('MessageLayout');

const MessageComponent = computed(() => {
  const renderers = messageListContext?.messageRenderers;
  const { messageType } = props.message;
  if (renderers?.[messageType]) {
    return renderers[messageType];
  }
  return MessageComponentsFactory[messageType];
});

const isMessageOwner = computed(() => props.message.isSentBySelf);
const isGroup = computed(() => props.message.conversationType === ConversationType.Group);

const displayTime = computed(() => getTimeStampAuto(props.message.timestamp!));

const showSendStatus = computed(() => (
  isMessageOwner.value
  && (props.message.status === MessageStatus.Sending || props.message.status === MessageStatus.SendFail)
));

const showReadReceipt = computed(() => (
  isMessageOwner.value
  && props.message.status === MessageStatus.SendSuccess
  && props.message.needReadReceipt
));

const readReceiptText = computed(() => {
  if (
    !props.message.needReadReceipt
    || props.message.status !== MessageStatus.SendSuccess
    || !props.message.readReceiptInfo
    || !isMessageOwner.value
  ) {
    return '';
  }
  const { readCount, unreadCount, isPeerRead } = props.message.readReceiptInfo;
  if (isGroup.value) {
    if (unreadCount === undefined || readCount === undefined) {
      return '';
    }
    if (unreadCount > 0) {
      return `${unreadCount}${t('MessageList.people')}${t('MessageList.unread')}`;
    }
    return t('MessageList.all_read');
  }
  if (isPeerRead) {
    return t('MessageList.read');
  }
  return t('MessageList.unread');
});

const messageLayoutClasses = computed(() => useMessageLayoutClasses({
  isMessageOwner: isMessageOwner.value,
  alignment: props.alignment,
  isAggregated: props.isAggregated,
}));

const layoutClasses = computed(() => messageLayoutClasses.value.layoutClasses);
const contentClasses = computed(() => messageLayoutClasses.value.contentClasses);
const headerClasses = computed(() => messageLayoutClasses.value.headerClasses);
const bodyClasses = computed(() => messageLayoutClasses.value.bodyClasses);
const avatarClasses = computed(() => messageLayoutClasses.value.avatarClasses);
const bubbleClasses = computed(() => messageLayoutClasses.value.bubbleClasses);
const statusClasses = computed(() => messageLayoutClasses.value.statusClasses);

function handleReadReceiptOpen() {
  isReadReceiptInfoOpen.value = true;
}

function handleReadReceiptClose() {
  isReadReceiptInfoOpen.value = false;
}

// Avatar display logic:
// - alignment 'left' or 'right': always show avatar regardless of props
// - removeAvatar=true: completely remove avatar from DOM (user takes full control of layout)
// - isHiddenMessageAvatar=true: visually hide avatar but keep DOM space (no layout shift)
const isSingleSideAlignment = computed(() => props.alignment === 'left' || props.alignment === 'right');
const shouldRenderAvatar = computed(() => {
  if (isSingleSideAlignment.value) {
    return true;
  }
  return !props.removeAvatar;
});
const avatarVisibility = computed(() => {
  if (isSingleSideAlignment.value) {
    return 'visible';
  }
  return props.isHiddenMessageAvatar ? 'hidden' : 'visible';
});
</script>

<template>
  <RecalledMessage
    v-if="message.status === MessageStatus.Recalled"
    class="message-recalled"
    :message="message"
  />
  <GroupTipMessage
    v-else-if="message.messageType === MessageType.Tips || shouldRenderAsGroupTip"
    :message="message"
  />
  <View
    v-else-if="MessageComponent"
    :data-message-id="message.msgID"
    :class="cs(layoutClasses, {
      'highlight--normal': isHighlighted,
    })"
    :style="style"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <Avatar
      v-if="shouldRenderAvatar && !messageAvatar"
      :class="cs(avatarClasses)"
      :style="{ visibility: avatarVisibility }"
      :src="message.from.avatarURL"
      size="sm"
    />
    <View
      v-else-if="shouldRenderAvatar"
      :class="cs(avatarClasses)"
      :style="{ visibility: avatarVisibility }"
    >
      <component
        :is="messageAvatar"
        :message-info="message"
      />
    </View>
    <View :class="cs(contentClasses)">
      <View v-if="!isAggregated" :class="cs(headerClasses)">
        <View v-if="!isHiddenMessageNick" :class="cs('message-layout__nick')">
          {{ showName }}
        </View>
        <span class="message-layout__time" :style="{ visibility: isHovered ? 'visible' : 'hidden' }">{{ displayTime }}</span>
      </View>
      <View :class="cs(bodyClasses)">
        <MessageBubble
          :class="bubbleClasses"
          :message="message"
          :alignment="alignment"
          :isLastInChunk="false"
          :messageActionList="messageActionList"
        >
          <component
            :is="MessageComponent"
            :message="message"
          />
        </MessageBubble>
        <View
          v-if="showSendStatus || showReadReceipt"
          :class="cs(statusClasses, showSendStatus && 'message-layout__status--centered')"
        >
          <MessageStatusIcon
            v-if="showSendStatus"
            :status="message.status"
          />
          <template v-else-if="showReadReceipt && Boolean(readReceiptText)">
            <span
              v-if="!isGroup"
              class="message-layout__read-status"
            >
              {{ readReceiptText }}
            </span>
            <span
              v-else-if="isGroup && message.readReceiptInfo && message.readReceiptInfo.unreadCount > 0"
              class="message-layout__group-unread"
              @click="handleReadReceiptOpen"
            >
              {{ readReceiptText }}
            </span>
            <span
              v-else-if="isGroup"
              class="message-layout__group-all-read"
            >
              {{ readReceiptText }}
            </span>
          </template>
        </View>
      </View>
      <View class="message-layout__reactions" />
    </View>
  </View>
  <ReadReceiptInfo
    :open="isReadReceiptInfoOpen"
    :message="message"
    :read-count="message.readReceiptInfo?.readCount"
    :unread-count="message.readReceiptInfo?.unreadCount"
    :is-peer-read="message.readReceiptInfo?.isPeerRead"
    @on-close="handleReadReceiptClose"
  />
</template>

<style lang="scss" scoped>
@use '../../../../styles/mixins' as mixin;

$message-avatar-size: 32px;
$message-avatar-gap: 8px;

.message-layout {
  display: flex;
  flex-direction: row;
  width: 100%;
  position: relative;
  gap: $message-avatar-gap;

  &--left {
    flex-direction: row;
  }

  &--right {
    flex-direction: row-reverse;
  }

  &__avatar {
    flex: 0 0 auto;
  }

  &__nick {
    font-size: 12px;
    max-width: min(70%, 120px);
    color: var(--text-color-tertiary);
    @include mixin.text-ellipsis;
  }

  &__time {
    font-size: 12px;
    color: var(--text-color-tertiary);
    flex-shrink: 0;
    white-space: nowrap;
  }

  &__read-status,
  &__group-all-read {
    font-size: 12px;
    color: var(--text-color-secondary);
  }

  &__group-unread {
    font-size: 12px;
    color: var(--text-color-link);
    cursor: pointer;

    &:hover {
      text-decoration: underline;
      color: var(--text-color-link-hover);
    }
  }

  &__reactions {
    display: none;
  }
}

.message-layout__content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  flex: 1 1 auto;
  min-width: 0;

  &--left {
    align-items: flex-start;
  }

  &--right {
    align-items: flex-end;
  }

}

.message-layout__header {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;

  &--right {
    flex-direction: row-reverse;
  }
}

.message-layout__body {
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  gap: 4px;
  max-width: 90%;

  @include mixin.tablet-and-up {
    max-width: 80%;
  }

  @include mixin.desktop-and-up {
    max-width: 70%;
  }

  &--left {
    flex-direction: row;
  }

  &--right {
    flex-direction: row-reverse;
  }
}

.message-layout__bubble {
  flex: 0 1 auto;
}

.message-layout__status {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  align-self: stretch;
  flex-shrink: 0;
  font-size: 12px;
  color: var(--text-color-link);

  &--centered {
    justify-content: center;
  }
}

.message-layout__failed {
  color: #ff584c;
  margin-left: 8px;
  cursor: pointer;
}

.highlight {
  &--normal {
    animation: background-highlight 1s ease-in-out infinite;
  }
}

@keyframes background-highlight {
  50% {
    background-color: rgb(255, 199, 126);
  }
}

@keyframes media-highlight {
  50% {
    box-shadow: 0 1px 20px 0 rgb(255, 199, 126);
  }
}
</style>
