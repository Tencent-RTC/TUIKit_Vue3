<template>
  <div
    :class="[
      'group-actions',
    ]"
  >
    <!-- Change group owner button - only for group owner (blue text) -->
    <TUIButton
      v-if="canChangeGroupOwner"
      class="group-actions__button"
      radius="rect"
      :disabled="loading"
      type="text"
      @click="handleChangeGroupOwner"
    >
      {{ t('ChatSetting.transfer_group_owner') }}
    </TUIButton>

    <Divider v-if="canChangeGroupOwner" variant="line" />

    <!-- Clear history button -->
    <TUIButton
      class="group-actions__button"
      color="red"
      radius="rect"
      type="text"
      @click="() => isShowClearHistoryDialog = true"
    >
      {{ t('ChatSetting.clear_history_message') }}
    </TUIButton>

    <Divider v-if="canQuitGroup || canDismissGroup" variant="line" />

    <!-- Quit group button -->
    <TUIButton
      v-if="canQuitGroup"
      class="group-actions__button"
      color="red"
      radius="rect"
      type="text"
      @click="() => isShowQuitDialog = true"
    >
      {{ t('ChatSetting.quit_group') }}
    </TUIButton>

    <Divider v-if="canQuitGroup && canDismissGroup" variant="line" />

    <!-- Dismiss group button - only for group owner -->
    <TUIButton
      v-if="canDismissGroup"
      class="group-actions__button"
      color="red"
      radius="rect"
      type="text"
      @click="() => isShowDismissDialog = true"
    >
      {{ t('ChatSetting.dismiss_group') }}
    </TUIButton>

    <!-- Clear History Dialog -->
    <TUIDialog
      appendTo="body"
      :visible="isShowClearHistoryDialog"
      :title="t('ChatSetting.clear_history_message')"
      @close="() => isShowClearHistoryDialog = false"
      @cancel="() => isShowClearHistoryDialog = false"
      @confirm="handleClearHistory"
    >
      <div>
        {{ t('ChatSetting.confirm_clear_history') }}
      </div>
    </TUIDialog>

    <!-- Transfer Group Owner Dialog -->
    <TUIDialog
      appendTo="body"
      :visible="isShowTransferDialog"
      :title="t('ChatSetting.transfer_group_owner')"
      :custom-classes="['user-picker-dialog']"
      @close="() => isShowTransferDialog = false"
      @cancel="() => isShowTransferDialog = false"
      @confirm="handleTransferConfirm"
    >
      <UserPicker
        ref="userPickerRef"
        display-mode="list"
        :data-source="transferDataSource"
        :locked-items="[{ key: currentUserID! }]"
        :max-count="1"
        @max-count-exceed="() => {
          TUIToast.error({
            message: t('ChatSetting.only_one_owner_error'),
          });
        }"
      />
    </TUIDialog>

    <!-- Dismiss Group Dialog -->
    <TUIDialog
      appendTo="body"
      :visible="isShowDismissDialog"
      :title="t('ChatSetting.dismiss_group')"
      @close="() => isShowDismissDialog = false"
      @cancel="() => isShowDismissDialog = false"
      @confirm="handleDismissGroup"
    />

    <!-- Quit Group Dialog -->
    <TUIDialog
      appendTo="body"
      :visible="isShowQuitDialog"
      :title="t('ChatSetting.quit_group')"
      @close="() => isShowQuitDialog = false"
      @cancel="() => isShowQuitDialog = false"
      @confirm="handleQuitGroup"
    >
      <div>
        {{ t('ChatSetting.confirm_quit_group') }}
      </div>
    </TUIDialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, inject } from 'vue';
