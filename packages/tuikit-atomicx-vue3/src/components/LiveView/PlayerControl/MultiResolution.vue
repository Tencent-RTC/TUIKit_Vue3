<template>
  <span
    v-if="resolutionList.length > 0 && currentResolution"
    v-click-outside="handleClickOutside"
    class="multi-resolution"
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
import { ref } from 'vue';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import vClickOutside from '../../../directives/vClickOutside';
import { usePlayerControlState, Resolution } from './PlayerControlState';

const { t } = useUIKit();
const {
  resolutionList,
  currentResolution,
  isPictureInPicture,
  exitPictureInPicture,
  switchResolution,
} = usePlayerControlState();

// Resolution mapping for UI display
const resolutionMap: Record<Resolution, string> = {
  [Resolution.R360P]: '360P',
  [Resolution.R540P]: '540P',
  [Resolution.R720P]: '720P',
  [Resolution.R1080P]: '1080P',
};

const isShowResolutionList = ref<boolean>(false);

// Throttle state for resolution switching
const isResolutionSwitching = ref<boolean>(false);
const RESOLUTION_SWITCH_COOLDOWN = 1000; // 1 second cooldown

const handleClickOutside = () => {
  isShowResolutionList.value = false;
};

const handleClickCurrentResolution = () => {
  isShowResolutionList.value = !isShowResolutionList.value;
};

const handleClickResolution = async (event: MouseEvent) => {
  event.stopPropagation();
  
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
  color: #ffffff;
  user-select: none;

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
    background-color: #1f2024;
    border: 1px solid #2b2c30;

    &.switching-disabled {
      pointer-events: none;
      opacity: 0.6;
    }

    .multi-resolution-item {
      width: 100%;
      padding: 4px;
      margin: 4px 0;
      border-radius: 4px;
      text-wrap: nowrap;

      &:hover {
        background-color: #2b2c30;
      }
    }
  }

  .current-resolution {
    text-wrap: nowrap;
  }
}
</style>
