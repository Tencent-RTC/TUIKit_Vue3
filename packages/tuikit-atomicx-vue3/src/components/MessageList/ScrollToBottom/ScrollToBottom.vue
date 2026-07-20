<template>
  <div :class="$style['scroll-to-bottom']">
    <button
      :class="$style['scroll-to-bottom__button']"
      @click="emits('click')"
    >
      <IconArrowStrokeSelectDown
        :customClass="$style['scroll-to-bottom__button--icon']"
        :size="18"
      />
    </button>
    <span
      v-if="unreadCount > 0"
      :class="$style['scroll-to-bottom__badge']"
    >
      {{ unreadCount > 99 ? '99+' : unreadCount }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { IconArrowStrokeSelectDown } from '@tencentcloud/uikit-base-component-vue3';

interface Props {
  /** Unread message count shown as a badge on the top-right corner of the button */
  unreadCount?: number;
}

withDefaults(defineProps<Props>(), {
  unreadCount: 0,
});

const emits = defineEmits(['click']);
</script>

<style lang="scss" module>
.scroll-to-bottom {
  position: relative;
  display: inline-flex;
}

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
    background: var(--dropdown-color-active);
    box-shadow: none;
  }

  &--icon {
    color: var(--text-color-link);
  }
}

.scroll-to-bottom__badge {
  position: absolute;
  top: 0;
  left: 0;
  transform: translate(-20%, -20%);
  min-width: 16px;
  height: 16px;
  padding: 0 3px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--text-color-link);
  color: var(--bg-color-topbar);
  pointer-events: none;
}
</style>
