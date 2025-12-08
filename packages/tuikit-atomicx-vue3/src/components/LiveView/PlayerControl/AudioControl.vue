<template>
  <div class="audio-control" :style="iconSizeStyle" @mouseenter="handleMouseEnter" @mouseleave="handleMouseLeave">
    <span class="control-btn volume-btn" :title="props.isMuted ? t('Open Speaker') : t('Close Speaker')" @click="handleVolumeIconClick">
      <IconSpeakerOff :size="props.iconSize" v-if="props.isMuted" />
      <IconSpeakerOn :size="props.iconSize" v-else />
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
import { computed, ref, onUnmounted, defineProps, withDefaults } from 'vue';
import { IconSpeakerOn, IconSpeakerOff, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { isMobile } from '../../../utils';

// Constants
const VOLUME_CONSTANTS = {
  // Minimum allowed volume level (silent)
  MIN_VOLUME: 0,
  // Maximum allowed volume level (full volume)
  MAX_VOLUME: 100,
};

interface AudioControlEmits {
  (e: 'volume-change', value: number): void;
  (e: 'mute-change'): void;
}

interface AudioControlProps {
  iconSize?: number;
  isMuted?: boolean;
  volume?: number; // Volume range: 0-100
}

const props = withDefaults(defineProps<AudioControlProps>(), {
  iconSize: 20,
  isMuted: false,
  volume: 100,
});

const emit = defineEmits<AudioControlEmits>();

const { t } = useUIKit();



const isVolumeSliderVisible = ref(false);
const isDragging = ref(false);
const volumeSliderElement = ref<HTMLElement>();
const volumeSliderAutoHideTimer = ref<number | null>(null);

// Auto-hide delay for different platforms
const AUTO_HIDE_DELAY = {
  PC: 1500, // 1.5 seconds for PC
  MOBILE: 3000, // 3 seconds for mobile
};

// Computed property - use volume from props (already in percentage)
const volumePercentage = computed(() => {
  return Math.round(props.volume);
});

const iconSizeStyle = computed(() => ({
  width: `${props.iconSize}px`,
  height: `${props.iconSize}px`,
}));

const updateVolume = (newVolume: number) => {
  // Clamp volume to valid range
  const clampedVolume = Math.max(VOLUME_CONSTANTS.MIN_VOLUME, Math.min(VOLUME_CONSTANTS.MAX_VOLUME, newVolume));
  emit('volume-change', clampedVolume);
};

const toggleMute = () => {
  // Simply emit mute change event, let parent component handle the logic
  emit('mute-change');
};

const handleVolumeIconClick = () => {
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
};

const startVolumeSliderAutoHideTimer = () => {
  stopVolumeSliderAutoHideTimer();
  const delay = isMobile ? AUTO_HIDE_DELAY.MOBILE : AUTO_HIDE_DELAY.PC;
  volumeSliderAutoHideTimer.value = window.setTimeout(() => {
    isVolumeSliderVisible.value = false;
  }, delay);
};

const stopVolumeSliderAutoHideTimer = () => {
  if (volumeSliderAutoHideTimer.value) {
    clearTimeout(volumeSliderAutoHideTimer.value);
    volumeSliderAutoHideTimer.value = null;
  }
};

const handleMouseEnter = () => {
  // Only handle mouse events on PC
  if (isMobile) return;

  // On PC, show volume slider and start auto-hide timer
  isVolumeSliderVisible.value = true;
  startVolumeSliderAutoHideTimer();
};

const handleMouseLeave = () => {
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
  const volumePercentage = (1 - clickY / height) * 100; // Convert to 0-100 range
  return Math.max(VOLUME_CONSTANTS.MIN_VOLUME, Math.min(VOLUME_CONSTANTS.MAX_VOLUME, volumePercentage));
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
  stopVolumeSliderAutoHideTimer();
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
  if (isVolumeSliderVisible.value) {
    startVolumeSliderAutoHideTimer();
  }
  removeGlobalEventListeners();
};

const handleSliderMouseDown = (event: MouseEvent) => {
  startDragging();
  event.preventDefault();
};

const handleSliderTouchStart = (event: TouchEvent) => {
  startDragging();
  event.preventDefault();
};

const handleVolumeSliderAreaClick = () => {
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
  // Only handle mouse events on PC
  if (isMobile) return;
  // On PC, stop auto-hide timer when mouse enters slider area
  stopVolumeSliderAutoHideTimer();
};

const handleVolumeSliderMouseLeave = () => {
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
  gap: 4px;
  background: var(--volume-control-background);
  padding: 12px 8px; // Increased padding for PC (from 8px 6px)
  border-radius: 8px;
  backdrop-filter: blur(10px);
  border: 1px solid var(--volume-control-border);
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;

  // Mobile devices keep original padding
  @media (max-width: 768px) {
    padding: 8px 6px;
  }

  @media (hover: none) and (pointer: coarse) {
    cursor: grab;

    &:active {
      cursor: grabbing;
    }
  }
}

.volume-slider-wrapper-inner {
  position: relative;
  width: 24px;  // Increased to accommodate 16px thumb (20px -> 24px)
  height: 96px; // Increased to accommodate thumb at top/bottom (80px + 16px = 96px)
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 4px;
  
  // Mobile devices keep smaller size
  @media (max-width: 768px) {
    width: 20px;
    height: 80px;
  }
}

.custom-volume-slider {
  position: relative;
  width: 6px;
  height: 80px; // Keep slider track height same, but container is bigger
  cursor: pointer;
  z-index: 2;
  margin: 8px 0; // Add margin to center the track in the larger container
  
  // Mobile devices keep original margin
  @media (max-width: 768px) {
    margin: 0;
  }
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
  $thumb-size: 16px;

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
    padding: 10px 8px;

    &:active {
      background: var(--volume-control-background-light);
      transform: scale(0.98);
      transition: all 0.1s ease;
    }
  }

  .volume-slider-wrapper-inner {
    height: 100px;
    margin-top: 4px;
  }
}
</style>
