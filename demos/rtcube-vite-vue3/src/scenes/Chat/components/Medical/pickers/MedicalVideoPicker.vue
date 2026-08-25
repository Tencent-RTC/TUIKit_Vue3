<script setup lang="ts">
import { VideoPicker } from '@tencentcloud/chat-uikit-vue3';
import { SquarePlay } from 'lucide-vue-next';
</script>

<template>
  <VideoPicker>
    <span class="medical-picker-icon"><SquarePlay :size="18" /></span>
  </VideoPicker>
</template>

<style scoped>
.medical-picker-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #0ABF77;
  padding: 4px 6px;
}
.medical-picker-icon:hover {
  background-color: var(--button-color-secondary-hover);
}
</style>
