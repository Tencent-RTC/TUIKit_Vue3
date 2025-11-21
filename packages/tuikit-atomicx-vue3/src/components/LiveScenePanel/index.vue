<template>
  <div class="live-scene-panel" :class="{ 'no-material': mediaSourceList.length === 0 }">
    <LiveSceneSelect :displayMode="mediaSourceList.length === 0 ? 'panel' : 'button'" @addMaterial="selectMaterial" />
    <!-- 素材列表区域 -->
    <div class="materials-list">
      <template v-for="material in mediaSourceListWithZOrderSort" :key="material.id">
        <MaterialItem
          :material="material"
          @cameraSetting="updateCameraSetting(material)"
          @rename="updateMaterialName(material)"
        />
      </template>
    </div>

    <!-- 摄像头设置弹窗 -->
    <CameraSettingDialog
      v-if="showCameraSettingDialog"
      :mediaSource="cameraSettingMediaSource"
      @close="closeCameraSettingDialog"
      @addCameraMaterial="addCameraMaterial"
      @updateCameraMaterial="updateMaterial(cameraSettingMediaSource, $event)"
    />

    <MaterialRenameDialog
      v-if="showMaterialRenameDialog"
      :material="renameMaterial"
      @close="closeMaterialRenameDialog"
      @rename="updateMaterial(renameMaterial, { name: $event })"
    />
  </div>
</template>

<script setup lang="ts">
import TUIRoomEngine, {
  TRTCMediaSourceType,
  TRTCVideoResolution,
  TRTCVideoResolutionMode,
  TUIVideoQuality,
} from '@tencentcloud/tuiroom-engine-js';
import LiveSceneSelect from './LiveSceneSelect.vue';
import { TUIToast, TOAST_TYPE, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { onBeforeUnmount, ref, computed } from 'vue';
import CameraSettingDialog from './CameraSettingDialog.vue';
import MaterialRenameDialog from './MaterialRenameDialog.vue';
import MaterialItem from './MaterialItem.vue';
import { useVideoMixerState } from '../../states/VideoMixerState';
import { useDeviceState } from '../../states/DeviceState';
import { useLiveListState } from '../../states/LiveListState';
import { getNanoId } from '../../utils/utils';
import { LiveOrientation, MediaSource } from '../../types';
const { t } = useUIKit();

const { currentLive } = useLiveListState();
const { mediaSourceList, publishVideoQuality, addMediaSource, updateMediaSource, clearMediaSource } = useVideoMixerState();
const { getCameraList } = useDeviceState();

TUIRoomEngine.once('ready', async () => {
  await getCameraList();
});

const mediaSourceListWithZOrderSort = computed(() =>
  [...mediaSourceList.value].sort(
    (item1: MediaSource, item2: MediaSource) => item2.layout?.zOrder - item1.layout?.zOrder
  )
);

// 状态数据
const showMaterialDialog = ref(false);
const showCameraSettingDialog = ref(false);
const showMaterialRenameDialog = ref(false);

const closeMaterialDialog = () => {
  showMaterialDialog.value = false;
};

const closeCameraSettingDialog = () => {
  showCameraSettingDialog.value = false;
};

const closeMaterialRenameDialog = () => {
  showMaterialRenameDialog.value = false;
};

const addCameraMaterial = async (material: Partial<MediaSource>) => {
  console.log('addCameraMaterial', material);
  try {
    await addMediaSource({
      id: material.id || `${TRTCMediaSourceType.kCamera}_${getNanoId(5)}`,
      type: material.type || TRTCMediaSourceType.kCamera,
      ...material,
    });
    closeCameraSettingDialog();
  } catch (error: any) {
    if (error.name === 'NotAllowedError' && error.message.includes('Permission denied')) {
      TUIToast({
        type: TOAST_TYPE.WARNING,
        message: t('Please check the current browser camera permission'),
      });
    }
  }
};

const updateMaterial = async (material: MediaSource, materialOption: Partial<MediaSource>) => {
  console.log('updateMaterial', materialOption);
  await updateMediaSource(material, materialOption);
  closeCameraSettingDialog();
  closeMaterialRenameDialog();
};

const renameMaterial = ref<MediaSource | null>(null);
const updateMaterialName = (material: MediaSource) => {
  renameMaterial.value = material;
  showMaterialRenameDialog.value = true;
};

const cameraSettingMediaSource = ref<MediaSource | null>(null);

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

const currentLiveOrientation = computed(() => {
  if (currentLive.value
    && currentLive.value?.layoutTemplate >= 200 && currentLive.value?.layoutTemplate <= 599) {
    return LiveOrientation.Landscape;
  }
  return LiveOrientation.Portrait;
});

function addImageMaterial() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = async e => {
    const file = (e.target as HTMLInputElement)?.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.src = url;
    image.onload = async () => {
      const imageWidth = image.width;
      const imageHeight = image.height;
      const { width: canvasWidth, height: canvasHeight } = getCanvasSize(
        publishVideoQuality.value,
        currentLiveOrientation.value === LiveOrientation.Landscape ? TRTCVideoResolutionMode.TRTCVideoResolutionModeLandscape : TRTCVideoResolutionMode.TRTCVideoResolutionModePortrait
      );
      const scale = Math.min(canvasWidth / imageWidth, canvasHeight / imageHeight);
      await addMediaSource({
        id: `${TRTCMediaSourceType.kImage}_${getNanoId(5)}`,
        type: TRTCMediaSourceType.kImage,
        name: t('Image'),
        image: {
          url,
        },
        layout: {
          rect: {
            left: 0,
            top: 0,
            right: image.width * scale,
            bottom: image.height * scale,
          },
        },
      });
      URL.revokeObjectURL(url);
    };
  };
  input.click();
}

