<template>
  <div class="audio-setting-tab">
    <div class="item-setting">
      <span class="title">{{ t('AudioSettingPanel.Microphone') }}</span>
      <div class="flex">
        <microphone-select
          class="select"
          :auto-refresh="!manageMicrophoneDevice"
        />
        <TUIButton v-if="micTestVisible" @click="handleMicrophoneTest">
          {{ isMicrophoneTesting ? t('AudioSettingPanel.Stop') : t('AudioSettingPanel.Test') }}
        </TUIButton>
      </div>
      <p v-if="testFailureGuidanceVisible && microphoneTestFailureGuidanceKey" class="test-failure-guidance">
        {{ t(microphoneTestFailureGuidanceKey) }}
      </p>
    </div>
    <div v-if="inputVolumeLevelVisible" class="item-setting">
      <span class="title">{{ t('AudioSettingPanel.InputLevel') }}</span>
      <div class="mic-bar-container">
        <div
          v-for="(item, index) in new Array(volumeTotalNum).fill('')"
          :key="index"
          :class="[
            'mic-bar',
            `${showInputVolume && volumeNum > index ? 'active' : ''}`,
          ]"
        />
      </div>
    </div>
    <div v-if="inputVolumeVisible" class="item-setting">
      <span class="title">{{ t('AudioSettingPanel.InputVolume') }}</span>
      <div class="flex">
        <TUISlider
          v-model="captureVolumeValue"
          class="custom-slider"
          :min="0"
          :max="100"
        />
        <span class="volume-value">{{ captureVolume }}</span>
      </div>
    </div>
    <div class="item-setting">
      <span class="title">{{ t('AudioSettingPanel.Speaker') }}</span>
      <div class="flex">
        <speaker-select
          class="select"
          :disabled="speakerTestVisible"
        />
        <TUIButton v-if="speakerTestVisible" @click="handleSpeakerTest">
          {{ isSpeakerTesting ? t('AudioSettingPanel.Stop') : t('AudioSettingPanel.Test') }}
        </TUIButton>
      </div>
      <p v-if="testFailureGuidanceVisible && speakerTestFailureGuidanceKey" class="test-failure-guidance">
        {{ t(speakerTestFailureGuidanceKey) }}
      </p>
    </div>
    <div v-if="outputVolumeVisible" class="item-setting">
      <span class="title">{{ t('AudioSettingPanel.OutputVolume') }}</span>
      <div class="flex">
        <TUISlider
          v-model="outputVolumeValue"
          class="custom-slider"
          :min="0"
          :max="100"
        />
        <span class="volume-value">{{ outputVolume }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onUnmounted } from 'vue';
import { useUIKit, TUIButton, TUISlider } from '@tencentcloud/uikit-base-component-vue3';
import { useDeviceState } from '../../states/DeviceState';
import { DeviceError } from '../../types/device';
import MicrophoneSelect from './MicrophoneSelect.vue';
import SpeakerSelect from './SpeakerSelect.vue';
import {
  getMicrophoneTestFailureGuidanceKey,
  getSpeakerTestFailureGuidanceKey,
} from './audioTestGuidance';
import {
  type MicrophonePermissionState,
  syncMicrophoneDeviceSelection,
} from './audioDeviceSelectionRecovery';

const { t } = useUIKit();

const props = defineProps({
  micTestVisible: {
    type: Boolean,
    default: true,
  },
  inputVolumeLevelVisible: {
    type: Boolean,
    default: true,
  },
  inputVolumeVisible: {
    type: Boolean,
    default: true,
  },
  speakerTestVisible: {
    type: Boolean,
    default: true,
  },
  outputVolumeVisible: {
    type: Boolean,
    default: true,
  },
  testFailureGuidanceVisible: {
    type: Boolean,
    default: false,
  },
  manageMicrophoneDevice: {
    type: Boolean,
    default: false,
  },
  microphoneDeviceSyncActive: {
    type: Boolean,
    default: false,
  },
});

const {
  captureVolume,
  currentMicVolume,
  testingMicVolume,
  outputVolume,
  microphoneLastError,
  microphoneList,
  currentMicrophone,
  getMicrophoneList,
  setCurrentMicrophone,
  setCaptureVolume,
  setOutputVolume,
  isMicrophoneTesting,
  isSpeakerTesting,
  startMicrophoneTest,
  stopMicrophoneTest,
  startSpeakerTest,
  stopSpeakerTest,
} = useDeviceState();

const microphoneTestFailureGuidanceKey = ref<string | null>(null);
const speakerTestFailureGuidanceKey = ref<string | null>(null);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let microphonePermissionStatus: any = null;
let microphoneSyncVersion = 0;
let isUnmounted = false;

const handleMicrophonePermissionChange = () => {
  if (props.manageMicrophoneDevice && props.microphoneDeviceSyncActive) {
    void syncMicrophoneDevice();
  }
};

async function queryMicrophonePermission(isActive: () => boolean): Promise<MicrophonePermissionState> {
  // Some TypeScript DOM libraries do not include the microphone permission name.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const permissions: any = typeof navigator === 'undefined' ? null : navigator.permissions;
  if (!permissions?.query) {
    return 'unsupported';
  }
  try {
    const status = await permissions.query({ name: 'microphone' });
    if (!isActive()) {
      return status.state;
    }
    if (microphonePermissionStatus !== status) {
      microphonePermissionStatus?.removeEventListener('change', handleMicrophonePermissionChange);
      microphonePermissionStatus = status;
      microphonePermissionStatus.addEventListener('change', handleMicrophonePermissionChange);
    }
    return status.state;
  } catch {
    return 'unsupported';
  }
}

