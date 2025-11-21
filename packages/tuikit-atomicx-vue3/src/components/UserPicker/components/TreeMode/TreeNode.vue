<template>
  <div :class="$style['tree__node-wrapper']">
    <div
      :class="[
        $style.tree__node,
        {
          [$style['tree__node--selected']]: isSelected,
          [$style['tree__node--half-selected']]: isHalfSelected,
          [$style['tree__node--locked']]: isLocked,
        },
      ]"
    >
      <div
        :class="$style['tree__node-content']"
        :data-level="level"
        :style="{ paddingLeft: `${level * 20 + (level > 0 && node.isLeafNode ? 24 + 8 : 0)}px` }"
      >
        <!-- Expand/collapse icon -->
        <IconArrowDown
          v-if="!node.isLeafNode"
          name="arrow-down"
          :class="[$style['tree__expand-icon'], { [$style['tree__expand-icon--expanded']]: isExpanded }]"
          :size="20"
          @click="handleExpand"
        />

        <!-- Checkbox -->
        <div :class="$style['tree__checkbox-wrapper']" @click="handleItemClick">
          <div
            :class="[
              $style.tree__checkbox,
              {
                [$style['tree__checkbox--checked']]: isSelected,
                [$style['tree__checkbox--half-checked']]: isHalfSelected,
              },
            ]"
          >
            <svg v-if="isHalfSelected" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M19 13H5v-2h14v2z" />
            </svg>
            <IconCheckSm v-else-if="isSelected" name="check" />
          </div>
        </div>

        <!-- Node content -->
        <template v-if="renderItem">
          <component :is="renderItem" :node="node" />
        </template>
        <div v-else :class="$style['tree__node-label']">
          <span>头像</span>
          <span :class="$style.tree__label">{{ node.label }}</span>
        </div>
      </div>
    </div>

    <!-- Children -->
    <div v-if="(hasChildren && isExpanded) || isLazyLoading" :class="$style['tree__child-nodes']">
      <div
        v-if="isLazyLoading && !hasChildren"
        :class="$style['tree__loading-container']"
        :data-level="level + 1"
        :style="{ paddingLeft: `${(level + 1) * 20 + (24 + 8 + 8)}px` }"
      >
        <span :class="$style['tree__loading-indicator']">
          <IconLoading />
        </span>
      </div>
      <TreeNode
        v-else
        v-for="childNode in node.children"
        :key="childNode.key"
        :node="childNode"
        :level="level + 1"
        :selected-keys="selectedKeys"
        :half-selected-keys="halfSelectedKeys"
        :locked-keys="lockedKeys"
        :expanded-keys="expandedKeys"
        :loading-keys="loadingKeys"
        :render-item="renderItem"
        @item-click="$emit('item-click', $event)"
        @expand="$emit('expand', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, computed } from 'vue';
import { IconArrowDown, IconCheckSm, IconLoading } from '@tencentcloud/uikit-base-component-vue3';
import { Avatar } from '../../../Avatar';
import type { UserPickerNode } from '../../type';

interface TreeNodeProps<T = unknown> {
  node: UserPickerNode<T>;
  level: number;
  selectedKeys: Set<string>;
  halfSelectedKeys: Set<string>;
  lockedKeys: Set<string>;
  expandedKeys: Set<string>;
  loadingKeys: Set<string>;
  renderItem?: any;
}

const props = defineProps<TreeNodeProps>();

const emit = defineEmits<{
  'item-click': [key: string];
  expand: [node: UserPickerNode<any>];
}>();

const isSelected = computed(() => props.selectedKeys.has(props.node.key));
const isHalfSelected = computed(() => props.halfSelectedKeys.has(props.node.key));
const isLocked = computed(() => props.lockedKeys.has(props.node.key));
const isExpanded = computed(() => props.expandedKeys.has(props.node.key));
const isLoading = computed(() => props.loadingKeys.has(props.node.key));

const hasChildren = computed(() => props.node.children && props.node.children.length > 0);
const isLazyLoading = computed(() => isExpanded.value && props.node.lazyLoad && isLoading.value);

const handleItemClick = () => {
  if (!isLocked.value) {
    emit('item-click', props.node.key);
  }
};

const handleExpand = (e: Event) => {
  e.stopPropagation();
  emit('expand', props.node);
};
</script>

<style module lang="scss">
.tree {
  &__node-wrapper {
    width: 100%;
  }

  &__node {
    padding: 4px 0;
    cursor: pointer;
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

    &--half-selected {
      background-color: var(--list-color-focused);
    }

    &--locked {
      opacity: 0.7;
      cursor: not-allowed;
    }
  }

  &__node-content {
    display: flex;
    align-items: center;
    min-height: 32px;
  }

  &__expand-icon {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 24px;
    height: 24px;
    color: var(--text-color-primary);

    cursor: pointer;
    user-select: none;
    transition: transform 0.3s;

    &--expanded {
      transform: rotate(90deg);
    }

    &:hover {
      color: var(--text-color-secondary);
    }
  }

  &__checkbox-wrapper {
    margin: 0 8px;
  }

  &__checkbox {
    width: 18px;
    height: 18px;
    border: 1px solid #d9d9d9;
    border-radius: 2px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s;
    color: #fff;

    &--checked {
      background-color: var(--checkbox-color-selected);
      border-color: var(--checkbox-color-selected);
    }

    &--half-checked {
      background-color: var(--checkbox-color-selected);
      border-color: var(--checkbox-color-selected);
    }
  }

  &__node-label {
    display: flex;
    align-items: center;
    flex: 1;
    min-width: 0;
  }

  &__label {
    font-size: 14px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--text-color-primary);
  }

  &__avatar {
    margin-right: 8px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__child-nodes {
    width: 100%;
  }

  &__loading-container {
    display: flex;
    align-items: center;
  }

  &__loading-indicator {
    animation: tree-spin 1s linear infinite;
    color: var(--checkbox-color-selected);
  }
}

@keyframes tree-spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}
</style>
