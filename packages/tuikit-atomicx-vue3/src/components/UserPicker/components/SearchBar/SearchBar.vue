<template>
  <div :class="$style['search__bar']">
    <div :class="$style['search__input-wrapper']">
      <IconSearch name="search" :class="$style.search__icon" />
      <input
        type="text"
        :class="$style.search__input"
        :placeholder="placeholder"
        :value="value"
        @input="handleChange"
      />
      <IconClose v-if="value" name="close" :class="$style['search__clear-icon']" size="12px" @click="handleClear" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineProps } from 'vue';
import { TUIInput, IconSearch, IconClose } from '@tencentcloud/uikit-base-component-vue3';

interface SearchBarProps {
  placeholder?: string;
  onSearch: (value: string) => void;
}

const props = defineProps<SearchBarProps>();

const value = ref<string>('');

const handleChange = (e: any) => {
  console.log('handleChange', e);
  const target = e.target as HTMLInputElement;
  const newValue = target.value;
  value.value = newValue;
  props.onSearch(newValue);
};

const handleClear = () => {
  value.value = '';
  props.onSearch('');
};
</script>

<style module lang="scss">
.search {
  &__bar {
    padding: 8px 0;
  }

  &__input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    border-radius: 16px;
    padding: 0 12px;
    height: 32px;
    transition: background-color 0.3s;

    background-color: var(--bg-color-input);
  }

  &__icon {
    display: flex;
    align-items: center;
    margin-right: 8px;

    color: var(--text-color-secondary);
  }

  &__input {
    flex: 1;
    border: none;
    background: transparent;
    font-size: 14px;
    outline: none;

    color: var(--text-color-primary);

    &::placeholder {
      color: var(--text-color-secondary);
    }
  }

  &__clear-icon {
    display: flex;
    align-items: center;
    cursor: pointer;
    padding: 2px;

    color: var(--text-color-primary);

    &:hover {
      color: var(--text-color-secondary);
    }
  }
}
</style>
