<script setup lang="ts">
import { AudioCallPicker } from '@tencentcloud/chat-uikit-vue3';
import { Phone } from 'lucide-vue-next';
</script>

<template>
  <AudioCallPicker>
    <!-- Report medical picker click event (remove for GitHub demo) -->
    <span class="medical-picker-icon"><Phone :size="18" /></span>
  </AudioCallPicker>
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
