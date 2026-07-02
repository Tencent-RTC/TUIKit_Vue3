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
      <div
        class="battle-decorate"
        v-if="getBattleLevel(item.userInfo.userId) > 0"
        :style="{ '--widget-scale': getSeatScale(item.region) }"
      >
        <span class="battle-score-value" v-if="!battleScore?.has(item.userInfo.userId)">{{ t('LiveView.Connecting') }}</span>
        <template v-else>
          <div class="battle-badge-container" :class="getBattleLevel(item.userInfo.userId) === 1 ? 'top-badge' : 'ordinary-badge'">
            <img :src="getBattleLevel(item.userInfo.userId) === 1 ? BattleTopBadge : BattleOrdinaryBadge" alt="battle-badge" class="battle-badge" />
          <span class="battle-level">{{ getBattleLevel(item.userInfo.userId) }}</span>
          </div>
          <span class="battle-score-value">{{ battleScore?.get(item.userInfo.userId) || 0 }}</span>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { SeatUserInfo, CoHostLayoutTemplate } from '../../../types';
import { useBattleState } from '../../../states/BattleState';
import { useLiveListState } from '../../../states/LiveListState';
import { useCoHostState } from '../../../states/CoHostState';
import { computed } from 'vue';
import BattleTopBadge from '../assets/svg/BattleTopBadge.svg';
import BattleOrdinaryBadge from '../assets/svg/BattleOrdinaryBadge.svg';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { getWidgetScale } from '../useWidgetScale';

const { t } = useUIKit();

const props = defineProps<{
  seatListWithRealSize: Array<{ userInfo: SeatUserInfo; region: {
    left: string;
    top: string;
    width: string;
    height: string;
    zIndex: number;
  }}>;
}>();

const { currentLive } = useLiveListState();
const { connected } = useCoHostState();
const { currentBattleInfo, battleScore } = useBattleState();

// The PK badge overlay is gated strictly on an active battle: it appears only
// after `onBattleStarted` populates `currentBattleInfo.battleId`, and hides the
// moment the battle ends (battleId cleared). Driving this directly off
// `battleId` avoids showing the overlay on a mere invitee-accept (which fills
// `battleScore` via `onUserJoinBattle` before the battle officially starts) and
// prevents stale state from a previous battle leaking into the next one.
const isInBattle = computed(
  () => currentBattleInfo.value?.battleId !== null && currentBattleInfo.value?.battleId !== undefined
);

const showBattleUserDecorate = computed(() => {
  const showUserDecorateInGrid = currentLive.value?.layoutTemplate === CoHostLayoutTemplate.HostDynamicGrid;
  const showUserDecorateIn1v6 = currentLive.value?.layoutTemplate === CoHostLayoutTemplate.HostDynamic1v6;
  const showUserDecorate = showUserDecorateInGrid || showUserDecorateIn1v6;
  return props.seatListWithRealSize.length > 0 && isInBattle.value && showUserDecorate && connected.value.length > 2;
});

const currentBattleScoreList = computed(() => {
  return [...battleScore.value.values()].sort((a, b) => b - a);
});

function getBattleLevel(userId: string) {
  return currentBattleScoreList.value.indexOf(battleScore.value.get(userId) || 0) + 1;
};

// Lower bound for the PK badge scale. Higher than the text floor (0.5) so the
// badge graphics / score stay clear instead of collapsing on tiny seats.
const BADGE_WIDGET_MIN_SCALE = 0.6;

// Per-seat scale derived from the region size provided by the parent layout,
// so the PK badge shrinks proportionally on small seats.
function getSeatScale(region: { width: string; height: string }) {
  return getWidgetScale(
    { width: parseInt(region.width), height: parseInt(region.height) },
    { min: BADGE_WIDGET_MIN_SCALE },
  );
}

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
    color: var(--text-color-primary);
    transform: scale(var(--widget-scale, 1));
    transform-origin: top left;
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
    }
  }
</style>
