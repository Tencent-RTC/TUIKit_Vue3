<template>
  <template v-if="item.kind === 'custom'">
    <span
      :class="[
        'control-btn',
        'custom-control-btn',
        item.button.className,
        { disabled: item.button.disabled },
      ]"
      :style="item.button.style"
      :title="item.button.tooltip"
      @click="handleCustomButtonClick(item.button)"
    >
      <component :is="renderCustomButtonIcon(item.button)" />
    </span>
  </template>

  <template v-else-if="item.id === PlayerControlButton.Play">
    <span
      :class="['control-btn', 'play-pause-btn', { disabled: isPlayPauseDisabled }]"
      :title="buttons[PlayerControlButton.Play].tooltip || (isPlaying ? t('LiveView.Pause') : t('LiveView.Play'))"
      @click="handlePlayPause"
    >
      <template v-if="isPlaying">
        <component v-if="buttons[PlayerControlButton.Play].icon" :is="renderButtonIcon(buttons[PlayerControlButton.Play].icon!)" />
        <IconPause v-else :size="20" />
      </template>
      <template v-else>
        <component v-if="buttons[PlayerControlButton.Play].activeIcon" :is="renderButtonIcon(buttons[PlayerControlButton.Play].activeIcon!)" />
        <IconPlay v-else :size="20" />
      </template>
    </span>
  </template>

  <template v-else-if="item.id === PlayerControlButton.Resolution">
    <MultiResolution />
  </template>

  <template v-else-if="item.id === PlayerControlButton.Volume">
    <span class="control-btn audio-control-btn">
      <AudioControl
        class="audio-control-icon"
        :icon-size="20"
        :volume="currentVolume"
        :is-muted="isMuted"
        :custom-icon="buttons[PlayerControlButton.Volume].icon"
        :custom-active-icon="buttons[PlayerControlButton.Volume].activeIcon"
        @volume-change="handleVolumeChange"
        @mute-change="handleMuteChange"
      />
    </span>
  </template>

  <template v-else-if="item.id === PlayerControlButton.PictureInPicture">
    <span
      :class="['control-btn', { disabled: isPictureInPictureDisabled }]"
      :title="buttons[PlayerControlButton.PictureInPicture].tooltip
        || (isPictureInPicture ? t('LiveView.ExitPictureInPicture') : t('LiveView.PictureInPicture'))"
      @click="handlePictureInPicture"
    >
      <template v-if="isPictureInPicture">
        <component v-if="buttons[PlayerControlButton.PictureInPicture].activeIcon" :is="renderButtonIcon(buttons[PlayerControlButton.PictureInPicture].activeIcon!)" />
        <IconPictureInPicture v-else :size="20" />
      </template>
      <template v-else>
        <component v-if="buttons[PlayerControlButton.PictureInPicture].icon" :is="renderButtonIcon(buttons[PlayerControlButton.PictureInPicture].icon!)" />
        <IconPictureInPicture v-else :size="20" />
      </template>
    </span>
  </template>

  <template v-else-if="item.id === PlayerControlButton.Fullscreen">
    <span
      :class="['control-btn', 'fullscreen-btn', { disabled: isFullscreenDisabled }]"
      :title="buttons[PlayerControlButton.Fullscreen].tooltip
        || (isFullscreen ? t('LiveView.ExitFullscreen') : t('LiveView.Fullscreen'))"
      @click="handleFullscreen"
    >
      <template v-if="isFullscreen">
        <component v-if="buttons[PlayerControlButton.Fullscreen].activeIcon" :is="renderButtonIcon(buttons[PlayerControlButton.Fullscreen].activeIcon!)" />
        <IconFullScreen v-else :size="20" />
      </template>
      <template v-else>
        <component v-if="buttons[PlayerControlButton.Fullscreen].icon" :is="renderButtonIcon(buttons[PlayerControlButton.Fullscreen].icon!)" />
        <IconFullScreen v-else :size="20" />
      </template>
    </span>
  </template>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'ControlBarItem',
});
</script>

