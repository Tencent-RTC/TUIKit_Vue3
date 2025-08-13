<!-- eslint-disable import/extensions -->
<template>
  <div
    :class="[$style.SearchBar, isHasBack && $style['SearchBar--h5'], className]"
    :style="style"
  >
    <div
      v-if="isHasBack"
      :class="$style['SearchBar__left']"
      @click="handleClear"
    >
      <IconBack :size="24" />
    </div>
    <TUIInput
      v-model="inputValue"
      :placeholder="placeholder || searchPlaceholderMap[variant || VariantType.STANDARD]"
      @input="handleInput"
      @focus="handleFocus"
      @blur="handleBlur"
      @done="handleDone"
    >
      <template #prefix>
        <component
          :is="SearchIcon"
          v-if="SearchIcon"
        />
        <IconSearch v-else />
      </template>
      <template #suffix>
        <div
          v-if="!isHasBack && inputValue"
          :class="$style['SearchBar__actions']"
        >
          <div
            :class="$style['SearchBar__clear-icon']"
            @click="handleClear"
          >
            <component
              :is="ClearIcon"
              v-if="ClearIcon"
            />
            <IconCloseInput
              v-else
              class="clearIcon"
            />
          </div>
        </div>
      </template>
    </TUIInput>
    <div
      v-if="isHasBack"
      :class="$style['SearchBar__right']"
      @click="handleClear"
    >
      <IconBack :size="24" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, defineProps, withDefaults, watch } from 'vue';
import { IconBack, IconCloseInput, IconSearch, TUIInput, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { VariantType } from '../../../types/search';
import { isH5 } from '../../../utils/env';
import type { SearchBarProps } from '../../../types/search';

const props = withDefaults(defineProps<SearchBarProps>(), {
  value: '',
  className: '',
  style: () => ({}),
  autoFocus: false,
  variant: VariantType.STANDARD,
});

const inputValue = ref(props.value);

// 监听 value 变化，同步到 inputValue
watch(
  () => props.value,
  (newValue) => {
    inputValue.value = newValue || '';
  },
);

const { t } = useUIKit();

const isHasBack = computed(() => props.variant !== VariantType.MINI && props.variant !== VariantType.EXACT && isH5);

// 替换 searchPlaceholderMap 里的 t('xxx') 为 t('xxx')
const searchPlaceholderMap = {
  [VariantType.EXACT]: t('Search.action.search'),
  [VariantType.STANDARD]: t('Search.action.search'),
  [VariantType.MINI]: t('Search.action.search'),
  [VariantType.EMBEDDED]: t('Search.results.title'),
};

const handleInput = (value: string | number) => {
  const stringValue = String(value);
  // 创建一个模拟的 Event 对象
  const event = {
    target: { value: stringValue },
  } as unknown as Event;
  props.onChange?.(event);
};

const handleFocus = (e: FocusEvent) => {
  props.onFocus?.(e);
};

const handleBlur = (e: FocusEvent) => {
  props.onBlur?.(e);
};

const handleDone = (element: HTMLInputElement | null) => {
  // 当用户按下回车键时触发
  if (element) {
    const event = new KeyboardEvent('keydown', { key: 'Enter' });
    props.onKeyDown?.(event);
  }
};

const handleClear = () => {
  inputValue.value = '';
  props.onClear?.();
};
</script>

<style lang="scss" module>
@import './SearchBar.scss';
</style>
