<script setup lang="ts">
import { ref } from 'vue';
import { Zap } from 'lucide-vue-next';
import { Popup as TPopup } from 'tdesign-vue-next';
// Aegis data reporting (remove for GitHub demo)
import { reportEvent } from '@/utils/aegis';
import QuickReplyPanel from './QuickReplyPanel.vue';

const isOpen = ref(false);

const handleClose = () => {
  isOpen.value = false;
};
</script>

<template>
  <TPopup
    v-model:visible="isOpen"
    trigger="click"
    placement="top-left"
    :show-arrow="false"
    :destroy-on-close="true"
  >
    <!-- Report medical picker click event (remove for GitHub demo) -->
    <button class="quick-reply-picker__trigger" title="快捷回复" @click="reportEvent('medical_picker_click', 'quick_reply')">
      <Zap :size="18" />
    </button>
    <template #content>
      <QuickReplyPanel @close="handleClose" />
    </template>
  </TPopup>
</template>

<style scoped>
.quick-reply-picker__trigger {
  padding: 4px 6px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  color: #0ABF77;
}
.quick-reply-picker__trigger:hover {
  background: var(--button-color-secondary-hover);
}
</style>
