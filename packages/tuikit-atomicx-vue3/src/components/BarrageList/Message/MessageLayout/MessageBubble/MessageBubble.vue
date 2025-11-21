<template>
  <div
    class="message-bubble"
    :class="
      cs({
        [`bubble-${flow}`]: flow && true,
        'all-round-radius': !isLastInChunk,
        'no-background': MEDIA_MESSAGE_TYPE.includes(message.type),
        'highlight--normal': isHighlighted,
        'highlight--media': isHighlighted && isMediaMessage,
      })
    "
  >
    <div v-if="message.hasRiskContent" class="has-risk-content">
      {{ t('This message contains risky content') }}
    </div>
    <slot></slot>
  </div>
</template>

<script lang="ts" setup>
import { toRefs, computed, defineProps, withDefaults } from 'vue';
import TUIChatEngine from '@tencentcloud/chat-uikit-engine';
import cs from 'classnames';
import { useBarrageListState } from '../../../../../states/BarrageListState';
import type { IMessageModel } from '@tencentcloud/chat-uikit-engine';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';

interface IMessageBubbleProps {
  message: IMessageModel;
  isLastInChunk: boolean;
}

const { t } = useUIKit();

const MEDIA_MESSAGE_TYPE = [TUIChatEngine.TYPES.MSG_IMAGE, TUIChatEngine.TYPES.MSG_VIDEO];

const props = withDefaults(defineProps<IMessageBubbleProps>(), {
  message: () => ({}) as IMessageModel,
  isLastInChunk: false,
});

const { message, isLastInChunk } = toRefs(props);
const { highlightMessageIDList } = useBarrageListState();

const isMediaMessage = computed(() => MEDIA_MESSAGE_TYPE.includes(message.value.type));
const isHighlighted = computed(() => highlightMessageIDList.value.includes(message.value.ID));

const { flow } = message.value;
</script>

<style lang="scss" scoped>
$message-bubble-border-radius: 8px;

.message-bubble {
  border-radius: $message-bubble-border-radius;
  flex: 1;

  &.all-round-radius {
    border-radius: $message-bubble-border-radius;
  }
}

.bubble-in {
  border-top-left-radius: 0px;
}

.bubble-out {
  border-top-right-radius: 0px;
}

.no-background {
  background: none;
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
