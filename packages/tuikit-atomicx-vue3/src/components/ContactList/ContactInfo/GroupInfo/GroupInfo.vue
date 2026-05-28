<template>
  <div class="contact-group-info">
    <div class="contact-group-info__header">
      <div class="contact-group-info__main-info">
        <div class="contact-group-info__name">
          {{ displayName }}
        </div>
        <div class="contact-group-info__id">
          {{ t('TUIContact.Group ID') }}：{{ group.groupID }}
        </div>
      </div>
      <div class="contact-group-info__avatar-wrap">
        <Avatar
          :src="group.avatarURL"
          :alt="displayName"
          :size="48"
        />
      </div>
    </div>

    <div class="contact-group-info__rows">
      <div class="contact-group-info__row">
        <div class="contact-group-info__row-label">
          {{ t('TUIContact.Group type') }}
        </div>
        <div class="contact-group-info__row-value">
          {{ getGroupTypeText() }}
        </div>
      </div>
    </div>

    <div
      v-if="showActions"
      class="contact-group-info__actions"
    >
      <TUIButton
        class="contact-group-info__button--primary"
        type="primary"
        size="big"
        radius="round"
        @click="handleEnterGroup"
      >
        {{ t('TUIContact.Enter group chat') }}
      </TUIButton>
      <TUIButton
        v-if="canDismissGroup"
        class="contact-group-info__button--secondary"
        type="default"
        size="big"
        radius="round"
        color="red"
        @click="visible = true;"
      >
        {{ t('TUIContact.dismiss group') }}
      </TUIButton>

      <TUIButton
        v-if="canQuitGroup"
        class="contact-group-info__button--secondary"
        type="default"
        size="big"
        radius="round"
        color="red"
        @click="visible = true"
      >
        {{ t('TUIContact.quit group') }}
      </TUIButton>
      <TUIDialog
        appendTo="body"
        :visible="visible"
        :title="canDismissGroup ? t('TUIContact.Confirm dismiss group'): t('TUIContact.Confirm quit group')"
        :confirm-text="t('TUIContact.Submit')"
        :cancel-text="t('TUIContact.Cancel')"
        @confirm="handleGroupAction"
        @cancel="visible = false;"
        @close="visible = false;"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { GroupMemberRole, GroupType } from '@atomicxcore/core';
import { useChatContext, useGroupStore } from '../../../../chat-store';
import { TUIButton, TUIDialog, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { Avatar } from '../../../Avatar';
import type { GroupInfoProps } from '../../../../types/contact';
import type { GroupInfo } from '@atomicxcore/core';

const props = withDefaults(defineProps<GroupInfoProps>(), {
  showActions: true,
});

const emit = defineEmits<{
  close: [];
  enterGroup: [group: GroupInfo];
  leaveGroup: [group: GroupInfo];
  dismissGroup: [group: GroupInfo];
}>();

const { t } = useUIKit();
const { quitGroup, dismissGroup } = useGroupStore();
const { setActiveConversation } = useChatContext(props.channel);

const visible = ref(false);

const displayName = computed(() => props.group.groupName || props.group.groupID);

/**
 * Simple inline permission logic — mirrors the M3 plan which defers the full
 * GroupSetting permission matrix to M4. The rules here are:
 *   - Only the group owner can dismiss a regular group.
 *   - Any non-owner can quit, except for AVChatRoom which does not support quit.
 *   - AVChatRoom owners cannot dismiss via this panel either (no dismiss API).
 */
const canDismissGroup = computed(() => {
  if (props.group.groupType === GroupType.AVChatRoom) {
    return false;
  }
  return props.group.selfRole === GroupMemberRole.Owner;
});

const canQuitGroup = computed(() => {
  if (props.group.groupType === GroupType.AVChatRoom) {
    return false;
  }
  return props.group.selfRole !== GroupMemberRole.Owner;
});

const handleEnterGroup = async () => {
  emit('enterGroup', props.group);
  const conversationID = `GROUP${props.group.groupID}`;
  setActiveConversation(conversationID);
  emit('close');
};

const handleLeaveGroup = async () => {
  try {
    await quitGroup(props.group.groupID);
    emit('leaveGroup', props.group);
  } catch (err) {
    console.error('[GroupInfo quitGroup] error', err);
  }
  visible.value = false;
  emit('close');
};

const handleDismissGroup = async () => {
  try {
    await dismissGroup(props.group.groupID);
    emit('dismissGroup', props.group);
  } catch (err) {
    console.error('[GroupInfo dismissGroup] error', err);
  }
  visible.value = false;
  emit('close');
};

const handleGroupAction = () => {
  if (canDismissGroup.value) {
    handleDismissGroup();
  } else {
    handleLeaveGroup();
  }
};

const getGroupTypeText = () => {
  if (!props.group.groupType) {
    return t('ChatSetting.group_type_unknown');
  }
  const groupTypeTextMap: Record<GroupType, string> = {
    [GroupType.Work]: t('ChatSetting.group_type_work'),
    [GroupType.Public]: t('ChatSetting.group_type_public'),
    [GroupType.Meeting]: t('ChatSetting.group_type_meeting'),
    [GroupType.Community]: t('ChatSetting.group_type_community'),
    [GroupType.AVChatRoom]: t('ChatSetting.group_type_avchatroom'),
  };
  return groupTypeTextMap[props.group.groupType] || t('ChatSetting.group_type_unknown');
};
</script>

<style scoped lang="scss">
@use './GroupInfo.scss';
</style>
