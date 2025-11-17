<template>
  <span
    v-if="resolutionList.length > 0"
    v-click-outside="handleClickOutside"
    class="multi-resolution"
  >
    <span
      v-show="isShowResolutionList"
      class="multi-resolution-list"
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
      {{ currentResolution ? t(resolutionMap[currentResolution]) : (resolutionList.length > 0 ? t(resolutionMap[resolutionList[0]]) : '') }}
    </span>
  </span>
</template>

<script setup lang="ts">
import { onMounted, ref, watch, defineEmits } from 'vue';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import vClickOutside from '../../../directives/vClickOutside';
import { useLiveListState } from '../../../states/LiveListState';
import { usePlayerControlState, Resolution } from './PlayerControlState';

const { t } = useUIKit();
const { currentLive } = useLiveListState();
const {
  resolutionList,
  currentResolution,
  switchResolution,
  initializeResolution,
} = usePlayerControlState();

const emit = defineEmits<{
  (e: 'resolution-change', resolution: Resolution): void;
}>();

// Resolution mapping for UI display
const resolutionMap: Record<Resolution, string> = {
  [Resolution.R360P]: '360P',
  [Resolution.R540P]: '540P',
  [Resolution.R720P]: '720P',
  [Resolution.R1080P]: '1080P',
};

const isShowResolutionList = ref<boolean>(false);

const handleClickOutside = () => {
  isShowResolutionList.value = false;
};

const handleClickCurrentResolution = () => {
  isShowResolutionList.value = !isShowResolutionList.value;
};

const handleClickResolution = async (event: MouseEvent) => {
  event.stopPropagation();
  const resolution = (event.target as HTMLElement)?.dataset.resolution;
  if (resolution) {
    const resolutionValue = Number(resolution) as Resolution;
    if (resolutionList.value.includes(resolutionValue)) {
      isShowResolutionList.value = false;
      if (resolutionValue === currentResolution.value) {
        return;
      }
      await switchResolution(resolutionValue);
      emit('resolution-change', resolutionValue);
    }
  }
};

onMounted(() => {
  watch(
    () => currentLive.value?.liveId,
    async () => {
      if (currentLive.value?.liveId) {
        await initializeResolution(currentLive.value.liveId);
      }
    },
    {
      immediate: true,
    },
  );
});
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
