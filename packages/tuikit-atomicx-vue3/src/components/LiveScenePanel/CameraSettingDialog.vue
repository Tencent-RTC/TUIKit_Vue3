<template>
  <TUIDialog
    :visible="true"
    width="600px"
    :confirmText="confirmText"
    @close="handleClose"
    @cancel="handleClose"
    @confirm="handleConfirm"
    :confirmDisabled="cameraList.length === 0"
    :title="title"
    :customClasses="['camera-setting-dialog']"
  >
    <div id="video-preview" class="video-preview"></div>
    <div class="basic-setting">
      <div class="item-setting">
        <span class="title">{{ t('Camera') }}</span>
        <TUISelect class="camera-select" v-model="currentCameraId" @change="handleCameraChange">
          <TUIOption v-for="item in cameraList" :key="item.deviceId" :value="item.deviceId" :label="item.deviceName" />
        </TUISelect>
      </div>
      <div class="item-setting">
        <span class="title">{{ t('Resolution') }}</span>
        <TUISelect class="resolution-select" v-model="currentResolution">
          <TUIOption v-for="item in videoResolutionList" :key="item.value" :value="item.value" :label="item.label" />
        </TUISelect>
      </div>
      <div class="mirror-container" @click="toggleMirror">
        <svg-icon :icon="isMirror ? CameraMirror : CameraUnMirror" />
      </div>
    </div>
  </TUIDialog>
</template>

<script setup lang="ts">
import { ref, Ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useDeviceState } from '../../states/DeviceState';
import { MediaSource } from '../../types';
import {
  TRTCVideoMirrorType,
  TRTCVideoResolution,
  TRTCCloud,
  TRTCVideoFillMode,
  TRTCVideoRotation,
} from '@tencentcloud/tuiroom-engine-js';
import { TUIDialog, TUISelect, TUIOption, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import SvgIcon from '../../baseComp/SvgIcon.vue';
import CameraMirror from './icons/CameraMirror.vue';
import CameraUnMirror from './icons/CameraUnmirror.vue';

const previewTRTCCloud = new TRTCCloud();

const { t } = useUIKit();

const { cameraList } = useDeviceState();

const props = defineProps<{
  mediaSource: MediaSource | null;
}>();

const emits = defineEmits(['addCameraMaterial', 'updateCameraMaterial', 'close']);

onUnmounted(async () => {
  await previewTRTCCloud.stopCameraDeviceTest();
});

const title = computed(() => {
  return props.mediaSource ? t('Update Camera') : t('Add Camera');
});

const confirmText = computed(() => {
  return props.mediaSource ? t('Update Camera') : t('Add Camera');
});

const currentCameraId = ref(props.mediaSource?.camera.cameraId || cameraList.value[0]?.deviceId);
const currentResolution = ref(props.mediaSource?.camera.resolution || TRTCVideoResolution.TRTCVideoResolution_1280_720);
const currentFps = ref(props.mediaSource?.camera.fps);
const isMirror: Ref<boolean> = ref(
  props.mediaSource?.camera.mirror === TRTCVideoMirrorType.TRTCVideoMirrorType_Enable || true
);

const videoResolutionList = computed(() => [
  { label: '640x360', value: TRTCVideoResolution.TRTCVideoResolution_640_360 },
  { label: '960x540', value: TRTCVideoResolution.TRTCVideoResolution_960_540 },
  { label: '1280x720', value: TRTCVideoResolution.TRTCVideoResolution_1280_720 },
  { label: '1920x1080', value: TRTCVideoResolution.TRTCVideoResolution_1920_1080 },
]);

watch(() => cameraList.value, async () => {
  if (!cameraList.value.find(item => item.deviceId === currentCameraId.value)) {
    currentCameraId.value = cameraList.value[0]?.deviceId;
    await previewTRTCCloud.setCurrentCameraDevice(currentCameraId.value);
  }
});

onMounted(async () => {
  if (props.mediaSource?.camera.cameraId) {
    currentCameraId.value = props.mediaSource.camera.cameraId;
    await previewTRTCCloud.setCurrentCameraDevice(props.mediaSource.camera.cameraId);
  } else {
    currentCameraId.value = cameraList.value[0]?.deviceId;
    await previewTRTCCloud.setCurrentCameraDevice(cameraList.value[0]?.deviceId);
  }
  await previewTRTCCloud.startCameraDeviceTest('video-preview');
});

watch(
  () => props.mediaSource,
  async (mediaSource: any) => {
    console.log('mediaSource', mediaSource);
    if (mediaSource) {
      const cameraConfig = mediaSource.camera;
      if (currentCameraId.value !== cameraConfig.cameraId) {
        currentCameraId.value = cameraConfig.cameraId;
        await previewTRTCCloud.setCurrentCameraDevice(cameraConfig.cameraId);
      }
      if (currentResolution.value !== cameraConfig.resolution) {
        currentResolution.value = cameraConfig.resolution;
      }
      if (currentFps.value !== cameraConfig.fps) {
        currentFps.value = cameraConfig.fps;
      }
      isMirror.value = mediaSource.layout.mirror === TRTCVideoMirrorType.TRTCVideoMirrorType_Enable;
      await previewTRTCCloud.setLocalRenderParams({
        rotation: TRTCVideoRotation.TRTCVideoRotation_0,
        fillMode: TRTCVideoFillMode.TRTCVideoFillMode_Fill,
        mirrorType: isMirror.value
          ? TRTCVideoMirrorType.TRTCVideoMirrorType_Enable
          : TRTCVideoMirrorType.TRTCVideoMirrorType_Disable,
      });
    }
  },
  { deep: true, immediate: true }
);

const handleCameraChange = async (newVal: string) => {
  currentCameraId.value = newVal;
  await previewTRTCCloud.setCurrentCameraDevice(newVal);
};

const toggleMirror = () => {
  isMirror.value = !isMirror.value;
  previewTRTCCloud.setLocalRenderParams({
    rotation: TRTCVideoRotation.TRTCVideoRotation_0,
    fillMode: TRTCVideoFillMode.TRTCVideoFillMode_Fill,
    mirrorType: isMirror.value
      ? TRTCVideoMirrorType.TRTCVideoMirrorType_Enable
      : TRTCVideoMirrorType.TRTCVideoMirrorType_Disable,
  });
};

const handleConfirm = () => {
  if (!props.mediaSource) {
    emits('addCameraMaterial', {
      name: cameraList.value.find(item => item.deviceId === currentCameraId.value)?.deviceName,
      camera: {
        cameraId: currentCameraId.value,
        resolution: currentResolution.value,
      },
      layout: {
        mirror: isMirror.value
          ? TRTCVideoMirrorType.TRTCVideoMirrorType_Enable
          : TRTCVideoMirrorType.TRTCVideoMirrorType_Disable,
      },
    });
  } else {
    const hasCameraNameChanged = props.mediaSource.name !== cameraList.value.find(item => item.deviceId === props.mediaSource.camera.cameraId)?.deviceName;
    const updateCameraInfo = {
      camera: {
        cameraId: currentCameraId.value,
        resolution: currentResolution.value,
      },
      layout: {
        mirror: isMirror.value
          ? TRTCVideoMirrorType.TRTCVideoMirrorType_Enable
          : TRTCVideoMirrorType.TRTCVideoMirrorType_Disable,
      },
    }
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
  .dialog-body {
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
