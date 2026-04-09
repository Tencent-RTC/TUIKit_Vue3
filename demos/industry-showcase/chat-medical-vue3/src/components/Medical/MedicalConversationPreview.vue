<script setup lang="ts">
import { ConversationPreviewUI } from '@tencentcloud/chat-uikit-vue3';
import MedicalConversationTitle from './MedicalConversationTitle.vue';
import type { ConversationModel } from '@tencentcloud/chat-uikit-vue3';

defineOptions({ inheritAttrs: false });

const props = defineProps<{
  conversation: ConversationModel;
  isSelected?: boolean;
  enableActions?: boolean;
  Avatar?: any;
  Title?: any;
  LastMessageAbstract?: any;
  LastMessageTimestamp?: any;
  Unread?: any;
  ConversationActions?: any;
  actionsConfig?: any;
  className?: string;
  style?: any;
}>();

const emit = defineEmits<{
  selectConversation: [conversation: ConversationModel];
}>();
</script>

<template>
  <ConversationPreviewUI
    :conversation="props.conversation"
    :is-selected="props.isSelected"
    :enable-actions="props.enableActions"
    :Avatar="props.Avatar"
    :Title="MedicalConversationTitle"
    :LastMessageAbstract="props.LastMessageAbstract"
    :LastMessageTimestamp="props.LastMessageTimestamp"
    :Unread="props.Unread"
    :ConversationActions="props.ConversationActions"
    :actions-config="props.actionsConfig"
    :class-name="props.className"
    :style="props.style"
    @select-conversation="(c: ConversationModel) => emit('selectConversation', c)"
  />
</template>
