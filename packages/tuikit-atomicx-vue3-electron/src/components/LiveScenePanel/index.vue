<template>
  <div class="live-scene-panel" :class="{ 'no-material': mediaSourceList.length === 0 }">
    <LiveSceneSelect :displayMode="mediaSourceList.length === 0 ? 'panel' : 'button'" @add-material="selectMaterial" />
    <!-- Materials list area -->
    <div class="materials-list">
      <template v-for="material in mediaSourceListWithZOrderSort" :key="getMaterialKey(material)">
        <MaterialItem
          :material="material"
          :is-menu-visible="visibleMenuKey === getMaterialKey(material)"
          @toggle-menu="handleToggleMenu"
          @close-menu="handleCloseMenu"
          @camera-setting="updateCameraSetting(material)"
          @screen-share-setting="updateScreenShareSetting(material)"
          @rename="updateMaterialName(material)"
        />
      </template>
    </div>

    <!-- Camera settings dialog -->
    <CameraSettingDialog
      v-if="showCameraSettingDialog"
      :mediaSource="cameraSettingMediaSource"
      @close="closeCameraSettingDialog"
      @add-camera-material="addCameraMaterial"
      @update-camera-material="updateMaterial"
    />

    <!-- Screen share settings dialog -->
    <ScreenShareSettingDialog
      v-if="showScreenShareSettingDialog"
      :mediaSource="screenShareSettingMediaSource"
      @close="closeScreenShareSettingDialog"
      @add-screen-material="addScreenMaterial"
      @update-screen-material="updateMaterial"
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
import { ref, computed } from 'vue';
import { TRTCMediaSourceType } from '@tencentcloud/tuiroom-engine-electron';
import { TUIToast, TOAST_TYPE, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useVideoMixerState } from '../../states/VideoMixerState';

import CameraSettingDialog from './CameraSettingDialog.vue';
import LiveSceneSelect from './LiveSceneSelect.vue';
import MaterialItem from './MaterialItem.vue';
import MaterialRenameDialog from './MaterialRenameDialog.vue';
import ScreenShareSettingDialog from './ScreenShareSettingDialog.vue';
import type { MediaSource } from '../../types';

const { t } = useUIKit();
const {
  addMediaSource,
  updateMediaSource,
  mediaSourceList,
} = useVideoMixerState();

const cameraSettingMediaSource = ref<MediaSource | null>(null);
const screenShareSettingMediaSource = ref<MediaSource | null>(null);

const mediaSourceListWithZOrderSort = computed(() => [...mediaSourceList.value].sort(
  (item1: MediaSource, item2: MediaSource) => (item2.zOrder || 0) - (item1.zOrder || 0),
));

const visibleMenuKey = ref('');
const showMaterialDialog = ref(false);
const showCameraSettingDialog = ref(false);
const showScreenShareSettingDialog = ref(false);
const showMaterialRenameDialog = ref(false);

const getMaterialKey = (material: MediaSource) => `${material.sourceType}::${material.sourceId}`;

const handleToggleMenu = (material: MediaSource) => {
  const key = getMaterialKey(material);
  visibleMenuKey.value = visibleMenuKey.value === key ? '' : key;
};

const handleCloseMenu = () => {
  visibleMenuKey.value = '';
};

const closeMaterialDialog = () => {
  showMaterialDialog.value = false;
};

const renameMaterial = ref<MediaSource | null>(null);
const updateMaterialName = (material: MediaSource) => {
  renameMaterial.value = material;
  showMaterialRenameDialog.value = true;
};

const closeCameraSettingDialog = () => {
  showCameraSettingDialog.value = false;
};

const closeScreenShareSettingDialog = () => {
  showScreenShareSettingDialog.value = false;
};

const closeMaterialRenameDialog = () => {
  showMaterialRenameDialog.value = false;
};

