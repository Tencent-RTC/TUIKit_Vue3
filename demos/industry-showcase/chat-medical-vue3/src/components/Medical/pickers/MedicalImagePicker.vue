<script setup lang="ts">
import { ImagePlus } from 'lucide-vue-next';
import { ImagePicker } from '@tencentcloud/chat-uikit-vue3';
</script>

<template>
  <ImagePicker>
    <span class="medical-picker-icon"><ImagePlus :size="18" /></span>
  </ImagePicker>
</template>

<style scoped>
.medical-picker-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px 6px;
  border-radius: 4px;
  cursor: pointer;
  color: #0ABF77;
}
.medical-picker-icon:hover {
  background-color: var(--button-color-secondary-hover);
}
</style>
