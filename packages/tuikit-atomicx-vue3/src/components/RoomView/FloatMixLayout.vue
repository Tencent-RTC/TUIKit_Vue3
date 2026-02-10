<template>
  <div ref="floatMixLayoutContainerRef" class="float-mix-layout-container">
    <div :style="streamItemStyle" class="float-mix-layout-content">
      <div
        id="local-video-mixer"
        class="local-video-mixer-content"
      />
      <slot
        v-if="localParticipant && (!hasCameraTrack && !hasScreenTrack)"
        name="participantViewUI"
        v-bind="{ participant: localParticipant, streamType: VideoStreamType.Camera }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch, computed, ref, onUnmounted } from 'vue';
import TUIRoomEngine, { TRTCMediaSourceType, TRTCVideoFillMode, TRTCVideoRotation, TRTCVideoResolution, TRTCVideoResolutionMode } from '@tencentcloud/tuiroom-engine-js';
import { useRoomEngine } from '../../hooks/useRoomEngine';
import { useDeviceState } from '../../states/DeviceState';
import { useRoomParticipantState } from '../../states/RoomParticipantState';
import { VideoStreamType, DeviceStatus, VideoQuality } from '../../types';
import { useStreamItemDimensions } from './useStreamItemDimensions';
import type { TRTCCloud } from '@tencentcloud/tuiroom-engine-js';

// Layout mode enum for media sources
enum LayoutMode {
  Fullscreen = 'fullscreen', // Full screen display matching current quality dimensions
  Corner = 'corner', // Small window in top-right corner
  Hidden = 'hidden', // Hidden position (minimal size)
}

interface LayoutRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

const { cameraStatus, screenStatus } = useDeviceState();
const { localParticipant } = useRoomParticipantState();

const roomEngine = useRoomEngine();
let trtcCloud: TRTCCloud | null = null;
TUIRoomEngine.once('ready', async () => {
  trtcCloud = roomEngine.instance?.getTRTCCloud();
});

const floatMixLayoutContainerRef = ref<HTMLElement | null>(null);
const { itemStyle: streamItemStyle } = useStreamItemDimensions({
  containerRef: floatMixLayoutContainerRef,
  columns: 1,
  rows: 1,
  itemCount: 1,
  gap: 8,
  aspectRatio: 16 / 9,
});

const { localMirrorType, localVideoQuality } = useDeviceState();

// Track actual camera and screen status based on MediaStreamTrack
const hasCameraTrack = ref(false);
const hasScreenTrack = ref(false);

watch(() => hasCameraTrack.value, (value) => {
  cameraStatus.value = value ? DeviceStatus.On : DeviceStatus.Off;
}, { immediate: true });

watch(() => hasScreenTrack.value, (value) => {
  screenStatus.value = value ? DeviceStatus.On : DeviceStatus.Off;
}, { immediate: true });

function getVideoDataByQuality(quality: VideoQuality) {
  const videoDataMap = {
    [VideoQuality.Quality1080P]: {
      fps: 20,
      bitrate: 3000,
    },
    [VideoQuality.Quality720P]: {
      fps: 15,
      bitrate: 1800,
    },
    [VideoQuality.Quality540P]: {
      fps: 15,
      bitrate: 1200,
    },
    [VideoQuality.Quality360P]: {
      fps: 15,
      bitrate: 800,
    },
  };
  return videoDataMap[quality];
}

function transformTUIVideoQualityToTRTCVideoResolution(quality: VideoQuality) {
  const sizeMap = {
    [VideoQuality.Quality1080P]: TRTCVideoResolution.TRTCVideoResolution_1920_1080,
    [VideoQuality.Quality720P]: TRTCVideoResolution.TRTCVideoResolution_1280_720,
    [VideoQuality.Quality540P]: TRTCVideoResolution.TRTCVideoResolution_960_540,
    [VideoQuality.Quality360P]: TRTCVideoResolution.TRTCVideoResolution_640_360,
  };
  return sizeMap[quality];
}

function getSizeByQuality(quality: VideoQuality): { width: number; height: number } {
  const sizeMap = {
    [VideoQuality.Quality1080P]: { width: 1920, height: 1080 },
    [VideoQuality.Quality720P]: { width: 1280, height: 720 },
    [VideoQuality.Quality540P]: { width: 960, height: 540 },
    [VideoQuality.Quality360P]: { width: 640, height: 360 },
  };
  return sizeMap[quality] || { width: 1280, height: 720 };
}

/**
 * Calculate layout rect based on mode and quality
 * @param mode - Layout mode (fullscreen, corner, hidden)
 * @param quality - Current video quality
 * @returns Layout rect with left, top, right, bottom coordinates
 */
