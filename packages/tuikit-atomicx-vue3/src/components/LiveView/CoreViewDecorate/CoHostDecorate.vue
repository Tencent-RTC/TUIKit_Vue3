<template>
  <div class="co-host-decorate" v-if="coHostStatus === CoHostStatus.Connected && !currentBattleInfo?.battleId">
    <div class="co-host-decorate-container">
    </div>
    <div class="co-host-decorate-content">
      <span class="co-host-status">{{ t('co-Hosting') }}</span>
      <span class="co-host-time">{{ time }}</span>
      <IconChevronRight size="10" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconChevronRight, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { ref, computed, watch, onUnmounted } from 'vue';
import { useCoHostState } from '../../../states/CoHostState';
import { useBattleState } from '../../../states/BattleState';
import { CoHostStatus } from '../../../types';
import { convertSecondsToHMS } from '../../../utils/utils';

const { coHostStatus } = useCoHostState();
const { currentBattleInfo } = useBattleState();
const { t } = useUIKit();

const changedTime = ref(0);
const currentTime = ref(Date.now());
let timer: ReturnType<typeof setInterval> | null = null;

onUnmounted(() => {
  stopTimer();
});

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

watch(coHostStatus, (newVal) => {
  if (newVal === CoHostStatus.Connected) {
    changedTime.value = Date.now();
    currentTime.value = Date.now();
    startTimer();
  }
  if (newVal === CoHostStatus.Disconnected) {
    changedTime.value = 0;
    stopTimer();
  }
}, { immediate: true });

function convertToTwoDigits(value: number) {
  return value.toString().padStart(2, '0');
}

const time = computed(() => {
  if (changedTime.value === 0) {
    return '00:00';
  }
  const timeDiffInSeconds = Math.floor((currentTime.value - changedTime.value) / 1000);
  const { minutes, seconds } = convertSecondsToHMS(timeDiffInSeconds);
  return `${convertToTwoDigits(minutes)}:${convertToTwoDigits(seconds)}`;
});
</script>

<style scoped lang="scss">
.co-host-decorate {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 110px;
  height: 24px;
}

.co-host-decorate-container {
  width: 100%;
  height: 100%;
  border-bottom-left-radius: 10px;
  border-bottom-right-radius: 10px;
  background-color: var(--bg-color-mask, rgba(0, 0, 0, 0.55));
  transform: perspective(50px) rotateX(-20deg) rotateY(0deg) translateZ(0);
}

.co-host-decorate-content {
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

  .co-host-time {
    width: 30px;
  }
}
</style>
