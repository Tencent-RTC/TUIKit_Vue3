<template>
  <View
    v-if="groupID"
    :class="'group-management'"
  >
    <!-- Header -->
    <View
      class="group-management__header"
      dir="row"
      align="center"
      justify="flex-start"
      :gap="8"
    >
      <IconArrowStrokeBack
        class="group-management__back-btn"
        @click="handleBack"
      />
      <span class="group-management__title">{{ t('ChatSetting.group_management') }}</span>
    </View>

    <!-- Admin Management -->
    <GroupMembers
      v-if="hasPermission(GroupPermission.SET_MEMBER_ROLE, GroupMemberRole.OWNER)"
      :title="t('ChatSetting.group_admin')"
      :members="adminMembers"
      :member-count="adminMembers?.length || 0"
      :hidden-member-count="true"
      :show-add-button="currentUserRole === GroupMemberRole.OWNER"
      :show-remove-button="currentUserRole === GroupMemberRole.OWNER"
      :expandable="true"
      @add-button-click="() => handleAdminManagement('promote')"
      @remove-button-click="() => handleAdminManagement('demote')"
    />

    <!-- Mute Management -->
    <GroupMembers
      v-if="hasPermission(GroupPermission.MUTE_MEMBER)"
      :title="t('ChatSetting.mute_management')"
      :members="mutedMembers"
      :member-count="mutedMembers.length"
      :show-add-button="true"
      :show-remove-button="true"
      :expandable="true"
      @add-button-click="() => handleMuteManagement('mute')"
      @remove-button-click="() => handleMuteManagement('unmute')"
    />

    <!-- Mute All Members -->
    <View
      v-if="hasPermission(GroupPermission.MUTE_ALL_MEMBERS) && isMuteAllMembers !== undefined"
      class="group-management__mute-all"
    >
      <SettingItem
        type="switch"
        :label="t('ChatSetting.mute_all_members')"
        :value="isMuteAllMembers"
        @change="() => handleMuteAllToggle(!isMuteAllMembers)"
      />
      <div class="group-management__mute-all-desc">
        {{ t('ChatSetting.mute_all_members_description') }}
      </div>
    </View>

    <!-- User Picker Dialog -->
    <TUIDialog
      :custom-classes="['user-picker-dialog']"
      :visible="isShowUserPickerDialog"
      :title="userPickerTitle"
      @close="() => isShowUserPickerDialog = false"
      @cancel="() => isShowUserPickerDialog = false"
      @confirm="handleUserPickerConfirm"
    >
      <UserPicker
        ref="userPickerRef"
        display-mode="list"
        :data-source="userPickerDataSource"
        :locked-items="userPickerLockedItems"
      />
    </TUIDialog>
  </View>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import { TUIDialog, TUIToast, IconArrowStrokeBack, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { View } from '../../../../baseComp/View';
import {
  useGroupSettingState,
  GroupPermission,
  GroupMemberRole,
} from '../../../../states/GroupSettingState';
import { UserPicker } from '../../../UserPicker';
import { SettingItem } from '../../SettingItem';
import { GroupMembers } from '../GroupMembers';
import type { IUserPickerRow, IUserPickerRef } from '../../../UserPicker';

const emit = defineEmits<{
  back: [];
}>();

const { t } = useUIKit();

const {
  groupID,
  allMembers,
  adminMembers,
  currentUserID,
  currentUserRole,
  isMuteAllMembers,
  hasPermission,
  // Business actions
  getGroupMemberList,
  setGroupMemberRole,
  setGroupMemberMuteTime,
  setMuteAllMember,
} = useGroupSettingState();

const isShowUserPickerDialog = ref(false);
const userPickerTitle = ref('');
const userPickerLockedItems = ref<any[]>([]);

const userPickerRef = ref<IUserPickerRef>();
const memberActionRef = ref<'promote_admin' | 'demote_admin' | 'mute' | 'unmute' | null>(null);

// Filter muted members
const mutedMembers = computed(() => {
  if (!allMembers.value) {
    return [];
  }
  return allMembers.value.filter((member) => {
    if (!member.muteUntil) {
      return false;
    }
    const muteTime = parseInt(member.muteUntil, 10);
    return muteTime > Date.now() / 1000;
  });
});

const handleBack = () => {
  emit('back');
};

// Handle admin management
const handleAdminManagement = (action: 'promote' | 'demote') => {
  if (!allMembers.value) {
    return;
  }

  if (action === 'promote') {
    memberActionRef.value = 'promote_admin';
    userPickerTitle.value = t('ChatSetting.set_admin');
    userPickerLockedItems.value = [];
  } else {
    memberActionRef.value = 'demote_admin';
    userPickerTitle.value = t('ChatSetting.unset_admin');
    // Lock current user if they are admin
    const lockedItems = currentUserRole.value === GroupMemberRole.ADMIN
      ? [{
        key: currentUserID.value!,
      }]
      : [];

    userPickerLockedItems.value = lockedItems;
  }
  isShowUserPickerDialog.value = true;
};

// Handle mute management
const handleMuteManagement = (action: 'mute' | 'unmute') => {
  if (!allMembers.value) {
    return;
  }

  isShowUserPickerDialog.value = true;

  if (action === 'mute') {
    memberActionRef.value = 'mute';
    userPickerTitle.value = t('ChatSetting.mute_members');
    // Lock privileged users based on current user role
    const lockedItems = allMembers.value
      .filter((member) => {
        if (member.userID === currentUserID.value) {
          return true;
        }
        if (member.role === GroupMemberRole.OWNER) {
          return true;
        }
        if (currentUserRole.value === GroupMemberRole.ADMIN && member.role === GroupMemberRole.ADMIN) {
          return true;
        }
        return false;
      })
      .map(member => ({
        key: member.userID,
        label: member.nick || member.userID,
        avatarUrl: member.avatar,
      }));
    userPickerLockedItems.value = lockedItems;
  } else {
    memberActionRef.value = 'unmute';
    userPickerTitle.value = t('ChatSetting.unmute_members');
    userPickerLockedItems.value = [];
  }
};

// Handle user picker confirm
const handleUserPickerConfirm = async () => {
  const selectedItems = userPickerRef.value?.getSelectedItems();
  if (!selectedItems || selectedItems.length === 0) {
    return;
  }

  const action = memberActionRef.value;
  if (!action) {
    return;
  }

  try {
    const promises = selectedItems.map((item) => {
      switch (action) {
        case 'promote_admin':
          return setGroupMemberRole({
            userID: item.key,
            role: GroupMemberRole.ADMIN,
          });
        case 'demote_admin':
          return setGroupMemberRole({
            userID: item.key,
            role: GroupMemberRole.COMMON,
          });
        case 'mute':
          return setGroupMemberMuteTime({
            userID: item.key,
            time: 86400 * 30,
          });
        case 'unmute':
          return setGroupMemberMuteTime({
            userID: item.key,
            time: 0,
          });
        default:
          return Promise.resolve();
      }
    });

    await Promise.all(promises);

    TUIToast.success({
      message: t('ChatSetting.operation_success'),
    });

    isShowUserPickerDialog.value = false;

    // Refresh member list
    await getGroupMemberList({ offset: 0, count: 100 });
  } catch {
    TUIToast.error({
      message: t('ChatSetting.operation_failed'),
    });
  }
};

// Handle mute all members toggle
const handleMuteAllToggle = (checked: boolean) => {
  setMuteAllMember(checked).then(() => {
    TUIToast.success({
      message: checked ? t('ChatSetting.all_members_muted') : t('ChatSetting.all_members_unmuted'),
    });
  }).catch(() => {
    TUIToast.error({
      message: t('ChatSetting.mute_all_failed'),
    });
  });
};

// Get filtered data source for user picker
const userPickerDataSource = computed(() => {
  if (!allMembers.value || !isShowUserPickerDialog.value) {
    return [];
  }

  const action = memberActionRef.value;
  let filteredMembers = allMembers.value;

  switch (action) {
    case 'promote_admin':
      filteredMembers = allMembers.value.filter(member => member.role === GroupMemberRole.COMMON);
      break;
    case 'demote_admin':
      filteredMembers = adminMembers.value || [];
      break;
    case 'mute':
      filteredMembers = allMembers.value.filter((member) => {
        const muteTime = member.muteUntil ? parseInt(member.muteUntil, 10) : 0;
        return muteTime * 1000 <= Date.now();
      });
      break;
    case 'unmute':
      filteredMembers = allMembers.value.filter((member) => {
        const muteTime = member.muteUntil ? parseInt(member.muteUntil, 10) : 0;
        return muteTime * 1000 > Date.now();
      });
      break;
    default:
      break;
  }

  return filteredMembers.map(member => ({
    key: member.userID,
    label: `${member.nick || member.userID} (${member.userID === currentUserID.value ? 'Me' : member.role})`,
    avatarUrl: member.avatar,
  }));
});
</script>

<style lang="scss" scoped>
.group-management {
  padding: 0 20px;

  &__header {
    padding: 16px 0;
    border-bottom: 1px solid var(--border-color-light);
  }

  &__back-btn {
    width: 28px;
    height: 28px;
    padding: 6px;
    cursor: pointer;
    color: var(--text-color-primary);

    &:hover {
      color: var(--text-color-secondary);
    }
  }

  &__title {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-color-primary);
  }

  &__mute-all {
    color: var(--text-color-primary);
  }

  &__mute-all-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  &__mute-all-title {
    font-size: 16px;
    font-weight: 500;
  }

  &__mute-all-desc {
    font-size: 14px;
    color: var(--text-color-secondary);
  }
}
</style>
