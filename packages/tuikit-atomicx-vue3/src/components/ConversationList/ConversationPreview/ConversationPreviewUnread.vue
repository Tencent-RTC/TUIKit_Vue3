<template>
  <div :class="$style.conversationPreview__unread">
    <IconMute v-if="conversation?.isMuted" />
    <span
      v-else-if="conversation?.unreadCount > 99"
      :class="$style['unread-count']"
    >99+</span>
    <span
      v-else-if="conversation?.unreadCount > 0"
      :class="$style['unread-count']"
    >{{ conversation?.unreadCount }}</span>
    <span
      v-else-if="isUnreadMarked"
      :class="$style['unread-count']"
    >1</span>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import TUIChatEngine from '@tencentcloud/chat-uikit-engine-lite';
import { IconMute } from '@tencentcloud/uikit-base-component-vue3';
import type { ConversationModel } from '../../../types';

const props = defineProps<{
  conversation: ConversationModel;
}>();

const isUnreadMarked = computed(() => props.conversation?.markList?.includes(TUIChatEngine.TYPES.CONV_MARK_TYPE_UNREAD));
</script>

<style lang="scss" module>
@use './ConversationPreview.scss';
</style>
