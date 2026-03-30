<template>
  <button
    class="toolbar-quick-entry"
    :title="t('chatToolbar.quickCall')"
    @click="handleClick"
  >
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="toolbar-icon">
      <path
        d="M20.5 15.28c-1.16 0-2.28-.18-3.33-.52a1.05 1.05 0 0 0-1.08.25l-1.48 1.87a14.07 14.07 0 0 1-6.05-6.05l1.87-1.5a1.05 1.05 0 0 0 .25-1.08c-.34-1.05-.52-2.17-.52-3.33A1.05 1.05 0 0 0 9.11 4H6a1.05 1.05 0 0 0-1.05 1.05c0 8.5 6.9 15.4 15.4 15.4A1.05 1.05 0 0 0 21.4 19.4v-3.07a1.05 1.05 0 0 0-1.05-1.05z"
        fill="currentColor"
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
