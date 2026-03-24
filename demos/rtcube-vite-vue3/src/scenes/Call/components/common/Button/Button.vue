<template>
  <button
    :disabled="disabled"
    :style="[ButtonStyle]"
    :class="['custom-button', ButtonClassName]"
    @click="handleClick"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { isH5, classNames } from '../../../utils';
import { ButtonProps } from './Button';

const props = defineProps(ButtonProps);

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void;
}>();

const ButtonClassName = classNames([
  { h5: isH5 },
  { pc: !isH5 },
])

const ButtonStyle = computed(() => ({
  width: props.width ? props.width + 'px' : undefined,
  height: props.height ? props.height + 'px' : undefined,
  backgroundColor: props.color || undefined,
}));

const handleClick = (event: MouseEvent) => {
  if (!props.disabled) {
    emit('click', event);
  }
};
</script>

<style lang="scss" scoped>
.custom-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  transition: opacity 0.2s;

  &:hover:not(:disabled) {
    opacity: 0.85;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
}

.pc {
  border-radius: 27px;
  font-weight: 500;
  color: #FFFFFF;
}

.h5 {
  border-radius: 10px;
  font-weight: 500;
  font-size: 16px;
  color: #FFFFFF;
}
</style>
