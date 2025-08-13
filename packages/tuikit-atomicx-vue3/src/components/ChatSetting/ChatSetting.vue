<script lang="ts" setup>
import { computed } from 'vue';
import { TUIChatEngine } from '@tencentcloud/chat-uikit-engine';
import { useConversationListState } from '../../states/ConversationListState';
import { useUIOpenControlState } from '../../states/UIOpenControlState';
import { C2CChatSetting } from './C2CChatSetting';
import { GroupChatSetting } from './GroupChatSetting';

const { currentConversation: activeConversation } = useConversationListState();
const { isChatSettingOpen } = useUIOpenControlState();
// Constants for conversation types
const { TYPES } = TUIChatEngine;
const { CONV_C2C, CONV_GROUP } = TYPES;

const chatType = computed(() => activeConversation?.value?.type);
</script>

<template>
  <div
    v-if="activeConversation && isChatSettingOpen"
    class="chat-setting"
  >
    <!-- C2C Chat Setting -->
    <C2CChatSetting v-if="chatType === CONV_C2C" />
    <!-- Group Chat Setting -->
    <GroupChatSetting v-else-if="chatType === CONV_GROUP" />
  </div>
</template>

<style lang="scss" scoped>
@use '../../styles/mixins' as mixins;

.chat-setting {
  display: flex;
  flex-direction: column;
  overflow-y: auto;

  background-color: var(--bg-color-operate);
  border-left: 1px solid var(--stroke-color-primary);

  @include mixins.scrollbar-hidden();
}
</style>