function calculateLayoutRect(mode: LayoutMode, quality: VideoQuality): LayoutRect {
  const { width, height } = getSizeByQuality(quality);

  switch (mode) {
    case LayoutMode.Fullscreen: {
      // Full screen matching current quality dimensions
      const fullscreenRect = {
        left: 0,
        top: 0,
        right: width,
        bottom: height,
      };
      return fullscreenRect;
    }

    case LayoutMode.Corner: {
      // Corner position scales proportionally with resolution
      // Base reference: 1280x720 -> corner size is 256x144
      // Corner takes 20% of width and height, positioned in top-right with margin
      const cornerWidth = Math.round(width * 0.2);
      const cornerHeight = Math.round(height * 0.2);
      const margin = Math.round(width * 0.023); // Approximately 30px for 1280px width
      const cornerRect = {
        left: width - cornerWidth - margin,
        top: margin,
        right: width - margin,
        bottom: margin + cornerHeight,
      };
      return cornerRect;
    }

    case LayoutMode.Hidden: {
      // Minimal size for hidden state
      const hiddenRect = {
        left: 0,
        top: 0,
        right: 1,
        bottom: 1,
      };
      return hiddenRect;
    }

    default: {
      const defaultRect = {
        left: 0,
        top: 0,
        right: width,
        bottom: height,
      };
      return defaultRect;
    }
  }
}

const publishParams = computed(() => {
  const { fps, bitrate } = getVideoDataByQuality(localVideoQuality.value);
  return {
    videoEncoderParams: {
      videoResolution: transformTUIVideoQualityToTRTCVideoResolution(localVideoQuality.value),
      resMode: TRTCVideoResolutionMode.TRTCVideoResolutionModeLandscape,
      videoFps: fps,
      videoBitrate: bitrate,
    },
    canvasColor: '#000000',
    selectedBorderColor: 0,
  };
});

watch(
  () => publishParams.value,
  async () => {
    await trtcCloud?.getMediaMixingManager()?.updatePublishParams(publishParams.value);
  },
  { immediate: true, deep: true },
);

// Watch for quality changes to update all active media source layouts
watch(() => localVideoQuality.value, async () => {
  if (hasCameraTrack.value) {
    await updateMediaSourceLayout('camera');
  }
  if (hasScreenTrack.value) {
    await updateMediaSourceLayout('screen');
  }
}, { deep: true });

watch(() => localMirrorType.value, async (val) => {
  if (val !== undefined && hasCameraTrack.value) {
    await updateMediaSourceLayout('camera');
  }
}, { immediate: true });

onMounted(async () => {
  TUIRoomEngine.once('ready', async () => {
    const mixerView = document.getElementById('local-video-mixer');
    if (!mixerView) {
      return;
    }
    const mediaMixingManager = roomEngine.instance?.getTRTCCloud().getMediaMixingManager();
    await mediaMixingManager.bindPreviewArea(mixerView as HTMLElement);
    mediaMixingManager.addMediaSource({
      id: 'camera_local',
      type: TRTCMediaSourceType.kCamera,
      useInternalTrack: true,
      layout: {
        rect: {
          left: 0,
          top: 0,
          right: 1,
          bottom: 1,
        },
        zOrder: 1,
      },
      interaction: {
        draggable: false,
        showBorder: false,
        showResizeAnchors: false,
        canExceedCanvas: false,
      },
    });
    mediaMixingManager.addMediaSource({
      id: 'screen_local',
      type: TRTCMediaSourceType.kScreen,
      useInternalTrack: true,
      layout: {
        rect: {
          left: 0,
          top: 0,
          right: 1,
          bottom: 1,
        },
        zOrder: 0,
      },
      interaction: {
        draggable: false,
        showBorder: false,
        showResizeAnchors: false,
        canExceedCanvas: false,
      },
    });
    if (publishParams.value) {
      await trtcCloud?.getMediaMixingManager()?.updatePublishParams(publishParams.value);
    }
  });
});

onUnmounted(() => {
  trtcCloud?.getMediaMixingManager()?.stopPublish();
  trtcCloud?.getMediaMixingManager()?.destroy();
});

function transformTRTCVideoProfile(quality: VideoQuality) {
  const profileMap = {
    [VideoQuality.Quality1080P]: { width: 1920, height: 1080, frameRate: 20, bitrate: 3000 },
    [VideoQuality.Quality720P]: { width: 1280, height: 720, frameRate: 15, bitrate: 1800 },
    [VideoQuality.Quality540P]: { width: 960, height: 540, frameRate: 15, bitrate: 1200 },
    [VideoQuality.Quality360P]: { width: 640, height: 360, frameRate: 15, bitrate: 800 },
  };
  return profileMap[quality];
}

watch(() => [hasCameraTrack.value, hasScreenTrack.value], async ([newCameraStatus, newScreenStatus], [oldCameraStatus, oldScreenStatus]) => {
  const oldHasAnyTrack = oldCameraStatus || oldScreenStatus;
  const newHasAnyTrack = newCameraStatus || newScreenStatus;

  if (!newHasAnyTrack && oldHasAnyTrack) {
    await trtcCloud?.getMediaMixingManager()?.stopPublish();
    await roomEngine.instance?.closeLocalCamera();
  } else if (newHasAnyTrack && !oldHasAnyTrack) {
    await trtcCloud?.getMediaMixingManager()?.startPublish();
  } else if ((!newCameraStatus && newScreenStatus) && (oldCameraStatus && oldScreenStatus)) {
    await trtcCloud?.getMediaMixingManager()?.startPublish();
    await trtcCloud._trtc.updateLocalVideo({
      option: {
        profile: transformTRTCVideoProfile(localVideoQuality.value),
        mirror: false,
      },
    });
  }
});

