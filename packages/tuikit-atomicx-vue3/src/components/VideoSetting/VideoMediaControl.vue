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
        <IconCameraOn size="24" v-if="isCameraTesting" />
        <IconCameraOff size="24" v-else />
      </template>
      <template v-else>
        <IconCameraOn
          size="24"
          v-if="cameraStatus === DeviceStatus.On"
        />
        <IconCameraOff size="24" v-else />
      </template>
    </icon-button>
    <video-setting-tab v-show="showVideoSettingTab" class="video-tab" />
  </div>
</template>

<script setup lang="ts">
import { ref, Ref, defineEmits, inject } from 'vue';
import {
  IconCameraOn,
  IconCameraOff,
} from '@tencentcloud/uikit-base-component-vue3';
import IconButton from '../../baseComp/IconButton.vue';
import VideoSettingTab from './VideoSettingTab.vue';
import { useI18n } from '../../locales';
import vClickOutside from '../../directives/vClickOutside';
import {
  MediaSettingDisplayMode,
  VideoSettingProps,
} from '../../types';
import useDeviceState from '../../states/DeviceState';
import { DeviceStatus, DeviceError } from '../../types';
import useUserState from '../../states/UserState/index';
import { useRoomState } from '../../states/RoomState';

const videoSettingProps: VideoSettingProps | undefined =
  inject('videoSettingProps');

const emits = defineEmits(['click-icon']);
const { cameraStatus, cameraLastError, isCameraTesting, startCameraDeviceTest, stopCameraDeviceTest, openLocalCamera, closeLocalCamera } = useDeviceState();
const { localUser } = useUserState();
const { currentRoom } = useRoomState();

const { t } = useI18n();
const showVideoSettingTab: Ref<boolean> = ref(false);

async function handleClickIcon() {
  showVideoSettingTab.value = false;
  emits('click-icon');
  if (!currentRoom.value) {
    if (isCameraTesting.value) {
      await stopCameraDeviceTest();
    } else {
      await startCameraDeviceTest({ view: 'video-preview' });
    }
    return;
  }
  if (localUser.value?.cameraStatus === DeviceStatus.On) {
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
