<script lang="ts" setup>
import { ref } from 'vue';
import { MessageLayout } from './MessageLayout';
import type { IMessageModel } from '@tencentcloud/chat-uikit-engine-lite';

interface IMessageProps {
  message: IMessageModel;
  isLastInChunk?: boolean;
}

const props = withDefaults(defineProps<IMessageProps>(), {
  message: () => ({} as IMessageModel),
  isLastInChunk: true,
});

const message = ref(props.message);
const isLastInChunk = ref(props.isLastInChunk);
</script>

<template>
  <MessageLayout
    :message="message"
    :is-last-in-chunk="isLastInChunk"
  />
</template>

<style lang="scss" scoped>
</style>
