<script setup lang="ts">
import { Smile } from 'lucide-vue-next';
import { EmojiPicker } from '@tencentcloud/chat-uikit-vue3';
</script>

<template>
  <EmojiPicker>
    <!-- Report medical picker click event (remove for GitHub demo) -->
    <span class="medical-picker-icon"><Smile :size="18" /></span>
  </EmojiPicker>
</template>

<style scoped>
.medical-picker-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #0ABF77;
}
</style>
