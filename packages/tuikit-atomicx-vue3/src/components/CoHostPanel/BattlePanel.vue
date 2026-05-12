<template>
  <div id="AtomicxCoHostPanel" class="battle-panel">
    <div v-if="currentBattleInfo?.battleId" class="battle-user-list">
      <UserList :userList="battleUsers">
        <template #user-actions="{ user }">
          <div class="user-status">
            {{ t('In battle') }}...
          </div>
        </template>
      </UserList>
    </div>
    <RecommendHostList v-else class="recommend-host-list">
      <template #host-item-actions="{ user }">
        <TUIButton
          v-if="!isUserInvited(user.userId, user.liveId)"
          size="small"
          type="primary"
          @click="handleSendBattleRequest(user)"
        >
          {{ t('Invite battle') }}
        </TUIButton>
        <TUIButton
          v-else
          size="small"
          color="gray"
          @click="handleCancelBattleRequest(user)"
        >
          {{ t('Cancel invitation') }}
        </TUIButton>
      </template>
    </RecommendHostList>
  </div>
  <div v-if="currentBattleInfo?.battleId" class="battle-panel-footer">
    <TUIButton
      type="primary"
      :color="'red'"
      @click="showExitCoHostDialog = true"
    >
      {{ t('End battle') }}
    </TUIButton>
  </div>
  <TUIDialog
    :visible="showExitCoHostDialog"
    :showClose="false"
    :modal="false"
    :customClasses="['exit-co-host-dialog']"
    @confirm="handleExitBattle"
    @cancel="showExitCoHostDialog = false"
  >
    {{ t('Are you sure you want to exit the battle') }}
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
        @click="handleExitBattle"
      >
        {{ t('End battle') }}
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
import { CoHostLayoutTemplate, CoHostEvent, LiveOrientation } from '../../types';
import UserList from './UserList.vue';
import RecommendHostList from './RecommendHostList.vue';
import type { SeatUserInfo } from '../../types';

const { t } = useUIKit();
const props = defineProps<{
  battleDuration: number;
  coHostLayoutTemplate: CoHostLayoutTemplate;
}>();
const { loginUserInfo } = useLoginState();
const { currentLive } = useLiveListState();
const {
  invitees,
  requestHostConnection,
  cancelHostConnection,
  subscribeEvent: subscribeCoHostEvent,
  unsubscribeEvent: unsubscribeCoHostEvent,
} = useCoHostState();
const {
  currentBattleInfo,
  battleUsers,
  requestBattle,
  exitBattle,
} = useBattleState();

const showExitCoHostDialog = ref(false);
const isUserInvited = (userId: string, liveId: string) => invitees.value.some(user => user.userId === userId && user.liveId === liveId);

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

const pkUserIds = new Set<string>();
const handleSendBattleRequest = async (user: SeatUserInfo) => {
  try {
    const result = await requestHostConnection({
      liveId: user.liveId,
      layoutTemplate: effectiveCoHostLayoutTemplate.value,
      timeout: 10,
      extensionInfo: JSON.stringify({
        timeout: 10,
        withBattle: true,
      }),
    });
    switch (result.get(user.liveId)) {
      case TUIConnectionCode.TUIConnectionCodeSuccess:
        pkUserIds.add(user.userId);
        TUIToast({ type: TOAST_TYPE.SUCCESS, message: t('Battle invitation sent to user', { userName: user.userName || user.userId }) });
        break;
      case TUIConnectionCode.TUIConnectionCodeRoomNotExist:
        TUIToast({ type: TOAST_TYPE.ERROR, message: t('Send battle request failed, Room not exist') });
        break;
      case TUIConnectionCode.TUIConnectionCodeConnecting:
        TUIToast({ type: TOAST_TYPE.ERROR, message: t('Send battle request failed, Room is connecting') });
        break;
      case TUIConnectionCode.TUIConnectionCodeConnectingOtherRoom:
        TUIToast({ type: TOAST_TYPE.ERROR, message: t('Send battle request failed, Room is connecting other room') });
        break;
      case TUIConnectionCode.TUIConnectionCodeFull:
        TUIToast({ type: TOAST_TYPE.ERROR, message: t('Send battle request failed, Connected count is full') });
        break;
      case TUIConnectionCode.TUIConnectionCodeRetry:
        TUIToast({ type: TOAST_TYPE.ERROR, message: t('Send battle request failed') });
        break;
      default:
        break;
    }
  } catch (error) {
    pkUserIds.delete(user.userId);
    TUIToast({ type: TOAST_TYPE.ERROR, message: t('Send battle request failed') });
    throw error;
  }
};

