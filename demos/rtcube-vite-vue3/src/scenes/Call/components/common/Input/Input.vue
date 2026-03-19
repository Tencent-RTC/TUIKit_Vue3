<template>
  <div :class="['custom-input', { 'has-prepend': hasPrepend, 'has-append': hasAppend }]">
    <div v-if="hasPrepend" class="input-prepend">
      <slot name="prepend" />
    </div>
    <input
      ref="inputRef"
      class="input-inner"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :type="type"
      @input="handleInput"
      @keyup.enter="handleEnter"
    />
    <div v-if="hasAppend" class="input-append">
      <slot name="append" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, useSlots } from 'vue';

interface Props {
  modelValue?: string;
  placeholder?: string;
  disabled?: boolean;
  type?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: '',
  disabled: false,
  type: 'text',
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'input', event: Event): void;
  (e: 'keyup', event: KeyboardEvent): void;
}>();

const slots = useSlots();
const inputRef = ref<HTMLInputElement | null>(null);

const hasPrepend = !!slots.prepend;
const hasAppend = !!slots.append;

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', target.value);
  emit('input', event);
};

const handleEnter = (event: KeyboardEvent) => {
  emit('keyup', event);
};

defineExpose({
  focus: () => inputRef.value?.focus(),
  blur: () => inputRef.value?.blur(),
});
</script>

<style lang="scss" scoped>
.custom-input {
  display: flex;
  align-items: center;
  width: 100%;
  height: 48px;
  background: #F0F4FA;
  border-radius: 28px;
  overflow: hidden;
  box-sizing: border-box;

  &.has-prepend {
    .input-prepend {
      display: flex;
      align-items: center;
      padding: 0 12px;
      height: 100%;
      background: #F0F4FA;
      color: #606266;
      font-size: 14px;
      white-space: nowrap;
      border-right: 1px solid #DCDFE6;
    }
  }

  &.has-append {
    .input-append {
      display: flex;
      align-items: center;
      padding: 0 12px;
      height: 100%;
      background: #F0F4FA;
    }
  }

  .input-inner {
    flex: 1;
    height: 100%;
    padding: 0 16px;
    border: none;
    outline: none;
    background: transparent;
    font-size: 14px;
    color: #303133;

    &::placeholder {
      color: #A8ABB2;
    }

    &:disabled {
      cursor: not-allowed;
      color: #C0C4CC;
    }
  }
}
</style>
