<template>
  <div class="mic-button-container">
    <div class="mic-button" :class="{ 'disabled': !hasPublishAudioPermission }" @click="handleClick">
      <audio-icon
        :audio-volume="currentMicVolume"
        :is-muted="isMuted"
        :is-disabled="!hasPublishAudioPermission"
      />
      <IconUnSupport v-if="microphoneLastError !== DeviceError.NoError" class="unsupport-icon" size="14" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { IconUnSupport } from '@tencentcloud/uikit-base-component-vue3';
import { useDeviceState } from '../../states/DeviceState';
import { DeviceStatus, DeviceError } from '../../types';
import AudioIcon from './AudioIcon.vue';

const {
  currentMicVolume,
  hasPublishAudioPermission,
  microphoneStatus,
  microphoneLastError,
  muteLocalAudio,
  openLocalMicrophone,
  unmuteLocalAudio,
} = useDeviceState();

const isMuted = computed(() => {
  return microphoneStatus.value !== DeviceStatus.On;
});

async function handleClick() {
  if (!hasPublishAudioPermission.value) {
    return;
  }
  if (microphoneStatus.value === DeviceStatus.On) {
    await muteLocalAudio();
  } else {
    await openLocalMicrophone();
    await unmuteLocalAudio();
  }
}

</script>

<style scoped lang="scss">
.mic-button-container {
  display: flex;
  align-items: center;
  .mic-button {
    position: relative;

    .unsupport-icon {
      position: absolute;
      right: 0;
      bottom: 0;
    }
  }
}
</style>
