<template>
  <div
    v-click-outside="handleHideVideoSettingTab"
    class="video-control-container"
  >
    <icon-button
      :title="t('Camera')"
      :has-more="
        videoSettingProps?.displayMode === MediaSettingDisplayMode.IconWithPanel
      "
      :disabled="cameraStatus === DeviceStatus.OffNeedPermission"
      :is-not-support="
        cameraLastError !== DeviceError.NoError
      "
      @click-icon="handleClickIcon"
      @click-more="handleMore"
    >
      <template v-if="!currentRoom">
        <IconCameraOn v-if="isCameraTesting" size="24" />
        <IconCameraOff v-else size="24" />
      </template>
      <template v-else>
        <IconCameraOn
          v-if="cameraStatus === DeviceStatus.On"
          size="24"
        />
        <IconCameraOff v-else size="24" />
      </template>
    </icon-button>
    <video-setting-tab v-if="showVideoSettingTab" class="video-tab" />
  </div>
</template>

<script setup lang="ts">
import type { Ref } from 'vue';
import { ref, defineEmits, inject } from 'vue';
import {
  IconCameraOn,
  IconCameraOff,
} from '@tencentcloud/uikit-base-component-vue3';
import IconButton from '../../baseComp/IconButton.vue';
import vClickOutside from '../../directives/vClickOutside';
import { useI18n } from '../../locales';
import { useDeviceState } from '../../states/DeviceState';
import { useRoomParticipantState } from '../../states/RoomParticipantState';
import { useRoomState } from '../../states/RoomState';
import {
  MediaSettingDisplayMode,
  DeviceStatus, DeviceError } from '../../types';
import VideoSettingTab from './VideoSettingTab.vue';
import type {
  VideoSettingProps } from '../../types';

const videoSettingProps: VideoSettingProps | undefined
  = inject('videoSettingProps');

const emits = defineEmits(['click-icon']);
const { cameraStatus, cameraLastError, isCameraTesting, startCameraTest, stopCameraTest, openLocalCamera, closeLocalCamera } = useDeviceState();
const { currentRoom } = useRoomState();
const { localParticipant } = useRoomParticipantState();

const { t } = useI18n();
const showVideoSettingTab: Ref<boolean> = ref(false);

async function handleClickIcon() {
  showVideoSettingTab.value = false;
  emits('click-icon');
  if (!currentRoom.value) {
    if (isCameraTesting.value) {
      await stopCameraTest();
    } else {
      await startCameraTest({ view: 'video-preview' });
    }
    return;
  }
  if (localParticipant.value?.cameraStatus === DeviceStatus.On) {
    await closeLocalCamera();
  } else {
    await openLocalCamera();
  }
}

function handleMore() {
  showVideoSettingTab.value = !showVideoSettingTab.value;
}

function handleHideVideoSettingTab() {
  if (showVideoSettingTab.value) {
    showVideoSettingTab.value = false;
  }
}
</script>

<style lang="scss" scoped>
$videoTabWidth: 305px;

.video-control-container {
  position: relative;
  display: flex;

  .video-tab {
    position: absolute;
    bottom: calc(100% + 12px);
    left: -5px;
    width: $videoTabWidth;
    padding: 20px 20px 24px;
    box-shadow:
      0 2px 4px -3px var(--uikit-color-black-8),
      0 6px 10px 1px var(--uikit-color-black-8),
      0 3px 14px 2px var(--uikit-color-black-8);
    border-radius: 8px;
    background-color: var(--bg-color-dialog);

    &::before {
      position: absolute;
      bottom: -10px;
      left: 30px;
      content: '';
      border-right: 5px solid transparent;
      border-bottom: 5px solid transparent;
      border-left: 5px solid transparent;
      border-top: 5px solid var(--bg-color-dialog);
    }
  }
}
</style>
