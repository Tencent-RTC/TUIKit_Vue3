<template>
  <div
    v-click-outside="handleHideAudioSettingTab"
    class="audio-control-container"
  >
    <icon-button
      :title="t('Mic')"
      :has-more="
        audioSettingProps?.displayMode === MediaSettingDisplayMode.IconWithPanel
      "
      :is-not-support="microphoneLastError !== DeviceError.NoError"
      @click-icon="handleClickIcon"
      @click-more="handleMore"
    >
      <audio-icon
        :audio-volume="captureVolume"
        :is-muted="isMuted"
      />
    </icon-button>
    <audio-setting-tab
      v-show="showAudioSettingTab"
      class="audio-tab"
      :audio-volume="captureVolume"
    />
  </div>
</template>

<script setup lang="ts">
import type { Ref } from 'vue';
import { ref, defineEmits, computed, inject } from 'vue';
import AudioIcon from '../../baseComp/AudioIcon.vue';
import IconButton from '../../baseComp/IconButton.vue';
import vClickOutside from '../../directives/vClickOutside';
import { useI18n } from '../../locales';
import { useDeviceState } from '../../states/DeviceState';
import { useRoomState } from '../../states/RoomState';
import { DeviceStatus, DeviceError, MediaSettingDisplayMode } from '../../types';
import AudioSettingTab from './AudioSettingTab.vue';
import type { AudioSettingProps } from '../../types';

const audioSettingProps: AudioSettingProps | undefined
  = inject('audioSettingProps');

const { currentRoom } = useRoomState();
const {
  captureVolume,
  microphoneStatus,
  microphoneLastError,
  isMicrophoneTesting,
  openLocalMicrophone,
  muteLocalAudio,
  unmuteLocalAudio,
  startMicrophoneTest,
  stopMicrophoneTest,
} = useDeviceState();

const emits = defineEmits(['click-icon']);

const showAudioSettingTab: Ref<boolean> = ref(false);
const { t } = useI18n();

const isMuted = computed(() => {
  if (!currentRoom?.value) {
    return !isMicrophoneTesting.value;
  }
  return microphoneStatus.value !== DeviceStatus.On;
});

async function handleClickIcon() {
  showAudioSettingTab.value = false;
  emits('click-icon');
  if (!currentRoom.value) {
    if (isMicrophoneTesting.value) {
      await stopMicrophoneTest();
    } else {
      await startMicrophoneTest({ interval: 200 });
    }
    return;
  }
  if (microphoneStatus.value === DeviceStatus.On) {
    await muteLocalAudio();
  } else {
    await openLocalMicrophone();
    await unmuteLocalAudio();
  }
}

function handleMore() {
  showAudioSettingTab.value = !showAudioSettingTab.value;
}

function handleHideAudioSettingTab() {
  if (showAudioSettingTab.value) {
    showAudioSettingTab.value = false;
  }
}
</script>

<style lang="scss" scoped>
$audio-tab-width: 305px;

.audio-control-container {
  position: relative;
  display: flex;

  .audio-tab {
    position: absolute;
    bottom: calc(100% + 12px);
    left: -5px;
    width: $audio-tab-width;
    padding: 20px 20px 24px;
    background-color: var(--bg-color-dialog);
    border-radius: 8px;
    box-shadow:
      0 2px 4px -3px var(--uikit-color-black-8),
      0 6px 10px 1px var(--uikit-color-black-8),
      0 3px 14px 2px var(--uikit-color-black-8);

    &::before {
      position: absolute;
      bottom: -10px;
      left: 28px;
      content: '';
      border-top: 5px solid var(--bg-color-dialog);
      border-right: 5px solid transparent;
      border-bottom: 5px solid transparent;
      border-left: 5px solid transparent;
    }
  }
}
</style>
