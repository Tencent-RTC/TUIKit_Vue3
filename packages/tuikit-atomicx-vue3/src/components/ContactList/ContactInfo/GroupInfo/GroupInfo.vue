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
        <div class="contact-group-info__id">
          {{ t('TUIContact.Group type') }}：{{ group.type }}
        </div>
        <div class="contact-group-info__intro">
          {{ t('TUIContact.Group introduction') }}：{{ group.introduction || t('TUIContact.No introduction') }}
        </div>
      </div>
      <Avatar
        :src="group.avatar"
        :alt="displayName"
        size="xl"
      />
    </div>

    <div
      v-if="showActions"
      class="contact-group-info__actions"
    >
      <TUIButton
        v-if="canDismissGroup"
        type="default"
        size="big"
        color="red"
        @click="visible = true;"
      >
        {{ t('TUIContact.dismiss group') }}
      </TUIButton>

      <TUIButton
        v-if="canQuitGroup"
        type="default"
        size="big"
        color="red"
        @click="visible = true"
      >
        {{ t('TUIContact.quit group') }}
      </TUIButton>

      <TUIButton
        type="primary"
        size="big"
        @click="handleEnterGroup"
      >
        {{ t('TUIContact.Enter group chat') }}
      </TUIButton>
      <TUIDialog
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
import { TUIButton, TUIDialog, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useConversationListState } from '../../../../states/ConversationListState';
import { useGroupSettingState } from '../../../../states/GroupSettingState';
import { GroupMemberRole, GroupPermission } from '../../../../states/GroupSettingState/types';
import { Avatar } from '../../../Avatar';
import type { GroupType } from '../../../../states/GroupSettingState/types';
import type { GroupInfoProps, GroupModel } from '../../../../types';

const props = withDefaults(defineProps<GroupInfoProps>(), {
  showActions: true,
});

const emit = defineEmits<{
  close: [];
  enterGroup: [group: GroupModel];
  leaveGroup: [group: GroupModel];
  dismissGroup: [group: GroupModel];
}>();

const { t } = useUIKit();
const { quitGroup, dismissGroup, hasPermission } = useGroupSettingState();
const { setActiveConversation } = useConversationListState();

const visible = ref(false);

const displayName = computed(() => props.group.name || props.group.groupID);

const role = computed(() => (props.group.selfInfo?.role as GroupMemberRole) || GroupMemberRole.COMMON);
const groupType = computed(() => props.group.type as unknown as GroupType);

const canDismissGroup = computed(() =>
  hasPermission(GroupPermission.DISMISS_GROUP, role.value, groupType.value),
);
const canQuitGroup = computed(() =>
  hasPermission(GroupPermission.QUIT_GROUP, role.value, groupType.value),
);

const handleEnterGroup = () => {
  setActiveConversation(`GROUP${props.group.groupID}`);
  emit('enterGroup', props.group);
  emit('close');
};

const handleLeaveGroup = async () => {
  try {
    await quitGroup(props.group.groupID);
    emit('leaveGroup', props.group);
  } catch (err) {
    console.error('[ContactInfo quitGroup] error', err);
  }
  visible.value = false;
  emit('close');
};

const handleDismissGroup = async () => {
  try {
    await dismissGroup(props.group.groupID);
    emit('dismissGroup', props.group);
  } catch (err) {
    console.error('[ContactInfo dismissGroup] error', err);
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
}
</script>
<style scoped lang="scss">
@import './GroupInfo.scss';
</style>
