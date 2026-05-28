<template>
  <div id="AtomicxCoHostPanel" class="connection-panel">
    <div
      v-if="coHostStatus === CoHostStatus.Connected"
      id="userListContainer"
      class="user-list-container"
    >
      <div class="user-list-title">
        <span class="user-list-title-text">{{ t('Current seat') }}</span>
        <span class="user-list-title-count">
          {{ `(${connected.length}/${seatNumber})` }}
        </span>
      </div>
      <div class="user-list">
        <div
          v-for="user in connected"
          :key="`${user.userId}-${user.liveId}`"
          class="user-item"
        >
          <div class="user-item-left">
            <Avatar
              :src="user.avatarUrl"
              :size="40"
            />
          </div>
          <div class="user-item-right">
            <div class="user-info">
              <span class="user-name">{{ user.userName || user.userId }}</span>
            </div>
            <div class="user-actions" v-if="user.userId !== loginUserInfo?.userId">
              <TUIButton
                size="small"
                :type="isMuted(user.liveId) ? 'primary' : 'default'"
                @click="handleToggleMuteHost(user)"
              >
                {{ isMuted(user.liveId) ? t('Unmute') : t('Mute') }}
              </TUIButton>
            </div>
            <div v-else class="user-status">
              {{ t('Connecting') }}...
            </div>
          </div>
        </div>
      </div>
      <div
        v-if="connected.length === 0"
        class="empty-state"
      >
        <span>{{ t('Seat is empty') }}</span>
      </div>
    </div>

    <RecommendHostList class="recommend-host-list">
      <template #host-item-actions="{ user }">
        <TUIButton
          v-if="!isUserInvited(user.userId, user.liveId)"
          size="small"
          :type="coHostStatus === CoHostStatus.Connected ? 'default' : 'primary'"
          @click="handleSendCoHostRequest(user)"
        >
          {{ t('Invite connection') }}
        </TUIButton>
        <TUIButton
          v-else
          size="small"
          color="gray"
          @click="handleCancelCoHostRequest(user)"
        >
          {{ t('Cancel invitation') }}
        </TUIButton>
      </template>
    </RecommendHostList>
  </div>
  <div v-if="coHostStatus === CoHostStatus.Connected" class="connection-panel-footer">
    <TUIButton :color="'red'" @click="showExitCoHostDialog = true">
      {{ t('Exit connection') }}
    </TUIButton>
    <template v-if="!currentBattleInfo?.battleId">
      <TUIButton type="primary" @click="handleBattleRequest" v-if="!inPk && battleRequestList.size === 0">
        {{ t('Start battle') }}
      </TUIButton>
      <TUIButton @click="handleCancelBattleRequest" v-if="!inPk && battleRequestList.size > 0">
        {{ t('Cancel battle') }}
      </TUIButton>
    </template>
  </div>
  <TUIDialog
    :visible="coHostStatus === CoHostStatus.Connected && showExitCoHostDialog"
    :showClose="false"
    :modal="false"
    :customClasses="['exit-co-host-dialog']"
    @confirm="exitHostConnection"
    @cancel="showExitCoHostDialog = false"
  >
    {{ t('Are you sure you want to exit the connection') }}
    <template #footer>
      <TUIButton
        type="default"
        color="gray"
        @click="showExitCoHostDialog = false"
      >
        {{ t('Cancel') }}
      </TUIButton>
      <TUIButton
        type="primary"
        color="red"
        @click="handleExitCoHost"
      >
        {{ t('Exit connection') }}
      </TUIButton>
    </template>
  </TUIDialog>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { TUIConnectionCode } from '@tencentcloud/tuiroom-engine-js';
import { TUIButton, TUIToast, useUIKit, TOAST_TYPE, TUIDialog } from '@tencentcloud/uikit-base-component-vue3';
import { useBattleState } from '../../states/BattleState';
import { useCoHostState } from '../../states/CoHostState';
import { useLiveListState } from '../../states/LiveListState';
import { useLoginState } from '../../states/LoginState';
import { CoHostLayoutTemplate, CoHostStatus, CoHostEvent, BattleEvent, LiveOrientation } from '../../types';
import { Avatar } from '../Avatar';
import RecommendHostList from './RecommendHostList.vue';
import type { SeatUserInfo } from '../../types';
import { ERROR_MESSAGE } from './constants';

