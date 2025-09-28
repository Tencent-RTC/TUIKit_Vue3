<template>
  <div
    v-if="showBattleUserDecorate"
    class="battle-user-decorate-container"
  >
    <div
      v-for="(item, index) in seatListWithRealSize"
      :key="`seat-${index}`"
      :style="item.region"
    >
      <div class="battle-decorate" v-if="getBattleLevel(item.userInfo.userId) > 0">
        <div class="battle-badge-container" :class="getBattleLevel(item.userInfo.userId) === 1 ? 'top-badge' : 'ordinary-badge'">
          <img :src="getBattleLevel(item.userInfo.userId) === 1 ? BattleTopBadge : BattleOrdinaryBadge" alt="battle-badge" class="battle-badge" />
          <span class="battle-level">{{ getBattleLevel(item.userInfo.userId) }}</span>
        </div>
        <span class="battle-score-value">{{ battleScore?.get(item.userInfo.userId) || 0 }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { SeatUserInfo, CoHostLayoutTemplate } from '../../../types';
import { useBattleState } from '../../../states/BattleState';
import { useLiveState } from '../../../states/LiveState';
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { TUILiveBattleManagerEvents } from '@tencentcloud/tuiroom-engine-js';
import BattleTopBadge from '../assets/svg/BattleTopBadge.svg';
import BattleOrdinaryBadge from '../assets/svg/BattleOrdinaryBadge.svg';

const props = defineProps<{
  seatListWithRealSize: Array<{ userInfo: SeatUserInfo; region: {
    left: string;
    top: string;
    width: string;
    height: string;
    zIndex: number;
  }}>;
}>();

const { currentLive } = useLiveState();
const { battleUsers, battleScore, subscribeEvent, unsubscribeEvent } = useBattleState();

const isInBattle = ref(false);

const showBattleUserDecorate = computed(() => {
  const showUserDecorateInGrid = currentLive.value?.layoutTemplate === CoHostLayoutTemplate.HostDynamicGrid && battleUsers.value.length > 2;
  const showUserDecorateIn1v6 = currentLive.value?.layoutTemplate === CoHostLayoutTemplate.HostDynamic1v6;
  const showUserDecorate = showUserDecorateInGrid || showUserDecorateIn1v6;
  return props.seatListWithRealSize.length > 0 && isInBattle.value && showUserDecorate;
});

const currentBattleScoreList = computed(() => {
  return [...battleScore.value.values()].sort((a, b) => b - a);
});

function getBattleLevel(userId: string) {
  return currentBattleScoreList.value.indexOf(battleScore.value.get(userId) || 0) + 1;
};

function handleBattleStarted() {
  isInBattle.value = true;
}

function handleBattleEnded() {
  setTimeout(() => {
    isInBattle.value = false;
  }, 5000);
}

onMounted(() => {
  subscribeEvent(TUILiveBattleManagerEvents.onBattleStarted, handleBattleStarted);
  subscribeEvent(TUILiveBattleManagerEvents.onBattleEnded, handleBattleEnded);
});

onUnmounted(() => {
  unsubscribeEvent(TUILiveBattleManagerEvents.onBattleStarted, handleBattleStarted);
  unsubscribeEvent(TUILiveBattleManagerEvents.onBattleEnded, handleBattleEnded);
});

</script>

<style scoped lang="scss">
.battle-user-decorate-container {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
}

.battle-decorate {
    position: absolute;
    top: 8px;
    left: 8px;
    height: 24px;
    min-width: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2px;
    padding: 4px;
    background-color: rgba(15, 16, 20, 0.4);
    border-radius: 24px;
    .battle-badge-container {
      display: flex;
      align-items: center;
      justify-content: center;
      &.top-badge {
        .battle-level {
          color: #FF772E;
        }
      }
      &.ordinary-badge {
        .battle-level {
          color: #8490B8;
        }
      }
      .battle-badge {
        width: 20px;
        height: 20px;
      }
      .battle-level {
        position: absolute;
        transform: translateY(-1px);
        font-family: "Test Söhne Schmal";
        font-size: 10px;
        font-style: normal;
        font-weight: 800;
        line-height: 10px; /* 100% */
        text-transform: uppercase;
      }
    }
    .battle-score-value {
      font-size: 12px;
      font-weight: 500;
      color: #fff;
    }
  }
</style>