import type { Ref } from 'vue';
import { LoginStore } from '@atomicxcore/core';
import { useChatContext, useGroupStore } from '../../../../chat-store';
import { TUIButton, TUIDialog, TUIToast, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { GroupPermission, hasGroupPermission } from '../../../../types/groupSetting';
import { UserPicker } from '../../../UserPicker';
import { Divider } from '../../Divider';
import type { UserPickerRef } from '../../../UserPicker';
import type { GroupMember, GroupInfo } from '@atomicxcore/core';

const { t } = useUIKit();
const channel = inject('channel', 'default') as string;
const { activeConversation, memberList, clearConversationMessages } = useChatContext(channel);
const { dismissGroup, quitGroup, changeOwner } = useGroupStore();

const currentGroupID = computed(() => {
  const id = activeConversation.value?.conversationID;
  return id?.startsWith('GROUP') ? id.replace(/^GROUP/, '') : undefined;
});

const groupInfo = inject<Ref<GroupInfo | undefined>>('groupInfo');
const currentUserRole = computed(() => groupInfo?.value?.selfRole);
const groupType = computed(() => groupInfo?.value?.groupType);
const currentUserID = computed(() => LoginStore.getState().loginUserInfo?.userID);

const isShowTransferDialog = ref(false);
const isShowClearHistoryDialog = ref(false);
const isShowDismissDialog = ref(false);
const isShowQuitDialog = ref(false);
const loading = ref(false);

const userPickerRef = ref<UserPickerRef>();

const canDismissGroup = computed(() => hasGroupPermission(GroupPermission.DISMISS_GROUP, currentUserRole.value, groupType.value));
const canQuitGroup = computed(() => hasGroupPermission(GroupPermission.QUIT_GROUP, currentUserRole.value, groupType.value));
const canChangeGroupOwner = computed(() => hasGroupPermission(GroupPermission.TRANSFER_OWNERSHIP, currentUserRole.value, groupType.value));

const handleChangeGroupOwner = () => {
  isShowTransferDialog.value = true;
};

const handleTransferConfirm = async () => {
  const selectedItems = userPickerRef.value?.getSelectedItems();
  if (!selectedItems || selectedItems.length === 0) {
    TUIToast.error({ message: t('ChatSetting.select_new_owner_error') });
    return;
  }
  if (selectedItems.length > 1) {
    TUIToast.error({ message: t('ChatSetting.only_one_owner_error') });
    return;
  }
  const newOwnerID = selectedItems[0].key;
  if (!currentGroupID.value) {
    return;
  }
  try {
    loading.value = true;
    await changeOwner(currentGroupID.value, newOwnerID);
    TUIToast.success({ message: t('ChatSetting.transfer_owner_success') });
    isShowTransferDialog.value = false;
  } catch {
    TUIToast.error({ message: t('ChatSetting.transfer_owner_failed') });
  } finally {
    loading.value = false;
  }
};

const transferDataSource = computed(() => {
  return (memberList.value as GroupMember[]).map((member: GroupMember) => {
    let label = member.nickname || member.userID;
    if (label.length > 20) {
      label = `${label.slice(0, 20)}...`;
    }
    label = `${label} (${t(`ChatSetting.group_member_role_${(member.role ?? '').toLowerCase()}`)})`;
    if (member.userID === currentUserID.value) {
      label = `${label} (${t('ChatSetting.me')})`;
    }
    return { key: member.userID, label, avatarUrl: member.avatarURL ?? '' };
  });
});

const handleQuitGroup = async () => {
  if (currentGroupID.value) {
    try {
      await quitGroup(currentGroupID.value);
      isShowQuitDialog.value = false;
    } catch {
      TUIToast.error({ message: t('ChatSetting.quit_group_failed') });
    }
  }
};

const handleDismissGroup = async () => {
  if (currentGroupID.value) {
    try {
      await dismissGroup(currentGroupID.value);
      isShowDismissDialog.value = false;
    } catch {
      TUIToast.error({ message: t('ChatSetting.dismiss_group_failed') });
    }
  }
};

const handleClearHistory = async () => {
  const conversationID = activeConversation.value?.conversationID;
  if (!conversationID) {
    return;
  }
  try {
    await clearConversationMessages(conversationID);
    isShowClearHistoryDialog.value = false;
    TUIToast.success({ message: t('ChatSetting.clear_history_success') });
  } catch {
    TUIToast.error({ message: t('ChatSetting.clear_history_failed') });
  }
};
</script>

<style lang="scss" scoped>
.group-actions {
  display: flex;
  flex-direction: column;

  &__button {
    box-sizing: border-box;
    height: auto;
    width: 100%;
    padding: 12px 0;
  }
}
</style>
