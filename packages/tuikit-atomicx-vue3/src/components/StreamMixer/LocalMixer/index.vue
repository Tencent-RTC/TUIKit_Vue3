<template>
  <div
    ref="localMixerRef"
    class="local-mixer-container"
  >
    <div
      id="local-video-mixer"
      class="local-mixer-content"
    />
    <MixerControl
      v-if="activeMediaSource"
      ref="mixControlRef"
      class="mixer-control"
      :style="mixControlStyle"
    />
    <div
      v-if="mediaSourceList.length === 0"
      class="local-mixer-placeholder"
    >
      <span class="placeholder-text">{{ t('No video') }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Ref } from 'vue';
import { ref, onMounted, watch, onBeforeUnmount, computed, nextTick } from 'vue';
import TUIRoomEngine, {
  TRTCVideoResolutionMode,
  TRTCVideoRotation,
  TUIVideoQuality,
} from '@tencentcloud/tuiroom-engine-js';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useRoomEngine } from '../../../hooks/useRoomEngine';
import { useLiveListState } from '../../../states/LiveListState';
import { useVideoMixerState } from '../../../states/VideoMixerState';
import { LiveOrientation } from '../../../types';
import { debounce } from '../../../utils/utils';
import MixerControl from './MixerControl.vue';

const { t } = useUIKit();

const { currentLive } = useLiveListState();

const mixControlRef = ref<InstanceType<typeof MixerControl> | null>(null);
const { publishVideoQuality, activeMediaSource, enableLocalVideoMixer, mediaSourceList, isVideoMixerEnabled } = useVideoMixerState();
enableLocalVideoMixer();

const currentLiveOrientation = computed(() => {
  if (currentLive.value
    && currentLive.value?.layoutTemplate >= 200 && currentLive.value?.layoutTemplate <= 599) {
    return LiveOrientation.Landscape;
  }
  return LiveOrientation.Portrait;
});

const roomEngine = useRoomEngine();
const localMixerRef = ref();

function getCanvasSize(
  videoResolution: TUIVideoQuality,
  resMode: TRTCVideoResolutionMode,
): { width: number; height: number } {
  const sizeMap = {
    [TUIVideoQuality.kVideoQuality_360p]: { width: 640, height: 360 },
    [TUIVideoQuality.kVideoQuality_540p]: { width: 960, height: 540 },
    [TUIVideoQuality.kVideoQuality_720p]: { width: 1280, height: 720 },
    [TUIVideoQuality.kVideoQuality_1080p]: { width: 1920, height: 1080 },
  };
  let { width, height } = sizeMap[videoResolution];
  if (resMode === TRTCVideoResolutionMode.TRTCVideoResolutionModePortrait) {
    [width, height] = [height, width];
  }
  return { width, height };
}

const mixControlStyle: Ref<{
  transform: string;
  position: string;
}> = ref({
  position: 'absolute',
  transform: 'translate(0px, 0px)',
});

let mixControlWidth: number;
let mixControlHeight: number;
// margin between control and media source
const CONTROL_MARGIN_WITH_MEDIA_SOURCE = 6;

function getMixControlStyle() {
  if (!localMixerRef.value || !activeMediaSource.value) {
    return;
  }

  const { width: canvasWidth, height: canvasHeight } = getCanvasSize(
    publishVideoQuality.value,
    currentLiveOrientation.value === LiveOrientation.Landscape ? TRTCVideoResolutionMode.TRTCVideoResolutionModeLandscape : TRTCVideoResolutionMode.TRTCVideoResolutionModePortrait,
  );
  const { width: viewportWidth, height: viewportHeight } = localMixerRef.value.getBoundingClientRect();
  const scale = Math.max(viewportWidth / canvasWidth, viewportHeight / canvasHeight);

  const previewWidth = canvasWidth * scale;
  const previewHeight = canvasHeight * scale;

  const { top, left, right, bottom } = activeMediaSource.value.layout.rect;
  const mediaSourceWidth = right - left;
  const mediaSourceHeight = bottom - top;
  const rotation = activeMediaSource.value.layout.rotation || TRTCVideoRotation.TRTCVideoRotation0;

  const mediaSourceTop = top * scale - (previewHeight - viewportHeight) / 2;
  const mediaSourceLeft = left * scale - (previewWidth - viewportWidth) / 2;
  let mediaSourceDisplayWidth;
  let mediaSourceDisplayHeight;

  if (rotation === TRTCVideoRotation.TRTCVideoRotation0 || rotation === TRTCVideoRotation.TRTCVideoRotation180) {
    mediaSourceDisplayWidth = mediaSourceWidth * scale;
    mediaSourceDisplayHeight = mediaSourceHeight * scale;
  } else {
    mediaSourceDisplayWidth = mediaSourceHeight * scale;
    mediaSourceDisplayHeight = mediaSourceWidth * scale;
  }

  const controlPosition = calculateOptimalControlPosition(
    mediaSourceLeft,
    mediaSourceTop,
    mediaSourceDisplayWidth,
    mediaSourceDisplayHeight,
    viewportWidth,
    viewportHeight,
  );

  mixControlStyle.value = {
    ...controlPosition,
    position: 'absolute',
  };
}

