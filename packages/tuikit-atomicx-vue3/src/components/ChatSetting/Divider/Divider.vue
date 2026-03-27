<script lang="ts" setup>
interface DividerProps {
  variant: 'line' | 'section';
  fullWidth?: boolean;
}

withDefaults(defineProps<DividerProps>(), {
  variant: 'line',
  fullWidth: false,
});
</script>

<template>
  <div :class="['chat-setting-divider', `chat-setting-divider--${variant}`]">
    <div :class="['chat-setting-divider__inner', { 'chat-setting-divider__inner--full-width': fullWidth }]" />
  </div>
</template>

<style lang="scss" scoped>
.chat-setting-divider {
  width: 100%;
  box-sizing: border-box;

  &__inner {
    width: 100%;
    box-sizing: border-box;
  }

  &--line &__inner {
    height: 0.5px;
    width: calc(100% - 40px);
    margin: 0 20px;
    background-color: var(--stroke-color-secondary);
  }
  &--line &__inner--full-width {
    width: 100%;
    margin: 0;
  }

  &--section &__inner {
    width: 100%;
    background-color: var(--bg-color-topbar);
    height: 10px;
  }
}
</style>
