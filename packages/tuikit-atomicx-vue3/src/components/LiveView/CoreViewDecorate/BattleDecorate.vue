<template>
  <div class="battle-decorate" v-if="showBattleDecorate">
    <div class="battle-score-container" v-if="showPkBar">
      <div class="battle-score-item" :style="battleStyle[user.userId]" v-for="user, key in battleUsers" :key="user.userId">
        <span class="battle-score-value">{{ battleScore?.get(user.userId) || 0 }}</span>
        <div class="battle-score-icon" v-if="key === 1">
          <IconPK size="18" />
        </div>
      </div>
    </div>
    <div :class="['battle-time-container', { 'more-top': showPkBar }]">
      <div class="battle-time-background"></div>
      <div class="battle-time-content">
        <span class="battle-status">{{ t('In battle') }}</span>
        <span class="battle-time">{{ time }}</span>
      </div>
    </div>
    <div :class="['battle-start-container', { 'disappearing': showBattleStartDisappearAnimation }]" v-if="showBattleStart">
      <img :src="redBkgSvg" alt="red-bkg" class="red-bkg" />
      <img :src="blueBkgSvg" alt="blue-bkg" class="blue-bkg" />
      <img :src="vSvg" alt="v" class="letter-v" />
      <img :src="sSvg" alt="s" class="letter-s" />
    </div>
    <div :class="['battle-result-container', showBattleResult ? 'show' : '']">
      <img :src="battleResultImg" alt="battle-result" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconPK, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { TUILiveBattleManagerEvents, TUIBattleStoppedReason } from '@tencentcloud/tuiroom-engine-js';
import { ref, computed, watch, Ref, onMounted, onUnmounted, nextTick } from 'vue';
import { CoHostLayoutTemplate } from '../../../types';
import { useBattleState } from '../../../states/BattleState';
import { useLiveSeatState } from '../../../states/LiveSeatState';
import { useLiveState } from '../../../states/LiveState';
import { convertSecondsToHMS } from '../../../utils/utils';
import defeatResult from '../assets/img/defeat.png';
import victoryResult from '../assets/img/victory.png';
import drawResult from '../assets/img/draw.png';
import redBkgSvg from '../assets/svg/redBkg.svg';
import blueBkgSvg from '../assets/svg/blueBkg.svg';
import vSvg from '../assets/svg/v.svg';
import sSvg from '../assets/svg/s.svg';

const { currentLive } = useLiveState();
const { currentBattleInfo, battleUsers, battleScore, subscribeEvent, unsubscribeEvent} = useBattleState();
const { seatList } = useLiveSeatState();
const { t } = useUIKit();

const showBattleDecorate = ref(false);
const showPkBar = computed(() => {
  return currentLive.value?.layoutTemplate === CoHostLayoutTemplate.HostDynamicGrid
    && battleUsers.value.length === 2
    && seatList.value?.filter(seat => seat.userInfo).length === 2;
});
const showBattleStart = ref(false);
const showBattleStartDisappearAnimation = ref(false);

watch(() => currentBattleInfo.value?.battleId, (newVal) => {
  if (newVal) {
    showBattleDecorate.value = true;
    showBattleStart.value = true;
    setTimeout(() => {
      showBattleStartDisappearAnimation.value = true;
      setTimeout(() => {
        showBattleStart.value = false;
        showBattleStartDisappearAnimation.value = false;
      }, 300);
    }, 2000);
  }
}, { immediate: true });

watch(() => currentLive.value?.liveId, (val, oldVal) => {
  if (oldVal && !val) {
    stopTimer();
    showBattleDecorate.value = false;
    showBattleStart.value = false;
    showBattleStartDisappearAnimation.value = false;
    showBattleResult.value = false;
  }
}, { immediate: true });

const battleStyle: Ref<Record<string, { width: string }>> = ref({});

watch(battleScore, (newVal) => {
  if (!newVal) return;
  const totalScore = [...newVal?.values()].reduce((acc, curr) => acc + curr, 0);
  [...newVal?.keys()].forEach(key => {
    battleStyle.value[key] = {
      width: (newVal.get(key) || 0) / totalScore * 100 + '%',
    };
  });
}, { immediate: true });

let timer: ReturnType<typeof setInterval> | null = null;

const currentTime = ref(0);

const leftBattleTime = computed(() => {
  if (!currentBattleInfo.value) return 0;
  currentTime.value = Date.now();
  return currentBattleInfo.value?.config.duration - ((Math.floor(currentTime.value / 1000) - currentBattleInfo.value?.startTime));
});

watch(() => currentBattleInfo.value?.battleId, (newVal) => {
  if (newVal) {
    startTimer();
  } else {
    stopTimer();
  }
}, { immediate: true });

function startTimer() {
  stopTimer();
  timer = setInterval(() => {
    currentTime.value = Date.now();
  }, 1000);
}

function stopTimer() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

function convertToTwoDigits(value: number) {
  return value.toString().padStart(2, '0');
}

const time = computed(() => {
  const { minutes, seconds } = convertSecondsToHMS(leftBattleTime.value);
  if (minutes <= 0 && seconds <= 0) {
    return '00:00';
  }
  return `${convertToTwoDigits(minutes)}:${convertToTwoDigits(seconds)}`;
});

const showBattleResult = ref(false);
const battleResultImg = ref(drawResult);

