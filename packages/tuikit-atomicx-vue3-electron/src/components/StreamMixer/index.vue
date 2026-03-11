<template>
  <component
    :is="platformComponent"
    v-bind="$attrs"
    @onUserOnSeatInfoChanged="(data: Array<TUIUserOnSeatInfo>) => emit('onUserOnSeatInfoChanged', data)"
    @onStreamLayoutChanged="(data: TRTCStreamLayout) => emit('onStreamLayoutChanged', data)"
    @onStreamLayoutAreaChanged="(data: StreamLayoutArea) => emit('onStreamLayoutAreaChanged', data)"
  />
</template>

<script setup lang="ts">
import { isWindows } from '../../utils/environment';
import MacStreamMixer from './MacStreamMixer.vue';
import WinStreamMixer from './WinStreamMixer.vue';
import type { TUIUserOnSeatInfo } from './type';
import type { TRTCStreamLayout } from 'trtc-electron-sdk';

type StreamLayoutArea = {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
};

defineOptions({
  inheritAttrs: false,
});

const emit = defineEmits<{
  (e: 'onUserOnSeatInfoChanged', data: Array<TUIUserOnSeatInfo>): void;
  (e: 'onStreamLayoutChanged', data: TRTCStreamLayout): void;
  (e: 'onStreamLayoutAreaChanged', data: StreamLayoutArea): void;
}>();

// Platform-based component selection: Windows -> WinStreamMixer, macOS -> MacStreamMixer
const platformComponent = isWindows ? WinStreamMixer : MacStreamMixer;
</script>
