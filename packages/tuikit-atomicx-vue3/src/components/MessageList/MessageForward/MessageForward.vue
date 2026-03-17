<script lang="ts" setup>
import { ref, computed } from 'vue';
import ChatEngine from '@tencentcloud/chat-uikit-engine-lite';
import { useUIKit, IconClose, TUIToast, TUIButton } from '@tencentcloud/uikit-base-component-vue3';
import { DialogTitle } from 'reka-ui';
import { Modal } from '../../../baseComp/Modal';
import { View } from '../../../baseComp/View';
import { useConversationListState } from '../../../states/ConversationListState';
import { useMessageActionState } from '../../../states/MessageActionState';
import { UserPicker } from '../../UserPicker';
import type { UserPickerRef, UserPickerRow } from '../../UserPicker/type';
import type { IConversationModel } from '@tencentcloud/chat-uikit-engine-lite';

const { t } = useUIKit();
const {
  forwardMessageIDList,
  forwardConversationIDList,
  isForwardMessageSelectionDone,
  forwardMessage,
} = useMessageActionState();

const {
  conversationList,
} = useConversationListState();

// UserPicker ref
const userPickerRef = ref<UserPickerRef<undefined> | null>(null);

// Convert conversation list to UserPicker data format
const forwardListDataSource = computed((): any[] => {
  if (!conversationList.value) {
    return [];
  }

  return conversationList.value.map((conversation: IConversationModel) => {
    const { type, remark, groupProfile, userProfile } = conversation;
    const userPickerRow: UserPickerRow<undefined> = {
      key: conversation.conversationID,
      label: '',
      avatarUrl: conversation.getAvatar() || '',
    };

    // resolve c2c conversation
    if (type === ChatEngine.TYPES.CONV_C2C) {
      const userDisplayName = remark || userProfile?.nick || userProfile?.userID;
      userPickerRow.label = userDisplayName || '';
    }

    // resolve group conversation
    if (type === ChatEngine.TYPES.CONV_GROUP) {
      const groupDisplayName = groupProfile?.name || groupProfile?.groupID;
      userPickerRow.label = groupDisplayName || '';
    }

    return userPickerRow;
  });
});

// Track if forward button should be disabled
const isDisableConfirm = ref(true);

function handleSelectedChange(selectedItems: any[]) {
  isDisableConfirm.value = selectedItems.length === 0;
  // Update forwardConversationIDList to maintain compatibility with existing logic
  forwardConversationIDList.value = selectedItems.map(item => item.key);
}

function forward() {
  if (!isForwardMessageSelectionDone.value) {
    return;
  }

  const selectedConversationList = userPickerRef.value?.getSelectedItems();

  if (selectedConversationList && selectedConversationList.length > 0) {
    forwardMessage({
      messageIDList: forwardMessageIDList.value,
      conversationIDList: selectedConversationList.map(item => item.key),
      isMergeForward: false,
    });
    closeMessageForward();
  }
}

function closeMessageForward() {
  forwardMessageIDList.value = [];
  forwardConversationIDList.value = [];
  isForwardMessageSelectionDone.value = false;
}
</script>

<template>
  <Modal
    :open="isForwardMessageSelectionDone"
    content-class="forward-container"
    @on-close="closeMessageForward"
  >
    <View
      class="forward-header"
      dir="row"
    >
      <IconClose
        size="28"
        class="forward-header__close"
        @click="closeMessageForward"
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
