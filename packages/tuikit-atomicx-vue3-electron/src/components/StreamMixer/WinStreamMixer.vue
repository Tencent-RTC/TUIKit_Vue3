<template>
  <local-mixer
    :windowId="props.windowId"
    @on-user-on-seat-info-changed="(data) => emit('onUserOnSeatInfoChanged', data)"
    @on-stream-layout-changed="(data) => emit('onStreamLayoutChanged', data)"
    @on-stream-layout-area-changed="(data) => emit('onStreamLayoutAreaChanged', data)"
  />
</template>

<script setup lang="ts">
import LocalMixer from './WinLocalMixer.vue';
import type { TUIUserOnSeatInfo } from './type';
import type { TRTCStreamLayout } from 'trtc-electron-sdk';

type Props = {
  windowId: number | Uint8Array | null;
};

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'onUserOnSeatInfoChanged', userOnSeatInfos: Array<TUIUserOnSeatInfo>): void;
  (e: 'onStreamLayoutChanged', streamLayout: TRTCStreamLayout): void;
  (e: 'onStreamLayoutAreaChanged', layoutArea: { left: number; top: number; right: number; bottom: number; width: number; height: number }): void;
}>();
</script>
