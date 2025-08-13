<script lang="ts" setup>
import { computed } from 'vue';
import TUIChatEngine from '@tencentcloud/chat-uikit-engine';
import { IconCopy, TUIToast, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { View } from '../../../../baseComp/View';
import { useConversationListState } from '../../../../states/ConversationListState';
import {
  useGroupSettingState,
  GroupPermission,
  GroupType,
} from '../../../../states/GroupSettingState';
import { copyTextToClipboard } from '../../../../utils';
import { Avatar } from '../../../Avatar';
import { SettingItem } from '../../SettingItem';

const { t } = useUIKit();

const {
  groupID,
  groupName,
  notification,
  groupType,
  isInGroup,
  hasPermission,
  updateGroupProfile,
} = useGroupSettingState();

const { currentConversation: activeConversation } = useConversationListState();

// Get group type display text
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

// Validator for group name
const validateGroupName = (value: string, originalValue?: string) => {
  if (typeof value !== 'string') {
    return t('ChatSetting.group_name_required_string');
  }
  if (value.length === 0) {
    return t('ChatSetting.group_name_required');
  }
  if (value.length > 25) {
    return t('ChatSetting.group_name_max_length');
  }
  if (value === (originalValue || '')) {
    return t('ChatSetting.group_name_unchanged');
  }
  return null;
};

// Validator for notification
const validateNotification = (value: string, originalValue?: string) => {
  if (typeof value !== 'string') {
    return t('ChatSetting.group_notification_required_string');
  }
  if (value.length > 100) {
    return t('ChatSetting.group_notification_max_length');
  }
  if (value === (originalValue || '')) {
    return t('ChatSetting.group_notification_unchanged');
  }
  return null;
};

// Handle group name confirm
const handleGroupNameConfirm = async (value: string) => {
  try {
    await updateGroupProfile({ name: value });
    TUIToast.success({
      message: t('ChatSetting.group_name_update_success'),
    });
  } catch (error: any) {
    TUIToast.error({
      message: t('ChatSetting.group_name_update_failed'),
    });
    console.warn('updateGroupProfile::groupName', error);
  }
};

// Handle notification confirm
const handleNotificationConfirm = async (value: string) => {
  try {
    await updateGroupProfile({ notification: value });
    TUIToast.success({
      message: t('ChatSetting.group_notification_update_success'),
    });
  } catch (error: any) {
    TUIToast.error({
      message: t('ChatSetting.group_notification_update_failed'),
    });
    console.warn('updateGroupProfile::notification', error);
  }
};

// Handle copy group ID
const handleCopyGroupID = () => {
  if (groupID.value) {
    copyTextToClipboard(groupID.value).then(() => {
      TUIToast.success({
        message: t('ChatSetting.copied'),
      });
    });
  }
};

const avatarUrl = computed<string>(() => {
  if (!activeConversation.value) {
    return '';
  }
  if (activeConversation.value.type === TUIChatEngine.TYPES.CONV_GROUP) {
    return activeConversation.value.getAvatar();
  }
  return '';
});
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
      :editable="Boolean(hasPermission(GroupPermission.EDIT_GROUP_PROFILE_NAME) && isInGroup)"
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
      :editable="Boolean(hasPermission(GroupPermission.EDIT_GROUP_PROFILE_NOTIFICATION) && isInGroup)"
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
    border-bottom: 0.5px solid var(--stroke-color-module);

    &:last-child {
      border-bottom: none;
    }
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
