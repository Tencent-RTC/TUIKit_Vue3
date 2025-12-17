<template>
  <div :class="[$style.conversationPreview__title, $style.textEllipsis]">
    {{ title }}
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import type { ConversationModel } from '../../../types/engine';

const props = defineProps<{
  conversation: ConversationModel;
}>();

const title = computed(() => props?.conversation?.getShowName?.() || '');
</script>

<style lang="scss" module>
@use './ConversationPreview.scss';
</style>
