<template>
  <div class="audio-control" :style="iconSizeStyle" @mouseenter="handleMouseEnter" @mouseleave="handleMouseLeave">
    <span class="control-btn volume-btn" :title="isMuted ? t('Open Speaker') : t('Close Speaker')" @click="handleVolumeIconClick">
      <IconSpeakerOff size="20" v-if="isMuted" />
      <IconSpeakerOn size="20" v-else />
    </span>
    <div v-show="isVolumeSliderVisible" class="volume-slider-container">
      <div
        class="volume-slider-wrapper"
        @mouseenter="handleVolumeSliderMouseEnter"
        @mouseleave="handleVolumeSliderMouseLeave"
      >
        <div class="volume-slider-wrapper-inner">
          <div
            ref="volumeSliderElement"
            class="custom-volume-slider"
            @mousedown="handleSliderMouseDown"
            @touchstart="handleSliderTouchStart"
            @click="handleVolumeSliderAreaClick"
          >
            <div class="slider-track">
              <div class="slider-progress" :style="{ height: `${volumePercentage}%` }"></div>
              <div
                class="slider-thumb"
                :class="{ 'no-transition': isDragging }"
                :style="{ bottom: `${volumePercentage}%` }"
              ></div>
            </div>
          </div>
        </div>
        <div class="volume-value">{{ volumePercentage }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onUnmounted, toRaw } from 'vue';