const props = defineProps<{
  battleDuration: number;
  coHostLayoutTemplate: CoHostLayoutTemplate;
}>();

const { t } = useUIKit();
const { loginUserInfo } = useLoginState();
const { currentLive } = useLiveListState();
const {
  coHostStatus,
  connected,
  invitees,
  requestHostConnection,
  cancelHostConnection,
  exitHostConnection,
  muteRemoteHostAudio,
  subscribeEvent,
  unsubscribeEvent,
} = useCoHostState();
const {
  currentBattleInfo,
  battleUsers,
  requestBattle,
  cancelBattleRequest,
  subscribeEvent: subscribeBattleEvent,
  unsubscribeEvent: unsubscribeBattleEvent,
} = useBattleState();

// Determine the current live orientation based on layoutTemplate range.
// Landscape templates fall within [200, 599]; portrait otherwise.
const currentLiveOrientation = computed(() => {
  const layout = currentLive.value?.layoutTemplate;
  if (typeof layout === 'number' && layout >= 200 && layout <= 599) {
    return LiveOrientation.Landscape;
  }
  return LiveOrientation.Portrait;
});

// In landscape mode, force the co-host layout to the fixed 2-seat landscape template.
const effectiveCoHostLayoutTemplate = computed(() => {
  if (currentLiveOrientation.value === LiveOrientation.Landscape) {
    return CoHostLayoutTemplate.HostVideoLandscapeFixed2Seats;
  }
  return props.coHostLayoutTemplate;
});

const seatNumber = computed(() => {
  const seatNumberMap: Record<CoHostLayoutTemplate, number> = {
    [CoHostLayoutTemplate.HostDynamicGrid]: 9,
    [CoHostLayoutTemplate.HostDynamic1v6]: 7,
    [CoHostLayoutTemplate.HostVideoLandscapeFixed2Seats]: 2,
  };
  return seatNumberMap[effectiveCoHostLayoutTemplate.value];
});

const showExitCoHostDialog = ref(false);
const mutedHosts = ref<Set<string>>(new Set());
const battleRequestList = ref<Set<string>>(new Set());
const requestBattleId = ref('');

const isUserInvited = (userId: string, liveId: string) => invitees.value.some(user => user.userId === userId && user.liveId === liveId);
const inPk = computed(() => battleUsers.value.some(user => user.userId === loginUserInfo.value?.userId));

const sentCoHostRequestUserList = ref<Set<string>>(new Set());
// Map userId -> close() callback of the most recent "invitation sent" toast.
// Used to dismiss the toast when the invitation is rejected/cancelled/timed
// out, so the user does not see "invitation sent" and "invitation rejected"
// at the same time (typically when invitee is busy on another connection).
const sentToastHandles = ref<Map<string, () => void>>(new Map());

const closeSentToast = (userId: string) => {
  const close = sentToastHandles.value.get(userId);
  if (close) {
    try {
      close();
    } catch (e) {
      // Ignore: toast may already be closed.
    }
    sentToastHandles.value.delete(userId);
  }
};

