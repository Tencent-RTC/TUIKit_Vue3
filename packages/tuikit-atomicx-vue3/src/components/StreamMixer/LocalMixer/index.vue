<template>
  <div class="local-mixer-container" ref="localMixerRef">
    <div class="local-mixer-content" id="local-video-mixer"></div>
    <div class="mixer-control-container" v-if="activeMediaSource" :style="mixControlContainerStyle">
      <MixerControl class="mixer-control" :style="mixControlStyle" />
    </div>
    <div class="local-mixer-placeholder" v-if="mediaSourceList.length === 0">
      <span class="placeholder-text">{{ t('No video') }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted, Ref, computed } from 'vue';
import { useRoomEngine } from '../../../hooks/useRoomEngine';
import { useVideoMixerState } from '../../../states/VideoMixerState';
import TUIRoomEngine, {
  TRTCVideoResolutionMode,
  TRTCVideoRotation,
  TUIVideoQuality,
} from '@tencentcloud/tuiroom-engine-js';
import { useLiveState } from '../../../states/LiveState';
import { LiveStatus, LiveOrientation } from '../../../types';
import MixerControl from './MixerControl.vue';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';

const { t } = useUIKit();

const { currentLive } = useLiveState();

const { publishVideoQuality, activeMediaSource, enableLocalVideoMixer, mediaSourceList } = useVideoMixerState();
enableLocalVideoMixer();


const currentLiveOrientation = computed(() => {
  if (currentLive.value
    && currentLive.value?.layoutTemplate >= 200 && currentLive.value?.layoutTemplate <= 599) {
    return LiveOrientation.Landscape;
  }
  return LiveOrientation.Portrait;
});

const { localLiveStatus } = useLiveState();

const roomEngine = useRoomEngine();
const localMixerRef = ref();

function getCanvasSize(
  videoResolution: TUIVideoQuality,
  resMode: TRTCVideoResolutionMode
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

const mixControlContainerStyle = ref({
  top: '0px',
  left: '0px',
  width: '0px',
  height: '0px',
});

const mixControlStyle: Ref<{ top?: string; bottom?: string; transform: string }> = ref({
  top: '-6px',
  transform: 'translate(-50%, -100%)',
});

function getMixControlStyle() {
  if (!localMixerRef.value || !activeMediaSource.value) {
    return;
  }
  const { width: canvasWidth, height: canvasHeight } = getCanvasSize(
    publishVideoQuality.value,
    currentLiveOrientation.value === LiveOrientation.Landscape ? TRTCVideoResolutionMode.TRTCVideoResolutionModeLandscape : TRTCVideoResolutionMode.TRTCVideoResolutionModePortrait
  );
  const { width: realWidth, height: realHeight } = localMixerRef.value.getBoundingClientRect();
  const scale = Math.max(realWidth / canvasWidth, realHeight / canvasHeight);

  const previewWidth = canvasWidth * scale;
  const previewHeight = canvasHeight * scale;

  const { top, left, right, bottom } = activeMediaSource.value.layout.rect;
  const mediaSourceWidth = right - left;
  const mediaSourceHeight = bottom - top;
  const rotation = activeMediaSource.value.layout.rotation || TRTCVideoRotation.TRTCVideoRotation0;
  if (rotation === TRTCVideoRotation.TRTCVideoRotation0 || rotation === TRTCVideoRotation.TRTCVideoRotation180) {
    mixControlContainerStyle.value = {
      top: `${top * scale - (previewHeight - realHeight) / 2}px`,
      left: `${left * scale - (previewWidth - realWidth) / 2}px`,
      width: `${mediaSourceWidth * scale}px`,
      height: `${mediaSourceHeight * scale}px`,
    };
  } else {
    mixControlContainerStyle.value = {
      top: `${top * scale - (previewHeight - realHeight) / 2}px`,
      left: `${left * scale - (previewWidth - realWidth) / 2}px`,
      width: `${mediaSourceHeight * scale}px`,
      height: `${mediaSourceWidth * scale}px`,
    };
  }
  if (top < 60) {
    mixControlStyle.value = {
      bottom: '-6px',
      transform: 'translate(-50%, 100%)',
    };
  } else {
    mixControlStyle.value = {
      top: '-6px',
      transform: 'translate(-50%, -100%)',
    };
  }
}

watch(
  () => [publishVideoQuality.value, currentLiveOrientation.value, activeMediaSource.value?.layout],
  ([newVideoQuality, newOrientation, newLayout]) => {
    if (!newVideoQuality || !newOrientation || !newLayout) {
      return;
    }
    getMixControlStyle();
  },
  { immediate: true, deep: true }
);

const re = new ResizeObserver(() => {
  getMixControlStyle();
});

onMounted(() => {
  re.observe(localMixerRef.value);
  TUIRoomEngine.once('ready', async () => {
    const mediaSourceManager = roomEngine.instance?.getTRTCCloud().getMediaMixingManager();
    await mediaSourceManager.setDisplayParams(document.getElementById('local-video-mixer') as HTMLElement);
    getMixControlStyle();
  });

  watch(localLiveStatus, async newVal => {
    if (newVal === LiveStatus.Live) {
      const mediaSourceManager = roomEngine.instance?.getTRTCCloud().getMediaMixingManager();
      await mediaSourceManager?.startPublish();
    }
  });
});

onUnmounted(() => {
  re.unobserve(localMixerRef.value);
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
  .mixer-control-container {
    position: absolute;
    pointer-events: none;
    .mixer-control {
      position: absolute;
      left: 50%;
    }
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
