<template>
  <div class="video-preview-container">
    <div id="video-preview" class="video-preview"></div>
    <div class="attention-info">
      <span
        v-if="!isCameraTesting && !isCameraTestLoading"
        class="off-camera-info"
        >{{ t('Off Camera') }}
      </span>
      <IconLoading size="36" v-if="isCameraTestLoading" class="loading" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { IconLoading } from '@tencentcloud/uikit-base-component-vue3';
import { useI18n } from '../../locales';
import TUIRoomEngine from '@tencentcloud/tuiroom-engine-js';
import { useDeviceState } from '../../states/DeviceState';

const { t } = useI18n();
const { isCameraTesting, isCameraTestLoading, startCameraDeviceTest, stopCameraDeviceTest } = useDeviceState();

onMounted(async () => {
  TUIRoomEngine.once('ready', () => {
    startCameraDeviceTest({ view: 'video-preview' });
  });
});

onUnmounted(async () => {
  await stopCameraDeviceTest();
});
</script>

<style lang="scss" scoped>
.video-preview-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: var(--base-color-black-1);
  border-radius: 8px;

  .video-preview {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }

  .attention-info {
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;

    .off-camera-info {
      font-size: 22px;
      font-weight: 400;
      line-height: 34px;
      color: var(--base-color-gray-7);
    }

    .loading {
      animation: loading-rotate 2s linear infinite;
    }
  }
}

@keyframes loading-rotate {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}
</style>
