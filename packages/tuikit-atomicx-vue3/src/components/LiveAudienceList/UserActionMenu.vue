<template>
  <div
    ref="actionMenuRef"
    class="user-action-menu"
    @click.stop
  >
    <div class="action-menu-content">
      <div class="action-menu-header">
        <div class="user-info-simple">
          <Avatar :src="avatarUrl" :size="26" />
          <span class="user-name-simple">{{ userName || userId }}</span>
        </div>
      </div>

      <div
        v-if="actions.length > 0"
        class="action-menu-list"
      >
        <template
          v-for="action in actions"
          :key="action.label"
        >
          <button
            class="action-menu-item"
            @click="handleAction(action)"
          >
            {{ action.label }}
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineProps, defineEmits, ref, onMounted, onUnmounted } from 'vue';
import { useUIKit, TUIToast } from '@tencentcloud/uikit-base-component-vue3';
import { useCoGuestState } from '../../states/CoGuestState';
import { useLiveAudienceState } from '../../states/LiveAudienceState';
import { useLiveState } from '../../states/LiveState';
import { useLoginState } from '../../states/LoginState';
import { Avatar } from '../Avatar';

const { t } = useUIKit();
const actionMenuRef = ref<HTMLDivElement>();

interface Props {
  userId: string;
  userName: string;
  avatarUrl?: string;
  clickTarget: HTMLElement | null;
}

interface Emits {
  (e: 'close'): void;
}

const emit = defineEmits<Emits>();
const props = defineProps<Props>();
const { currentLive } = useLiveState();
const {
  userListInCoGuest,
  receivedCoGuestUserList,
  sentCoGuestUserList,
  availableCoGuestUserList,
  sendCoGuestRequest,
  cancelCoGuestRequest,
  acceptCoGuestRequest,
  rejectCoGuestRequest,
  disconnect,
} = useCoGuestState();
const { disableSendMessage, audienceList, kickUserOutOfRoom } = useLiveAudienceState();
const { loginUserInfo } = useLoginState();
const currentUserInfo = computed(() => audienceList.value.find(user => user.userId === props.userId));
const isOwner = computed(() => loginUserInfo.value?.userId === currentLive.value?.liveOwner.userId);
const actions = computed(() => {
  const tempActions: Array<{ label: string; action: string; actionFn: () => Promise<void> }> = [];
  if (!isOwner.value) {
    return [];
  }
  const isInCoGuest = userListInCoGuest.value.some(user => user.userId === props.userId);
  const isSentCoGuest = sentCoGuestUserList.value.some(user => user.userId === props.userId);
  const isAvailableCoGuest = availableCoGuestUserList.value.some(user => user.userId === props.userId);
  const isReceivedCoGuest = receivedCoGuestUserList.value.some(user => user.userId === props.userId);
  const isDisableSendMessage = currentUserInfo.value?.isMessageDisabled;
  if (!isDisableSendMessage) {
    tempActions.push({
      label: t('Mute'),
      action: 'disableSendMessage',
      actionFn: () => disableSendMessage({ userId: props.userId, isDisable: true }),
    });
  }
  if (isDisableSendMessage) {
    tempActions.push({
      label: t('Unmute'),
      action: 'disableSendMessage',
      actionFn: () => disableSendMessage({ userId: props.userId, isDisable: false }),
    });
  }
  if (isInCoGuest) {
    tempActions.push({ label: t('Kick out'), action: 'disconnect', actionFn: () => disconnect(props.userId) });
  }
  if (isAvailableCoGuest) {
    tempActions.push({
      label: t('Invite to seat'),
      action: 'takeSeat',
      actionFn: () =>
        sendCoGuestRequest({
          userId: props.userId,
          seatIndex: -1,
        }),
    });
  }
  if (isSentCoGuest) {
    tempActions.push({
      label: t('Cancel invitation'),
      action: 'cancelCoGuestRequest',
      actionFn: () => cancelCoGuestRequest({ userId: props.userId }),
    });
  }
  if (isReceivedCoGuest) {
    tempActions.push({
      label: t('Accept invitation'),
      action: 'acceptCoGuestRequest',
      actionFn: () => acceptCoGuestRequest({ userId: props.userId }),
    });
    tempActions.push({
      label: t('Reject invitation'),
      action: 'rejectCoGuestRequest',
      actionFn: () => rejectCoGuestRequest({ userId: props.userId }),
    });
  }
  tempActions.push({
    label: t('Kick out of room'),
    action: 'kickUserOutOfRoom',
    actionFn: () => kickUserOutOfRoom({ userId: props.userId }),
  });

  return tempActions;
});

const handleAction = async (action: { actionFn: () => Promise<void>; label: string }) => {
  try {
    await action.actionFn();
    TUIToast.success({
      message: t('Operation successful'),
    });
  } catch (error) {
    console.error('Action failed:', error);
    TUIToast.error({
      message: t('Operation failed'),
    });
  }
  emit('close');
};

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (!actionMenuRef.value?.contains(target) && !props.clickTarget?.contains(target)) {
    emit('close');
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style lang="scss" scoped>
.user-action-menu {
  position: fixed;
  width: 200px;
  background: var(--bg-color-operate);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 8px 32px var(--shadow-color-primary);
  border: 1px solid var(--stroke-color-module);
  z-index: 1001;
}

.action-menu-content {
  position: relative;
  z-index: 1;
}

.action-menu-header {
  display: flex;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid var(--stroke-color-module);

  &:last-child {
    border-bottom: none;
  }

  .user-info-simple {
    display: flex;
    align-items: center;
    gap: 8px;

    .user-name-simple {
      font-size: 13px;
      font-weight: 500;
      color: var(--text-color-primary);
    }
  }
}

.action-menu-list {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;

  .action-menu-item {
    display: block;
    width: 100%;
    padding: 12px 16px;
    border: none;
    border-radius: 6px;
    background: var(--uikit-color-gray-3);
    border: none;
    color: var(--text-color-primary);
    font-size: 14px;
    cursor: pointer;
    transition: background 0.2s ease;
    text-align: left;

    &:hover {
      background: var(--uikit-color-gray-4);
    }
  }
}
</style>
