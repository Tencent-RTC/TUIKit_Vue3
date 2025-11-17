<template>
  <Transition name="player-control">
    <div
      v-show="showControls"
      ref="playerControlRef"
      :class="[
        'playback-controls',
        isMobile ? 'mobile-mode' : 'pc-mode',
        { 'mobile-landscape-mode': props.isLandscapeStyleMode },
      ]"
    >
      <div class="control-buttons">
        <span class="control-btn play-pause-btn" :title="isPlaying ? t('Pause') : t('Play')" @click="handlePlayPause">
          <IconPause size="20" v-if="isPlaying" />
          <IconPlay size="20" v-else />
        </span>
        <div class="center-controls"></div>
        <div class="right-controls">
          <MultiResolution @resolution-change="handleResolutionChanged" />
          <span class="control-btn audio-control-btn">
            <AudioControl
              class="audio-control-icon"
              :icon-size="20"
              :enable-volume-control="isEnableVolumeControl()"
              @volume-change="handleVolumeChange"
              @muted-change="handleMutedChange"
            />
          </span>
          <span
            class="control-btn"
            :title="isPictureInPicture ? t('Exit Picture in Picture') : t('Picture in Picture')"
            @click="handlePictureInPicture"
          >
            <IconPictureInPicture size="20" />
          </span>
          <span
            class="control-btn fullscreen-btn"
            :title="isFullscreen ? t('Exit Fullscreen') : t('Fullscreen')"
            @click="handleFullscreen"
          >
            <IconFullScreen size="20" />
          </span>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { onMounted, ref, onBeforeUnmount } from 'vue';
import {
  IconFullScreen,
  IconPictureInPicture,
  IconPause,
  IconPlay,
  useUIKit,
  TUIToast,
  TOAST_TYPE,
} from '@tencentcloud/uikit-base-component-vue3';
import { usePlayerControlState } from './PlayerControlState';
import AudioControl from './AudioControl.vue';
import MultiResolution from './MultiResolution.vue';
import { isMobile } from '../../../utils';
import { isFirefoxBrowser, isSafariBrowser } from './utils/deviceDetection';
import { waitForVideoMounted } from './utils/domHelpers';

const {
  isPlaying,
  isFullscreen,
  isPictureInPicture,
  currentVolume,
  pause,
  resume,
  requestPictureInPicture,
  exitPictureInPicture,
  requestFullscreen,
  exitFullscreen,
  setVolume,
  cleanup,
} = usePlayerControlState();

const props = defineProps<{
  isLandscapeStyleMode?: boolean;
}>();

const { t } = useUIKit();
const isMuted = ref(false);
const playerControlRef = ref<HTMLElement>();
const showControls = ref(false);
const hideTimeout = ref<number | null>(null);

const AUTO_HIDE_DELAY = 3000; // ms

const isEnableVolumeControl = () => {
  // PC
  if (!isMobile) return true;

  // Safari is not supported
  if (isSafariBrowser()) return false;

  // Firefox is not supported
  if (isFirefoxBrowser()) return false;

  // Other Mobile browsers is supported
  return true;
};

const handlePlayPause = () => {
  if (isPlaying.value) {
    pause();
  } else {
    resume();
  }
};

const handleResolutionChanged = async () => {
  const video = await waitForVideoMounted();
  if (video) {
    await setVolume(currentVolume.value);
  }
};

const handlePictureInPicture = async () => {
  let flag = false;
  if (isPictureInPicture.value) {
    flag = await exitPictureInPicture();
  } else {
    flag = await requestPictureInPicture();
  }

  if (!flag) {
    TUIToast({
      type: TOAST_TYPE.ERROR,
      message: t('The system does not support picture-in-picture mode'),
    });
  }
};

const handleFullscreen = () => {
  console.log('handleFullscreen');
  if (isFullscreen.value) {
    exitFullscreen();
  } else {
    requestFullscreen();
  }
};

const handleVolumeChange = async (volume: number) => {
  currentVolume.value = volume;
  // When the mouse is placed in the liveCoreView area on a pc, playerControls will always be displayed
  if (isMobile) {
    startAutoHideControl();
  }
  await setVolume(volume);
};

const startAutoHideControl = () => {
  stopAutoHideControl();
  hideTimeout.value = window.setTimeout(() => {
    showControls.value = false;
    hideTimeout.value = null;
  }, AUTO_HIDE_DELAY);
};

const stopAutoHideControl = () => {
  if (hideTimeout.value) {
    clearTimeout(hideTimeout.value);
    hideTimeout.value = null;
  }
};

const onMouseOver = () => {
  stopAutoHideControl();
  showControls.value = true;
};

const onMouseOut = () => {
  startAutoHideControl();
};

const setupParentMouseListener = () => {
  if (!isMobile && playerControlRef.value) {
    const { parentElement } = playerControlRef.value;
    if (parentElement) {
      parentElement.addEventListener('mouseover', onMouseOver);
      parentElement.addEventListener('mouseout', onMouseOut);
    }
  }
};

const removeParentMouseListener = () => {
  if (!isMobile && playerControlRef.value) {
    const { parentElement } = playerControlRef.value;
    if (parentElement) {
      parentElement.removeEventListener('mouseover', onMouseOver);
      parentElement.removeEventListener('mouseout', onMouseOut);
    }
  }
};

const touchStartCoords = ref<{ x: number; y: number } | null>(null);

// Touch distance calculation
const calculateTouchDistance = (start: { x: number; y: number }, end: Touch) => {
  return Math.sqrt(Math.pow(end.clientX - start.x, 2) + Math.pow(end.clientY - start.y, 2));
};

