<script lang="ts" setup>
import { computed } from 'vue';
import { TUIChatEngine } from '@tencentcloud/chat-uikit-engine-lite';
import { useConversationListState } from '../../states/ConversationListState';
import { C2CChatSetting } from './C2CChatSetting';
import { GroupChatSetting } from './GroupChatSetting';

const { activeConversation } = useConversationListState();

const chatType = computed(() => activeConversation.value?.type);
</script>

<template>
  <div
    v-if="Boolean(activeConversation)"
    class="chat-setting"
  >
    <!-- C2C Chat Setting -->
    <C2CChatSetting v-if="chatType === TUIChatEngine.TYPES.CONV_C2C" />
    <!-- Group Chat Setting -->
    <GroupChatSetting v-else-if="chatType === TUIChatEngine.TYPES.CONV_GROUP" />
  </div>
  <div v-else>
    [null active conversation]
  </div>
</template>

<style lang="scss" scoped>
@use '../../styles/mixins' as mixins;

.chat-setting {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  background-color: var(--bg-color-operate);

  @include mixins.scrollbar-hidden();
}
</style>
