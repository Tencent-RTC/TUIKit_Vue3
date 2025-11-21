<template>
  <div class="camera-button" :class="{ 'disabled': !hasPublishVideoPermission }" @click="handleClick">
    <IconCameraOn
      size="24"
      v-if="cameraStatus === DeviceStatus.On"
    />
    <IconCameraOff size="24" v-else />
    <IconUnSupport v-if="cameraLastError !== DeviceError.NoError" class="unsupport-icon" size="14" />
  </div>
</template>

<script setup lang="ts">
import { IconCameraOn, IconCameraOff, IconUnSupport } from '@tencentcloud/uikit-base-component-vue3';
import { useDeviceState } from '../../states/DeviceState';
import { DeviceStatus, DeviceError } from '../../types';

const {
  cameraStatus,
  cameraLastError,
  closeLocalCamera,
  openLocalCamera,
} = useDeviceState();

async function handleClick() {
  if (!hasPublishVideoPermission.value) {
    return;
  }
  if (cameraStatus.value === DeviceStatus.On) {
    await closeLocalCamera();
  } else {
    await openLocalCamera();
  }
}

</script>

<style lang="scss" scoped>
.camera-button {
  cursor: pointer;
  position: relative;

  .disabled {
    cursor: not-allowed;
    opacity: 0.4;
  }

  .unsupport-icon {
    position: absolute;
    right: 0;
    bottom: 0;
  }
}
</style>
