<template>
  <div>
    <component
      :is="Preview"
      :conversation="conversation"
      :is-selected="isSelected"
      :enable-actions="enableActions"
      :highlight-match-string="highlightMatchString"
      :avatar="Avatar"
      :conversation-actions="ConversationActions"
      :title="Title"
      :last-message-timestamp="LastMessageTimestamp"
      :last-message-abstract="LastMessageAbstract"
      :unread="Unread"
      :actions-config="actionsConfig"
      :class-name="className"
      :style="style"
      @select="handleSelectConversation"
    >
      <slot />
    </component>
  </div>
</template>

<script lang="ts" setup>
import { computed, h } from 'vue';
import { Avatar as DefaultAvatar } from '../../Avatar';
import { ConversationActions as DefaultConversationActions } from '../ConversationActions';
import {
  ConversationPreviewUI,
  ConversationPreviewAbstract,
  ConversationPreviewTimestamp,
  ConversationPreviewTitle,
  ConversationPreviewUnread } from '.';
import type {
  ConversationModel,
  ConversationPreviewProps,
} from '../../../types';

const props = withDefaults(defineProps<ConversationPreviewProps>(), {
  isSelected: false,
  enableActions: true,
  Preview: () => ConversationPreviewUI,
  Avatar: () => DefaultAvatar,
  ConversationActions: () => DefaultConversationActions,
});

const emit = defineEmits<{
  selectConversation: [conversation: ConversationModel];
}>();

const Title = computed(() => h(ConversationPreviewTitle, {
  conversation: props.conversation,
  highlightMatchString: props.highlightMatchString,
}));

const LastMessageTimestamp = computed(() => h(ConversationPreviewTimestamp, {
  conversation: props.conversation,
}));

const LastMessageAbstract = computed(() => h(ConversationPreviewAbstract, {
  conversation: props.conversation,
}));

const Unread = computed(() => h(ConversationPreviewUnread, {
  conversation: props.conversation,
}));

const handleSelectConversation = (conversation: ConversationModel) => {
  emit('selectConversation', conversation);
};
</script>
