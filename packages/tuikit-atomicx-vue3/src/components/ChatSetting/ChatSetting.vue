<script lang="ts" setup>
import { computed, provide } from 'vue';
import { ConversationType } from '@atomicxcore/core';
import { IconClose1, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useChatContext } from '../../chat-store';
import { C2CChatSetting } from './C2CChatSetting';
import { GroupChatSetting } from './GroupChatSetting';

interface ChatSettingProps {
  channel?: string;
}

const props = withDefaults(defineProps<ChatSettingProps>(), {
  channel: 'default',
});

provide('channel', props.channel);

const { activeConversation } = useChatContext(props.channel);
const { t } = useUIKit();
const emit = defineEmits<{
  close: [];
}>();

const chatType = computed(() => activeConversation.value?.type);
const headerTitle = computed(() =>
  chatType.value === ConversationType.Group
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
    <C2CChatSetting v-if="chatType === ConversationType.C2C" />
    <!-- Group Chat Setting -->
    <GroupChatSetting v-else-if="chatType === ConversationType.Group" />
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
