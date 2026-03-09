<script lang="ts" setup>
import { ref, computed, onMounted, watch } from 'vue';
import { IconCopy, TUIDialog, TUIToast, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { View } from '../../../baseComp/View';
import { useContactListState } from '../../../states/ContactListState';
import {
  useGroupSettingState,
  GroupMemberRole,
  GroupPermission,
  GroupInviteType,
  GroupType,
} from '../../../states/GroupSettingState';
import { copyTextToClipboard } from '../../../utils';
import { UserPicker } from '../../UserPicker';
import { Divider } from '../Divider';
import { SettingItem } from '../SettingItem';
import { GroupActions } from './GroupActions';
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
  groupName,
  notification,
  groupType,
  allMembers,
  memberCount,
  isInGroup,
  currentUserID,
  currentUserRole,
  inviteOption,
  hasPermission,
  getGroupMemberList,
  updateGroupProfile,
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

const getGroupTypeText = () => {
  if (!groupType.value) {
    return t('ChatSetting.group_type_unknown');
  }

  const groupTypeTextMap: Record<GroupType, string> = {
    [GroupType.WORK]: t('ChatSetting.group_type_work'),
    [GroupType.PUBLIC]: t('ChatSetting.group_type_public'),
    [GroupType.MEETING]: t('ChatSetting.group_type_meeting'),
    [GroupType.COMMUNITY]: t('ChatSetting.group_type_community'),
    [GroupType.AVCHATROOM]: t('ChatSetting.group_type_avchatroom'),
  };

  return groupTypeTextMap[groupType.value] || t('ChatSetting.group_type_unknown');
};

const validateGroupName = (value: string, originalValue?: string) => {
  if (typeof value !== 'string') {
    return t('ChatSetting.group_name_required_string');
  }
  if (value.length === 0) {
    return t('ChatSetting.group_name_required');
  }
  if (value.length > 30) {
    return t('ChatSetting.group_name_max_length');
  }
  if (value === (originalValue || '')) {
    return t('ChatSetting.group_name_unchanged');
  }
  return null;
};

const validateNotification = (value: string, originalValue?: string) => {
  if (typeof value !== 'string') {
    return t('ChatSetting.group_notification_required_string');
  }
  if (value.length > 130) {
    return t('ChatSetting.group_notification_max_length');
  }
  if (value === (originalValue || '')) {
    return t('ChatSetting.group_notification_unchanged');
  }
  return null;
};

const handleGroupNameConfirm = async (value: string) => {
  try {
    await updateGroupProfile({ name: value });
    TUIToast.success({
      message: t('ChatSetting.group_name_update_success'),
    });
  } catch {
    TUIToast.error({
      message: t('ChatSetting.group_name_update_failed'),
    });
  }
};

const handleNotificationConfirm = async (value: string) => {
  try {
    await updateGroupProfile({ notification: value });
    TUIToast.success({
      message: t('ChatSetting.group_notification_update_success'),
    });
  } catch {
    TUIToast.error({
      message: t('ChatSetting.group_notification_update_failed'),
    });
  }
};

const handleCopyGroupID = () => {
  if (groupID.value) {
    copyTextToClipboard(groupID.value).then(() => {
      TUIToast.success({
        message: t('ChatSetting.copied'),
      });
    });
  }
};

onMounted(() => {
  if (groupID.value && prevGroupID.value !== groupID.value) {
    setHasMore(true);
    loading.value = false;
    currentView.value = ViewMode.MAIN;
    prevGroupID.value = groupID.value;
    setTimeout(() => {
      getGroupMemberList({ offset: 0, count: 100 });
    }, 1000);
  }
});

watch(groupID, (newGroupID) => {
  if (newGroupID && prevGroupID.value !== newGroupID) {
    setHasMore(true);
    loading.value = false;
    currentView.value = ViewMode.MAIN;
    prevGroupID.value = newGroupID;
    setTimeout(() => {
      getGroupMemberList({ offset: 0, count: 100 });
    }, 1000);
  }
});

watch([allMembers, memberCount], () => {
  if (allMembers.value && memberCount.value !== undefined) {
    setHasMore(allMembers.value.length < memberCount.value);
  }
});

function setHasMore(value: boolean) {
  hasMore.value = value;
}

const handleLoadMoreMembers = async () => {
  if (loading.value || !hasMore.value || !groupID.value) {
    return;
  }
  loading.value = true;
  try {
    await getGroupMemberList({
      offset: allMembers.value?.length || 0,
      count: 100,
    });
  } catch {
    TUIToast.error({
      message: t('ChatSetting.failed_to_load_more_members'),
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
  <Divider variant="line" :full-width="true" />
  <GroupManagement
    v-if="currentView === ViewMode.GROUP_MANAGEMENT"
    @back="() => currentView = ViewMode.MAIN"
  />
  <View
    v-else-if="groupID"
    :class="['group-chat-setting']"
  >
    <SettingItem
      type="input"
      :label="t('ChatSetting.group_name')"
      :value="groupName || ''"
      :placeholder="t('ChatSetting.group_name_placeholder')"
      :editable="Boolean(hasPermission(GroupPermission.EDIT_GROUP_PROFILE_NAME) && isInGroup)"
      :validator="validateGroupName"
      @confirm="handleGroupNameConfirm"
    />
    <Divider variant="line" />
    <div class="group-chat-setting__group-id-row">
      <div class="group-chat-setting__label">
        {{ t('ChatSetting.group_id') }}
      </div>
      <div class="group-chat-setting__value-row">
        <div class="group-chat-setting__value">
          {{ groupID }}
        </div>
        <IconCopy
          v-if="groupID"
          class="unique-icon-btn"
          size="24px"
          @click="handleCopyGroupID"
        />
      </div>
    </div>

    <template v-if="isInGroup">
      <Divider variant="section" />
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
    </template>

    <Divider variant="section" />
    <SettingItem
      type="textarea"
      :label="t('ChatSetting.group_notification')"
      :value="notification || ''"
      :placeholder="t('ChatSetting.group_notification_placeholder')"
      :rows="4"
      :editable="Boolean(hasPermission(GroupPermission.EDIT_GROUP_PROFILE_NOTIFICATION) && isInGroup)"
      :validator="validateNotification"
      @confirm="handleNotificationConfirm"
    />

    <template v-if="isInGroup">
      <GroupManagementEntry
        @click="() => currentView = ViewMode.GROUP_MANAGEMENT"
      />
    </template>

    <Divider variant="line" />
    <SettingItem
      type="display"
      :label="t('ChatSetting.group_type')"
      :value="getGroupTypeText()"
    />

    <template v-if="isInGroup">
      <Divider variant="section" />
      <PersonalSettings />

      <Divider variant="section" />
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
          class="user-picker-dialog__content"
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
  &__group-id-row {
    padding: 14px 20px 11px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__label {
    font-size: 14px;
    color: var(--text-color-primary);
  }

  &__value-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  &__value {
    flex: 1;
    min-width: 0;
    font-size: 14px;
    line-height: 1.5;
    word-break: break-word;
    color: var(--text-color-secondary);
  }
}
</style>

<style lang="scss">
.user-picker-dialog {
  height: 70vh;

  &__content {
    width: 100%;
  }
}
</style>
