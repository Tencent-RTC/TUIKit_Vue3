<template>
  <live-core-view :ignore-local-video="true">
    <template #localVideo="{ style }">
      <local-mixer :style="style" />
    </template>
  </live-core-view>
</template>

<script setup lang="ts">
import { LiveCoreView } from '../LiveView';
import LocalMixer from './LocalMixer/index.vue';
</script>

<style scoped lang="scss"></style>
