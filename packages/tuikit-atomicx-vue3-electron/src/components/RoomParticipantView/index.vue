<template>
  <div class="atomicx-participant-view">
    <stream-play
      :participant="participant"
      :stream-type="streamType"
      :fill-mode="fillMode"
      :lazy-load="lazyLoad"
      :on-stream-loading="onStreamLoading"
      :on-stream-playing="onStreamPlaying"
      :on-stream-error="onStreamError"
    />
    <slot name="participantViewUI" />
  </div>
</template>

<script setup lang="ts">
import StreamPlay from './StreamPlay.vue';
import type { RoomParticipant, VideoStreamType, FillMode } from '../../types';

interface Props {
  participant: RoomParticipant;
  streamType: VideoStreamType;
  fillMode?: FillMode;
  lazyLoad?: {
    enable: boolean;
    viewport?: string | HTMLDivElement;
  };
  onStreamLoading?: () => void;
  onStreamPlaying?: () => void;
  onStreamError?: (error: any) => void;
}

defineProps<Props>();
</script>

<style scoped>
.atomicx-participant-view {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  transform: translateZ(0);
  will-change: transform;
}
</style>
