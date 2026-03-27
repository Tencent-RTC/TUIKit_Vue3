<script lang="ts" setup>
import { computed } from 'vue';
import { TUIChatEngine } from '@tencentcloud/chat-uikit-engine-lite';
import { IconClose1, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useConversationListState } from '../../states/ConversationListState';
import { C2CChatSetting } from './C2CChatSetting';
import { GroupChatSetting } from './GroupChatSetting';

const { activeConversation } = useConversationListState();
const { t } = useUIKit();
const emit = defineEmits<{
  close: [];
}>();

const chatType = computed(() => activeConversation.value?.type);
const headerTitle = computed(() =>
  chatType.value === TUIChatEngine.TYPES.CONV_GROUP
    ? t('ChatSetting.group_setting_title')
    : t('ChatSetting.chat_setting_title'),
);
</script>

<template>
  <div
    v-if="Boolean(activeConversation)"
    class="chat-setting"
  >
    <div class="chat-setting__header">
      <span class="chat-setting__title">{{ headerTitle }}</span>
      <IconClose1
        class="chat-setting__close unique-icon-btn"
        :size="24"
        @click="() => emit('close')"
      />
    </div>
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

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px;
  }

  &__title {
    font-size: 16px;
    font-weight: 500;
    color: var(--text-color-primary);
  }

  &__close {
    color: var(--text-color-primary);
    cursor: pointer;
  }
}
</style>
