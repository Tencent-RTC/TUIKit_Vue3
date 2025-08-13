<template>
  <div :class="[$style.conversationPreview__title, $style.textEllipsis]">
    <span
      v-for="(item, index) in titleItems"
      :key="index"
      :class="{
        [$style['conversationPreview__title--highlight']]: item.isHighlight,
        [$style['conversationPreview__title--normal']]: !item.isHighlight,
      }"
    >
      {{ item.text }}
    </span>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { generateHighlightTitle } from './utils';
import type { ConversationModel } from '../../../types';

const props = defineProps<{
  conversation: ConversationModel;
  highlightMatchString?: string;
}>();

const titleItems = computed(() => generateHighlightTitle(props.conversation, props.highlightMatchString));
</script>

<style lang="scss" module>
@import './ConversationPreview.scss';
</style>