function calculateOptimalControlPosition(
  mediaSourceLeft: number,
  mediaSourceTop: number,
  mediaSourceWidth: number,
  mediaSourceHeight: number,
  viewportWidth: number,
  viewportHeight: number,
) {
  // media source boundary
  const mediaSourceBottom = mediaSourceTop + mediaSourceHeight;
  const mediaSourceCenterX = mediaSourceLeft + mediaSourceWidth / 2;

  // ideal position
  let controlLeft = mediaSourceCenterX - mixControlWidth / 2;
  let controlTop = mediaSourceTop - CONTROL_MARGIN_WITH_MEDIA_SOURCE - mixControlHeight;

  // horizontal boundary detection and adjustment
  if (controlLeft < 0) {
    controlLeft = 0;
  } else if (controlLeft + mixControlWidth > viewportWidth) {
    controlLeft = viewportWidth - mixControlWidth;
  }

  // vertical boundary detection and adjustment
  // check if there is enough space to display the control above
  const topSpaceAvailable = mediaSourceTop;
  const bottomSpaceAvailable = viewportHeight - mediaSourceBottom;

  if (controlTop >= 0 && topSpaceAvailable >= mixControlHeight + CONTROL_MARGIN_WITH_MEDIA_SOURCE) {
    // top space is enough, keep it above
    controlTop = Math.min(controlTop, viewportHeight - mixControlHeight);
  } else if (bottomSpaceAvailable >= mixControlHeight + CONTROL_MARGIN_WITH_MEDIA_SOURCE) {
    // top space is not enough, but bottom space is enough, move to bottom
    controlTop = Math.max(0, mediaSourceBottom + CONTROL_MARGIN_WITH_MEDIA_SOURCE);
  } else {
    // top space is not enough, but bottom space is not enough, move to top
    controlTop = Math.max(0, mediaSourceTop - mixControlHeight - CONTROL_MARGIN_WITH_MEDIA_SOURCE);
  }

  return {
    transform: `translate(${controlLeft}px, ${controlTop}px)`,
  };
}

const debouncedGetMixControlStyle = debounce(getMixControlStyle, 16);

watch(() => activeMediaSource.value, async (newVal, oldVal) => {
  if (!oldVal && newVal) {
    await nextTick();
    const mixControlElement = mixControlRef.value?.$el as HTMLElement;
    const { width, height } = mixControlElement?.getBoundingClientRect() || { width: 0, height: 0 };
    mixControlWidth = width;
    mixControlHeight = height;
  }
  getMixControlStyle();
}, { immediate: true, deep: true });

watch(
  () => [publishVideoQuality.value, currentLiveOrientation.value],
  ([newVideoQuality, newOrientation]) => {
    if (!newVideoQuality || !newOrientation) {
      return;
    }
    getMixControlStyle();
  },
  { immediate: true, deep: true },
);

const re = new ResizeObserver(() => {
  debouncedGetMixControlStyle();
});

onMounted(() => {
  re.observe(localMixerRef.value);
  TUIRoomEngine.once('ready', async () => {
    const mixerView = document.getElementById('local-video-mixer');
    if (!mixerView) {
      return;
    }

    const mediaSourceManager = roomEngine.instance?.getTRTCCloud().getMediaMixingManager();
    await mediaSourceManager.bindPreviewArea(mixerView as HTMLElement);
    getMixControlStyle();
  });

  watch(() => currentLive.value?.liveId, async (newVal) => {
    const mediaSourceManager = roomEngine.instance?.getTRTCCloud().getMediaMixingManager();
    if (newVal) {
      await mediaSourceManager?.startPublish();
    }
    if (!newVal) {
      await mediaSourceManager?.stopPublish();
    }
  });
});

onBeforeUnmount(async () => {
  re.unobserve(localMixerRef.value);
  isVideoMixerEnabled.value = false;
  const mediaSourceManager = roomEngine.instance?.getTRTCCloud().getMediaMixingManager();
  await mediaSourceManager?.destroy();
});
</script>

<style scoped lang="scss">
.local-mixer-container {
  width: 100%;
  height: 100%;
  position: relative;
  background-color: #000;
  .local-mixer-content {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
  .mixer-control {
    position: absolute;
    top: 0;
    left: 0;
    transition: transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }

  .local-mixer-placeholder {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    .placeholder-text {
      color: var(--text-color-secondary, rgba(255, 255, 255, 0.55));
      font-size: 14px;
      font-style: normal;
      font-weight: 400;
      line-height: 22px;
    }
  }
}
</style>
