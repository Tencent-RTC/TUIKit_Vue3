<script setup lang="ts">
import { computed } from 'vue';
import {
  ChatSetting,
  ConversationType,
  useChatContext,
} from '@tencentcloud/chat-uikit-vue3';
import PatientInfoPanel from './PatientInfoPanel.vue';

const emit = defineEmits<{
  close: [];
}>();

const { activeConversation } = useChatContext();
const isC2C = computed(() => activeConversation.value?.type === ConversationType.C2C);
</script>

<template>
  <PatientInfoPanel
    v-if="isC2C"
    @close="emit('close')"
  />
  <ChatSetting
    v-else
    @close="emit('close')"
  />
</template>
