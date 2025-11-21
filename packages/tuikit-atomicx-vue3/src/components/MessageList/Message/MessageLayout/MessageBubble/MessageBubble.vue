<script lang="ts" setup>
import { computed } from 'vue';
import TUIChatEngine from '@tencentcloud/chat-uikit-engine';
import cs from 'classnames';
import { useMessageListState } from '../../../../../states/MessageListState';
import { MessageActionDropdown } from '../MessageActionDropdown';
import type { MessageAction } from '../../../../../hooks/useMessageActions';
import type { IMessageModel as MessageModel } from '@tencentcloud/chat-uikit-engine';

interface MessageBubbleProps {
  message: MessageModel;
  alignment?: 'left' | 'right' | 'two-sided';
  isLastInChunk?: boolean;
  messageActionList?: MessageAction[];
}

const MEDIA_MESSAGE_TYPE = [
  TUIChatEngine.TYPES.MSG_IMAGE,
  TUIChatEngine.TYPES.MSG_VIDEO,
];

const props = withDefaults(defineProps<MessageBubbleProps>(), {
  message: () => ({} as MessageModel),
  alignment: 'two-sided',
  isLastInChunk: true,
  messageActionList: undefined,
});

const { highlightMessageIDSet } = useMessageListState();

const isMediaMessage = computed(() => MEDIA_MESSAGE_TYPE.includes(props.message.type));
const isHighlighted = computed(() => highlightMessageIDSet.value.has(props.message.ID));
</script>

<template>
  <div
    class="message-bubble"
    :class="cs({
      [`bubble-${message.flow}`]: message.flow && true,
      'all-round-radius': !isLastInChunk,
      'media-bubble': MEDIA_MESSAGE_TYPE.includes(message.type),
      'highlight--normal': isHighlighted,
      'highlight--media': isHighlighted && isMediaMessage
    })"
  >
    <div
      v-if="message.hasRiskContent"
      class="has-risk-content"
    >
      hasRiskContent
    </div>
    <MessageActionDropdown
      v-else
      :messageActionList="messageActionList"
      :message="message"
    >
      <slot />
    </MessageActionDropdown>
  </div>
</template>

<style lang="scss" scoped>

$message-bubble-border-radius: 8px;

.message-bubble {
  border-radius: $message-bubble-border-radius;
  overflow: hidden;

  &.all-round-radius {
    border-radius: $message-bubble-border-radius;
  }
}

.bubble-in {
  background-color: var(--bg-color-bubble-reciprocal);
  border-top-left-radius: 0px;
}

.bubble-out {
  background-color: var(--bg-color-bubble-own);
  border-top-right-radius: 0px;
}

.message-bubble.media-bubble {
  background: none;
  border-radius: 20px;
  border: 1.5px solid var(--bg-color-bubble-own);
}

.has-risk-content {
  padding: 8px;
  background-color: #fa515129;
  color: var(--text-color-error);
  font-size: 14px;
}

.highlight {
  &--normal {
    animation: background-highlight 1s ease-in-out infinite;
  }
  &--media {
    animation: media-highlight 1s ease-in-out infinite;
  }
}

@keyframes background-highlight {
  50% {
    background-color: rgba(255, 156, 25, 1);
  }
}

@keyframes media-highlight {
  50% {
    box-shadow: 0 1px 20px 0 rgb(255, 150, 13);
  }
}
</style>
