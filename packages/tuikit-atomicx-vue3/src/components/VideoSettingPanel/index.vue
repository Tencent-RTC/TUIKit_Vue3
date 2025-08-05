<template>
  <div class="video-setting-panel">
    <template v-if="cameraSelectVisible">
      <div class="section">
        <div class="section-title">{{ t('Camera') }}</div>
        <div class="row">
          <span class="label">{{ t('Select device') }}</span>
          <camera-select />
        </div>
      </div>

      <div class="divider"></div>
    </template>

    <template v-if="videoPreviewVisible">
      <div class="section">
        <div class="section-title">{{ t('Preview') }}</div>
        <div class="preview-container">
          <video-preview class="video-preview" />
        </div>
      </div>

      <div class="divider"></div>
    </template>

    <template v-if="videoProfileVisible">
      <div class="section">
        <div class="section-title">{{ t('Video profile') }}</div>
        <div class="row">
          <span class="label">{{ t('Resolution') }}</span>
          <video-profile />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import CameraSelect from './CameraSelect.vue';
import VideoProfile from './VideoProfile.vue';
import VideoPreview from './VideoPreview.vue';
import { defineProps } from 'vue';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';

const { t } = useUIKit();

const props = defineProps({
  cameraSelectVisible: {
    type: Boolean,
    default: true,
  },
  videoPreviewVisible: {
    type: Boolean,
    default: true,
  },
  videoProfileVisible: {
    type: Boolean,
    default: true,
  },
});
</script>

<style scoped lang="scss">
.video-setting-panel {
  color: var(--tui-color-text-primary);

  .section {
    margin-bottom: 32px;

    .section-title {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 16px;
    }

    .row {
      display: flex;
      align-items: center;
      margin-bottom: 16px;

      .label {
        width: 96px;
      }
    }

    .preview-container {
      margin-top: 8px;

      .video-preview {
        position: relative;
        width: 100%;
        height: 0;
        padding-top: calc(100% * 9 / 16);
        overflow: hidden;
        border-radius: 8px;
        background: #222;
      }
    }
  }

  .divider {
    height: 1px;
    background: var(--uikit-color-gray-4);
    margin: 32px 0;
  }
}
</style>