const handleCancelBattleRequest = async (user: SeatUserInfo) => {
  await cancelHostConnection({ liveId: user.liveId });
  pkUserIds.delete(user.userId);
};

const handleExitBattle = () => {
  if (currentBattleInfo.value?.battleId) {
    exitBattle({ battleId: currentBattleInfo.value?.battleId });
    showExitCoHostDialog.value = false;
  }
};

const handleCoHostRequestAccepted = async ({ invitee }: { invitee: SeatUserInfo }) => {
  if (!pkUserIds.has(invitee.userId)) {
    return;
  }
  try {
    await requestBattle({
      config: {
        duration: props.battleDuration,
        needResponse: false,
      },
      userIdList: [invitee.userId],
      timeout: 0,
    });
    pkUserIds.delete(invitee.userId);
  } catch (error) {
    TUIToast({ type: TOAST_TYPE.ERROR, message: t('Request battle failed') });
    throw error;
  }
};

const handleCoHostRequestCancelled = ({ inviter }: { inviter: SeatUserInfo }) => {
  if (!pkUserIds.has(inviter.userId)) {
    return;
  }
  pkUserIds.delete(inviter.userId);
};

const handleCoHostRequestRejected = ({ invitee }: { invitee: SeatUserInfo }) => {
  if (!pkUserIds.has(invitee.userId)) {
    return;
  }
  pkUserIds.delete(invitee.userId);
};

const handleCoHostRequestTimeout = ({ inviter, invitee }: { inviter: SeatUserInfo; invitee: SeatUserInfo }) => {
  if (inviter.userId === loginUserInfo.value?.userId && pkUserIds.has(invitee.userId)) {
    pkUserIds.delete(invitee.userId);
  }
};

onMounted(() => {
  subscribeCoHostEvent(CoHostEvent.onCoHostRequestAccepted, handleCoHostRequestAccepted);
  subscribeCoHostEvent(CoHostEvent.onCoHostRequestCancelled, handleCoHostRequestCancelled);
  subscribeCoHostEvent(CoHostEvent.onCoHostRequestRejected, handleCoHostRequestRejected);
  subscribeCoHostEvent(CoHostEvent.onCoHostRequestTimeout, handleCoHostRequestTimeout);
});

onUnmounted(() => {
  unsubscribeCoHostEvent(CoHostEvent.onCoHostRequestAccepted, handleCoHostRequestAccepted);
  unsubscribeCoHostEvent(CoHostEvent.onCoHostRequestCancelled, handleCoHostRequestCancelled);
  unsubscribeCoHostEvent(CoHostEvent.onCoHostRequestRejected, handleCoHostRequestRejected);
  unsubscribeCoHostEvent(CoHostEvent.onCoHostRequestTimeout, handleCoHostRequestTimeout);
});
</script>

<style lang="scss">
.exit-co-host-dialog {
  width: 300px;
  border-radius: 16px;
  border: 1px solid var(--stroke-color-module);
  background: var(--bg-color-operate);
  box-shadow: 0 1px 8px 0 var(---Black-5), 0 4px 12px 0 var(---Black-5), 0 10px 30px 0 var(---Black-5);
}
</style>

<style scoped lang="scss">
.battle-panel {
  width: 100%;
  height: 100%;
  display: flex;
  overflow: auto;
}

.battle-user-list {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.user-status {
  color: var(--text-color-secondary);
  font-size: 14px;
  margin-right: 12px;
}

.recommend-host-list {
  flex: 1;
  min-height: 0;
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

.battle-panel-footer {
  display: flex;
  gap: 12px;
  justify-content: right;
  align-items: center;
  padding: 20px 0 0 0;
}
</style>
