<template>
  <button
    :class="$style['scroll-to-bottom__button']"
    @click="emits('click')"
  >
    <IconArrowStrokeSelectDown
      :customClass="$style['scroll-to-bottom__button--icon']"
      :size="18"
    />
  </button>
</template>

<script setup lang="ts">
import { IconArrowStrokeSelectDown } from '@tencentcloud/uikit-base-component-vue3';

const emits = defineEmits(['click']);
</script>

<style lang="scss" module>
.scroll-to-bottom__button {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  padding: 0;

  box-shadow:
    0 12px 26px 0 var(--shadow-color),
    0 8px 12px 0 var(--shadow-color);
  background: var(--dropdown-color-default);

  &:hover {
    background: var(--dropdown-color-hover);
  }

  &:active {
    background: get(dropdown-color-active);
    box-shadow: none;
  }

  &--icon {
    color: var(--text-color-link);
  }
}
</style>
