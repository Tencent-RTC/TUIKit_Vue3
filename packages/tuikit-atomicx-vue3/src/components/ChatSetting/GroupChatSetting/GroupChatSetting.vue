<script lang="ts" setup>
import { onMounted, ref, computed, inject, watch, provide } from 'vue';
import { GroupType, GroupMemberRole, GroupInviteOption, LoginStore, ContactStore } from '@atomicxcore/core';
import { useChatContext, useGroupStore } from '../../../chat-store';
import { IconCopy, TUIDialog, TUIToast, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { View } from '../../../baseComp/View';
import { GroupPermission, hasGroupPermission } from '../../../types/groupSetting';
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
import type { GroupMember, GroupInfo } from '@atomicxcore/core';

enum ViewMode {
  MAIN = 'main',
  GROUP_MANAGEMENT = 'group_management',
}

const { t } = useUIKit();
const channel = inject('channel', 'default') as string;
const {
  activeConversation,
  memberList,
  hasMoreMembers,
  addMember,
  deleteMember,
  loadMembers,
  loadMoreMembers,
} = useChatContext(channel);
const { joinedGroupList, updateProfile, loadJoinedGroups, getGroupInfo } = useGroupStore();

onMounted(() => {
  loadJoinedGroups();
});

const currentGroupID = computed(() => {
  const id = activeConversation.value?.conversationID;
  return id?.startsWith('GROUP') ? id.replace(/^GROUP/, '') : undefined;
});

// Full GroupInfo (including selfRole, notification etc.) fetched on demand
const fullGroupInfo = ref<GroupInfo | undefined>(undefined);

watch(
  [currentGroupID],
  async ([id]) => {
    if (!id) {
      fullGroupInfo.value = undefined;
      return;
    }
    try {
      fullGroupInfo.value = await getGroupInfo(id);
    } catch {
      fullGroupInfo.value = undefined;
    }
  },
  { immediate: true },
);

watch(joinedGroupList, (joinedGroupList) => {
  const currentGroup = joinedGroupList.find(group => group.groupID === currentGroupID.value);
  if (currentGroup && fullGroupInfo.value) {
    for (const [key, value] of Object.entries(currentGroup)) {
      if (value !== undefined && value !== null) {
        (fullGroupInfo.value as any)[key] = value;
      }
    }
  } else if (!currentGroup && fullGroupInfo.value) {
    // No longer in group (quit/dismissed) — clear selfRole so isInGroup becomes false
    fullGroupInfo.value.selfRole = undefined;
  }
}, { immediate: true });

const groupID = computed(() => fullGroupInfo.value?.groupID);
const groupName = computed(() => fullGroupInfo.value?.groupName);
const notification = computed(() => fullGroupInfo.value?.notification);
const groupType = computed(() => fullGroupInfo.value?.groupType);
const inviteOption = computed(() => fullGroupInfo.value?.inviteOption);
const isInGroup = computed(() => fullGroupInfo.value?.selfRole !== undefined);
const currentUserRole = computed(() => fullGroupInfo.value?.selfRole);
const currentUserID = computed(() => LoginStore.getState().loginUserInfo?.userID);

provide('groupInfo', fullGroupInfo);

watch(
  [currentGroupID, fullGroupInfo],
  ([id]) => {
    const inGroup = fullGroupInfo.value?.selfRole !== undefined;
    if (id && inGroup) {
      loadMembers();
    }
  },
  { immediate: true },
);

// Map friendList from ContactStore (pure state read, no Vue reactivity needed here)
const friendList = computed(() => ContactStore.getState().friendList);

const prevGroupID = ref('');
const loading = ref(false);
const currentView = ref<ViewMode>(ViewMode.MAIN);
const isShowUserPickerDialog = ref(false);
const memberDataSource = ref<UserPickerRow[]>([]);
const userPickerLockedItems = ref<UserPickerRow[]>([]);
const memberActionType = ref<'remove' | 'add' | null>(null);
const userPickerRef = ref<UserPickerRef>();

watch(currentGroupID, (newGroupID) => {
  if (newGroupID && prevGroupID.value !== newGroupID) {
    loading.value = false;
    currentView.value = ViewMode.MAIN;
    prevGroupID.value = newGroupID;
  }
});

const canEditName = computed(() =>
  hasGroupPermission(GroupPermission.EDIT_GROUP_PROFILE_NAME, currentUserRole.value, groupType.value)
  && isInGroup.value,
);

const canEditNotification = computed(() =>
  hasGroupPermission(GroupPermission.EDIT_GROUP_PROFILE_NOTIFICATION, currentUserRole.value, groupType.value)
  && isInGroup.value,
);

const canRemoveMember = computed(() =>
  hasGroupPermission(GroupPermission.REMOVE_MEMBER, currentUserRole.value, groupType.value),
);

const getGroupTypeText = () => {
  if (!groupType.value) {
    return t('ChatSetting.group_type_unknown');
  }
  const groupTypeTextMap: Record<GroupType, string> = {
    [GroupType.Work]: t('ChatSetting.group_type_work'),
    [GroupType.Public]: t('ChatSetting.group_type_public'),
    [GroupType.Meeting]: t('ChatSetting.group_type_meeting'),
    [GroupType.Community]: t('ChatSetting.group_type_community'),
    [GroupType.AVChatRoom]: t('ChatSetting.group_type_avchatroom'),
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
  if (!currentGroupID.value) {
    return;
  }
  try {
    await updateProfile({ groupID: currentGroupID.value, groupName: value });
    TUIToast.success({ message: t('ChatSetting.group_name_update_success') });
  } catch {
    TUIToast.error({ message: t('ChatSetting.group_name_update_failed') });
  }
};

const handleNotificationConfirm = async (value: string) => {
  if (!currentGroupID.value) {
    return;
  }
  try {
    await updateProfile({ groupID: currentGroupID.value, notification: value });
    TUIToast.success({ message: t('ChatSetting.group_notification_update_success') });
  } catch {
    TUIToast.error({ message: t('ChatSetting.group_notification_update_failed') });
  }
};

const handleCopyGroupID = () => {
  if (groupID.value) {
    copyTextToClipboard(groupID.value).then(() => {
      TUIToast.success({ message: t('ChatSetting.copied') });
    });
  }
};

const handleLoadMoreMembers = async () => {
  if (loading.value || !hasMoreMembers.value || !currentGroupID.value) {
    return;
  }
  loading.value = true;
  try {
    await loadMoreMembers();
  } catch {
    TUIToast.error({ message: t('ChatSetting.failed_to_load_more_members') });
  } finally {
    loading.value = false;
  }
};

const onUserPickerDialogOpen = (action: 'remove' | 'add') => {
  if (!memberList.value.length || !action) {
    return;
  }

  if (action === 'remove') {
    memberActionType.value = 'remove';
    const dataSource = memberList.value.map((member: GroupMember) => {
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
    memberDataSource.value = dataSource;
    const lockedItems = memberList.value
      .filter((member: GroupMember) =>
        member.userID === currentUserID.value
        || member.role === GroupMemberRole.Owner
        || (currentUserRole.value === GroupMemberRole.Admin && member.role === GroupMemberRole.Admin))
      .map((member: GroupMember) => ({
        key: member.userID,
        label: member.nickname || member.userID,
        avatarUrl: member.avatarURL ?? '',
      }));
    userPickerLockedItems.value = lockedItems;
    isShowUserPickerDialog.value = true;
  }

  if (action === 'add') {
    memberActionType.value = 'add';
    const dataSource = friendList.value.map(friend => ({
      key: friend.userID,
      label: friend.nickname || friend.userID,
      avatarUrl: friend.avatarURL ?? '',
    }));
    memberDataSource.value = dataSource;
    const lockedItems = memberList.value.map((member: GroupMember) => ({
      key: member.userID,
      label: member.nickname || member.userID,
      avatarUrl: member.avatarURL ?? '',
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
      deleteMember(selectedItems.map(item => item.key))
        .then(() => {
          TUIToast.success({ message: t('ChatSetting.group_member_remove_success') });
        })
        .catch(() => {
          TUIToast.error({ message: t('ChatSetting.group_member_remove_failed') });
        });
    }
  } else if (memberActionType.value === 'add') {
    if (selectedItems && selectedItems.length > 0) {
      addMember(selectedItems.map(item => item.key))
        .then((result) => {
          if (result.successUserIDList.length < selectedItems.length) {
            TUIToast.warning({ message: t('ChatSetting.group_member_add_partially_failed') });
          } else {
            TUIToast.success({
              message: t('ChatSetting.group_member_add_success'),
            });
          }
        })
        .catch(() => {
          TUIToast.error({ message: t('ChatSetting.group_member_add_failed') });
        });
    }
  }
  memberActionType.value = null;
  isShowUserPickerDialog.value = false;
};

const userPickerDialogTitle = computed(() =>
  memberActionType.value === 'remove'
    ? t('ChatSetting.remove_member_dialog_title')
    : t('ChatSetting.add_member_dialog_title'),
);
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
      :editable="canEditName"
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
        :members="(memberList as any)"
        :member-count="fullGroupInfo?.memberCount"
        :hidden-member-count="inviteOption === GroupInviteOption.Any || inviteOption === GroupInviteOption.Auth"
        :loading="loading"
        :has-more="hasMoreMembers"
        :show-add-button="inviteOption === GroupInviteOption.Any || inviteOption === GroupInviteOption.Auth"
        :show-remove-button="canRemoveMember"
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
      :editable="canEditNotification"
      :validator="validateNotification"
      @confirm="handleNotificationConfirm"
    />

    <!-- <SettingItem
      type="input"
      :editable="true"
      :label="t('ChatSetting.my_name_card')"
      :value="nameCard || ''"
      @confirm="handleNameCardConfirm"
    /> -->

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
