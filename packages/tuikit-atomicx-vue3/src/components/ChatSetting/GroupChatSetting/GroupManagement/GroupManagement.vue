<template>
  <View
    v-if="currentGroupID"
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
      v-if="hasPermission(GroupPermission.SET_MEMBER_ROLE, GroupMemberRole.Owner)"
      :title="t('ChatSetting.group_admin')"
      :members="adminMembers"
      :member-count="adminMembers?.length || 0"
      :hidden-member-count="true"
      :show-add-button="currentUserRole === GroupMemberRole.Owner"
      :show-remove-button="currentUserRole === GroupMemberRole.Owner"
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
      appendTo="body"
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
import { ref, computed, inject } from 'vue';
import type { Ref } from 'vue';
import { LoginStore, GroupMemberRole } from '@atomicxcore/core';
import { useChatContext, useGroupStore } from '../../../../chat-store';
import { TUIDialog, TUIToast, IconArrowStrokeBack, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { View } from '../../../../baseComp/View';
import { GroupPermission, hasGroupPermission } from '../../../../types/groupSetting';
import { UserPicker } from '../../../UserPicker';
import { SettingItem } from '../../SettingItem';
import { GroupMembers } from '../GroupMembers';
import type { UserPickerRow, UserPickerRef } from '../../../UserPicker';
import type { GroupInfo, GroupMember } from '@atomicxcore/core';

const emit = defineEmits<{
  back: [];
}>();

const { t } = useUIKit();
const channel = inject('channel', 'default') as string;
const groupInfo = inject<Ref<GroupInfo | undefined>>('groupInfo');
const { memberList, loadMembers, muteMember, setMemberRole } = useChatContext(channel);
const { muteAllMembers } = useGroupStore();

const currentGroupID = computed(() => groupInfo?.value?.groupID);
const currentUserID = computed(() => LoginStore.getState().loginUserInfo?.userID);
const currentUserRole = computed(() => groupInfo?.value?.selfRole);
const groupType = computed(() => groupInfo?.value?.groupType);
const isMuteAllMembers = computed(() => groupInfo?.value?.isAllMuted);

const allMembers = computed<GroupMember[]>(() => memberList.value as GroupMember[]);
const adminMembers = computed<GroupMember[]>(() =>
  allMembers.value.filter(m => m.role === GroupMemberRole.Admin),
);

const hasPermission = (permission: GroupPermission, role?: GroupMemberRole) =>
  hasGroupPermission(permission, role ?? currentUserRole.value, groupType.value);

const isShowUserPickerDialog = ref(false);
const userPickerTitle = ref('');
const userPickerLockedItems = ref<UserPickerRow[]>([]);

const userPickerRef = ref<UserPickerRef>();
const memberActionRef = ref<'promote_admin' | 'demote_admin' | 'mute' | 'unmute' | null>(null);

const mutedMembers = computed<GroupMember[]>(() =>
  allMembers.value.filter(m => m.muteUntil !== undefined && m.muteUntil > Date.now()),
);

const handleBack = () => {
  emit('back');
};

const handleAdminManagement = (action: 'promote' | 'demote') => {
  if (action === 'promote') {
    memberActionRef.value = 'promote_admin';
    userPickerTitle.value = t('ChatSetting.set_admin');
    userPickerLockedItems.value = [];
  } else {
    memberActionRef.value = 'demote_admin';
    userPickerTitle.value = t('ChatSetting.unset_admin');
    userPickerLockedItems.value = currentUserRole.value === GroupMemberRole.Admin
      ? [{ key: currentUserID.value ?? '', label: '', avatarUrl: '' }]
      : [];
  }
  isShowUserPickerDialog.value = true;
};

const handleMuteManagement = (action: 'mute' | 'unmute') => {
  isShowUserPickerDialog.value = true;

  if (action === 'mute') {
    memberActionRef.value = 'mute';
    userPickerTitle.value = t('ChatSetting.mute_members');
    userPickerLockedItems.value = allMembers.value
      .filter(m =>
        m.userID === currentUserID.value
        || m.role === GroupMemberRole.Owner
        || (currentUserRole.value === GroupMemberRole.Admin && m.role === GroupMemberRole.Admin),
      )
      .map(m => ({ key: m.userID, label: m.nickname || m.userID, avatarUrl: m.avatarURL ?? '' }));
  } else {
    memberActionRef.value = 'unmute';
    userPickerTitle.value = t('ChatSetting.unmute_members');
    userPickerLockedItems.value = [];
  }
};

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
          return setMemberRole(item.key, GroupMemberRole.Admin);
        case 'demote_admin':
          return setMemberRole(item.key, GroupMemberRole.Member);
        case 'mute':
          return muteMember(item.key, 86400 * 30);
        case 'unmute':
          return muteMember(item.key, 0);
        default:
          return Promise.resolve();
      }
    });

    await Promise.all(promises);
    TUIToast.success({ message: t('ChatSetting.operation_success') });
    isShowUserPickerDialog.value = false;
    await loadMembers();
  } catch {
    TUIToast.error({ message: t('ChatSetting.operation_failed') });
  }
};

const handleMuteAllToggle = (checked: boolean) => {
  const id = currentGroupID.value;
  if (!id) {
    return;
  }
  muteAllMembers(id, checked).then(() => {
    TUIToast.success({
      message: checked ? t('ChatSetting.all_members_muted') : t('ChatSetting.all_members_unmuted'),
    });
  }).catch(() => {
    TUIToast.error({ message: t('ChatSetting.mute_all_failed') });
  });
};

const userPickerDataSource = computed<UserPickerRow[]>(() => {
  if (!isShowUserPickerDialog.value) {
    return [];
  }
  const action = memberActionRef.value;
  let filtered: GroupMember[] = allMembers.value;

  switch (action) {
    case 'promote_admin':
      filtered = allMembers.value.filter(m => m.role === GroupMemberRole.Member);
      break;
    case 'demote_admin':
      filtered = adminMembers.value;
      break;
    case 'mute':
      filtered = allMembers.value.filter(m => !m.muteUntil || m.muteUntil <= Date.now());
      break;
    case 'unmute':
      filtered = allMembers.value.filter(m => m.muteUntil !== undefined && m.muteUntil > Date.now());
      break;
    default:
      break;
  }

  return filtered.map(m => ({
    key: m.userID,
    label: `${m.nickname || m.userID} (${m.userID === currentUserID.value ? t('ChatSetting.me') : t(`ChatSetting.group_member_role_${(m.role ?? '').toLowerCase()}`)})`,
    avatarUrl: m.avatarURL ?? '',
  }));
});
</script>

<style lang="scss" scoped>
.group-management {
  &__header {
    padding: 16px 20px;
    margin-left: -8px;
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
    padding: 0 20px;
    color: var(--text-color-secondary);
  }
}
</style>
