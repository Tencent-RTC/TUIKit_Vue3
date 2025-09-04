<template>
  <div
    :class="[
      'group-actions',
    ]"
  >
    <!-- Change group owner button - only for group owner -->
    <TUIButton
      v-if="canChangeGroupOwner"
      class="group-actions__button"
      radius="rect"
      :disabled="loading"
      @click="handleChangeGroupOwner"
    >
      {{ t('ChatSetting.transfer_group_owner') }}
    </TUIButton>

    <!-- Quit group button -->
    <TUIButton
      v-if="canQuitGroup"
      class="group-actions__button"
      color="red"
      radius="rect"
      @click="() => isShowQuitDialog = true"
    >
      {{ t('ChatSetting.quit_group') }}
    </TUIButton>

    <!-- Dismiss group button - only for group owner -->
    <TUIButton
      v-if="canDismissGroup"
      class="group-actions__button"
      color="red"
      radius="rect"
      @click="() => isShowDismissDialog = true"
    >
      {{ t('ChatSetting.dismiss_group') }}
    </TUIButton>

    <!-- Transfer Group Owner Dialog -->
    <TUIDialog
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
      :visible="isShowDismissDialog"
      :title="t('ChatSetting.dismiss_group')"
      @close="() => isShowDismissDialog = false"
      @cancel="() => isShowDismissDialog = false"
      @confirm="handleDismissGroup"
    />

    <!-- Quit Group Dialog -->
    <TUIDialog
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
import { ref, computed } from 'vue';
import { TUIButton, TUIDialog, TUIToast, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useGroupSettingState, GroupPermission } from '../../../../states/GroupSettingState';
import { UserPicker } from '../../../UserPicker';
import type { UserPickerRef } from '../../../UserPicker';

const { t } = useUIKit();

const {
  allMembers,
  currentUserID,
  dismissGroup,
  quitGroup,
  hasPermission,
  changeGroupOwner,
} = useGroupSettingState();

const isShowTransferDialog = ref(false);
const isShowDismissDialog = ref(false);
const isShowQuitDialog = ref(false);
const loading = ref(false);

const userPickerRef = ref<UserPickerRef>();

// Check permissions for different actions
const canDismissGroup = computed(() => hasPermission(GroupPermission.DISMISS_GROUP));
const canQuitGroup = computed(() => hasPermission(GroupPermission.QUIT_GROUP));
const canChangeGroupOwner = computed(() => hasPermission(GroupPermission.TRANSFER_OWNERSHIP));

// Handle change group owner
const handleChangeGroupOwner = () => {
  isShowTransferDialog.value = true;
};

// Handle transfer confirm
const handleTransferConfirm = async () => {
  const selectedItems = userPickerRef.value?.getSelectedItems();
  if (!selectedItems || selectedItems.length === 0) {
    TUIToast.error({
      message: t('ChatSetting.select_new_owner_error'),
    });
    return;
  }

  if (selectedItems.length > 1) {
    TUIToast.error({
      message: t('ChatSetting.only_one_owner_error'),
    });
    return;
  }

  const newOwnerID = selectedItems[0].key;

  try {
    loading.value = true;
    await changeGroupOwner({ newOwnerID });
    TUIToast.success({
      message: t('ChatSetting.transfer_owner_success'),
    });
    isShowTransferDialog.value = false;
  } catch {
    TUIToast.error({
      message: t('ChatSetting.transfer_owner_failed'),
    });
  } finally {
    loading.value = false;
  }
};

// Get available members for transfer (exclude current user and owner)
const transferDataSource = computed(() => {
  if (!allMembers.value) {
    return [];
  }

  return allMembers.value
    .map((member) => {
      let label = member.nick || member.userID;
      if (label.length > 20) {
        label = `${label.slice(0, 20)}...`;
      }
      label = `${label} (${t(`ChatSetting.group_member_role_${member.role.toLowerCase()}`)})`;

      if (member.userID === currentUserID.value) {
        label = `${label} (${t('ChatSetting.me')})`;
      }

      return {
        key: member.userID,
        label,
        avatarUrl: member.avatar,
      };
    });
});

// Handle quit group
const handleQuitGroup = () => {
  quitGroup();
};

// Handle dismiss group
const handleDismissGroup = () => {
  dismissGroup();
};
</script>

<style lang="scss" scoped>
.group-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;

  &__button {
    width: 100%;
  }
}
</style>
