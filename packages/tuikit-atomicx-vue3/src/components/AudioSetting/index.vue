<template>
  <div>
    <audio-media-control
      v-if="
        displayMode === MediaSettingDisplayMode.Icon ||
          displayMode === MediaSettingDisplayMode.IconWithPanel
      "
      @click-icon="handleAudioMediaClick"
    />
    <audio-setting-tab v-if="displayMode === MediaSettingDisplayMode.Panel" />
  </div>
</template>

<script setup lang="ts">
import { withDefaults, defineProps, reactive, provide, defineEmits } from 'vue';
import { MediaSettingDisplayMode } from '../../types';
import AudioMediaControl from './AudioMediaControl.vue';
import AudioSettingTab from './AudioSettingTab.vue';
import type { AudioSettingProps } from '../../types';

const emits = defineEmits(['click-icon']);
function handleAudioMediaClick() {
  emits('click-icon');
}

const props = withDefaults(defineProps<AudioSettingProps>(), {
  supportSwitchMicrophone: true,
  supportSwitchSpeaker: true,
  supportAudioLevel: true,
});

provide('audioSettingProps', reactive(props));
</script>

<style lang="scss" scoped></style>
