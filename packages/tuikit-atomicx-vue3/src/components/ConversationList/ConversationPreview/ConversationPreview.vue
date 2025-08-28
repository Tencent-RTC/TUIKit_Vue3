<template>
  <div>
    <component
      :is="Preview"
      :conversation="conversation"
      :isSelected="isSelected"
      :enableActions="enableActions"
      :Avatar="Avatar"
      :ConversationActions="ConversationActions"
      :Title="Title"
      :LastMessageTimestamp="LastMessageTimestamp"
      :LastMessageAbstract="LastMessageAbstract"
      :Unread="Unread"
      :actionsConfig="actionsConfig"
      :className="className"
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

const Title = computed(() => h(props.Title || ConversationPreviewTitle, {
  conversation: props.conversation,
}));

const LastMessageTimestamp = computed(() => h(props.LastMessageTimestamp || ConversationPreviewTimestamp, {
  conversation: props.conversation,
}));

const LastMessageAbstract = computed(() => h(props.LastMessageAbstract || ConversationPreviewAbstract, {
  conversation: props.conversation,
}));

const Unread = computed(() => h(props.Unread || ConversationPreviewUnread, {
  conversation: props.conversation,
}));

const handleSelectConversation = (conversation: ConversationModel) => {
  emit('selectConversation', conversation);
};
</script>
