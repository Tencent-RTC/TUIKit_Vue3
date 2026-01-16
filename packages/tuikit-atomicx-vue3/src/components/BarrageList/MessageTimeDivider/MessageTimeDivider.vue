<script lang="ts" setup>
import { h, computed, Fragment } from 'vue';
import { getTimeStampAuto } from '../../../utils/time';
import type { IMessageModel } from '@tencentcloud/chat-uikit-engine-lite';

interface IMessageTimeDividerProps {
  previousMessage: IMessageModel | undefined;
  message: IMessageModel;
}

const props = withDefaults(defineProps<IMessageTimeDividerProps>(), {
  previousMessage: undefined,
  message: () => ({}) as IMessageModel,
});

const shouldShowTimeDivider = computed(() => {
  if (!props.message?.time) {
    return false;
  }

  const prevTime = props.previousMessage?.time || 0;
  const currentTime = props.message.time;

  return currentTime - prevTime > 5 * 60;
});

const renderDefaultContent = () => {
  if (!shouldShowTimeDivider.value) {
    return h(Fragment, null, []);
  }

  const currentTime = props.message.time;

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
