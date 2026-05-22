<template>
  <TUIDialog
    :visible="true"
    width="600px"
    :confirmText="confirmText"
    :cancelText="cancelText"
    @close="handleClose"
    @cancel="handleClose"
    @confirm="handleConfirm"
    :confirmDisabled="cameraList.length === 0"
    :title="title"
    :customClasses="['camera-setting-dialog']"
  >
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
    </div>
  </TUIDialog>
</template>

<script setup lang="ts">
import { ref, Ref, computed, watch, onMounted } from 'vue';
import { useDeviceState } from '../../states/DeviceState';
import { MediaSource } from '../../types';
import {
  TRTCVideoMirrorType,
  TRTCMediaSourceType,
} from '@tencentcloud/tuiroom-engine-electron';
import { TUIDialog, TUISelect, TUIOption, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useRoomEngine } from '../../hooks/useRoomEngine';

const roomEngine = useRoomEngine();
const previewTRTCCloud = roomEngine.instance?.getTRTCCloud();

const { t } = useUIKit();

const { cameraList, getCameraList } = useDeviceState();

const props = defineProps<{
  mediaSource: MediaSource | null;
}>();

const emits = defineEmits(['addCameraMaterial', 'updateCameraMaterial', 'close']);

const title = computed(() => {
  return props.mediaSource ? t('Update Camera') : t('Add Camera');
});

const confirmText = computed(() => {
  return props.mediaSource ? t('Update Camera') : t('Add Camera');
});
const cancelText = t('Cancel');

const currentCameraId = ref(props.mediaSource?.sourceId || cameraList.value[0]?.deviceId);
const currentResolution = ref('');
const isMirror: Ref<boolean> = ref(
  props.mediaSource ? props.mediaSource.mirrorType === TRTCVideoMirrorType.TRTCVideoMirrorType_Enable : false
);

const videoResolutionList: Ref<Array<{
  label: string;
  value: string;
}>> = ref([]);

const DEFAULT_RESOLUTION_OPTIONS: Array<{ label: string; value: string }> = [
  { label: '1920x1080', value: '1920x1080' },
  { label: '1280x720', value: '1280x720' },
  { label: '960x540', value: '960x540' },
  { label: '640x360', value: '640x360' },
];

const generateVideoResolutionList = () => {
  const currentCamera = cameraList.value.find(item => item.deviceId === currentCameraId.value);
  if (!currentCamera) return;
  const supportedResolutions = (currentCamera as any)?.deviceProperties?.SupportedResolution;
  if (supportedResolutions && Array.isArray(supportedResolutions) && supportedResolutions.length > 0) {
    const resolutionList = supportedResolutions.map((resolution: {width: number; height: number;}) => ({
      label: `${resolution.width}x${resolution.height}`,
      value: `${resolution.width}x${resolution.height}`,
    }));
    videoResolutionList.value = resolutionList;
  } else {
    // No SupportedResolution from the device, fall back to a curated default list.
    videoResolutionList.value = [...DEFAULT_RESOLUTION_OPTIONS];
  }
};

watch(() => cameraList.value, async () => {
  if (!cameraList.value.find(item => item.deviceId === currentCameraId.value)) {
    currentCameraId.value = cameraList.value[0]?.deviceId;
    generateVideoResolutionList();
    currentResolution.value = videoResolutionList.value[0]?.value || '';
    await previewTRTCCloud?.setCurrentCameraDevice(currentCameraId.value);
  }
});

onMounted(async () => {
  await getCameraList();
  if (props.mediaSource?.sourceId) {
    currentCameraId.value = props.mediaSource.sourceId;
    generateVideoResolutionList();
    if (props.mediaSource?.width !== undefined && props.mediaSource.height !== undefined) {
      currentResolution.value = `${props.mediaSource.width}x${props.mediaSource.height}`;
    }
    await previewTRTCCloud?.setCurrentCameraDevice(props.mediaSource.sourceId);
  } else {
    currentCameraId.value = cameraList.value[0]?.deviceId;
    generateVideoResolutionList();
    currentResolution.value = videoResolutionList.value[0]?.value || '';
    await previewTRTCCloud?.setCurrentCameraDevice(cameraList.value[0]?.deviceId);
  }
});

watch(
  () => props.mediaSource,
  async (mediaSource: MediaSource | null) => {
    if (mediaSource) {
      if (currentCameraId.value !== mediaSource.sourceId) {
        currentCameraId.value = mediaSource.sourceId;
        generateVideoResolutionList();
        await previewTRTCCloud?.setCurrentCameraDevice(mediaSource.sourceId);
      }
      if (mediaSource.width !== undefined && mediaSource.height !== undefined) {
        currentResolution.value = `${mediaSource.width}x${mediaSource.height}`;
      }
      isMirror.value = mediaSource.mirrorType === TRTCVideoMirrorType.TRTCVideoMirrorType_Enable;
    }
  },
  { deep: true }
);

const handleCameraChange = async (newVal: string) => {
  currentCameraId.value = newVal;
  generateVideoResolutionList();
  currentResolution.value = videoResolutionList.value[0]?.value || '';
  await previewTRTCCloud?.setCurrentCameraDevice(newVal);
};

const handleConfirm = () => {
  const [width, height] = currentResolution.value.split('x').map(Number);
  if (!width || !height || isNaN(width) || isNaN(height)) {
    console.warn('Invalid resolution value:', currentResolution.value);
    return;
  }
  if (!props.mediaSource) {
    emits('addCameraMaterial', {
      sourceId: currentCameraId.value,
      sourceType: TRTCMediaSourceType.kCamera,
      name: cameraList.value.find(item => item.deviceId === currentCameraId.value)?.deviceName,
      width,
      height,
      rect: { left: 0, top: 0, right: width, bottom: height },
      mirrorType: isMirror.value
        ? TRTCVideoMirrorType.TRTCVideoMirrorType_Enable
        : TRTCVideoMirrorType.TRTCVideoMirrorType_Disable,
    });
  } else {
    const hasCameraNameChanged = props.mediaSource.name !== cameraList.value.find(item => item.deviceId === props.mediaSource?.sourceId)?.deviceName;
    const updateCameraInfo = {
      ...props.mediaSource,
      sourceId: currentCameraId.value,
      width,
      height,
      mirrorType: isMirror.value
        ? TRTCVideoMirrorType.TRTCVideoMirrorType_Enable
        : TRTCVideoMirrorType.TRTCVideoMirrorType_Disable,
    };
    if (!hasCameraNameChanged) {
      Object.assign(updateCameraInfo, {
        name: cameraList.value.find(item => item.deviceId === currentCameraId.value)?.deviceName,
      });
    }
    emits('updateCameraMaterial', props.mediaSource, updateCameraInfo);
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