import { IconSpeakerOn, IconSpeakerOff, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { isMobile } from '../../../utils';

interface AudioControlEmits {
  (e: 'volume-change', value: number): void;
  (e: 'muted-change', value: boolean): void;
}

interface AudioControlProps {
  iconSize?: number;
  enableVolumeControl?: boolean;
}

const props = withDefaults(defineProps<AudioControlProps>(), {
  iconSize: 20,
  enableVolumeControl: true,
});

const emit = defineEmits<AudioControlEmits>();

const { t } = useUIKit();

// Volume state - merged into single object
const volumeState = ref({
  current: 1,
  previous: 1,
});

const isMuted = ref(false);
const isVolumeSliderVisible = ref(false);
const isDragging = ref(false);
const volumeSliderElement = ref<HTMLElement>();
const volumeSliderAutoHideTimer = ref<number | null>(null);

// Auto-hide delay for different platforms
const AUTO_HIDE_DELAY = {
  PC: 500, // 0.5 seconds for PC
  MOBILE: 3000, // 3 seconds for mobile
};

// Simplified computed property - directly use isVolumeSliderVisible
const volumePercentage = computed(() => {
  if (props.enableVolumeControl === false) {
    return isMuted.value ? 0 : 100;
  }
  return Math.round(volumeState.value.current * 100);
});

const iconSizeStyle = computed(() => ({
  width: `${props.iconSize || 20}px`,
  height: `${props.iconSize || 20}px`,
}));

const updateVolume = (newVolume: number) => {
  volumeState.value.previous = toRaw(volumeState.value.current);
  volumeState.value.current = newVolume;
  isMuted.value = newVolume === 0;
  emit('volume-change', newVolume);
};

const toggleMute = () => {
  if (isMuted.value) {
    isMuted.value = false;
    volumeState.value.current = volumeState.value.previous || 0.2;
    emit('muted-change', false);
    emit('volume-change', volumeState.value.current);
  } else {
    isMuted.value = true;
    volumeState.value.previous = volumeState.value.current;
    volumeState.value.current = 0;
    emit('muted-change', true);
    emit('volume-change', volumeState.value.current);
  }
};

const handleVolumeIconClick = () => {
  if (props.enableVolumeControl === false) {
    // When volume control is disabled, handle mute/unmute on all platforms
    toggleMute();
  } else {
    // When volume control is enabled
    if (isMobile) {
      // On mobile: toggle volume slider visibility
      isVolumeSliderVisible.value = !isVolumeSliderVisible.value;

      // Start auto-hide timer when showing volume slider
      if (isVolumeSliderVisible.value) {
        startVolumeSliderAutoHideTimer();
      } else {
        stopVolumeSliderAutoHideTimer();
      }
    } else {
      // On PC: handle mute/unmute, volume slider will show on mouse hover
      toggleMute();
    }
  }
};

const startVolumeSliderAutoHideTimer = () => {
  stopVolumeSliderAutoHideTimer();
  const delay = isMobile ? AUTO_HIDE_DELAY.MOBILE : AUTO_HIDE_DELAY.PC;
  volumeSliderAutoHideTimer.value = window.setTimeout(() => {
    if (props.enableVolumeControl) {
      isVolumeSliderVisible.value = false;
    }
  }, delay);
};

const stopVolumeSliderAutoHideTimer = () => {
  if (volumeSliderAutoHideTimer.value) {
    clearTimeout(volumeSliderAutoHideTimer.value);
    volumeSliderAutoHideTimer.value = null;
  }
};

const handleMouseEnter = () => {
  if (props.enableVolumeControl === false) return;

  // Only handle mouse events on PC
  if (isMobile) return;

  // On PC, show volume slider and start auto-hide timer
  isVolumeSliderVisible.value = true;
  startVolumeSliderAutoHideTimer();
};

const handleMouseLeave = () => {
  if (props.enableVolumeControl === false) return;
  // Only handle mouse events on PC
  if (isMobile) return;
  // On PC, start auto-hide timer when mouse leaves icon area
  // But don't start if currently dragging
  if (!isDragging.value) {
    startVolumeSliderAutoHideTimer();
  }
};

const calculateVolumeFromPosition = (clientY: number, target: HTMLElement): number => {
  const rect = target.getBoundingClientRect();
  const clickY = clientY - rect.top;
  const height = rect.height;
  return Math.max(0, Math.min(1, 1 - clickY / height));
};

const addGlobalEventListeners = () => {
  document.addEventListener('mousemove', handleSliderMove);
  document.addEventListener('mouseup', handleSliderEnd);
  document.addEventListener('touchmove', handleSliderMove);
  document.addEventListener('touchend', handleSliderEnd);
};

const removeGlobalEventListeners = () => {
  document.removeEventListener('mousemove', handleSliderMove);
  document.removeEventListener('mouseup', handleSliderEnd);
  document.removeEventListener('touchmove', handleSliderMove);
  document.removeEventListener('touchend', handleSliderEnd);
};

const startDragging = () => {
  isDragging.value = true;
  // Stop auto-hide timer when dragging starts
  if (props.enableVolumeControl) {
    stopVolumeSliderAutoHideTimer();
  }
  addGlobalEventListeners();
};

const handleSliderMove = (event: MouseEvent | TouchEvent) => {
  if (!isDragging.value) return;
  event.preventDefault();
  let clientY: number;
  if (event instanceof MouseEvent) {
    clientY = event.clientY;
  } else {
    clientY = event.touches[0].clientY;
  }
  const volumeValue = calculateVolumeFromPosition(clientY, volumeSliderElement.value as HTMLElement);
  updateVolume(volumeValue);
};

const handleSliderEnd = () => {
  isDragging.value = false;
  // Restart auto-hide timer when dragging ends
  if (props.enableVolumeControl && isVolumeSliderVisible.value) {
    startVolumeSliderAutoHideTimer();
  }
  removeGlobalEventListeners();
};

const handleSliderMouseDown = (event: MouseEvent) => {
  if (props.enableVolumeControl === false) return;
  startDragging();
  event.preventDefault();
};

const handleSliderTouchStart = (event: TouchEvent) => {
  if (props.enableVolumeControl === false) return;
  startDragging();
  event.preventDefault();
};

const handleVolumeSliderAreaClick = () => {
  if (props.enableVolumeControl === false) return;
  if (isMobile) {
    // On mobile, toggle volume slider visibility
    isVolumeSliderVisible.value = !isVolumeSliderVisible.value;

    // Start auto-hide timer when showing volume slider
    if (isVolumeSliderVisible.value) {
      startVolumeSliderAutoHideTimer();
    } else {
      stopVolumeSliderAutoHideTimer();
    }
  }
};

const handleVolumeSliderMouseEnter = () => {
  if (props.enableVolumeControl === false) return;
  // Only handle mouse events on PC
  if (isMobile) return;
  // On PC, stop auto-hide timer when mouse enters slider area
  stopVolumeSliderAutoHideTimer();
};

const handleVolumeSliderMouseLeave = () => {
  if (props.enableVolumeControl === false) return;
  // Only handle mouse events on PC
  if (isMobile) return;
  // On PC, start auto-hide timer when mouse leaves slider area
  // But don't start if currently dragging
  if (!isDragging.value) {
    startVolumeSliderAutoHideTimer();
  }
};

onUnmounted(() => {
  removeGlobalEventListeners();
  if (volumeSliderAutoHideTimer.value) {
    clearTimeout(volumeSliderAutoHideTimer.value);
  }
});
</script>

<style scoped lang="scss">
.audio-control {
  --volume-control-primary: rgb(255, 255, 255);
  --volume-control-primary-hover: rgba(255, 255, 255, 0.1);
  --volume-control-background: rgba(0, 0, 0, 0.8);
  --volume-control-background-light: rgba(0, 0, 0, 0.5);
  --volume-control-border: rgba(255, 255, 255, 0.1);
  --volume-control-shadow: rgba(0, 0, 0, 0.2);

  position: relative;
  display: flex;
  align-items: center;
}

.volume-btn {
  width: 100%;
  height: 100%;
  flex-shrink: 0;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.volume-slider-container {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 12px;
  z-index: 100;
}

.volume-slider-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  background: var(--volume-control-background);
  padding: 12px 8px;
  border-radius: 8px;
  backdrop-filter: blur(10px);
  border: 1px solid var(--volume-control-border);
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;

  @media (hover: none) and (pointer: coarse) {
    cursor: grab;

    &:active {
      cursor: grabbing;
    }
  }
}

.volume-slider-wrapper-inner {
  position: relative;
  width: 20px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 12px;
}

.custom-volume-slider {
  position: relative;
  width: 4px;
  height: 80px;
  cursor: pointer;
  z-index: 2;
  margin: 0;
}

.slider-track {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
}

.slider-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  background: #ffffff;
  border-radius: 2px;
}

.slider-thumb {
  $thumb-size: 12px;

  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: $thumb-size;
  height: $thumb-size;
  background: #ffffff;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  transition: transform 0.1s ease;
  z-index: 3;
  cursor: grab;

  &.no-transition {
    transition: none;
  }

  &:active {
    cursor: grabbing;
    transform: translateX(-50%) scale(1.1);
  }

  &:hover {
    transform: translateX(-50%) scale(1.1);
  }
}

.volume-value {
  color: var(--volume-control-primary);
  font-size: 12px;
  font-weight: 500;
  text-align: center;
  min-width: 32px;
  padding: 2px 6px;
  border-radius: 4px;
  pointer-events: none;
}

@media (hover: none) and (pointer: coarse) {
  .volume-slider-wrapper {
    padding: 16px 12px;

    &:active {
      background: var(--volume-control-background-light);
      transform: scale(0.98);
      transition: all 0.1s ease;
    }
  }

  .volume-slider-wrapper-inner {
    height: 100px;
  }
}
</style>
