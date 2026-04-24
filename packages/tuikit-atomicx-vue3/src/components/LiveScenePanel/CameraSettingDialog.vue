<template>
  <TUIDialog
    :visible="true"
    width="600px"
    :confirmText="confirmText"
    :cancelText="cancelText"
    :confirmDisabled="cameraList.length === 0 || !isPreviewStarted"
    :title="title"
    :customClasses="['camera-setting-dialog']"
    @close="handleClose"
    @cancel="handleClose"
    @confirm="handleConfirm"
  >
    <div
      ref="videoPreviewRef"
      class="video-preview"
    />
    <div class="basic-setting">
      <div class="item-setting">
        <span class="title">{{ t('Camera') }}</span>
        <TUISelect
          v-model="currentCameraId"
          class="camera-select"
          @change="handleCameraChange"
        >
          <TUIOption
            v-for="item in cameraList"
            :key="item.deviceId"
            :value="item.deviceId"
            :label="item.deviceName"
          />
        </TUISelect>
      </div>
      <div class="item-setting">
        <span class="title">{{ t('Resolution') }}</span>
        <TUISelect
          v-model="currentResolution"
          class="resolution-select"
        >
          <TUIOption
            v-for="item in videoResolutionList"
            :key="item.value"
            :value="item.value"
            :label="item.label"
          />
        </TUISelect>
      </div>
      <div class="mirror-container" @click="toggleMirror">
        <svg-icon :icon="isMirror ? CameraMirror : CameraUnMirror" />
      </div>
    </div>
  </TUIDialog>
</template>