const addCameraMaterial = async (material: Partial<MediaSource>) => {
  try {
    await addMediaSource(material);
    closeCameraSettingDialog();
  } catch (error: any) {
    console.error('addCameraMaterial error:', error);
    const isCameraDuplicate = error?.message?.includes('Media source already existed') || false;
    if (isCameraDuplicate) {
      TUIToast({
        type: TOAST_TYPE.WARNING,
        message: t('This camera has already been added to the materials list'),
      });
    } else {
      TUIToast({
        type: TOAST_TYPE.WARNING,
        message: t('Failed to add camera source.'),
      });
    }
  }
};

const updateCameraSetting = (material: MediaSource) => {
  cameraSettingMediaSource.value = material;
  showCameraSettingDialog.value = true;
};

const updateScreenShareSetting = (material: MediaSource) => {
  screenShareSettingMediaSource.value = material;
  showScreenShareSettingDialog.value = true;
};

const selectMaterial = async (type: TRTCMediaSourceType) => {
  closeMaterialDialog();
  handleCloseMenu();

  switch (type) {
    case TRTCMediaSourceType.kCamera:
      cameraSettingMediaSource.value = null;
      showCameraSettingDialog.value = true;
      break;
    case TRTCMediaSourceType.kScreen:
      screenShareSettingMediaSource.value = null;
      showScreenShareSettingDialog.value = true;
      break;
    case TRTCMediaSourceType.kImage:
      addImageMaterial();
      break;
    default:
      break;
  }
};

function addImageMaterial() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.jpg,.jpeg,.png,.bmp';
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement)?.files?.[0];
    if (!file) {
      return;
    }

    // In Electron, file object has 'path' property with local file path
    const filePath = (file as any).path;
    if (!filePath) {
      console.warn('Failed to get file path');
      return;
    }

    // Create blob URL to load image and get dimensions
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.src = url;
    image.onload = async () => {
      const imageWidth = image.width;
      const imageHeight = image.height;
      const imageSourceInfo = {
        sourceId: filePath,
        sourceType: TRTCMediaSourceType.kImage,
        name: file.name || t('Image'),
        rect: {
          left: 0,
          top: 0,
          right: imageWidth,
          bottom: imageHeight,
        },
        zOrder: 1,
      };
      try {
        await addMediaSource(imageSourceInfo);
      } catch (error: any) {
        console.error('addImageMaterial error:', error);
        TUIToast({
          type: TOAST_TYPE.ERROR,
          message: t('Failed to add image'),
        });
      }

      URL.revokeObjectURL(url);
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      TUIToast({
        type: TOAST_TYPE.ERROR,
        message: t('Failed to load image'),
      });
    };
  };
  input.click();
}

const addScreenMaterial = async (material: Partial<MediaSource>) => {
  try {
    await addMediaSource(material);
    closeScreenShareSettingDialog();
  } catch (error: any) {
    console.log('addScreenMaterial error', error);
    const isScreenDuplicate = error?.message?.includes('Media source already existed') || false;
    if (isScreenDuplicate) {
      TUIToast({
        type: TOAST_TYPE.WARNING,
        message: t('This screen has already been added to the materials list'),
      });
    } else {
      TUIToast({
        type: TOAST_TYPE.WARNING,
        message: t('Failed to add screen or window source'),
      });
    }
  }
};

const updateMaterial = async (material: MediaSource, materialOption: Partial<MediaSource>) => {
  try {
    await updateMediaSource(material, materialOption);
    handleCloseMenu();
    closeCameraSettingDialog();
    closeScreenShareSettingDialog();
    closeMaterialRenameDialog();
  } catch (error: any) {
    console.log('updateMediaSource error', error);
    const isDuplicate = error?.message?.includes('Media source already existed') || false;
    if (isDuplicate) {
      TUIToast({
        type: TOAST_TYPE.WARNING,
        message: t('Failed to update media source. The new media source ID already exited.'),
      });
    } else {
      TUIToast({
        type: TOAST_TYPE.WARNING,
        message: t('Failed to update media source'),
      });
    }
  }
};

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