const selectMaterial = async (type: TRTCMediaSourceType) => {
  closeMaterialDialog();
  console.log('添加素材:', type);

  switch (type) {
    case TRTCMediaSourceType.kCamera:
      cameraSettingMediaSource.value = null;
      showCameraSettingDialog.value = true;
      break;
    case TRTCMediaSourceType.kScreen:
      await addMediaSource({
        id: `${TRTCMediaSourceType.kScreen}_${getNanoId(5)}`,
        type: TRTCMediaSourceType.kScreen,
        name: t('Screen'),
        screen: {
          resolution: TRTCVideoResolution.TRTCVideoResolution_1920_1080,
          fps: 15,
        },
      });
      break;
    case TRTCMediaSourceType.kImage:
      addImageMaterial();
      break;
    case TRTCMediaSourceType.kVideo:
      await addMediaSource({
        id: `${TRTCMediaSourceType.kVideo}_${getNanoId(5)}`,
        type: TRTCMediaSourceType.kVideo,
        name: t('Video'),
        video: {
          url: 'https://cdn.pixabay.com/video/2025/05/06/277097_tiny.mp4',
        },
      });
      break;
    case TRTCMediaSourceType.kText:
      await addMediaSource({
        id: `${TRTCMediaSourceType.kText}_${getNanoId(5)}`,
        type: TRTCMediaSourceType.kText,
        name: t('Text'),
        text: {
          content: 'Hello, World!',
          fontSize: 32,
          fontColor: 'red',
          fontFamily: 'Arial',
          fontWeight: 700,
        },
      });
      break;
    default:
      TUIToast({
        type: TOAST_TYPE.WARNING,
        message: t('This type of material is not supported yet'),
      });
      break;
  }
};

const updateCameraSetting = (material: MediaSource) => {
  cameraSettingMediaSource.value = material;
  showCameraSettingDialog.value = true;
};

onBeforeUnmount(() => {
  clearMediaSource();
})
</script>

<style lang="scss" scoped>
.live-scene-panel {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  width: 100%;
  height: 100%;
  &.no-material {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  * {
    box-sizing: border-box;
  }
}

.materials-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 20px;
  width: 100%;
}

.actions-section {
  display: flex;
  gap: 8px;
  border-radius: 6px;
  background: #1a1a1a;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;

  .add-material-btn {
    border: none;
    color: white;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;

    .add-icon {
      font-size: 14px;
      font-weight: bold;
    }
  }

  .clear-btn {
    color: red;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
  }
}
</style>
