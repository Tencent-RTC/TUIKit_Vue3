<template>
  <div :class="[$style.conversationPreview__title, $style.textEllipsis]">
    {{ title }}
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import type { ConversationInfo } from '@atomicxcore/core';

const props = defineProps<{
  conversation: ConversationInfo;
}>();

const title = computed(() => props?.conversation?.title || '');
</script>

<style lang="scss" module>
@use './ConversationPreview.scss';
</style>
