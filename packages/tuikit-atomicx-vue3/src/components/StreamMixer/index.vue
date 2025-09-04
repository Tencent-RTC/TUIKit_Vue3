<template>
  <live-stream-view :ignore-local-video="true">
    <template #localVideo="{ style }">
      <local-mixer :style="style" />
    </template>
  </live-stream-view>
</template>

<script setup lang="ts">
import LocalMixer from './LocalMixer/index.vue';
import { LiveStreamView } from '../LiveStreamView';
</script>

<style scoped lang="scss"></style>