const isPlayerControlTarget = (target: Node) => {
  return playerControlRef.value?.contains(target) || false;
};

const isLiveCoreViewTarget = (target: Node) => {
  const container = document.getElementById('live-core-view-container');
  return container?.contains(target) || false;
};

// Handle the touch in the player control area
const handlePlayerControlTouch = () => {
  stopAutoHideControl();
  startAutoHideControl();
};

// Handle the touch in the core view area of the live broadcast
const handleLiveCoreViewTouch = () => {
  showControls.value = !showControls.value;
  if (showControls.value) {
    startAutoHideControl();
  }
};

const handleScreenTouchStart = (event: TouchEvent) => {
  if (event.touches.length === 1) {
    const touch = event.touches[0];
    touchStartCoords.value = {
      x: touch.clientX,
      y: touch.clientY,
    };
  }
};

const handleScreenTouchMove = (event: TouchEvent) => {
  if (playerControlRef.value && playerControlRef.value.contains(event.target as Node)) {
    stopAutoHideControl();
    return;
  }
};

const handleScreenTouchEnd = (event: TouchEvent) => {
  if (!touchStartCoords.value) {
    return;
  }

  const touchEnd = event.changedTouches[0];
  const distance = calculateTouchDistance(touchStartCoords.value, touchEnd);

  const MAX_CLICK_DISTANCE = 20;
  if (distance > MAX_CLICK_DISTANCE) {
    touchStartCoords.value = null;
    return;
  }

  const target = event.target as Node;

  if (isPlayerControlTarget(target)) {
    handlePlayerControlTouch();
  } else if (isLiveCoreViewTarget(target)) {
    handleLiveCoreViewTouch();
  } else {
    showControls.value = false;
  }

  touchStartCoords.value = null;
};

const setupTouchEventListeners = () => {
  if (isMobile) {
    document.addEventListener('touchstart', handleScreenTouchStart, true);
    document.addEventListener('touchmove', handleScreenTouchMove, true);
    document.addEventListener('touchend', handleScreenTouchEnd, true);
  }
};

const removeTouchEventListeners = () => {
  if (isMobile) {
    document.removeEventListener('touchstart', handleScreenTouchStart, true);
    document.removeEventListener('touchmove', handleScreenTouchMove, true);
    document.removeEventListener('touchend', handleScreenTouchEnd, true);
  }
};

const handleMutedChange = async (muted: boolean) => {
  isMuted.value = muted;
  if (muted) {
    await setVolume(0);
  } else {
    await setVolume(currentVolume.value);
  }
};

const cleanupEventListeners = () => {
  removeTouchEventListeners();
  removeParentMouseListener();
  stopAutoHideControl();
};

onMounted(() => {
  setupTouchEventListeners();
  setupParentMouseListener();
});

onBeforeUnmount(() => {
  cleanupEventListeners();
  cleanup();
});
</script>

<style scoped lang="scss">
.playback-controls {
  background: #000000;
  padding: 12px 0;
  display: flex;
  width: calc(100% + 1px); // Solve the problem of 1px deviation during absolute positioning
  align-items: center;
  box-sizing: border-box;
}

.pc-mode {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 10;
}

.mobile-mode {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 999999;
  pointer-events: auto;
}

@media screen and (orientation: portrait) {
  .mobile-landscape-mode {
    position: fixed;
    bottom: unset;
    transform: rotate(90deg);
    transform-origin: left bottom;
    top: -60px;
    bottom: unset;
    width: 100vh;
    padding-right: 16px;
  }

  .mobile-landscape-mode {
    &.player-control-enter-active,
    &.player-control-leave-active {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      will-change: transform, opacity;
    }

    &.player-control-enter-from {
      opacity: 0;
      transform: rotate(90deg) translateY(60px);
    }

    &.player-control-enter-to {
      opacity: 1;
      transform: rotate(90deg) translateY(0);
    }

    &.player-control-leave-from {
      opacity: 1;
      transform: rotate(90deg) translateY(0);
    }

    &.player-control-leave-to {
      opacity: 0;
      transform: rotate(90deg) translateY(60px);
    }
  }
}

.control-buttons {
  display: flex;
  align-items: center;
  justify-content: space-around;
  width: 100%;
  pointer-events: all;
}

.center-controls {
  display: flex;
  align-items: center;
  gap: 16px;
}

.control-btn {
  background: transparent;
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  &:active {
    transform: scale(0.95);
  }

  .btn-icon {
    width: 20px;
    height: 20px;
    fill: currentColor;
  }
}

.play-pause-btn {
  .tui-icon {
    transform: scale(1.5);
  }
}

.audio-control-btn {
  &:active {
    transform: unset;
  }
}

.playback-time {
  color: white;
  font-size: 14px;
  font-weight: 500;
  margin-left: 16px;
}

.right-controls {
  display: flex;
  align-items: center;
  gap: 16px;
}

.fullscreen-btn {
  .btn-icon {
    width: 18px;
    height: 18px;
  }
}

.more-btn {
  .btn-icon {
    width: 18px;
    height: 18px;
  }
}

.player-control-enter-active,
.player-control-leave-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform, opacity;
}

.player-control-enter-from {
  opacity: 0;
  transform: translateY(100%);
}

.player-control-enter-to {
  opacity: 1;
  transform: translateY(0);
}

.player-control-leave-from {
  opacity: 1;
  transform: translateY(0);
}

.player-control-leave-to {
  opacity: 0;
  transform: translateY(100%);
}
</style>

<style lang="scss">
@import './PlayerControl.module.scss';
</style>