function stopObservingMicrophonePermission() {
  microphonePermissionStatus?.removeEventListener('change', handleMicrophonePermissionChange);
  microphonePermissionStatus = null;
}

async function syncMicrophoneDevice(): Promise<boolean> {
  const syncVersion = ++microphoneSyncVersion;
  const isActive = () => !isUnmounted && syncVersion === microphoneSyncVersion;
  const permission = await queryMicrophonePermission(isActive);
  if (!isActive()) {
    return false;
  }
  microphoneTestFailureGuidanceKey.value = null;
  const result = await syncMicrophoneDeviceSelection({
    permission,
    refreshDevices: getMicrophoneList,
    getCurrentDeviceId: () => currentMicrophone.value?.deviceId,
    getDevices: () => microphoneList.value,
    selectDevice: deviceId => setCurrentMicrophone({ deviceId }),
    isActive,
  });
  if (!isActive() || (!result.success && result.reason === 'cancelled')) {
    return false;
  }
  if (!result.success) {
    let error = microphoneLastError.value;
    if (result.reason === 'permission-denied') {
      error = DeviceError.NoSystemPermission;
    } else if (result.reason === 'no-device') {
      error = DeviceError.NoDeviceDetected;
    } else if (error === DeviceError.NoError) {
      error = DeviceError.UnknownError;
    }
    microphoneTestFailureGuidanceKey.value = getMicrophoneTestFailureGuidanceKey(error);
    return false;
  }
  return true;
}

async function handleMicrophoneTest() {
  if (isMicrophoneTesting.value) {
    await stopMicrophoneTest();
    return;
  }
  try {
    if (props.manageMicrophoneDevice && !(await syncMicrophoneDevice())) {
      return;
    }
    await startMicrophoneTest({ interval: 200 });
  } catch (error) {
    console.warn('Failed to start microphone test:', error);
    microphoneTestFailureGuidanceKey.value = getMicrophoneTestFailureGuidanceKey(
      microphoneLastError.value === DeviceError.NoError
        ? DeviceError.UnknownError
        : microphoneLastError.value,
    );
  }
}

async function handleSpeakerTest() {
  const SPEAKER_TEST_URL
    = 'https://web.sdk.qcloud.com/trtc/electron/download/resources/media/TestSpeaker.mp3';
  if (isSpeakerTesting.value) {
    await stopSpeakerTest();
    return;
  }
  speakerTestFailureGuidanceKey.value = null;
  try {
    await startSpeakerTest({ filePath: SPEAKER_TEST_URL });
  } catch (error) {
    console.warn('Failed to start speaker test:', error);
    speakerTestFailureGuidanceKey.value = getSpeakerTestFailureGuidanceKey();
  }
}

watch(
  () => props.microphoneDeviceSyncActive,
  (active) => {
    if (props.manageMicrophoneDevice && active) {
      void syncMicrophoneDevice();
      return;
    }
    if (!active) {
      microphoneSyncVersion += 1;
      stopObservingMicrophonePermission();
    }
  },
  { immediate: true },
);

const volumeTotalNum = ref(28);

const volumeNum = computed(() => {
  if (isMicrophoneTesting.value) {
    return (testingMicVolume.value * volumeTotalNum.value) / 100;
  }
  return (currentMicVolume.value * volumeTotalNum.value) / 100;
});

const showInputVolume = computed(() => {
  if (props.micTestVisible) {
    return isMicrophoneTesting.value;
  }
  return true;
});

const captureVolumeValue = ref(captureVolume.value);
const outputVolumeValue = ref(outputVolume.value);

watch(captureVolumeValue, async (value) => {
  await setCaptureVolume(value);
});

watch(outputVolumeValue, async (value) => {
  await setOutputVolume(value);
});

onUnmounted(() => {
  isUnmounted = true;
  microphoneSyncVersion += 1;
  stopObservingMicrophonePermission();
  if (isMicrophoneTesting.value) {
    stopMicrophoneTest();
  }
  if (isSpeakerTesting.value) {
    stopSpeakerTest();
  }
});
</script>

<style lang="scss" scoped>
.audio-setting-tab {
  width: 100%;
  font-size: 14px;
  border-radius: 4px;
  text-align: initial;

  .item-setting {
    width: 100%;

    &:not(:last-child) {
      margin-bottom: 20px;
    }
  }

  .flex {
    display: flex;
    align-items: center;
    width: 100%;
    gap: 10px;
  }

  .select {
    flex: 1;
  }

  .test-failure-guidance {
    margin: 8px 0 0;
    color: var(--text-color-secondary);
    font-size: 12px;
    line-height: 20px;
  }

  .title {
    display: inline-block;
    width: 100%;
    margin-bottom: 8px;
    font-size: 14px;
    font-weight: 400;
    line-height: 22px;
    color: var(--text-color-secondary);
  }

  .custom-slider {
    flex: 1;
  }

  .volume-value {
    margin-left: 6px;
  }

  .mic-bar-container {
    display: flex;
    justify-content: space-between;

    .mic-bar {
      width: 3px;
      height: 6px;
      background-color: var(--text-color-secondary);

      &.active {
        background-color: var(--text-color-link);
      }
    }
  }

}
</style>