const handleSendCoHostRequest = async (user: SeatUserInfo) => {
  try {
    const result = await requestHostConnection({
      liveId: user.liveId,
      layoutTemplate: effectiveCoHostLayoutTemplate.value,
      timeout: 10,
      extensionInfo: JSON.stringify({
        timeout: 10,
        withBattle: false,
      }),
    });
    if (result.get(user.liveId) === TUIConnectionCode.TUIConnectionCodeSuccess) {
      sentCoHostRequestUserList.value.add(user.userId);
      // Keep a handle to the "invitation sent" toast so we can close it later.
      // When the invitee is already busy on another co-host connection, the
      // SDK returns Success here and then fires `onConnectionRequestReject`
      // almost immediately, which surfaces an "Invitation rejected" toast in
      // the host app. To avoid showing two conflicting toasts at the same
      // time, we proactively dismiss the "sent" toast on reject/timeout
      // (see `handleCoHostRequestRejected` / `handleCoHostRequestTimeout`).
      const sentToast = TUIToast({
        type: TOAST_TYPE.SUCCESS,
        message: t('Co-host invitation sent to user', { userName: user.userName || user.userId }),
      });
      if (sentToast?.close) {
        sentToastHandles.value.set(user.userId, sentToast.close);
      }
    } else {
      switch (result.get(user.liveId)) {
        case TUIConnectionCode.TUIConnectionCodeRoomNotExist:
          TUIToast({ type: TOAST_TYPE.ERROR, message: t('Send co-host request failed, Room not exist') });
          break;
        case TUIConnectionCode.TUIConnectionCodeConnecting:
          TUIToast({ type: TOAST_TYPE.ERROR, message: t('Send co-host request failed, Room is connecting') });
          break;
        case TUIConnectionCode.TUIConnectionCodeConnectingOtherRoom:
          TUIToast({ type: TOAST_TYPE.ERROR, message: t('Send co-host request failed, Room is connecting other room') });
          break;
        case TUIConnectionCode.TUIConnectionCodeFull:
          TUIToast({ type: TOAST_TYPE.ERROR, message: t('Send co-host request failed, Connected count is full') });
          break;
        case TUIConnectionCode.TUIConnectionCodeRetry:
          TUIToast({ type: TOAST_TYPE.ERROR, message: t('Send co-host request failed') });
          break;
        default:
          TUIToast({ type: TOAST_TYPE.ERROR, message: t('Send co-host request failed') });
          break;
      }
    }
  } catch (error) {
    TUIToast({ type: TOAST_TYPE.ERROR, message: t('Send co-host request failed') });
    throw error;
  }
};

const handleCancelCoHostRequest = async (user: SeatUserInfo) => {
  try {
    await cancelHostConnection({ liveId: user.liveId });
    sentCoHostRequestUserList.value.delete(user.userId);
    closeSentToast(user.userId);
  } catch (error) {
    TUIToast({ type: TOAST_TYPE.ERROR, message: t('Cancel co-host request failed') });
    throw error;
  }
};

const isMuted = (liveId: string) => mutedHosts.value.has(liveId);

const handleToggleMuteHost = async (user: SeatUserInfo) => {
  const muted = isMuted(user.liveId);
  try {
    await muteRemoteHostAudio(user.liveId, !muted);
    if (muted) {
      mutedHosts.value.delete(user.liveId);
    } else {
      mutedHosts.value.add(user.liveId);
    }
  } catch (error) {
    TUIToast({ type: TOAST_TYPE.ERROR, message: t('Mute failed') });
  }
};

const handleExitCoHost = () => {
  exitHostConnection();
  showExitCoHostDialog.value = false;
  mutedHosts.value.clear();
};

const handleBattleRequest = async () => {
  const userIdList = connected.value.filter(item => item.userId !== loginUserInfo.value?.userId).map(item => item.userId);
  try {
    const battleRes = await requestBattle({
      config: {
        duration: props.battleDuration,
        needResponse: true,
        extensionInfo: '',
      },
      userIdList,
      timeout: 10,
    });
    requestBattleId.value = battleRes.battleId;
    userIdList.forEach(userId => battleRequestList.value.add(userId))
  } catch (error: any) {
    const message = t(ERROR_MESSAGE[error.code as keyof typeof ERROR_MESSAGE] || 'Request battle failed');
    TUIToast.error({ message });
  }
};

const handleCancelBattleRequest = async () => {
  await cancelBattleRequest({
    battleId: requestBattleId.value,
    userIdList: Array.from(battleRequestList.value)
  });
  requestBattleId.value = '';
  battleRequestList.value.clear();
};

