<template>
  <View>
    <div @click="handleAudioCallClick">
      <slot>
        <div
          :class="cs(styles['audio-call-picker__button'], {
            [styles['disabled']]: props.disabled,
          })"
        >
          <IconCall1
            :size="props.iconSize"
            :class="styles['audio-call-picker__icon']"
          />
        </div>
      </slot>
    </div>

    <TUIDialog
      :visible="isGroupCallDialogVisible"
      :title="t('MessageInput.select_call_members')"
      :cancelText="t('MessageInput.cancel')"
      :cancel="handleCancelGroupCallDialog"
      :close="handleCloseGroupCallDialog"
      :confirmText="t('MessageInput.initiate_call')"
      :confirm="handleConfirmGroupCall"
      :confirmDisabled="groupCallSelectedCount === 0"
      :customClasses="['group-call-dialog-h5']"
      appendTo="body"
    >
      <div
        class="group-call-dialog-body"
        @click.stop
        @mousedown.stop
        @touchstart.stop
      >
        <UserPicker
          ref="groupMemberPickerRef"
          display-mode="list"
          :data-source="groupMemberOptions"
          :max-count="MAX_GROUP_CALL_MEMBERS"
          :min-count="MIN_GROUP_CALL_MEMBERS"
          class="group-member-picker"
          style="width: 100%;"
          :on-selected-change="handleGroupCallSelectedChange"
          @reach-end="handleLoadMoreGroupMembers"
        />
      </div>
    </TUIDialog>
  </View>
</template>

<script setup lang="ts">
import { computed, ref, useCssModule, inject } from 'vue';
import { ConversationType } from '@atomicxcore/core';
import {
  IconCall1,
  TUIDialog,
  useUIKit,
} from '@tencentcloud/uikit-base-component-vue3';
import cs from 'classnames';
import { View } from '../../../baseComp/View';
import { useChatContext, LoginStore } from '../../../chat-store';
import { startCall } from '../../../utils/call';
import { handleChatErrorWithModal } from '../../UIKitModal/chatErrorModal';
import { UserPicker } from '../../UserPicker';
import type { UserPickerResult } from '../../UserPicker';

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
const { loginUserInfo } = LoginStore();

const isGroupCallDialogVisible = ref(false);
const groupMemberPickerRef = ref();
const groupCallSelectedCount = ref(0);

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
    handleChatErrorWithModal(error as unknown as any);
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
  groupCallSelectedCount.value = 0;
  isGroupCallDialogVisible.value = true;
}

function handleCloseGroupCallDialog() {
  groupCallSelectedCount.value = 0;
  isGroupCallDialogVisible.value = false;
}

function handleCancelGroupCallDialog() {
  groupCallSelectedCount.value = 0;
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

    groupCallSelectedCount.value = 0;
    handleCloseGroupCallDialog();
  } catch (error) {
    handleChatErrorWithModal(error as unknown as any);
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

const handleGroupCallSelectedChange = (selectedItems: UserPickerResult) => {
  groupCallSelectedCount.value = selectedItems.length;
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
.group-call-dialog-h5 {
  max-height: 90vh;
  max-height: 90dvh;
  min-height: 60vh;
  min-height: 60dvh;
  width: calc(100vw - 64px);
  max-width: 500px;
  background: var(--bg-color-operate);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.group-call-dialog-h5,
.group-call-dialog-h5 * {
  box-sizing: border-box;
}

.group-call-dialog-h5 .group-member-picker {
  width: 100%;
  min-width: 0;
}

.group-call-dialog-h5 .group-call-dialog-body {
  display: flex;
  min-width: 0;
  min-height: 0;
  width: 100%;
}
</style>