<script setup lang="ts">
import type { Ref } from 'vue';
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import {
  TRTCVideoMirrorType,
  TRTCVideoResolution,
  TRTCCloud,
  TRTCVideoFillMode,
  TRTCVideoRotation,
  TRTCVideoResolutionMode,
} from '@tencentcloud/tuiroom-engine-js';
import { TUIDialog, TUISelect, TUIOption, TUIToast, TOAST_TYPE, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import SvgIcon from '../../baseComp/SvgIcon.vue';
import { useDeviceState } from '../../states/DeviceState';
import CameraMirror from './icons/CameraMirror.vue';
import CameraUnMirror from './icons/CameraUnmirror.vue';
import type { MediaSource } from '../../types';

const previewTRTCCloud = new TRTCCloud();

const { t } = useUIKit();

const { cameraList } = useDeviceState();

const props = defineProps<{
  mediaSource: MediaSource | null;
}>();

const emits = defineEmits(['addCameraMaterial', 'updateCameraMaterial', 'close']);

const title = computed(() => props.mediaSource ? t('Update Camera') : t('Add Camera'));

const confirmText = computed(() => props.mediaSource ? t('Update Camera') : t('Add Camera'));
const cancelText = t('Cancel');

const currentCameraId = ref(props.mediaSource?.camera?.cameraId || cameraList.value[0]?.deviceId);
const currentResolution = ref('');
const videoPreviewRef = ref<HTMLDivElement>();
const isMirror: Ref<boolean> = ref(
  props.mediaSource?.layout?.mirror === TRTCVideoMirrorType.TRTCVideoMirrorType_Enable || false,
);

const videoResolutionList: Ref<Array<{
  label: string;
  value: string;
}>> = ref([]);

// Guards the confirm button. Set to false during camera switching to prevent
// users from adding an unavailable camera; restored to true after success.
const isPreviewStarted = ref(false);

// Tracks whether startCameraDeviceTest is currently active. When stopped
// (e.g. after a failed switch), the next successful switch must restart it.
const isDeviceTestRunning = ref(false);

// Switches the active camera device and manages the device-test session state.
// Sets isPreviewStarted to false at the start to guard the confirm button during
// the switch. Restarts startCameraDeviceTest if the session was previously stopped.
// Returns true on success, false on failure (with Toast shown).
const switchCameraDevice = async (deviceId: string): Promise<boolean> => {
  isPreviewStarted.value = false;
  try {
    await previewTRTCCloud.setCurrentCameraDevice(deviceId);
    if (!isDeviceTestRunning.value && videoPreviewRef.value) {
      // Device-test session was never started or was stopped after a previous
      // failure. Restart it now that a valid camera is selected.
      await previewTRTCCloud.startCameraDeviceTest(videoPreviewRef.value);
      isDeviceTestRunning.value = true;
    }
    isPreviewStarted.value = true;
    return true;
  } catch (error) {
    console.error('Failed to switch camera:', error);
    isPreviewStarted.value = false;
    // Stop device test to clear the stale preview frame from the previous camera.
    if (isDeviceTestRunning.value) {
      previewTRTCCloud.stopCameraDeviceTest();
      isDeviceTestRunning.value = false;
    }
    TUIToast({
      type: TOAST_TYPE.ERROR,
      message: t('The camera may be in use by another application. Please select a different camera.'),
    });
    return false;
  }
};

// Determine portrait/landscape based on the user-selected resolution (not camera capabilities),
// because some platforms (e.g. macOS) cannot detect virtual camera orientation via getCapabilities.
const isPortrait = computed(() => {
  if (!currentResolution.value) {
    return false;
  }
  const [w, h] = currentResolution.value.split('x').map(Number);
  return h > w;
});

// Portrait resolutions use Fit mode to preserve original aspect ratio without cropping.
// Landscape resolutions use Fill mode to fully fill the preview area.
const localFillMode = computed(() =>
  isPortrait.value
    ? TRTCVideoFillMode.TRTCVideoFillMode_Fit
    : TRTCVideoFillMode.TRTCVideoFillMode_Fill,
);

// Sorted from high to low resolution, landscape first then portrait
const landscapeResolutions = [
  { width: 1920, height: 1080 },
  { width: 1280, height: 720 },
  { width: 960, height: 540 },
  { width: 640, height: 360 },
];

const portraitResolutions = [
  { width: 1080, height: 1920 },
  { width: 720, height: 1280 },
  { width: 540, height: 960 },
  { width: 360, height: 640 },
];

// Default resolutions used as fallback when camera capabilities are unavailable
// Order: high-to-low, landscape first then portrait
const defaultResolutions = [
  ...landscapeResolutions.map(r => ({ label: `${r.width}x${r.height}`, value: `${r.width}x${r.height}` })),
  ...portraitResolutions.map(r => ({ label: `${r.width}x${r.height}`, value: `${r.width}x${r.height}` })),
];

// Map TRTCVideoResolution enum values to "widthxheight" strings
const RESOLUTION_ENUM_MAP: Record<number, string> = {
  [TRTCVideoResolution.TRTCVideoResolution_640_360]: '640x360',
  [TRTCVideoResolution.TRTCVideoResolution_960_540]: '960x540',
  [TRTCVideoResolution.TRTCVideoResolution_1280_720]: '1280x720',
  [TRTCVideoResolution.TRTCVideoResolution_1920_1080]: '1920x1080',
};

// Cache camera capabilities by deviceId to avoid redundant getUserMedia calls
// when switching back to a previously inspected camera.
const capabilitiesCache = new Map<string, MediaTrackCapabilities | null>();

const generateVideoResolutionList = async (options?: { skipProbe?: boolean }) => {
  const currentCamera = cameraList.value.find(item => item.deviceId === currentCameraId.value);
  if (!currentCamera) {
    return;
  }

  try {
    const deviceId = currentCameraId.value;
    let capabilities: MediaTrackCapabilities | null = null;

    if (capabilitiesCache.has(deviceId)) {
      capabilities = capabilitiesCache.get(deviceId) ?? null;
    } else if (options?.skipProbe) {
      // Skip getUserMedia probe to avoid competing with SDK for camera access.
      // Use default resolutions as fallback; capabilities will be probed next
      // time when the camera is selected without an active preview stream.
      videoResolutionList.value = defaultResolutions;
      return;
    } else {
      // Use 'exact' constraint to ensure we get capabilities for the specified camera,
      // not the currently active one (which may still be the previous camera's stream)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } },
      });
      const track = stream.getVideoTracks()[0];
      capabilities = track.getCapabilities ? track.getCapabilities() : null;

      // Stop all tracks to release the device as quickly as possible,
      // especially important on Windows where some drivers hold the device
      // until all tracks are stopped.
      stream.getTracks().forEach(mediaTrack => mediaTrack.stop());

      capabilitiesCache.set(deviceId, capabilities);
    }

    if (capabilities && capabilities.width && capabilities.height) {
      const maxWidth = capabilities.width.max ?? 0;
      const maxHeight = capabilities.height.max ?? 0;

      // If max dimensions are unavailable, fall back to default resolutions
      if (maxWidth === 0 || maxHeight === 0) {
        videoResolutionList.value = defaultResolutions;
        return;
      }

      // Always provide both landscape and portrait resolutions, filtered by camera max dimensions.
      // This ensures virtual cameras (e.g. OBS on macOS) that report landscape capabilities
      // but actually output portrait frames can still be configured with portrait resolutions.
      const maxDimension = Math.max(maxWidth, maxHeight);
      const allCandidates = [...landscapeResolutions, ...portraitResolutions];

      const supportedResolutions = allCandidates.filter(res =>
        res.width <= maxDimension && res.height <= maxDimension,
      );

      // Sort: landscape first then portrait, high-to-low by area within each group
      supportedResolutions.sort((a, b) => {
        const aIsPortrait = a.height > a.width ? 1 : 0;
        const bIsPortrait = b.height > b.width ? 1 : 0;
        if (aIsPortrait !== bIsPortrait) {
          return aIsPortrait - bIsPortrait;
        }
        return (b.width * b.height) - (a.width * a.height);
      });

      videoResolutionList.value = supportedResolutions.map(resolution => ({
        label: `${resolution.width}x${resolution.height}`,
        value: `${resolution.width}x${resolution.height}`,
      }));
    } else {
      // Fallback to default resolutions if capabilities not available
      videoResolutionList.value = defaultResolutions;
    }
  } catch (error) {
    console.error('Failed to get camera capabilities:', error);
    // Fallback to default resolutions on error
    videoResolutionList.value = defaultResolutions;
  }
};