function handleBattleEnded(eventInfo: { battleId: string; reason: TUIBattleStoppedReason }) {
  stopTimer();
  showBattleResult.value = true;
  const maxScore = Math.max(...[...battleScore.value.values()]);
  const minScore = Math.min(...[...battleScore.value.values()]);
  const selfScore = battleScore.value.get(currentLive.value?.liveOwner.userId || '') || 0;
  if (maxScore === minScore) {
    battleResultImg.value = drawResult;
  } else {
    if (selfScore === maxScore) {
      battleResultImg.value = victoryResult;
    } else if (selfScore === minScore) {
      battleResultImg.value = defeatResult;
    }
  }
  setTimeout(() => {
    showBattleResult.value = false;
    showBattleDecorate.value = false;
  }, 5000);
}

onMounted(() => {
  subscribeEvent(TUILiveBattleManagerEvents.onBattleEnded, handleBattleEnded);
});

onUnmounted(() => {
  unsubscribeEvent(TUILiveBattleManagerEvents.onBattleEnded, handleBattleEnded);
});
</script>

<style scoped lang="scss">

.battle-score-container {
  display: flex;
  align-items: center;
  width: 100%;
  height: 14px;
  .battle-score-item {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    transition: width 0.3s ease;
    &:nth-child(1) {
      background-color: #1C66E5;
      justify-content: flex-start;
      padding: 0 18px 0 8px;
    }
    &:nth-child(2) {
      background-color: #F15065;
      justify-content: flex-end;
      padding: 0 8px 0 18px;
    }
    .battle-score-value {
      color: #fff;
      font-size: 12px;
      font-style: normal;
      font-weight: 500;
      line-height: 20px;
    }
  }
  .battle-score-icon {
    position: absolute;
    top: -2px;
    left: 0;
    transform: translateX(-50%);
  }
}


.battle-time-container {
  position: absolute;
  top: 0px;
  left: 50%;
  transform: translateX(-50%);
  width: 110px;
  height: 24px;
  &.more-top {
    top: 14px;
  }
  .battle-time-background {
    width: 100%;
    height: 100%;
    border-bottom-left-radius: 10px;
    border-bottom-right-radius: 10px;
    background-color: var(--bg-color-mask, rgba(0, 0, 0, 0.55));
    transform: perspective(50px) rotateX(-20deg) rotateY(0deg) translateZ(0);
  }

  .battle-time-content {
    pointer-events: auto;
    cursor: pointer;
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    text-align: center;
    color: var(--text-color-primary, rgba(255, 255, 255, 0.90));
    font-size: 12px;
    font-style: normal;
    font-weight: 500;
    line-height: 20px;
    gap: 4px;
    transform: translateY(-2px);

    .battle-time {
      width: 30px;
    }
  }
}

.battle-result-container {
  position: absolute;
  top: 50%;
  left: 50%;
  opacity: 0;
  transform: translate(-50%, -50%) scale(0);
  transform-origin: center center;
  transition:
    transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275),
    opacity 0.3s ease-out;

  &.show {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.5);
    animation: battleResultBouncePC 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
    @media screen and (max-width: 768px) {
      animation: battleResultBounceMobile 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
    }
  }
}

.battle-start-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(1.5);
  width: 218px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);

  &.disappearing {
    transform: translate(-50%, -50%) scale(0);
    opacity: 0;
  }

  .red-bkg {
    position: absolute;
    width: 118px;
    height: 50px;
    left: 0;
    top: 0px;
    animation: slideInFromLeft 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
  }

  .blue-bkg {
    position: absolute;
    width: 118px;
    height: 50px;
    right: 0;
    bottom: 0px;
    animation: slideInFromRight 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
  }

  .letter-v {
    position: absolute;
    width: 40px;
    height: 40px;
    left: calc(50% - 30px);
    top: 50%;
    transform: translateX(-50%) translateY(-50%) scale(0);
    animation: scaleInFromCenter 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.5s forwards;
  }

  .letter-s {
    position: absolute;
    width: 40px;
    height: 40px;
    left: calc(50% - 10px);
    top: 50%;
    transform: translateX(-50%) translateY(-50%) scale(0);
    animation: scaleInFromCenter 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.5s forwards;
  }
}

@keyframes slideInFromLeft {
  0% {
    transform: translateX(-100%);
    opacity: 0;
  }
  100% {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideInFromRight {
  0% {
    transform: translateX(100%);
    opacity: 0;
  }
  100% {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes scaleInFromCenter {
  0% {
    transform: translateY(-50%) scale(0);
    opacity: 0;
  }
  50% {
    transform: translateY(-50%) scale(1.2);
    opacity: 0.8;
  }
  100% {
    transform: translateY(-50%) scale(1);
    opacity: 1;
  }
}

@keyframes battleResultBouncePC {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 0;
  }

  50% {
    transform: translate(-50%, -50%) scale(1.5);
    opacity: 0.8;
  }

  70% {
    transform: translate(-50%, -50%) scale(1.8);
    opacity: 1;
  }

  100% {
    transform: translate(-50%, -50%) scale(1.5);
    opacity: 1;
  }
}

@keyframes battleResultBounceMobile {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 0;
  }

  50% {
    transform: translate(-50%, -50%) scale(0.9);
    opacity: 0.8;
  }

  70% {
    transform: translate(-50%, -50%) scale(1.15);
    opacity: 1;
  }

  100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
}
</style>