/**
 * Determine layout mode for a media source based on current state
 * @param type - Media source type ('camera' or 'screen')
 * @returns Layout mode for the media source
 */
function getLayoutMode(type: 'camera' | 'screen'): LayoutMode {
  const isActive = type === 'camera' ? hasCameraTrack.value : hasScreenTrack.value;

  if (!isActive) {
    return LayoutMode.Hidden;
  }

  // If both camera and screen are active
  if (hasCameraTrack.value && hasScreenTrack.value) {
    // Screen is fullscreen, camera is in corner
    return type === 'screen' ? LayoutMode.Fullscreen : LayoutMode.Corner;
  }

  // If only one source is active, show it fullscreen
  return LayoutMode.Fullscreen;
}

/**
 * Update media source layout based on current quality and active sources
 * @param type - Media source type ('camera' or 'screen')
 */
async function updateMediaSourceLayout(type: 'camera' | 'screen') {
  if (!trtcCloud) {
    return;
  }

  const mediaMixingManager = trtcCloud.getMediaMixingManager();
  if (!mediaMixingManager) {
    return;
  }

  const sourceId = type === 'camera' ? 'camera_local' : 'screen_local';
  const mediaSourceType = type === 'camera' ? TRTCMediaSourceType.kCamera : TRTCMediaSourceType.kScreen;
  const layoutMode = getLayoutMode(type);
  const rect = calculateLayoutRect(layoutMode, localVideoQuality.value);

  // Determine fill mode based on layout mode and source type
  let fillMode: TRTCVideoFillMode;
  if (layoutMode === LayoutMode.Fullscreen) {
    fillMode = type === 'screen' ? TRTCVideoFillMode.TRTCVideoFillMode_Fit : TRTCVideoFillMode.TRTCVideoFillMode_Fill;
  } else {
    fillMode = TRTCVideoFillMode.TRTCVideoFillMode_Fill;
  }

  try {
    await mediaMixingManager.updateMediaSource({
      id: sourceId,
      type: mediaSourceType,
      useInternalTrack: true,
      layout: {
        rect,
        zOrder: type === 'camera' ? 1 : 0,
        fillMode,
        rotation: TRTCVideoRotation.TRTCVideoRotation_0,
      },
      isSelected: false,
      interaction: {
        draggable: layoutMode === LayoutMode.Corner,
        showBorder: false,
        showResizeAnchors: false,
        canExceedCanvas: false,
      },
    });
  } catch (_error) {
    // Error handling
  }
}

/**
 * Add media source to mixing and start publish
 */
async function ensureMediaSourceAdded(type: 'camera' | 'screen') {
  if (!trtcCloud) {
    return;
  }

  const mediaMixingManager = trtcCloud.getMediaMixingManager();
  if (!mediaMixingManager) {
    return;
  }

  // Update layout for the newly added source
  await updateMediaSourceLayout(type);

  // If both sources are active, also update the other source's layout
  if (type === 'camera' && hasScreenTrack.value) {
    await updateMediaSourceLayout('screen');
  } else if (type === 'screen' && hasCameraTrack.value) {
    await updateMediaSourceLayout('camera');
  }
}

async function updateMediaSourceOnEnded(trackType: 'camera' | 'screen') {
  try {
    const mediaMixingManager = trtcCloud?.getMediaMixingManager();
    if (!mediaMixingManager) {
      return;
    }

    // Update the ended source to hidden state
    await updateMediaSourceLayout(trackType);

    // If the other source is still active, update its layout to fullscreen
    if (trackType === 'screen' && hasCameraTrack.value) {
      await updateMediaSourceLayout('camera');
    } else if (trackType === 'camera' && hasScreenTrack.value) {
      await updateMediaSourceLayout('screen');
    }
  } catch (_error) {
    // Error handling
  }
}

TUIRoomEngine.once('ready', async () => {
  const trtcCloudInstance = roomEngine.instance?.getTRTCCloud() as unknown as TRTCCloud;

  trtcCloudInstance.on('onCameraDidReady', async () => {
    hasCameraTrack.value = true;
    await ensureMediaSourceAdded('camera');
  });
  trtcCloudInstance.on('onCameraStopped', async () => {
    hasCameraTrack.value = false;
    await updateMediaSourceOnEnded('camera');
  });
  trtcCloudInstance.on('onScreenCaptureStarted', async () => {
    hasScreenTrack.value = true;
    await ensureMediaSourceAdded('screen');
  });
  trtcCloudInstance.on('onScreenCaptureStopped', async () => {
    hasScreenTrack.value = false;
    await updateMediaSourceOnEnded('screen');
  });
});

</script>

<style scoped lang="scss">
.float-mix-layout-container {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  padding: 25px 20px;
  box-sizing: border-box;
}

.float-mix-layout-content {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

.local-video-mixer-content {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  border-radius: 8px;
  overflow: hidden;
}
</style>
