<template>
  <TUIDialog
    :visible="true"
    width="600px"
    :confirmText="confirmText"
    :cancelText="t('Cancel')"
    @close="handleClose"
    @cancel="handleClose"
    @confirm="handleConfirm"
    :confirmDisabled="!filePath || isSubmitting"
    :title="title"
    :customClasses="['local-video-dialog']"
  >
    <div class="local-video-setting">
      <div class="item-setting">
        <span class="title">{{ t('Video File') }}</span>
        <div class="file-select-row">
          <input
            class="file-path-input"
            type="text"
            :value="filePath"
            :placeholder="t('Please select a video file')"
            readonly
          />
          <button class="browse-btn" @click="handleBrowse">{{ t('Browse') }}</button>
        </div>
      </div>
      <div class="item-setting">
        <span class="title">{{ t('Volume') }}</span>
        <div class="volume-row">
          <TUISlider
            v-model="playoutVolume"
            class="volume-slider"
            :min="0"
            :max="100"
          />
          <span class="volume-value">{{ playoutVolume }}</span>
        </div>
      </div>
    </div>
  </TUIDialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { TUIDialog, TUISlider, TUIToast, TOAST_TYPE, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import type { ElectronFile, MediaSource } from '../../types';

const { t } = useUIKit();

const props = defineProps<{
  mediaSource?: MediaSource | null;
}>();

const emits = defineEmits(['addVideoMaterial', 'updateVideoMaterial', 'close']);

const isEditMode = computed(() => !!props.mediaSource);

const title = computed(() => isEditMode.value ? t('Local Video Settings') : t('Add Local Video'));
const confirmText = computed(() => isEditMode.value ? t('Update') : t('Add Local Video'));

// NOTE: These refs intentionally capture props.mediaSource only at setup.
// The parent (LiveScenePanel) mounts this dialog with `v-if`, so a fresh
// instance is created for each open/edit cycle. Do NOT switch to `v-show`
// or reuse a single dialog instance across different mediaSources without
// also adding a `watch(() => props.mediaSource, ...)` to resync these refs.
const filePath = ref(props.mediaSource?.sourceId || '');
const fileName = ref(props.mediaSource?.name || '');
const playoutVolume = ref(props.mediaSource?.localVideo?.playoutVolume ?? 100);

/**
 * Submit-in-flight guard.
 *
 * Set to true synchronously in `handleConfirm` right before emitting the add/update
 * event. The parent's async flow (addMediaSource -> SDK) can take hundreds of
 * milliseconds on slow disks or under contention, during which a second click on
 * the "Add" button must not trigger another emit.
 *
 * On success the parent unmounts this dialog (v-if=false), so the flag goes away
 * with the component. On failure the parent keeps the dialog mounted and calls
 * the exposed `resetSubmitting()` to re-enable the button.
 */
const isSubmitting = ref(false);

const SUPPORTED_VIDEO_EXTENSIONS = ['mov', 'mp4', 'mkv'];
const VIDEO_ACCEPT = SUPPORTED_VIDEO_EXTENSIONS.map(ext => `.${ext}`).join(',');

function isValidVideoFile(name: string): boolean {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  return SUPPORTED_VIDEO_EXTENSIONS.includes(ext);
}

function handleBrowse() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = VIDEO_ACCEPT;
  // Use { once: true } so the listener is automatically removed after the
  // first change event, releasing the closure and letting the detached
  // <input> be garbage-collected.
  input.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement)?.files?.[0];
    if (!file) return;

    if (!isValidVideoFile(file.name)) {
      TUIToast({
        type: TOAST_TYPE.WARNING,
        message: t('Unsupported video format, please select MOV, MP4 or MKV file'),
      });
      return;
    }

    const localPath = (file as ElectronFile).path;
    if (!localPath) {
      console.warn('Failed to get file path');
      return;
    }

    filePath.value = localPath;
    fileName.value = file.name || '';
  }, { once: true });
  input.click();
}

function handleConfirm() {
  if (!filePath.value || isSubmitting.value) return;
  isSubmitting.value = true;
  if (isEditMode.value) {
    emits('updateVideoMaterial', {
      filePath: filePath.value,
      fileName: fileName.value,
      playoutVolume: playoutVolume.value,
    });
  } else {
    emits('addVideoMaterial', {
      filePath: filePath.value,
      fileName: fileName.value,
      playoutVolume: playoutVolume.value,
    });
  }
}

function handleClose() {
  emits('close');
}

/**
 * Re-enable the confirm button after a failed add/update attempt.
 *
 * Exposed to the parent via defineExpose so the parent's async handler can call
 * `localVideoDialogRef.value?.resetSubmitting()` in its catch branch without
 * resorting to two-way v-model or yet another prop.
 */
function resetSubmitting() {
  isSubmitting.value = false;
}

defineExpose({ resetSubmitting });
</script>

<style lang="scss" scoped>
:deep(.local-video-dialog) {
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

.local-video-setting {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
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

  .file-select-row {
    display: flex;
    width: 100%;
    gap: 8px;

    .file-path-input {
      flex: 1;
      height: 36px;
      padding: 0 12px;
      border: 1px solid var(--stroke-color-primary);
      border-radius: 8px;
      background: transparent;
      color: var(--text-color-primary);
      font-size: 14px;
      outline: none;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;

      &::placeholder {
        color: var(--text-color-secondary);
        opacity: 0.5;
      }
    }

    .browse-btn {
      height: 36px;
      padding: 0 16px;
      border: 1px solid var(--stroke-color-primary);
      border-radius: 8px;
      background: transparent;
      color: var(--text-color-primary);
      font-size: 14px;
      cursor: pointer;
      white-space: nowrap;
      transition: background-color 0.2s ease;

      &:hover {
        background-color: rgba(255, 255, 255, 0.1);
      }
    }
  }

  .volume-row {
    display: flex;
    width: 100%;
    align-items: center;
    gap: 12px;

    .volume-slider {
      flex: 1;
    }

    .volume-value {
      min-width: 32px;
      text-align: right;
      font-size: 14px;
      color: var(--text-color-primary);
    }
  }
}
</style>
