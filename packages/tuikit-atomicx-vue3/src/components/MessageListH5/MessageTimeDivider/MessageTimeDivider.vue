<script lang="ts" setup>
import { h, computed, Fragment } from 'vue';
import { getTimeStampAuto } from '../../../utils/time';
import type { MessageInfo } from '@atomicxcore/core';

interface MessageTimeDividerProps {
  previousMessage: MessageInfo | undefined;
  currentMessage: MessageInfo;
}

const props = withDefaults(defineProps<MessageTimeDividerProps>(), {
  previousMessage: undefined,
  currentMessage: () => ({}) as MessageInfo,
});

const shouldShowTimeDivider = computed(() => {
  if (!props.currentMessage?.timestamp) {
    return false;
  }

  const prevMs = props.previousMessage?.timestamp
    ? props.previousMessage.timestamp.getTime()
    : 0;
  const currentMs = props.currentMessage.timestamp.getTime();

  // Show divider when messages are more than 5 minutes apart
  return currentMs - prevMs > 5 * 60 * 1000;
});

const renderDefaultContent = () => {
  if (!shouldShowTimeDivider.value) {
    return h(Fragment, null, []);
  }

  const currentTimestamp = props.currentMessage.timestamp;

  return h('div', { class: 'message-time-divider' }, [
    h('span', {}, getTimeStampAuto(currentTimestamp ?? new Date())),
  ]);
};
</script>

<template>
  <component :is="renderDefaultContent()" />
</template>

<style lang="scss" scoped>
.message-time-divider {
  text-align: center;
  margin: 10px 0;
  font-size: 12px;
  color: var(--text-color-tertiary);
}
</style>