watch(() => cameraList.value, async () => {
  if (!cameraList.value.find(item => item.deviceId === currentCameraId.value)) {
    currentCameraId.value = cameraList.value[0]?.deviceId;
    if (!currentCameraId.value) {
      return;
    }
    await generateVideoResolutionList();
    await switchCameraDevice(currentCameraId.value);
  }
});

onMounted(async () => {
  const targetId = props.mediaSource?.camera?.cameraId ?? cameraList.value[0]?.deviceId;
  if (!targetId) {
    return;
  }

  currentCameraId.value = targetId;
  try {
    await previewTRTCCloud.setCurrentCameraDevice(targetId);
  } catch (error) {
    console.error('Failed to set initial camera device:', error);
    // Continue to attempt startCameraDeviceTest; it will surface the error via Toast if it also fails.
  }

  // Probe camera capabilities BEFORE startCameraDeviceTest to avoid getUserMedia
  // competing with the SDK for exclusive camera access on Windows.
  // The result is cached; subsequent switches will use the cache instead of re-probing.
  await generateVideoResolutionList();

  // Set initial resolution after the list is generated to avoid timing issues
  if (props.mediaSource?.camera?.resolution) {
    const res = props.mediaSource.camera.resolution;
    if (typeof res === 'object') {
      const { width, height } = res as { width: number; height: number };
      currentResolution.value = `${width}x${height}`;
    } else {
      currentResolution.value = RESOLUTION_ENUM_MAP[res as number] || '1920x1080';
    }
  } else if (videoResolutionList.value.length > 0) {
    currentResolution.value = videoResolutionList.value[0].value;
  }

  // Use startCameraDeviceTest for preview. Unlike startLocalPreview,
  // it works as a device-test session: setCurrentCameraDevice will
  // automatically refresh the preview stream when switching cameras.
  if (videoPreviewRef.value) {
    try {
      await previewTRTCCloud.startCameraDeviceTest(videoPreviewRef.value);
      isPreviewStarted.value = true;
      isDeviceTestRunning.value = true;
      previewTRTCCloud.setLocalRenderParams({
        rotation: TRTCVideoRotation.TRTCVideoRotation0,
        fillMode: localFillMode.value,
        mirrorType: isMirror.value
          ? TRTCVideoMirrorType.TRTCVideoMirrorType_Enable
          : TRTCVideoMirrorType.TRTCVideoMirrorType_Disable,
      });
    } catch (error) {
      console.error('Failed to start camera preview:', error);
      isPreviewStarted.value = false;
      isDeviceTestRunning.value = false;
      TUIToast({
        type: TOAST_TYPE.ERROR,
        message: t('The camera may be in use by another application. Please select a different camera.'),
      });
    }
  }
});

// Update preview encoder params and render fill mode when the selected resolution changes.
// Portrait resolutions use Fit mode + Portrait resMode; landscape uses Fill mode + Landscape resMode.
watch(currentResolution, () => {
  if (!currentResolution.value) {
    return;
  }
  previewTRTCCloud.setVideoEncoderParam({
    videoResolution: TRTCVideoResolution.TRTCVideoResolution_1920_1080,
    videoFps: 15,
    videoBitrate: 1000,
    resMode: isPortrait.value
      ? TRTCVideoResolutionMode.TRTCVideoResolutionModePortrait
      : TRTCVideoResolutionMode.TRTCVideoResolutionModeLandscape,
  });
  previewTRTCCloud.setLocalRenderParams({
    rotation: TRTCVideoRotation.TRTCVideoRotation0,
    fillMode: localFillMode.value,
    mirrorType: isMirror.value
      ? TRTCVideoMirrorType.TRTCVideoMirrorType_Enable
      : TRTCVideoMirrorType.TRTCVideoMirrorType_Disable,
  });
});

onBeforeUnmount(async () => {
  await previewTRTCCloud.stopCameraDeviceTest();
  previewTRTCCloud.destroy();
});

