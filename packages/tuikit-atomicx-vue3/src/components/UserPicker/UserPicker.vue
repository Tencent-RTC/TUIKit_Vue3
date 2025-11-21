<template>
  <div
    :class="$style['user-picker']"
    :data-display-mode="displayMode"
  >
    <SearchBar
      v-if="enableSearch"
      :placeholder="searchPlaceholder || t('UserPicker.search')"
      :on-search="searchManager.handleSearch"
    />

    <div
      :class="$style['user-picker__panel']"
      :data-display-mode="displayMode"
    >
      <div
        v-if="searchManager.isSearchEmpty.value"
        :class="$style['empty-search']"
      >
        {{ t('UserPicker.no_result') }}
      </div>
      <ListMode
        v-else-if="!isTreeMode"
        :data-source="searchManager.filteredData.value as UserPickerRow<any>[]"
        :selected-keys="selectionManager.selectedKeys.value"
        :locked-keys="selectionManager.lockedKeys.value"
        :on-item-click="selectionManager.toggle"
        :on-reach-end="onReachEnd || (() => {})"
        :render-item="renderItem as any"
      />
      <TreeMode
        v-else
        :data-source="searchManager.filteredData.value as UserPickerNode<any>[]"
        :selected-keys="selectionManager.selectedKeys.value"
        :half-selected-keys="selectionManager.halfSelectedKeys.value"
        :locked-keys="selectionManager.lockedKeys.value"
        :expanded-keys="treeStateManager.expandedKeys.value"
        :loading-keys="treeStateManager.loadingKeys.value"
        :on-item-click="selectionManager.toggle"
        :on-expand="treeStateManager.toggleExpand"
        :render-item="renderItem as any"
      />
    </div>

    <SelectedPanel
      :display-mode="displayMode"
      :selected-items="selectionManager.getSelectedItems()"
      :locked-keys="selectionManager.lockedKeys.value"
      :on-remove="selectionManager.toggle"
      :max-count="maxCount"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, defineProps, defineExpose, withDefaults } from 'vue';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';

import ListMode from './components/ListMode';
import SearchBar from './components/SearchBar';
import SelectedPanel from './components/SelectedPanel';
import TreeMode from './components/TreeMode';

import { useSearchFilter } from './hooks/useSearchFilter';
import { useSelection } from './hooks/useSelection';
import { useTreeState } from './hooks/useTreeState';
import type { UserPickerProps, UserPickerRef, UserPickerNode, UserPickerRow } from './type';

const props = withDefaults(defineProps<UserPickerProps>(), {
  dataSource: () => [],
  defaultSelectedItems: () => [],
  lockedItems: () => [],
  maxCount: Number.POSITIVE_INFINITY,
  minCount: 0,
  enableSearch: true,
});

const { t } = useUIKit();

const isTreeMode = computed(() => props.displayMode === 'tree');

// Internal data state management
const internalDataSource = ref(props.dataSource);

// Extract keys from selected items
const defaultSelectedKeys = computed(() => props.defaultSelectedItems.map(item => item.key));
const lockedKeys = computed(() => props.lockedItems.map(item => item.key));

// Use custom hook to manage selection state
const selectionManager = useSelection<any>({
  defaultSelectedKeys: defaultSelectedKeys.value,
  lockedKeys: lockedKeys.value,
  maxCount: props.maxCount,
  minCount: props.minCount,
  isTreeMode: isTreeMode.value,
  dataSource: internalDataSource,
  onSelectedChange: props.onSelectedChange || (() => {}),
  onMaxCountExceed: props.onMaxCountExceed || (() => {}),
});

// Use custom hook to manage search filtering
const searchManager = useSearchFilter<any>({
  dataSource: internalDataSource,
  isTreeMode: isTreeMode.value,
  onSearch: props.onSearch || (() => {}),
});

// Use custom hook to manage tree state (if in tree mode)
const treeStateManager = useTreeState<any>({
  onExpand: (node) => {
    if (props.onExpand) {
      props.onExpand(node);
    }
  },
});

// Watch for data source changes
watch(
  () => props.dataSource,
  (newDataSource) => {
    if (!isTreeMode.value) {
      internalDataSource.value = newDataSource;
    }
  },
  { deep: true },
);

// Generic node update function - can update any properties of a node
const updateNodeByKey = (nodeKey: string, partialNode: Partial<UserPickerNode<any>>) => {
  if (!isTreeMode.value) {
    return;
  }

  // Deep copy current data
  const newData = JSON.parse(JSON.stringify(internalDataSource.value));

  // Recursive function: find and update node
  const updateNode = (nodes: any[]): boolean => {
    for (let i = 0; i < nodes.length; i += 1) {
      if (nodes[i].key === nodeKey) {
        // Found target node, apply updates
        const updatedNode = {
          ...nodes[i], // Keep original properties
          ...partialNode, // Apply update properties
          key: nodes[i].key, // Ensure key is not overwritten
        };

        // If children are passed and node previously had lazyLoad property
        if (partialNode.children && nodes[i].lazyLoad) {
          updatedNode.lazyLoad = false; // Turn off lazy loading state after having children
        }

        // Create new array instead of directly modifying node
        const newNodes = [...nodes];
        newNodes[i] = updatedNode;

        // Replace original array
        nodes.splice(0, nodes.length, ...newNodes);

        return true;
      }

      // Recursively search child nodes
      const { children } = nodes[i];
      if (children && Array.isArray(children) && children.length > 0) {
        if (updateNode(children)) {
          return true;
        }
      }
    }
    return false;
  };

  // Try to update, return original data if node is not found
  if (Array.isArray(newData)) {
    updateNode(newData as any[]);
  }
  internalDataSource.value = newData;

  // If updating child nodes, automatically stop loading state
  if (partialNode.children) {
    treeStateManager.setNodeLoading(nodeKey, false);
  }
};

// Implement methods exposed by ref
const refMethods: UserPickerRef<any> = {
  getSelectedItems: () => selectionManager.getSelectedItems(),
  updateListData: (newDataSource: any[]) => {
    // Update list data
    if (!isTreeMode.value) {
      internalDataSource.value = newDataSource;
    }
  },
  updateTreeData: (nodeKey: string, partialNode: Partial<UserPickerNode<any>>) => {
    // Use generic update function
    updateNodeByKey(nodeKey, partialNode);
  },
};

defineExpose(refMethods);
</script>

<style module lang="scss">
.user-picker {
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &__panel {
    flex: 1;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    overflow: hidden;
  }

  &__empty-search {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100px;
    color: #999;
    font-size: 14px;
  }

  &__selection-status {
    padding: 8px 12px;
    display: flex;
    justify-content: flex-end;
    color: #666;
    font-size: 12px;
    border-top: 1px solid #f0f0f0;
  }
}
</style>
