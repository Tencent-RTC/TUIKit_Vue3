<script setup lang="ts">
import { VideoCallPicker } from '@tencentcloud/chat-uikit-vue3';
import { Video } from 'lucide-vue-next';
</script>

<template>
  <VideoCallPicker>
    <span class="medical-picker-icon"><Video :size="18" /></span>
  </VideoCallPicker>
</template>

<style scoped>
.medical-picker-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #0ABF77;
}
.medical-picker-icon:hover {
  background-color: var(--button-color-secondary-hover);
}
</style>
