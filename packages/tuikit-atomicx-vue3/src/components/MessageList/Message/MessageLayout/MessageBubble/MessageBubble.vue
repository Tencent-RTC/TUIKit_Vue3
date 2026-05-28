<script lang="ts" setup>
import { MessageStatus } from '@atomicxcore/core';
import { MessageActionDropdown } from '../MessageActionDropdown';
import type { MessageAction } from '../../../../../hooks/useMessageActions';
import type { MessageInfo } from '@atomicxcore/core';

interface MessageBubbleProps {
  message: MessageInfo;
  alignment?: 'left' | 'right' | 'two-sided';
  isLastInChunk?: boolean;
  messageActionList?: MessageAction[];
}

withDefaults(defineProps<MessageBubbleProps>(), {
  message: () => ({} as MessageInfo),
  alignment: 'two-sided',
  isLastInChunk: true,
  messageActionList: undefined,
});
</script>

<template>
  <div class="message-bubble">
    <div
      v-if="message.status === MessageStatus.Violation"
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
.message-bubble {
  // Only disable text selection on touch devices (H5), allow copy on PC
  @media (pointer: coarse) {
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
  }
}

.has-risk-content {
  padding: 8px;
  background-color: #fa515129;
  color: var(--text-color-error);
  font-size: 14px;
}
</style>
