<script lang="ts" setup>
import { computed, inject } from 'vue';
import { GroupType } from '@atomicxcore/core';
import { useChatContext, useGroupStore } from '../../../../chat-store';
import { IconCopy, TUIToast, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { View } from '../../../../baseComp/View';
import { GroupPermission, hasGroupPermission } from '../../../../types/groupSetting';
import { copyTextToClipboard } from '../../../../utils';
import { Avatar } from '../../../Avatar';
import { SettingItem } from '../../SettingItem';

const { t } = useUIKit();
const channel = inject('channel', 'default') as string;
const { activeConversation } = useChatContext(channel);
const { joinedGroupList, updateProfile, loadJoinedGroups } = useGroupStore();

// Ensure the joined group list is populated so groupInfo computed can find this group
loadJoinedGroups();

const currentGroupID = computed(() => {
  const id = activeConversation.value?.conversationID;
  return id?.startsWith('GROUP') ? id.replace(/^GROUP/, '') : undefined;
});

// Reactive: always reflects the latest state from joinedGroupList
const groupInfo = computed(() =>
  joinedGroupList.value.find(g => g.groupID === currentGroupID.value),
);

const groupID = computed(() => groupInfo.value?.groupID);
const groupName = computed(() => groupInfo.value?.groupName);
const notification = computed(() => groupInfo.value?.notification);
const groupType = computed(() => groupInfo.value?.groupType);
const avatarUrl = computed(() => groupInfo.value?.avatarURL ?? '');
const isInGroup = computed(() => groupInfo.value?.selfRole !== undefined);
const currentUserRole = computed(() => groupInfo.value?.selfRole);

const canEditName = computed(() =>
  hasGroupPermission(GroupPermission.EDIT_GROUP_PROFILE_NAME, currentUserRole.value, groupType.value)
  && isInGroup.value,
);

const canEditNotification = computed(() =>
  hasGroupPermission(GroupPermission.EDIT_GROUP_PROFILE_NOTIFICATION, currentUserRole.value, groupType.value)
  && isInGroup.value,
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
  } catch (error: any) {
    TUIToast.error({ message: t('ChatSetting.group_name_update_failed') });
    console.warn('updateGroupProfile::groupName', error);
  }
};

const handleNotificationConfirm = async (value: string) => {
  if (!currentGroupID.value) {
    return;
  }
  try {
    await updateProfile({ groupID: currentGroupID.value, notification: value });
    TUIToast.success({ message: t('ChatSetting.group_notification_update_success') });
  } catch (error: any) {
    TUIToast.error({ message: t('ChatSetting.group_notification_update_failed') });
    console.warn('updateGroupProfile::notification', error);
  }
};

const handleCopyGroupID = () => {
  if (groupID.value) {
    copyTextToClipboard(groupID.value).then(() => {
      TUIToast.success({ message: t('ChatSetting.copied') });
    });
  }
};
</script>

<template>
  <View
    :class="['group-info']"
    :gap="10"
  >
    <!-- Group Avatar -->
    <View
      justify="center"
      align="center"
    >
      <Avatar
        :src="avatarUrl || ''"
        size="xxl"
      />
    </View>

    <!-- Group ID -->
    <View class="group-info__item">
      <View class="group-info__label">
        {{ t('ChatSetting.group_id') }}
      </View>
      <View
        dir="row"
        justify="space-between"
        align="center"
      >
        <View class="group-info__value">
          {{ groupID }}
        </View>
        <IconCopy
          v-if="groupID"
          class="unique-icon-btn"
          size="24px"
          @click="handleCopyGroupID"
        />
      </View>
    </View>

    <!-- Group Name -->
    <SettingItem
      type="input"
      :label="t('ChatSetting.group_name')"
      :value="groupName || ''"
      :placeholder="t('ChatSetting.group_name_placeholder')"
      :editable="canEditName"
      :validator="validateGroupName"
      @confirm="handleGroupNameConfirm"
    />

    <!-- Group notification -->
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

    <!-- Group Type (read-only) -->
    <SettingItem
      type="display"
      :label="t('ChatSetting.group_type')"
      :value="getGroupTypeText()"
    />
  </View>
</template>

<style lang="scss" scoped>
.group-info {
  &__item {
    padding: 10px 0;
  }

  &__label {
    font-size: 14px;
    font-weight: bold;
    line-height: 1.4;
    margin-bottom: 8px;
    color: var(--text-color-primary);
  }

  &__value {
    flex: 1;
    font-size: 14px;
    line-height: 1.5;
    word-break: break-word;
    white-space: pre-wrap;
    color: var(--text-color-secondary);
  }
}
</style>
