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
        <IconBusinessPause v-else :size="20" />
      </template>
      <template v-else>
        <component v-if="buttons[PlayerControlButton.Play].activeIcon" :is="renderButtonIcon(buttons[PlayerControlButton.Play].activeIcon!)" />
        <IconBusinessPlay v-else :size="20" />
      </template>
    </span>
  </template>

  <template v-else-if="item.id === PlayerControlButton.Resolution">
    <MultiResolution />
  </template>

  <template v-else-if="item.id === PlayerControlButton.Volume">
    <span :class="['control-btn', 'audio-control-btn', { disabled: isVolumeDisabled }]">
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
      <!-- Transparent click-blocker shown only when the consumer disables
           the volume button via `buttons[PlayerControlButton.Volume].disabled`.
           Covers both the icon and the pop-up slider so the internal
           AudioControl never sees pointer events. Aligned with React. -->
      <span
        v-if="isVolumeDisabled"
        class="disabled-overlay"
        @click.stop="handleDisabledClick"
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
  IconBusinessPause,
  IconBusinessPlay,
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
 *
 * Note: click handlers distinguish the two sources and surface different
 * Toast messages — system-level constraints keep their specific copy (e.g.
 * "Not allow to Pause in PIP"), consumer-driven disables show the generic
 * `LiveView.ButtonDisabled` (aligned with React).
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

// Volume is a composite (AudioControl) that doesn't expose a disabled
// input. We surface a disabled-class + overlay based solely on the
// consumer flag. Aligned with React.
const isVolumeDisabled = computed(() =>
  buttons[PlayerControlButton.Volume].disabled,
);

/**
 * Emit the generic "button disabled" Toast used when the consumer
 * disabled a button via `buttons[key].disabled = true`. Kept as a single
 * helper so the wording is consistent across built-ins, the Volume
 * overlay, and the custom-button path.
 */
const handleDisabledClick = () => {
  TUIToast({
    type: TOAST_TYPE.WARNING,
    message: t('LiveView.ButtonDisabled'),
  });
};

const handlePlayPause = () => {
  // Consumer disable takes priority over the system constraint so the
  // user sees the accurate reason ("this button is disabled") rather than
  // the PiP-specific copy.
  if (buttons[PlayerControlButton.Play].disabled) {
    handleDisabledClick();
    return;
  }

  if (isPictureInPicture.value) {
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
  // Consumer disable takes priority; fall back to the system-constraint
  // branches below if `buttons.pictureInPicture.disabled` is false.
  if (buttons[PlayerControlButton.PictureInPicture].disabled) {
    handleDisabledClick();
    return;
  }

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
  if (buttons[PlayerControlButton.Fullscreen].disabled) {
    handleDisabledClick();
    return;
  }

  if (isPictureInPicture.value) {
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
    // Consumer explicitly disabled this button: surface the same generic
    // Toast as built-in buttons so UX is uniform.
    handleDisabledClick();
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
  position: relative;
  background: transparent;
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-color-button);

  @media (hover: hover) {
    &:hover {
      background: rgba(125, 125, 125, 0.4);
    }
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
  // The volume button's hover/active effects are managed by the inner
  // AudioControl component (volume-btn) rather than the outer control-btn
  // wrapper, because the slider popup is a child of this span and would
  // keep the hover state active even when the pointer is on the slider.
  &:hover {
    background: transparent;
  }

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

// Transparent click-blocker layered over composite controls (Volume)
// when the consumer disables them. Captures pointer events so the
// internal AudioControl slider / icon never sees a click, and the
// wrapping span shows the generic disabled Toast instead. Aligned with
// React's ControlBarItem.module.scss.
.disabled-overlay {
  position: absolute;
  inset: 0;
  z-index: 2;
  cursor: not-allowed;
  background: transparent;
}
</style>
