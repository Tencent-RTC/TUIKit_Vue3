<template>
  <div :class="$style.conversationPreview__unread">
    <IconMute v-if="isMuted" />
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
import { ConversationMarkType, ReceiveMessageOption } from '@atomicxcore/core';
import type { ConversationInfo } from '@atomicxcore/core';
import { IconMute } from '@tencentcloud/uikit-base-component-vue3';

const props = defineProps<{
  conversation: ConversationInfo;
}>();

const isMuted = computed(() => props.conversation?.receiveOption !== ReceiveMessageOption.Receive);
const isUnreadMarked = computed(() => props.conversation?.conversationMarkList?.includes(ConversationMarkType.Unread));
</script>

<style lang="scss" module>
@use './ConversationPreview.scss';
</style>
