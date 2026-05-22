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
          @local-video-setting="updateLocalVideoSetting(material)"
          @online-video-setting="updateOnlineVideoSetting(material)"
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
      v-if="showMaterialRenameDialog && renameMaterial"
      :material="renameMaterial"
      @close="closeMaterialRenameDialog"
      @rename="updateMaterial(renameMaterial!, { name: $event })"
    />

    <!-- Local video settings dialog -->
    <LocalVideoDialog
      v-if="showLocalVideoDialog"
      ref="localVideoDialogRef"
      :mediaSource="localVideoSettingMediaSource"
      @close="closeLocalVideoDialog"
      @add-video-material="addLocalVideoMaterial"
      @update-video-material="updateLocalVideoMaterial"
    />

    <!-- Online video settings dialog -->
    <OnlineVideoDialog
      v-if="showOnlineVideoDialog"
      ref="onlineVideoDialogRef"
      :mediaSource="onlineVideoSettingMediaSource"
      @close="closeOnlineVideoDialog"
      @add-online-video-material="addOnlineVideoMaterial"
      @update-online-video-material="updateOnlineVideoMaterial"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { TRTCMediaSourceType } from '@tencentcloud/tuiroom-engine-electron';
import { TUIToast, TOAST_TYPE, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useVideoMixerState, DEFAULT_VIDEO_RECT } from '../../states/VideoMixerState';
import { useLiveErrorModal } from '../UIKitModal';

import CameraSettingDialog from './CameraSettingDialog.vue';
import LocalVideoDialog from './LocalVideoDialog.vue';
import OnlineVideoDialog from './OnlineVideoDialog.vue';
import LiveSceneSelect from './LiveSceneSelect.vue';
import MaterialItem from './MaterialItem.vue';
import MaterialRenameDialog from './MaterialRenameDialog.vue';
import ScreenShareSettingDialog from './ScreenShareSettingDialog.vue';
import type { ElectronFile, MediaSource } from '../../types';

const { t } = useUIKit();
const { handleErrorWithModal } = useLiveErrorModal();

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}
const {
  addMediaSource,
  updateMediaSource,
  mediaSourceList,
} = useVideoMixerState();

/**
 * Common error handler for media source operations.
 * Checks for duplicate media source errors and shows appropriate toast messages.
 */
function handleMediaSourceError(error: unknown, options: {
  context: string;
  duplicateMessage: string;
  failureMessage: string;
  useModal?: boolean;
}) {
  console.error(`${options.context} error:`, error);
  const isDuplicate = getErrorMessage(error).includes('Media source already existed');
  if (isDuplicate) {
    TUIToast({ type: TOAST_TYPE.WARNING, message: t(options.duplicateMessage) });
  } else {
    if (options.useModal && handleErrorWithModal(error)) {
      return;
    }
    TUIToast({ type: TOAST_TYPE.ERROR, message: t(options.failureMessage) });
  }
}

const cameraSettingMediaSource = ref<MediaSource | null>(null);
const screenShareSettingMediaSource = ref<MediaSource | null>(null);
const localVideoSettingMediaSource = ref<MediaSource | null>(null);
const onlineVideoSettingMediaSource = ref<MediaSource | null>(null);

// NOTE: This computed depends on the whole `mediaSourceList` ref, so it
// re-sorts on ANY field change of any media source (rect, isSelected,
// mirrorType, ...), not only on zOrder. That is technically over-reactive,
// but `n` here is capped by the UI (at most ~10 sources), so an O(n log n)
// re-sort is negligible. If this ever becomes a bottleneck, consider
// maintaining a pre-sorted list inside VideoMixerState instead.
const mediaSourceListWithZOrderSort = computed(() => [...mediaSourceList.value].sort(
  (item1: MediaSource, item2: MediaSource) => (item2.zOrder || 0) - (item1.zOrder || 0),
));

