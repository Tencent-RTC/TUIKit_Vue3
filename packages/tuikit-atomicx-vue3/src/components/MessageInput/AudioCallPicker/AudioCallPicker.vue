<template>
  <View>
    <div
      :class="cs(styles['audio-call-picker__button'], {
        [styles['disabled']]: props.disabled,
      })"
      @click="handleAudioCallClick"
    >
      <slot>
        <IconCall1
          :size="props.iconSize"
          :class="styles['audio-call-picker__icon']"
        />
      </slot>
    </div>

    <TUIDialog
      :visible="isGroupCallDialogVisible"
      :title="t('MessageInput.select_call_members')"
      :cancelText="t('MessageInput.cancel')"
      :cancel="handleCloseGroupCallDialog"
      :close="handleCloseGroupCallDialog"
      :confirmText="t('MessageInput.initiate_call')"
      :confirm="handleConfirmGroupCall"
      :customClasses="['group-call-dialog']"
      appendTo="body"
    >
      <UserPicker
        ref="groupMemberPickerRef"
        display-mode="list"
        :data-source="groupMemberOptions"
        :max-count="MAX_GROUP_CALL_MEMBERS"
        :min-count="MIN_GROUP_CALL_MEMBERS"
        class="group-member-picker"
        style="width: 100%;"
        @reach-end="handleLoadMoreGroupMembers"
      />
    </TUIDialog>
  </View>
</template>

<script setup lang="ts">
import { computed, ref, useCssModule, inject } from 'vue';
import { ConversationType } from '@atomicxcore/core';
import { useChatContext, useLoginStore } from '../../../chat-store';
import {
  IconCall1,
  TUIDialog,
  useUIKit,
} from '@tencentcloud/uikit-base-component-vue3';
import cs from 'classnames';
import { View } from '../../../baseComp/View';
import { startCall } from '../../../utils/call';
import { UserPicker } from '../../UserPicker';

interface AudioCallPickerProps {
  label?: string;
  iconSize?: number;
  disabled?: boolean;
}

const AUDIO_CALL_TYPE = 1;
const MAX_GROUP_CALL_MEMBERS = 9;
const MIN_GROUP_CALL_MEMBERS = 1;

const props = withDefaults(defineProps<AudioCallPickerProps>(), {
  label: '',
  iconSize: 20,
  disabled: false,
});

const styles = useCssModule();
const { t } = useUIKit();
const channel = inject('channel', 'default') as string;
const {
  activeConversation,
  memberList,
  hasMoreMembers,
  loadMembers,
  loadMoreMembers,
} = useChatContext(channel);
const { loginUserInfo } = useLoginStore();

const isGroupCallDialogVisible = ref(false);
const groupMemberPickerRef = ref();

const isC2CConversation = computed(() =>
  activeConversation.value?.type === ConversationType.C2C,
);

const groupMemberOptions = computed(() => {
  const myUserID = loginUserInfo.value?.userID;
  return memberList.value
    .filter(member => member.userID !== myUserID)
    .map(member => ({
      key: member.userID,
      label: member.nickname || member.userID,
      avatarUrl: member.avatarURL,
    }));
});

const canStartCall = computed(() => {
  if (!activeConversation.value || props.disabled) {
    return false;
  }

  // TODO: add more call permission check logic
  return true;
});

function initiatePrivateCall(): void {
  const conversationID = activeConversation.value?.conversationID ?? '';
  const peerUserId = conversationID.replace(/^C2C/, '');
  if (!peerUserId) {
    console.warn('No peer user ID found for private call');
    return;
  }

  try {
    startCall({
      userIDList: [peerUserId],
      chatGroupID: undefined,
      type: AUDIO_CALL_TYPE,
    });
  } catch (error) {
    console.error('Failed to start private audio call:', error);
  }
}

function loadMoreGroupMembers(): void {
  if (!hasMoreMembers.value) {
    return;
  }
  loadMoreMembers();
}

function showGroupCallDialog(): void {
  loadMembers();
  isGroupCallDialogVisible.value = true;
}

function handleCloseGroupCallDialog() {
  isGroupCallDialogVisible.value = false;
}

function initiateGroupCall(): void {
  const conversationID = activeConversation.value?.conversationID ?? '';
  const currentGroupId = conversationID.replace(/^GROUP/, '');
  if (!groupMemberPickerRef.value || !currentGroupId) {
    console.warn('Missing group information for group call');
    return;
  }

  const selectedMembers = groupMemberPickerRef.value.getSelectedItems();
  if (!Array.isArray(selectedMembers) || selectedMembers.length === 0) {
    console.warn('No members selected for group call');
    return;
  }

  const selectedUserIds = selectedMembers.map((member: any) => member.key);

  try {
    startCall({
      userIDList: selectedUserIds,
      chatGroupID: currentGroupId,
      type: AUDIO_CALL_TYPE,
    });

    handleCloseGroupCallDialog();
  } catch (error) {
    console.error('Failed to start group audio call:', error);
  }
}

function handleAudioCallClick() {
  if (!canStartCall.value) {
    console.warn('Cannot start audio call');
    return;
  }

  if (isC2CConversation.value) {
    initiatePrivateCall();
  } else {
    showGroupCallDialog();
  }
}

const handleLoadMoreGroupMembers = () => {
  loadMoreGroupMembers();
};

const handleConfirmGroupCall = () => initiateGroupCall();

</script>

<style lang="scss" module>
.audio-call-picker {
  &__button {
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 4px 6px;
    transition: background-color 0.5s ease;
    border-radius: 4px;

    &:hover {
      background-color: var(--button-color-secondary-hover);
    }

    &:active {
      background-color: var(--button-color-secondary-active);
    }

    &.disabled {
      opacity: 0.5;
      cursor: not-allowed;
      user-select: none;
      pointer-events: none;
    }
  }

  &__icon {
    color: var(--icon-color-primary);
    transition: color 0.2s ease;
  }
}
</style>

<style>
.group-call-dialog {
  background: var(--bg-color-operate);
  border-radius: 8px;
  max-width: 500px;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}
</style>