const handleCoHostRequestAccepted = ({ invitee }: { invitee: SeatUserInfo }) => {
  if (sentCoHostRequestUserList.value.has(invitee.userId)) {
    sentCoHostRequestUserList.value.delete(invitee.userId);
  }
  // Drop the toast handle without closing — the "invitation sent" toast can
  // finish its normal life-cycle since the invitation was actually accepted.
  sentToastHandles.value.delete(invitee.userId);
};

const handleCoHostRequestRejected = ({ invitee }: { invitee: SeatUserInfo }) => {
  if (sentCoHostRequestUserList.value.has(invitee.userId)) {
    sentCoHostRequestUserList.value.delete(invitee.userId);
  }
  // Dismiss the just-shown "invitation sent" toast to avoid showing it
  // alongside the host app's "invitation rejected" toast.
  closeSentToast(invitee.userId);
};

const handleCoHostRequestTimeout = ({ inviter, invitee }: { inviter: SeatUserInfo; invitee: SeatUserInfo }) => {
  if (inviter.userId === loginUserInfo.value?.userId && sentCoHostRequestUserList.value.has(invitee.userId)) {
    sentCoHostRequestUserList.value.delete(invitee.userId);
  }
  if (inviter.userId === loginUserInfo.value?.userId) {
    closeSentToast(invitee.userId);
  }
};

const onBattleRequestAccept = (eventInfo: { battleId: string, inviter: SeatUserInfo, invitee: SeatUserInfo }) => {
  if (eventInfo.inviter.userId === loginUserInfo.value?.userId) {
    battleRequestList.value.delete(eventInfo.invitee.userId);
  }
};

const onBattleRequestRejected = (eventInfo: { battleId: string, inviter: SeatUserInfo, invitee: SeatUserInfo }) => {
  if (eventInfo.inviter.userId === loginUserInfo.value?.userId) {
    battleRequestList.value.delete(eventInfo.invitee.userId);
  }
};

const onBattleRequestTimeout = (eventInfo: { battleId: string, inviter: SeatUserInfo, invitee: SeatUserInfo }) => {
  if (eventInfo.inviter.userId === loginUserInfo.value?.userId) {
    battleRequestList.value.delete(eventInfo.invitee.userId);
  }
};

const onBattleStarted = () => {
  requestBattleId.value = '';
  battleRequestList.value.clear();
}

const onBattleEnded = () => {
  requestBattleId.value = '';
  battleRequestList.value.clear();
}

onMounted(() => {
  subscribeEvent(CoHostEvent.onCoHostRequestAccepted, handleCoHostRequestAccepted);
  subscribeEvent(CoHostEvent.onCoHostRequestRejected, handleCoHostRequestRejected);
  subscribeEvent(CoHostEvent.onCoHostRequestTimeout, handleCoHostRequestTimeout);

  subscribeBattleEvent(BattleEvent.onBattleRequestAccept, onBattleRequestAccept);
  subscribeBattleEvent(BattleEvent.onBattleRequestReject, onBattleRequestRejected);
  subscribeBattleEvent(BattleEvent.onBattleRequestTimeout, onBattleRequestTimeout);
  subscribeBattleEvent(BattleEvent.onBattleStarted, onBattleStarted);
  subscribeBattleEvent(BattleEvent.onBattleEnded, onBattleEnded);
});

onUnmounted(() => {
  unsubscribeEvent(CoHostEvent.onCoHostRequestAccepted, handleCoHostRequestAccepted);
  unsubscribeEvent(CoHostEvent.onCoHostRequestRejected, handleCoHostRequestRejected);
  unsubscribeEvent(CoHostEvent.onCoHostRequestTimeout, handleCoHostRequestTimeout);

  unsubscribeBattleEvent(BattleEvent.onBattleRequestAccept, onBattleRequestAccept);
  unsubscribeBattleEvent(BattleEvent.onBattleRequestReject, onBattleRequestRejected);
  unsubscribeBattleEvent(BattleEvent.onBattleRequestTimeout, onBattleRequestTimeout);
  unsubscribeBattleEvent(BattleEvent.onBattleStarted, onBattleStarted);
  unsubscribeBattleEvent(BattleEvent.onBattleEnded, onBattleEnded);
});
</script>