const visibleMenuKey = ref('');
const showCameraSettingDialog = ref(false);
const showScreenShareSettingDialog = ref(false);
const showMaterialRenameDialog = ref(false);
const showLocalVideoDialog = ref(false);
const showOnlineVideoDialog = ref(false);

/**
 * Template refs for video dialogs.
 *
 * Exposed `resetSubmitting()` is called from the add/update handlers' catch
 * branches to re-enable the confirm button after a failed attempt. On success
 * the dialog is unmounted (v-if=false) so the ref becomes null naturally.
 *
 * Typed as `{ resetSubmitting: () => void } | null` rather than InstanceType
 * to avoid coupling to the full SFC public instance shape.
 */
const localVideoDialogRef = ref<{ resetSubmitting: () => void } | null>(null);
const onlineVideoDialogRef = ref<{ resetSubmitting: () => void } | null>(null);

const getMaterialKey = (material: MediaSource) => `${material.sourceType}::${material.sourceId}`;

const handleToggleMenu = (material: MediaSource) => {
  const key = getMaterialKey(material);
  visibleMenuKey.value = visibleMenuKey.value === key ? '' : key;
};

const handleCloseMenu = () => {
  visibleMenuKey.value = '';
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
    await addMediaSource(material as MediaSource);
    closeCameraSettingDialog();
  } catch (error: unknown) {
    handleMediaSourceError(error, {
      context: 'addCameraMaterial',
      duplicateMessage: 'This camera has already been added to the materials list',
      failureMessage: 'Failed to add camera source.',
      useModal: true,
    });
  }
};

const updateCameraSetting = (material: MediaSource) => {
  cameraSettingMediaSource.value = material;
  showCameraSettingDialog.value = true;
};

const selectMaterial = async (type: TRTCMediaSourceType) => {
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
    case TRTCMediaSourceType.kVideoFile:
      localVideoSettingMediaSource.value = null;
      showLocalVideoDialog.value = true;
      break;
    case TRTCMediaSourceType.kOnlineVideo:
      onlineVideoSettingMediaSource.value = null;
      showOnlineVideoDialog.value = true;
      break;
    default:
      break;
  }
};

