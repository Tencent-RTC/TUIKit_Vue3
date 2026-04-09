<script setup lang="ts">
import { FilePicker } from '@tencentcloud/chat-uikit-vue3';
import { File } from 'lucide-vue-next';
</script>

<template>
  <FilePicker>
    <span class="medical-picker-icon"><File :size="18" /></span>
  </FilePicker>
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
