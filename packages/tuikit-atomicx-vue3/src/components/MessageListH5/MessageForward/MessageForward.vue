<script lang="ts" setup>
import { ref, computed, inject, watch } from 'vue';
import { useChatContext } from '../../../chat-store';
import { useUIKit, IconClose, TUIToast, TUIButton } from '@tencentcloud/uikit-base-component-vue3';
import { Modal } from '../../../baseComp/Modal';
import { View } from '../../../baseComp/View';
import { useChatUIState } from '../../../context/useChatUIState';
import { UserPicker } from '../../UserPicker';
import type { UserPickerRef, UserPickerResult } from '../../UserPicker/type';
import type { ForwardMessageOption } from '@atomicxcore/core';

const { t } = useUIKit();
const channel = inject('channel', 'default') as string;
const { isForwardModalOpen, forwardMessages, closeForwardModal } = useChatUIState(channel);
const {
  conversationList,
  forwardMessages: forwardMessagesToConversation,
  loadConversations,
} = useChatContext(channel);

// Load conversation list when modal opens
watch(isForwardModalOpen, (open) => {
  if (open) {
    loadConversations();
  }
});

// UserPicker ref
const userPickerRef = ref<UserPickerRef<undefined> | null>(null);

// Track if forward button should be disabled
const isDisableConfirm = ref(true);

// Convert conversation list to UserPicker data format
const forwardListDataSource = computed(() =>
  conversationList.value.map(conversation => ({
    key: conversation.conversationID,
    label: conversation.title || conversation.conversationID,
    avatarUrl: conversation.avatarURL || '',
  })),
);

function handleSelectedChange(selectedItems: UserPickerResult) {
  isDisableConfirm.value = selectedItems.length === 0;
}

async function forward() {
  const selectedItems = userPickerRef.value?.getSelectedItems();
  if (!selectedItems || selectedItems.length === 0) {
    return;
  }

  const option: ForwardMessageOption = { forwardType: 'separate' };
  const forwardPromises = selectedItems.map(
    item => forwardMessagesToConversation(forwardMessages.value, option, item.key),
  );

  await Promise.allSettled(forwardPromises);
  closeForwardModal();
}

function handleClose() {
  closeForwardModal();
}
</script>

<template>
  <Modal
    :open="isForwardModalOpen"
    content-class="forward-container"
    @on-close="handleClose"
  >
    <View
      class="forward-header"
      dir="row"
    >
      <IconClose
        size="28"
        class="forward-header__close"
        @click="handleClose"
      />
      <span class="forward-header__title">
        {{ t('MessageList.forward') }}
      </span>
      <div class="forward-header__placeholder" />
    </View>

    <UserPicker
      ref="userPickerRef"
      display-mode="list"
      :data-source="forwardListDataSource"
      :max-count="10"
      :on-selected-change="handleSelectedChange"
      :on-max-count-exceed="() => {
        TUIToast.error({
          message: t('MessageList.max_count_exceed'),
        });
      }"
    />

    <View class="forward-footer">
      <TUIButton
        radius="rect"
        color="blue"
        type="primary"
        :disabled="isDisableConfirm"
        @click="forward"
      >
        {{ t('MessageList.forward') }}
      </TUIButton>
    </View>
  </Modal>
</template>

<style lang="scss">
@use '../../../styles/mixins' as mixin;

.forward-container {
  padding: 16px;
  flex-direction: column;
  gap: 12px;
  color: var(--text-color-primary);
  display: flex;
  flex-direction: column;
  overflow: hidden;

  @include mixin.mobile {
    height: 65vh;
    width: 80vw;
  }

  @include mixin.tablet-and-up {
    width: 50vw;
    height: 60vh;
  }

  @include mixin.desktop-and-up {
    width: 480px;
    height: 60vh;
  }
}
</style>

<style lang="scss" scoped>
@use '../../../styles/mixins' as mixin;

$animationDuration: 200ms;

.forward-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--text-color-primary);

  $icon-size: 28px;

  &__close {
    width: $icon-size;
    height: $icon-size;
    flex: 0 0 auto;
    padding: 6px;
    cursor: pointer;
    border-radius: 4px;
    transition: background-color 0.2s ease;

    &:hover {
      background-color: var(--hover-bg-color, rgba(0, 0, 0, 0.04));
    }
  }

  &__title {
    flex: 1;
    margin: 0;
    text-align: center;
    font-size: 18px;
    font-weight: bold;
  }

  &__placeholder {
    width: $icon-size;
    height: $icon-size;
  }
}
</style>
