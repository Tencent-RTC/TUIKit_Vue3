<template>
  <button
    class="toolbar-quick-entry"
    :title="t('chatToolbar.quickRoom')"
    @click="handleClick"
  >
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="toolbar-icon">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" stroke-width="1.5" fill="none" />
      <circle cx="8" cy="10" r="2" fill="currentColor" />
      <circle cx="16" cy="10" r="2" fill="currentColor" />
      <circle cx="12" cy="10" r="2.5" fill="currentColor" />
      <path
        d="M6 16c0-1.5 2.5-2.5 6-2.5s6 1 6 2.5"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        fill="none"
      />
    </svg>
  </button>
</template>

<script setup lang="ts">
import { useUIKit } from '@tencentcloud/chat-uikit-vue3';

const { t } = useUIKit();

const emit = defineEmits<{
  (e: 'click'): void;
}>();

const handleClick = () => {
  emit('click');
};
</script>

<style lang="scss" scoped>
.toolbar-quick-entry {
  padding: 4px 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
  outline: none;
  color: var(--text-color-primary);

  &:focus {
    outline: none;
  }

  &:hover {
    background-color: var(--button-color-secondary-hover);
  }

  &:active {
    background-color: var(--button-color-secondary-active);
  }
}

.toolbar-icon {
  width: 20px;
  height: 20px;
}
</style>
