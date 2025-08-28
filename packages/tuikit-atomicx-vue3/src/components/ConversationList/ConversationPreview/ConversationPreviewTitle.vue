<template>
  <div :class="[$style.conversationPreview__title, $style.textEllipsis]">
    {{ title }}
  </div>
</template>

<script lang="ts" setup>
import type { ConversationModel } from '../../../types';

const props = defineProps<{
  conversation: ConversationModel;
}>();

const title =props?.conversation?.getShowName?.() || '';
</script>

<style lang="scss" module>
@import './ConversationPreview.scss';
</style>
