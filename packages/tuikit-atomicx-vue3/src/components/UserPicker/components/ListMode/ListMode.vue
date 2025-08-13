<template>
  <div
    v-if="dataSource.length === 0"
    :class="$style.list__empty"
  >
    {{ t('UserPicker.no_data_available') }}
  </div>
  <div
    v-else
    :class="$style.list__container"
    @scroll="handleScroll"
  >
    <div
      v-for="item in dataSource"
      :key="item.key"
    >
      <div
        :class="[
          $style.list__item,
          {
            [$style['list__item--selected']]: isSelected(item.key),
            [$style['list__item--locked']]: isLocked(item.key),
          },
        ]"
        @click="handleItemClick(item.key)"
      >
        <!-- Checkbox -->
        <div :class="$style['list__checkbox-wrapper']">
          <div :class="[$style.list__checkbox, { [$style['list__checkbox--checked']]: isSelected(item.key) }]">
            <IconCheckSm
              v-if="isSelected(item.key)"
              name="check"
            />
          </div>
        </div>

        <!-- Custom render or default render -->
        <template v-if="renderItem">
          <component
            :is="renderItem"
            :item="item"
          />
        </template>
        <div
          v-else
          :class="$style.list__content"
        >
          <Avatar
            :src="item.avatarUrl || ''"
            :class="$style.list__avatar"
            :alt="item.label"
          />
          <span :class="$style.list__label">{{ item.label }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';
import { useUIKit, IconCheckSm } from '@tencentcloud/uikit-base-component-vue3';
import { Avatar } from '../../../Avatar';
import type { IUserPickerRow } from '../../type';

interface ListModeProps<T = unknown> {
  dataSource: IUserPickerRow<T>[];
  selectedKeys: Set<string>;
  lockedKeys: Set<string>;
  onItemClick: (key: string) => void;
  onReachEnd?: () => void;
  renderItem?: any; // Vue component or render function
}

const props = defineProps<ListModeProps>();

const { t } = useUIKit();

const isSelected = (key: string): boolean => props.selectedKeys.has(key);
const isLocked = (key: string): boolean => props.lockedKeys.has(key);

const handleItemClick = (key: string) => {
  if (!isLocked(key)) {
    props.onItemClick(key);
  }
};

const handleScroll = (e: Event) => {
  if (!props.onReachEnd) {
    return;
  }

  const target = e.currentTarget as HTMLDivElement;
  const { scrollTop, scrollHeight, clientHeight } = target;
  // Trigger load more when scrolled to bottom
  if (scrollHeight - scrollTop - clientHeight < 50) {
    props.onReachEnd();
  }
};
</script>

<style module lang="scss">
@use '../../../../styles/mixins/scrollbar' as scrollbar;

.list {
  &__container {
    flex: 1;
    width: 100%;
    overflow-y: auto;

    @include scrollbar.scrollbar-default;
  }

  &__item {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    cursor: pointer;
    transition: background-color 0.2s;

    background-color: var(--list-color-default);

    &:hover {
      background-color: var(--list-color-hover);
    }

    &--selected {
      background-color: var(--list-color-focused);

      &:hover {
        background-color: var(--list-color-focused);
      }
    }

    &--locked {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  &__checkbox-wrapper {
    margin-right: 8px;
  }

  &__checkbox {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s;
    color: #fff;
    border: 2px solid #d9d9d9;

    &--checked {
      color: var(--checkbox-color-selected);
      border-color: var(--checkbox-color-selected);
    }
  }

  &__content {
    display: flex;
    align-items: center;
    flex: 1;
    min-width: 0;
  }

  &__avatar {
    margin-right: 8px;
  }

  &__label {
    font-size: 14px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    color: var(--text-color-primary);
  }

  &__load-more {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 40px;
    font-size: 14px;

    color: var(--text-color-secondary);
  }

  &__empty {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100px;
    font-size: 14px;

    color: var(--text-color-secondary);
  }
}

.list__end-marker {
  height: 1px;
  opacity: 0;
}
</style>
