<script lang="ts" setup>
import { useConversationListState } from '../../states/ConversationListState';

const {
  conversationList,
  switchConversation,
} = useConversationListState();

function handleConversationClick(conversationID: string) {
  switchConversation(conversationID);
}
</script>

<template>
  <div class="conversation-list">
    <div
      v-for="conversation in conversationList"
      :key="conversation.conversationID"
      class="conversationItem"
    >
      <div
        class="conversation-item"
        @click="handleConversationClick(conversation.conversationID)"
      >
        {{ conversation.getShowName() }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.conversation-list {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  gap: 8px;
}

.conversation-item {
  height: 80px;
  font-size: 14px;
  background-color: aquamarine;
  cursor: pointer;
}
</style>