function addImageMaterial() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.jpg,.jpeg,.png,.bmp';
  // Use { once: true } so the listener is automatically removed after the
  // first change event, releasing the closure and letting the detached
  // <input> be garbage-collected.
  input.addEventListener('change', async (e) => {
    const file = (e.target as HTMLInputElement)?.files?.[0];
    if (!file) {
      return;
    }

    // In Electron, file object has 'path' property with local file path
    const filePath = (file as ElectronFile).path;
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
      } catch (error: unknown) {
        handleMediaSourceError(error, {
          context: 'addImageMaterial',
          duplicateMessage: 'This image has already been added to the materials list',
          failureMessage: 'Failed to add image',
          useModal: true,
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
  }, { once: true });
  input.click();
}

function closeLocalVideoDialog() {
  showLocalVideoDialog.value = false;
}

function closeOnlineVideoDialog() {
  showOnlineVideoDialog.value = false;
}

const updateLocalVideoSetting = (material: MediaSource) => {
  localVideoSettingMediaSource.value = material;
  showLocalVideoDialog.value = true;
};

const updateOnlineVideoSetting = (material: MediaSource) => {
  onlineVideoSettingMediaSource.value = material;
  showOnlineVideoDialog.value = true;
};

async function updateLocalVideoMaterial({ filePath, fileName, playoutVolume }: { filePath: string; fileName: string; playoutVolume: number }) {
  const material = localVideoSettingMediaSource.value;
  if (!material) return;
  try {
    const config: Partial<MediaSource> = {
      localVideo: { playoutVolume },
    };
    // If file path changed, update sourceId and name
    if (filePath && filePath !== material.sourceId) {
      config.sourceId = filePath;
      config.name = fileName || material.name;
    }
    await updateMediaSource(material, config);
    closeLocalVideoDialog();
  } catch (error: unknown) {
    // Re-enable confirm button so the user can retry without having to reopen the dialog.
    localVideoDialogRef.value?.resetSubmitting();
    handleMediaSourceError(error, {
      context: 'updateLocalVideoMaterial',
      duplicateMessage: 'This video has already been added to the materials list',
      failureMessage: 'Failed to update local video',
    });
  }
}

async function updateOnlineVideoMaterial({ url, playoutVolume, networkCacheSizeKB }: { url: string; playoutVolume: number; networkCacheSizeKB: number }) {
  const material = onlineVideoSettingMediaSource.value;
  if (!material) return;
  try {
    const config: Partial<MediaSource> = {
      onlineVideo: { playoutVolume, networkCacheSizeKB },
    };
    // If URL changed, update sourceId and name
    if (url && url !== material.sourceId) {
      config.sourceId = url;
      config.name = url;
    }
    await updateMediaSource(material, config);
    closeOnlineVideoDialog();
  } catch (error: unknown) {
    onlineVideoDialogRef.value?.resetSubmitting();
    handleMediaSourceError(error, {
      context: 'updateOnlineVideoMaterial',
      duplicateMessage: 'This online video has already been added to the materials list',
      failureMessage: 'Failed to update online video',
    });
  }
}

async function addOnlineVideoMaterial({ url, playoutVolume, networkCacheSizeKB }: { url: string; playoutVolume: number; networkCacheSizeKB: number }) {
  const videoSourceInfo = {
    sourceId: url,
    sourceType: TRTCMediaSourceType.kOnlineVideo,
    name: url,
    rect: { ...DEFAULT_VIDEO_RECT },
    zOrder: 1,
    onlineVideo: { playoutVolume, networkCacheSizeKB },
  };
  try {
    await addMediaSource(videoSourceInfo);
    closeOnlineVideoDialog();
  } catch (error: unknown) {
    onlineVideoDialogRef.value?.resetSubmitting();
    handleMediaSourceError(error, {
      context: 'addOnlineVideoMaterial',
      duplicateMessage: 'This online video has already been added to the materials list',
      failureMessage: 'Failed to add online video',
      useModal: true,
    });
  }
}

async function addLocalVideoMaterial({ filePath, fileName, playoutVolume }: { filePath: string; fileName: string; playoutVolume: number }) {
  const videoSourceInfo = {
    sourceId: filePath,
    sourceType: TRTCMediaSourceType.kVideoFile,
    name: fileName || t('Video'),
    rect: { ...DEFAULT_VIDEO_RECT },
    zOrder: 1,
    localVideo: { playoutVolume },
  };
  try {
    await addMediaSource(videoSourceInfo);
    closeLocalVideoDialog();
  } catch (error: unknown) {
    localVideoDialogRef.value?.resetSubmitting();
    handleMediaSourceError(error, {
      context: 'addLocalVideoMaterial',
      duplicateMessage: 'This video has already been added to the materials list',
      failureMessage: 'Failed to add local video',
      useModal: true,
    });
  }
}

const addScreenMaterial = async (material: Partial<MediaSource>) => {
  try {
    await addMediaSource(material as MediaSource);
    closeScreenShareSettingDialog();
  } catch (error: unknown) {
    handleMediaSourceError(error, {
      context: 'addScreenMaterial',
      duplicateMessage: 'This screen has already been added to the materials list',
      failureMessage: 'Failed to add screen or window source',
    });
  }
};

const updateMaterial = async (material: MediaSource, materialOption: Partial<MediaSource>) => {
  try {
    await updateMediaSource(material, materialOption);
    handleCloseMenu();
    closeCameraSettingDialog();
    closeScreenShareSettingDialog();
    closeMaterialRenameDialog();
  } catch (error: unknown) {
    handleMediaSourceError(error, {
      context: 'updateMaterial',
      duplicateMessage: 'Failed to update media source. The new media source ID already exited.',
      failureMessage: 'Failed to update media source',
    });
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