watch(
  () => props.mediaSource,
  async (mediaSource: MediaSource | null) => {
    if (mediaSource) {
      const cameraConfig = mediaSource.camera;
      if (cameraConfig) {
        if (currentCameraId.value !== cameraConfig.cameraId) {
          currentCameraId.value = cameraConfig.cameraId;
          await generateVideoResolutionList();
          await switchCameraDevice(cameraConfig.cameraId);
        }
        if (cameraConfig.resolution) {
          // Handle both TRTCVideoResolution enum and {width, height} object
          if (typeof cameraConfig.resolution === 'object') {
            const { width, height } = cameraConfig.resolution as { width: number; height: number };
            currentResolution.value = `${width}x${height}`;
          } else {
            // Handle TRTCVideoResolution enum by converting to width/height string
            currentResolution.value = RESOLUTION_ENUM_MAP[cameraConfig.resolution as number] || '1920x1080';
          }
        }
      }
      isMirror.value = mediaSource?.layout?.mirror === TRTCVideoMirrorType.TRTCVideoMirrorType_Enable;
      await previewTRTCCloud.setLocalRenderParams({
        rotation: TRTCVideoRotation.TRTCVideoRotation0,
        fillMode: localFillMode.value,
        mirrorType: isMirror.value
          ? TRTCVideoMirrorType.TRTCVideoMirrorType_Enable
          : TRTCVideoMirrorType.TRTCVideoMirrorType_Disable,
      });
    }
  },
  { deep: true },
);

const handleCameraChange = async (newVal: string) => {
  currentCameraId.value = newVal;
  const success = await switchCameraDevice(newVal);
  if (!success) {
    return;
  }

  // After a successful switch, update the resolution list.
  // Capabilities for previously visited cameras are served from capabilitiesCache;
  // for a new camera, getUserMedia is called here while the SDK already holds the
  // stream — on most platforms this is safe; skipProbe is intentionally omitted so
  // users see accurate resolutions rather than the full default list.
  await generateVideoResolutionList();
  if (videoResolutionList.value.length > 0) {
    currentResolution.value = videoResolutionList.value[0].value;
  }
};

const toggleMirror = () => {
  isMirror.value = !isMirror.value;
  previewTRTCCloud.setLocalRenderParams({
    rotation: TRTCVideoRotation.TRTCVideoRotation0,
    fillMode: localFillMode.value,
    mirrorType: isMirror.value
      ? TRTCVideoMirrorType.TRTCVideoMirrorType_Enable
      : TRTCVideoMirrorType.TRTCVideoMirrorType_Disable,
  });
};

const handleConfirm = () => {
  const [width, height] = currentResolution.value.split('x').map(Number);
  if (!props.mediaSource) {
    emits('addCameraMaterial', {
      name: cameraList.value.find(item => item.deviceId === currentCameraId.value)?.deviceName,
      camera: {
        cameraId: currentCameraId.value,
        resolution: {
          width,
          height,
        },
      },
      layout: {
        mirror: isMirror.value
          ? TRTCVideoMirrorType.TRTCVideoMirrorType_Enable
          : TRTCVideoMirrorType.TRTCVideoMirrorType_Disable,
      },
    });
  } else {
    const hasCameraNameChanged = props.mediaSource.name !== cameraList.value.find(item => item.deviceId === props.mediaSource?.camera?.cameraId)?.deviceName;
    const updateCameraInfo = {
      camera: {
        cameraId: currentCameraId.value,
        resolution: {
          width,
          height,
        },
      },
      layout: {
        mirror: isMirror.value
          ? TRTCVideoMirrorType.TRTCVideoMirrorType_Enable
          : TRTCVideoMirrorType.TRTCVideoMirrorType_Disable,
      },
    };
    if (!hasCameraNameChanged) {
      Object.assign(updateCameraInfo, {
        name: cameraList.value.find(item => item.deviceId === currentCameraId.value)?.deviceName,
      });
    }
    emits('updateCameraMaterial', updateCameraInfo);
  }
};

const handleClose = () => {
  emits('close');
};
</script>

<style lang="scss" scoped>
:deep(.camera-setting-dialog) {
  width: 600px;
  padding: 20px;
  .tui-dialog-body {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 10px 0;
  }
}

.video-preview {
  width: 100%;
  height: 300px;
  background-color: #000;
}

.basic-setting {
  width: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-top: 16px;
  .item-setting {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    .title {
      font-size: 14px;
      color: var(--text-color-secondary);
      margin-bottom: 12px;
    }
  }

  .camera-select {
    width: 300px;
  }

  .resolution-select {
    width: 200px;
  }

  .mirror-container {
    width: 42px;
    height: 42px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--text-color-secondary);
    border: 1px solid var(--stroke-color-primary);
    border-radius: 8px;
  }
}
</style>
