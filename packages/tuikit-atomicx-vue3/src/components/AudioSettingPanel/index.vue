<template>
  <div class="audio-setting-panel">
    <div class="section">
      <div class="section-title">
        {{ t('Microphone') }}
      </div>
      <div class="row">
        <span class="label">{{ t('Select device') }}</span>
        <TUISelect
          v-model="currentMicrophoneId"
          class="select"
        >
          <TUIOption
            v-for="item in microphoneList"
            :key="item.deviceId"
            :label="item.deviceName"
            :value="item.deviceId"
          />
        </TUISelect>
      </div>
      <div class="row">
        <span class="label">{{ t('Input volume') }}</span>
        <TUISlider
          v-model="captureVolumeValue"
          :min="0"
          :max="100"
        />
        <span class="volume-value">{{ captureVolume }}</span>
      </div>
    </div>

    <div class="divider" />

    <div class="section">
      <div class="section-title">
        {{ t('Speaker') }}
      </div>
      <div class="row">
        <span class="label">{{ t('Select device') }}</span>
        <TUISelect
          v-model="currentSpeakerId"
          class="select"
        >
          <TUIOption
            v-for="item in speakerList"
            :key="item.deviceId"
            :label="item.deviceName"
            :value="item.deviceId"
          />
        </TUISelect>
      </div>

      <div class="row">
        <span class="label">{{ t('Output volume') }}</span>
        <TUISlider
          v-model="outputVolumeValue"
          :min="0"
          :max="100"
        />
        <span class="volume-value">{{ outputVolume }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { TUISelect, TUIOption, TUISlider, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useDeviceState } from '../../states/DeviceState';

const { t } = useUIKit();

const {
  microphoneList,
  currentMicrophone,
  setCurrentMicrophone,
  speakerList,
  currentSpeaker,
  setCurrentSpeaker,
  getMicrophoneList,
  getSpeakerList,
  captureVolume,
  outputVolume,
  setCaptureVolume,
  setOutputVolume,
} = useDeviceState();

const currentMicrophoneId = ref('');
const currentSpeakerId = ref('');

const captureVolumeValue = ref(captureVolume.value);
const outputVolumeValue = ref(outputVolume.value);

onMounted(async () => {
  await getMicrophoneList();
  await getSpeakerList();
  if (currentMicrophone.value) {
    currentMicrophoneId.value = currentMicrophone.value.deviceId;
  }
  if (currentSpeaker.value) {
    currentSpeakerId.value = currentSpeaker.value.deviceId;
  }
});
watch(currentMicrophone, (value) => {
  if (value && value.deviceId !== currentMicrophoneId.value) {
    currentMicrophoneId.value = value.deviceId;
  }
});

watch(currentSpeaker, (value) => {
  if (value && value.deviceId !== currentSpeakerId.value) {
    currentSpeakerId.value = value.deviceId;
  }
});

watch(captureVolumeValue, async (value) => {
  await setCaptureVolume(value);
});

watch(outputVolumeValue, async (value) => {
  await setOutputVolume(value);
});

watch(currentMicrophoneId, (id) => {
  setCurrentMicrophone({ deviceId: id });
});
watch(currentSpeakerId, (id) => {
  setCurrentSpeaker({ deviceId: id });
});
</script>

<style scoped lang="scss">
.audio-setting-panel {
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

      .volume-value {
        margin-left: 12px;
      }
    }
  }

  .divider {
    height: 1px;
    background: var(--uikit-color-gray-4);
    margin: 32px 0;
  }

  .select {
    width: 300px;
  }

  input[type='range'] {
    margin: 0 16px;
    flex: 1;
  }

  .icon-tip {
    display: inline-block;
    margin-left: 4px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #444;
    text-align: center;
    font-size: 12px;
    line-height: 16px;
    cursor: pointer;
  }
}
</style>
