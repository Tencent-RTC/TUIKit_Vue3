<script setup lang="ts">
import { AudioCallPicker } from '@tencentcloud/chat-uikit-vue3';
import { Phone } from 'lucide-vue-next';
// Aegis data reporting (remove for GitHub demo)
import { reportEvent } from '@/utils/aegis';
</script>

<template>
  <AudioCallPicker>
    <!-- Report medical picker click event (remove for GitHub demo) -->
    <span class="medical-picker-icon" @click="reportEvent('medical_picker_click', 'audio_call')"><Phone :size="18" /></span>
  </AudioCallPicker>
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
