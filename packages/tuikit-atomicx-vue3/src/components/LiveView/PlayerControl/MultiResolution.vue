<template>
  <span
    v-if="resolutionList.length > 0 && currentResolution"
    v-click-outside="handleClickOutside"
    class="multi-resolution"
    :class="{ disabled: isDisabled }"
  >
    <span
      v-show="isShowResolutionList"
      class="multi-resolution-list"
      :class="{ 'switching-disabled': isResolutionSwitching }"
      @click="handleClickResolution"
    >
      <span
        v-for="resolution in resolutionList"
        :key="resolution"
        class="multi-resolution-item"
        :data-resolution="resolution"
      >
        {{ t(resolutionMap[resolution]) }}
      </span>
    </span>
    <span class="current-resolution" @click="handleClickCurrentResolution">
      {{ t(resolutionMap[currentResolution]) }}
    </span>
  </span>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import vClickOutside from '../../../directives/vClickOutside';
import { usePlayerControlState, Resolution } from './PlayerControlState';
import { PlayerControlButton } from '../../../types/player';

const { t } = useUIKit();
const {
  resolutionList,
  currentResolution,
  isPictureInPicture,
  exitPictureInPicture,
  switchResolution,
  buttons,
} = usePlayerControlState();

// Disabled state: respects external buttons configuration
const isDisabled = computed(() => buttons[PlayerControlButton.Resolution].disabled);

// Resolution mapping for UI display
const resolutionMap: Record<Resolution, string> = {
  [Resolution.R360P]: '360P',
  [Resolution.R540P]: '540P',
  [Resolution.R720P]: '720P',
  [Resolution.R1080P]: '1080P',
};

const isShowResolutionList = ref<boolean>(false);

// Auto-collapse the resolution list when the button becomes disabled
watch(isDisabled, (disabled) => {
  if (disabled) {
    isShowResolutionList.value = false;
  }
});

// Throttle state for resolution switching
const isResolutionSwitching = ref<boolean>(false);
const RESOLUTION_SWITCH_COOLDOWN = 1000; // 1 second cooldown

const handleClickOutside = () => {
  isShowResolutionList.value = false;
};

const handleClickCurrentResolution = () => {
  if (isDisabled.value) {
    return;
  }
  isShowResolutionList.value = !isShowResolutionList.value;
};

const handleClickResolution = async (event: MouseEvent) => {
  event.stopPropagation();

  if (isDisabled.value) {
    return;
  }
  
  if (isResolutionSwitching.value) {
    console.warn('[MultiResolution] Resolution switching in progress, please wait...');
    return;
  }
  
  const resolution = (event.target as HTMLElement)?.dataset.resolution;
  if (resolution) {
    const resolutionValue = Number(resolution) as Resolution;
    if (resolutionList.value.includes(resolutionValue)) {
      isShowResolutionList.value = false;
      if (resolutionValue === currentResolution.value) {
        return;
      }
      try {
        isResolutionSwitching.value = true;
        if (isPictureInPicture.value) {
          await exitPictureInPicture();
        }
        await switchResolution(resolutionValue);
      } catch (error) {
        console.error('[MultiResolution] Failed to switch resolution:', error);
      } finally {
        setTimeout(() => {
          isResolutionSwitching.value = false;
        }, RESOLUTION_SWITCH_COOLDOWN);
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.multi-resolution {
  position: relative;
  text-align: center;
  cursor: pointer;
  color: var(--text-color-button);
  user-select: none;

  &.disabled {
    cursor: not-allowed;
    opacity: 0.4;
  }

  .multi-resolution-list {
    position: absolute;
    top: 0;
    left: 0;
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-width: 40px;
    border-radius: 4px;
    padding: 4px 8px;
    transform: translate(-12px, -110%);
    color: var(--text-color-primary);
    background-color: var(--floating-color-default);
    box-shadow: 
    0px 12px 26px 0px var(--shadow-color),
    0px 8px 12px 0px var(--shadow-color),
    0px 1px 5px 0px var(--shadow-color);

    &.switching-disabled {
      pointer-events: none;
      opacity: 0.6;
    }

    .multi-resolution-item {
      width: 100%;
      padding: 4px;
      margin: 4px 0;
      border-radius: 4px;
      color: var(--text-color-primary);
      text-wrap: nowrap;

      &:hover {
        background-color: var(--dropdown-color-hover);
      }
    }
  }

  .current-resolution {
    text-wrap: nowrap;
  }
}
</style>
