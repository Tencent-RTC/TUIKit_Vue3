<script lang="ts" setup>
import { h, computed, Fragment } from 'vue';
import { getTimeStampAuto } from '../../../utils/time';
import type { MessageModel } from '../../../types';

interface MessageTimeDividerProps {
  previousMessage: MessageModel | undefined;
  currentMessage: MessageModel;
}

const props = withDefaults(defineProps<MessageTimeDividerProps>(), {
  previousMessage: undefined,
  currentMessage: () => ({}) as MessageModel,
});

const shouldShowTimeDivider = computed(() => {
  if (!props.currentMessage?.time) {
    return false;
  }

  const prevTime = props.previousMessage?.time || 0;
  const currentTime = props.currentMessage.time;

  return currentTime - prevTime > 5 * 60;
});

const renderDefaultContent = () => {
  if (!shouldShowTimeDivider.value) {
    return h(Fragment, null, []);
  }

  const currentTime = props.currentMessage.time;

  return h('div', { class: 'message-time-divider' }, [
    h('span', {}, getTimeStampAuto(currentTime * 1000)),
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