<script setup lang="ts">
import { computed, h } from 'vue';
import {
  IconFullScreen,
  IconPictureInPicture,
  IconPause,
  IconPlay,
  useUIKit,
  TUIToast,
  TOAST_TYPE,
} from '@tencentcloud/uikit-base-component-vue3';
import { isMobile } from '../../../utils';
import AudioControl from './AudioControl.vue';
import MultiResolution from './MultiResolution.vue';
import { usePlayerControlState } from './PlayerControlState';
import { PlayerControlButton } from '../../../types/player';
import type { CustomButton } from '../../../types/player';
import type { ControlItem } from './types';
import { renderButtonIcon } from './utils/renderIcon';

const props = defineProps<{
  item: ControlItem;
}>();

const {
  isMuted,
  isPlaying,
  isFullscreen,
  isPictureInPicture,
  currentVolume,
  buttons,
  pause,
  resume,
  requestPictureInPicture,
  exitPictureInPicture,
  requestFullscreen,
  exitFullscreen,
  setVolume,
  setMute,
  startAutoHide,
} = usePlayerControlState();

const { t } = useUIKit();

/**
 * Disabled state computed properties for control buttons.
 * Merges internal logic constraints with external buttons.disabled configuration.
 */

const isPlayPauseDisabled = computed(() =>
  isPictureInPicture.value || buttons[PlayerControlButton.Play].disabled,
);

const isPictureInPictureDisabled = computed(() =>
  ((!isPlaying.value && !isPictureInPicture.value)
    || (isFullscreen.value && !isPictureInPicture.value))
  || buttons[PlayerControlButton.PictureInPicture].disabled,
);

const isFullscreenDisabled = computed(() =>
  isPictureInPicture.value || buttons[PlayerControlButton.Fullscreen].disabled,
);

const handlePlayPause = () => {
  if (isPlayPauseDisabled.value) {
    TUIToast({
      type: TOAST_TYPE.WARNING,
      message: t('LiveView.NotAllowPauseInPIP'),
    });
    return;
  }

  if (isPlaying.value) {
    pause();
  } else {
    resume();
  }
};

// Picture-in-picture is not allowed in paused state or fullscreen mode
const handlePictureInPicture = async () => {
  if (!isPlaying.value && !isPictureInPicture.value) {
    TUIToast({
      type: TOAST_TYPE.WARNING,
      message: t('LiveView.NotAllowPIPInNonPlaying'),
    });
    return;
  }

  if (isFullscreen.value && !isPictureInPicture.value) {
    TUIToast({
      type: TOAST_TYPE.WARNING,
      message: t('LiveView.NotAllowPIPInFullscreen'),
    });
    return;
  }

  let flag = false;
  if (isPictureInPicture.value) {
    flag = await exitPictureInPicture();
  } else {
    flag = await requestPictureInPicture();
  }

  if (!flag) {
    TUIToast({
      type: TOAST_TYPE.ERROR,
      message: t('LiveView.SystemNotSupportPIP'),
    });
  }
};

// Full-screen mode is not allowed in picture-in-picture mode
const handleFullscreen = () => {
  if (isFullscreenDisabled.value) {
    TUIToast({
      type: TOAST_TYPE.WARNING,
      message: t('LiveView.NotAllowFullscreenInPIP'),
    });
    return;
  }
  if (isFullscreen.value) {
    exitFullscreen();
  } else {
    requestFullscreen();
  }
};

const handleVolumeChange = async (volume: number) => {
  // When the mouse is placed in the liveCoreView area on a pc, playerControls will always be displayed
  if (isMobile) {
    startAutoHide();
  }
  await setVolume(volume);
};

const handleMuteChange = async () => {
  await setMute(!isMuted.value);
};

const handleCustomButtonClick = async (button: CustomButton) => {
  if (button.disabled) {
    return;
  }

  try {
    await button.onClick();
  } catch (error) {
    console.error('Custom player control button click failed:', error);
  }
};

const renderCustomButtonIcon = (button: CustomButton) => h(button.icon as any, {
  class: 'btn-icon',
  size: 20,
});
</script>

<style scoped lang="scss">
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

  &.disabled {
    cursor: not-allowed;
    opacity: 0.4;
  }
}

.audio-control-btn {
  &:active {
    transform: unset;
  }
}

.fullscreen-btn {
  .btn-icon {
    width: 18px;
    height: 18px;
  }
}
</style>
