<script lang="ts" setup>
import { ref, computed, onMounted, watch } from 'vue';
import { TUIDialog, TUIToast, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { View } from '../../../baseComp/View';
import { useContactListState } from '../../../states/ContactListState';
import { useGroupSettingState, GroupMemberRole, GroupPermission, GroupInviteType } from '../../../states/GroupSettingState';
import { UserPicker } from '../../UserPicker';
import { GroupActions } from './GroupActions';
import { GroupInfo } from './GroupInfo';
import { GroupManagement } from './GroupManagement';
import { GroupManagementEntry } from './GroupManagementEntry';
import { GroupMembers } from './GroupMembers';
import { PersonalSettings } from './PersonalSettings';
import type { UserPickerRow, UserPickerRef } from '../../UserPicker';

enum ViewMode {
  MAIN = 'main',
  GROUP_MANAGEMENT = 'group_management',
}

const {
  groupID,
  allMembers,
  memberCount,
  isInGroup,
  currentUserID,
  currentUserRole,
  inviteOption,
  // Business GroupActions
  hasPermission,
  getGroupMemberList,
  addGroupMember,
  deleteGroupMember,
} = useGroupSettingState();

const { friendList } = useContactListState();

const { t } = useUIKit();

const prevGroupID = ref('');
const loading = ref(false);
const hasMore = ref(true);
const currentView = ref<ViewMode>(ViewMode.MAIN);
const isShowUserPickerDialog = ref(false);
const memberDataSource = ref<UserPickerRow[]>([]);
const userPickerLockedItems = ref<UserPickerRow[]>([]);
const memberActionType = ref<'remove' | 'add' | null>(null);

const userPickerRef = ref<UserPickerRef>();

// Initialize member list when component mounts
onMounted(() => {
  if (groupID.value && prevGroupID.value !== groupID.value) {
    setHasMore(true);
    loading.value = false;
    currentView.value = ViewMode.MAIN;
    prevGroupID.value = groupID.value;
    // Reset and load initial members
    setTimeout(() => {
      getGroupMemberList({ offset: 0, count: 100 });
    }, 1000);
  }
});

// Watch for groupID changes
watch(groupID, (newGroupID) => {
  if (newGroupID && prevGroupID.value !== newGroupID) {
    setHasMore(true);
    loading.value = false;
    currentView.value = ViewMode.MAIN;
    prevGroupID.value = newGroupID;
    // Reset and load initial members
    setTimeout(() => {
      getGroupMemberList({ offset: 0, count: 100 });
    }, 1000);
  }
});

// Update hasMore based on member count
watch([allMembers, memberCount], () => {
  if (allMembers.value && memberCount.value !== undefined) {
    setHasMore(allMembers.value.length < memberCount.value);
  }
});

function setHasMore(value: boolean) {
  hasMore.value = value;
}

// Handle load more members
const handleLoadMoreMembers = async () => {
  if (loading.value || !hasMore.value || !groupID.value) {
    return;
  }
  loading.value = true;
  try {
    await getGroupMemberList({
      offset: allMembers.value?.length || 0,
      count: 100, // Load 100 more members each time
    });
  } catch {
    TUIToast.error({
      message: 'Failed to load more members',
    });
  } finally {
    loading.value = false;
  }
};

const onUserPickerDialogOpen = (action: 'remove' | 'add') => {
  if (!allMembers.value || !action) {
    return;
  }

  if (action === 'remove') {
    memberActionType.value = 'remove';
    const dataSource = (allMembers.value || [])?.map((member) => {
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

    memberDataSource.value = dataSource;

    const lockedItems = allMembers.value
      .filter(member =>
        member.userID === currentUserID.value
        || member.role === GroupMemberRole.OWNER
        || (currentUserRole.value === GroupMemberRole.ADMIN && member.role === GroupMemberRole.ADMIN))
      .map(member => ({
        key: member.userID,
        label: member.nick || member.userID,
        avatarUrl: member.avatar,
      }));
    userPickerLockedItems.value = lockedItems;
    isShowUserPickerDialog.value = true;
  }

  if (action === 'add') {
    memberActionType.value = 'add';
    const dataSource = (friendList.value || [])?.map((friend) => {
      let label = friend.nick || friend.userID;
      if (label.length > 20) {
        label = `${label.slice(0, 20)}...`;
      }
      return {
        key: friend.userID,
        label,
        avatarUrl: friend.avatar ?? '',
      };
    });
    memberDataSource.value = dataSource;
    const lockedItems = allMembers.value?.map(member => ({
      key: member.userID,
      label: member.nick || member.userID,
      avatarUrl: member.avatar,
    }));
    userPickerLockedItems.value = lockedItems;
    isShowUserPickerDialog.value = true;
  }
};

const onRemoveMemberUserPickerReachEnd = () => {
  handleLoadMoreMembers();
};

const onUserPickerConfirm = () => {
  const selectedItems = userPickerRef.value?.getSelectedItems();
  if (memberActionType.value === 'remove') {
    if (selectedItems && selectedItems.length > 0) {
      deleteGroupMember({
        userIDList: selectedItems.map(item => item.key),
      })
        .then(() => {
          TUIToast.success({
            message: t('ChatSetting.group_member_remove_success'),
          });
        })
        .catch(() => {
          TUIToast.error({
            message: t('ChatSetting.group_member_remove_failed'),
          });
        });
    }
  } else if (memberActionType.value === 'add') {
    if (selectedItems && selectedItems.length > 0) {
      addGroupMember({
        userIDList: selectedItems.map(item => item.key),
      })
        .then((result) => {
          if (result.data.successUserIDList.length < selectedItems.length) {
            TUIToast.warning({
              message: t('ChatSetting.group_member_add_partially_failed'),
            });
          } else {
            TUIToast.success({
              message: t('ChatSetting.group_member_add_success'),
            });
          }
        })
        .catch(() => {
          TUIToast.error({
            message: t('ChatSetting.group_member_add_failed'),
          });
        });
    }
  }
  memberActionType.value = null;
  isShowUserPickerDialog.value = false;
};

const userPickerDialogTitle = computed(() => {
  if (memberActionType.value === 'remove') {
    return t('ChatSetting.remove_member_dialog_title');
  }
  return t('ChatSetting.add_member_dialog_title');
});
</script>

<template>
  <!-- Render different views based on current view mode -->
  <GroupManagement
    v-if="currentView === ViewMode.GROUP_MANAGEMENT"
    @back="() => currentView = ViewMode.MAIN"
  />
  <View
    v-else-if="groupID"
    :class="['group-chat-setting']"
  >
    <GroupInfo />
    <template v-if="isInGroup">
      <GroupMembers
        :key="groupID"
        :members="allMembers"
        :member-count="memberCount || 0"
        :hidden-member-count="typeof memberCount === 'undefined'"
        :loading="loading"
        :has-more="hasMore"
        :show-add-button="inviteOption === GroupInviteType.FREE_ACCESS || inviteOption === GroupInviteType.NEED_PERMISSION"
        :show-remove-button="hasPermission(GroupPermission.REMOVE_MEMBER)"
        @reach-end="handleLoadMoreMembers"
        @remove-button-click="() => onUserPickerDialogOpen('remove')"
        @add-button-click="() => onUserPickerDialogOpen('add')"
      />
      <GroupManagementEntry
        @click="() => currentView = ViewMode.GROUP_MANAGEMENT"
      />
      <PersonalSettings />
      <GroupActions />
      <TUIDialog
        appendTo="body"
        :visible="isShowUserPickerDialog"
        :title="userPickerDialogTitle"
        :custom-classes="['user-picker-dialog']"
        :confirm-text="t('ChatSetting.confirm')"
        :cancel-text="t('ChatSetting.cancel')"
        @close="() => isShowUserPickerDialog = false"
        @cancel="() => isShowUserPickerDialog = false"
        @confirm="onUserPickerConfirm"
      >
        <UserPicker
          ref="userPickerRef"
          display-mode="list"
          :data-source="memberDataSource"
          :locked-items="userPickerLockedItems"
          @reach-end="onRemoveMemberUserPickerReachEnd"
        />
      </TUIDialog>
    </template>
  </View>
</template>

<style lang="scss" scoped>
.group-chat-setting {
  gap: 16px;
  padding: 16px;
}
</style>

<style lang="scss">
.user-picker-dialog {
  height: 70vh;
}
</style>