<style lang="scss">
.exit-co-host-dialog {
  width: 300px;
  border-radius: 16px;
  border: 1px solid var(--stroke-color-module, #48494F);
  background: var(--bg-color-operate, #1F2024);
  box-shadow: 0 1px 8px 0 var(---Black-5, rgba(0, 0, 0, 0.40)), 0 4px 12px 0 var(---Black-5, rgba(0, 0, 0, 0.40)), 0 10px 30px 0 var(---Black-5, rgba(0, 0, 0, 0.40));
}
</style>

<style scoped lang="scss">
.connection-panel {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
}

.user-list-container {
  display: flex;
  flex-direction: column;
  margin-bottom: 8px;
  max-height: 220px;
  .user-list-title {
    display: flex;
    align-items: center;
    color: var(--text-color-secondary);
    font-size: 14px;
    font-weight: 400;
    gap: 8px;
    margin: 12px 0 8px 0;
  }

  .refresh-icon {
    cursor: pointer;
    &.loading {
      animation: spin 1s linear infinite;
    }
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .user-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    overflow-y: scroll;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  .user-item {
    display: flex;
    align-items: center;
    gap: 12px;
    height: 50px;
    box-sizing: border-box;

    .user-item-left {
      height: 100%;
      display: flex;
      align-items: center;
    }

    .user-item-right {
      flex: 1;
      display: flex;
      height: 100%;
      align-items: center;
      border-bottom: 1px solid var(--stroke-color-secondary);
    }

    .user-info {
      flex-grow: 1;
      display: flex;
      align-items: center;
      gap: 8px;

      .user-name {
        font-size: 16px;
        font-weight: 500;
        color: var(--text-color-primary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 200px;
      }

      .user-level {
        background: #3b82f6;
        color: white;
        font-size: 12px;
        padding: 2px 6px;
        border-radius: 10px;
        min-width: 24px;
        text-align: center;
        font-weight: 500;
      }

      .is-me {
        color: var(--text-color-secondary);
        font-size: 14px;
      }
    }

    .user-status {
      color: var(--text-color-secondary);
      font-size: 14px;
      margin-right: 12px;
    }

    .user-actions {
      display: flex;
      gap: 6px;
    }
  }
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  align-self: center;
  flex: 1;
  color: var(--text-color-secondary);
  min-height: 60px;
}

.recommend-host-list {
  flex: 1;
  min-height: 0;
}

.connection-panel-footer {
  display: flex;
  gap: 12px;
  justify-content: right;
  align-items: center;
  padding: 20px 0 0 0;
}

.layout-template-container {
  padding: 16px;
  margin-bottom: 16px;
  background: var(--background-color-secondary);
  border-radius: 12px;
  border: 1px solid var(--border-color);
}

.layout-template-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;

  .layout-template-title-text {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-color-primary);
  }
}

.layout-template-options {
  display: flex;
  flex-direction: row;
  gap: 12px;
}

.layout-template-option {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--background-color-primary);

  &:hover {
    border-color: var(--primary-color);
    background: var(--background-color-hover);
  }

  &.active {
    border-color: var(--primary-color);
    background: var(--primary-color-light);

    .layout-template-label {
      color: var(--primary-color);
      font-weight: 600;
    }

    .layout-template-count {
      color: var(--primary-color);
    }
  }
}

.layout-template-radio {
  margin-right: 12px;
  width: 18px;
  height: 18px;
  accent-color: var(--primary-color);
  cursor: pointer;
}

.layout-template-label {
  flex: 1;
  font-size: 14px;
  color: var(--text-color-primary);
  font-weight: 500;
  cursor: pointer;
}

.layout-template-count {
  font-size: 14px;
  color: var(--text-color-secondary);
  font-weight: 400;
  margin-left: 8px;
}
</style>
