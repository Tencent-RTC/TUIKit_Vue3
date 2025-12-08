<template>
  <div
    v-if="leafItems.length > 0"
    :class="$style.selected__panel"
  >
    <div :class="$style.selected__header">
      <span :class="$style.selected__title">{{ t('UserPicker.selected') }}</span>
      <span :class="$style.selected__count">
        {{ leafItems.length }}
        <template v-if="maxCount < InfinityValue"> / {{ maxCount }} </template>
        {{ t('UserPicker.people_unit') }}
      </span>
    </div>
    <div :class="$style.selected__list">
      <div
        v-for="item in leafItems"
        :key="item.key"
        :class="$style.selected__item"
      >
        <div :class="$style['selected__item-content']">
          <Avatar
            :src="item.avatarUrl"
            :class="$style['selected__item-avatar']"
            :size="'sm'"
            :alt="item.label"
          />
          <div :class="$style['selected__item-label']">
            {{ item.label }}
          </div>
        </div>
        <button
          v-if="!lockedKeys.has(item.key)"
          type="button"
          :class="$style['selected__remove-button']"
          aria-label="remove"
          @click="onRemove(item.key)"
        >
          <IconClose
            name="close"
            size="12px"
          />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, computed, withDefaults } from 'vue';
import { IconClose, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { Avatar } from '../../../Avatar';
import type { UserPickerResult } from '../../type';

const { t } = useUIKit();

interface SelectedPanelProps {
  displayMode: 'list' | 'tree';
  selectedItems: UserPickerResult;
  lockedKeys: Set<string>;
  onRemove: (key: string) => void;
  maxCount?: number;
}

const props = withDefaults(defineProps<SelectedPanelProps>(), {
  maxCount: Number.POSITIVE_INFINITY,
});

const leafItems = computed(() => {
  if (props.displayMode === 'list') {
    return props.selectedItems;
  }
  if (props.displayMode === 'tree') {
    return props.selectedItems.filter(item => item.isLeafNode);
  }
  return [];
});

// Make Infinity available in template
const InfinityValue = Number.POSITIVE_INFINITY;
</script>

<style module lang="scss">
@use '../../../../styles/mixins' as mixin;

.selected {
  &__panel {
    margin-top: 8px;
    padding: 8px;

    border-top: 1px solid var(--stroke-color-primary);
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  &__title {
    font-size: 14px;
    font-weight: 500;

    color: var(--text-color-primary);
  }

  &__count {
    font-size: 12px;

    color: var(--text-color-primary);
  }

  &__list {
    display: flex;
    flex-wrap: nowrap;
    overflow-x: auto;
    white-space: nowrap;
    padding-bottom: 4px;
    gap: 8px;

    @include mixin.scrollbar-default();
  }

  &__item {
    display: flex;
    align-items: center;
    border-radius: 18px;
    padding: 4px 8px 4px 4px;
    flex-shrink: 0;
    max-width: none;

    background-color: var(--button-color-secondary-default);
  }

  &__item-content {
    display: flex;
    align-items: center;
    min-width: 0;
    flex: 1;
  }

  &__item-avatar {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    overflow: hidden;
    margin-right: 6px;
    flex-shrink: 0;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__item-label {
    font-size: 12px;
    max-width: 100px;

    @include mixin.text-ellipsis();
  }

  &__remove-button {
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    cursor: pointer;
    padding: 2px;
    margin-left: 4px;
    transition: color 0.3s;

    color: var(--text-color-primary);

    &:hover {
      color: var(--text-color-secondary);
    }
  }
}
</style>
