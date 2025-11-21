<template>
  <div v-if="dataSource.length === 0" :class="$style.tree__empty">No data available</div>
  <div v-else :class="$style.tree__container">
    <TreeNode
      v-for="node in dataSource"
      :key="node.key"
      :node="node"
      :level="0"
      :selected-keys="selectedKeys"
      :half-selected-keys="halfSelectedKeys"
      :locked-keys="lockedKeys"
      :expanded-keys="expandedKeys"
      :loading-keys="loadingKeys"
      :render-item="renderItem"
      @item-click="onItemClick"
      @expand="onExpand"
    />
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';
import TreeNode from './TreeNode.vue';
import type { UserPickerNode } from '../../type';

interface TreeModeProps<T = unknown> {
  dataSource: UserPickerNode<T>[];
  selectedKeys: Set<string>;
  halfSelectedKeys: Set<string>;
  lockedKeys: Set<string>;
  expandedKeys: Set<string>;
  loadingKeys: Set<string>;
  onItemClick: (key: string) => void;
  onExpand: (node: UserPickerNode<T>) => void;
  renderItem?: any; // Vue component or render function
}

const props = defineProps<TreeModeProps>();
</script>

<style module lang="scss">
@use '../../../../styles/mixins/scrollbar' as scrollbar;

.tree {
  &__container {
    overflow-y: auto;
    flex: 1;
    width: 100%;

    @include scrollbar.scrollbar-default;
  }

  &__empty {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100px;
    color: var(--text-color-secondary);
  }
}
</style>
