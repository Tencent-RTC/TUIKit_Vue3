<template>
  <div :class="$style.conversationPreview__time">
    {{ time }}
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { getTimeStamp } from '../../../utils/time';
import type { ConversationInfo } from '@atomicxcore/core';

const props = defineProps<{
  conversation: ConversationInfo;
}>();

const { language } = useUIKit();

const time = computed(() => getTimeStamp({
  time: props.conversation?.lastMessage?.timestamp || 0,
  language: language.value,
}) || '');
</script>

<style lang="scss" module>
@use './ConversationPreview.scss';
</style>
