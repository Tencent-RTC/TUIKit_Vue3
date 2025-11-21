/* eslint-disable @typescript-eslint/no-use-before-define */
import { ref, computed, watch, type Ref } from 'vue';
import type { UserPickerNode, UserPickerRow, UserPickerDataSource, UserPickerResult } from '../type';

interface UseSelectionOptions<T = unknown> {
  defaultSelectedKeys?: string[];
  lockedKeys?: string[];
  maxCount?: number;
  minCount?: number;
  isTreeMode?: boolean;
  dataSource: Ref<UserPickerDataSource<T>>;
  onSelectedChange?: (selectedItems: UserPickerResult<T>) => void;
  onMaxCountExceed?: (selectedItems: UserPickerResult<T>) => void;
}

interface UseSelectionReturn<T = unknown> {
  selectedKeys: Ref<Set<string>>;
  halfSelectedKeys: Ref<Set<string>>;
  lockedKeys: Ref<Set<string>>;
  isSelected: (key: string) => boolean;
  isHalfSelected: (key: string) => boolean;
  isLocked: (key: string) => boolean;
  toggle: (key: string) => void;
  getSelectedItems: () => UserPickerResult<T>;
  getNodeChildKeys: (node: UserPickerNode<T>) => string[];
  getNodeParentChildrenMap: () => Map<string, string[]>;
  canSelectMore: Ref<boolean>;
  reachMaxCount: Ref<boolean>;
  allSelectedCount: Ref<number>;
  getSelectableLeafNodes: (nodeKey: string) => UserPickerNode<T>[];
  getCancelableLeafNodes: (nodeKey: string) => UserPickerNode<T>[];
}

// Check if it's tree data structure
function isTreeDataSource<T>(data: UserPickerDataSource<T>): data is UserPickerNode<T>[] {
  if (data.length === 0) {
    return false;
  }
  return 'isLeafNode' in data[0];
}

/**
 * Build flattened node mapping
 * @param nodes
 * @returns
 */
function buildAllNodesMap<T>(nodes: UserPickerNode<T>[]): Map<string, UserPickerNode<T>> {
  const map = new Map<string, UserPickerNode<T>>();
  const traverse = (nodesToScan: UserPickerNode<T>[]) => {
    nodesToScan.forEach(node => {
      map.set(node.key, node);
      if (node.children && node.children.length) {
        traverse(node.children);
      }
    });
  };
  traverse(nodes);
  return map;
}

// Build parent-children mapping relationship
function buildParentChildrenMap<T>(nodes: UserPickerNode<T>[]): Map<string, string[]> {
  const map = new Map<string, string[]>();

  const traverse = (nodesList: UserPickerNode<T>[], parentKey?: string) => {
    nodesList.forEach(node => {
      if (parentKey) {
        if (!map.has(parentKey)) {
          map.set(parentKey, []);
        }
        map.get(parentKey)?.push(node.key);
      }

      if (node.children && node.children.length) {
        traverse(node.children, node.key);
      }
    });
  };

  traverse(nodes);
  return map;
}

// Build child-parent mapping relationship
function buildChildParentMap<T>(nodes: UserPickerNode<T>[]): Map<string, string> {
  const map = new Map<string, string>();

  const traverse = (nodesList: UserPickerNode<T>[], parentKey?: string) => {
    nodesList.forEach(node => {
      if (parentKey) {
        map.set(node.key, parentKey);
      }

      if (node.children && node.children.length) {
        traverse(node.children, node.key);
      }
    });
  };

  traverse(nodes);
  return map;
}

// Helper function to compare two Sets for equality
function areSetsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) {
    return false;
  }
  return Array.from(a).every(item => b.has(item));
}

export function useSelection<T = unknown>({
  defaultSelectedKeys = [],
  lockedKeys = [],
  maxCount = Infinity,
  minCount = 0,
  isTreeMode = false,
  dataSource,
  onSelectedChange,
  onMaxCountExceed,
}: UseSelectionOptions<T>): UseSelectionReturn<T> {
  // State
  const selectedKeys = ref<Set<string>>(new Set(defaultSelectedKeys));
  const halfSelectedKeys = ref<Set<string>>(new Set());
  const lockedKeysSet = ref<Set<string>>(new Set(lockedKeys));

  // Tree node relationships
  const parentChildrenMap = computed(() => {
    if (isTreeMode && isTreeDataSource(dataSource.value)) {
      return buildParentChildrenMap(dataSource.value as UserPickerNode<T>[]);
    }
    return new Map<string, string[]>();
  });

  const childParentMap = computed(() => {
    if (isTreeMode && isTreeDataSource(dataSource.value)) {
      return buildChildParentMap(dataSource.value as UserPickerNode<T>[]);
    }
    return new Map<string, string>();
  });

  const nodeEntitiesMap = computed(() => {
    if (isTreeMode && isTreeDataSource(dataSource.value)) {
      return buildAllNodesMap(dataSource.value as UserPickerNode<T>[]);
    }
    return new Map<string, UserPickerNode<T>>();
  });

  // Check if maximum selection count is reached
  const allSelectedCount = computed(() => selectedKeys.value.size);
  const canSelectMore = computed(() => allSelectedCount.value < maxCount);
  const reachMaxCount = computed(() => allSelectedCount.value >= maxCount);

  /**
   * Get the child keys of a node
   * @param node - The node to get the child keys of
   * @returns The child keys of the node
   */
  const getNodeChildKeys = (node: UserPickerNode<T>): string[] => {
    const result: string[] = [];

    const traverse = (nodeKey: string) => {
      const childKeys = parentChildrenMap.value.get(nodeKey);
      if (childKeys) {
        childKeys.forEach(childKey => {
          result.push(childKey);
          traverse(childKey);
        });
      }
    };

    traverse(node.key);
    return result;
  };

  /**
   * Get the number of leaf nodes that would be selected when selecting a certain node
   * @param nodeKey - The key of the node to select
   * @returns The number of leaf nodes that would be selected when selecting this node (excluding already selected or locked nodes)
   */
  const getSelectableLeafNodes = (nodeKey: string): UserPickerNode<T>[] => {
    // If the node itself is a leaf node and not selected or locked, return 1
    const nodeEntity = nodeEntitiesMap.value.get(nodeKey);
    if (nodeEntity?.isLeafNode && !selectedKeys.value.has(nodeKey) && !lockedKeysSet.value.has(nodeKey)) {
      return [nodeEntity];
    }

    // Get all child node keys
    const childKeys = getNodeChildKeys({ key: nodeKey } as UserPickerNode<T>);

    // Filter out unselected and unlocked leaf nodes
    const selectableLeafNodes = childKeys
      .filter(key => !selectedKeys.value.has(key) && !lockedKeysSet.value.has(key))
      .map(key => nodeEntitiesMap.value.get(key))
      .filter(childNode => childNode?.isLeafNode) as UserPickerNode<T>[];

    return selectableLeafNodes;
  };

  const getCancelableLeafNodes = (nodeKey: string): UserPickerNode<T>[] => {
    const nodeEntity = nodeEntitiesMap.value.get(nodeKey);
    if (nodeEntity?.isLeafNode && selectedKeys.value.has(nodeKey)) {
      return [nodeEntity];
    }

    const childKeys = getNodeChildKeys({ key: nodeKey } as UserPickerNode<T>);

    const cancelableLeafNodes = childKeys
      .filter(key => selectedKeys.value.has(key) && !lockedKeysSet.value.has(key))
      .map(key => nodeEntitiesMap.value.get(key))
      .filter(childNode => childNode?.isLeafNode) as UserPickerNode<T>[];

    return cancelableLeafNodes;
  };

  /**
   * Get the parent path of a node
   * @param key - The key of the node
   * @returns The parent path of the node
   *
   * Example:
   * [current, parent1, parent2, ..., root]
   */
  const getNodeParentKeyPath = (key: string): string[] => {
    const path: string[] = [key];
    let current = key;

    while (childParentMap.value.has(current)) {
      const parentKey = childParentMap.value.get(current)!;
      path.push(parentKey);
      current = parentKey;
    }

    return path;
  };

  /**
   * Update node selection state, ensuring proper handling of cross-level selection relationships
   * Through bottom-up multiple iterations, ensure all parent node states correctly reflect their descendant node states
   */
  const updateSelectedStates = () => {
    if (!isTreeMode) {
      return;
    }

    // Initialize new state sets
    const newSelectedKeys = new Set<string>(); // Will recalculate all node selection states
    const newHalfSelectedKeys = new Set<string>(); // Will recalculate all node half-selected states

    // 1. Collect all nodes (including leaf nodes and non-leaf nodes)
    const allNodes = new Set<string>(Array.from(selectedKeys.value)); // First add currently selected nodes

    // Add all parent nodes existing in parentChildrenMap
    parentChildrenMap.value.forEach((_, parentKey) => {
      allNodes.add(parentKey);
    });

    // Add all child nodes existing in parentChildrenMap
    parentChildrenMap.value.forEach(childKeys => {
      childKeys.forEach(childKey => allNodes.add(childKey));
    });

    // 2. Preserve all selected leaf node states
    selectedKeys.value.forEach(key => {
      const childKeys = parentChildrenMap.value.get(key);
      // If node has no children (i.e., leaf node) and is selected, preserve its selected state
      if (!childKeys || childKeys.length === 0) {
        if (selectedKeys.value.has(key)) {
          newSelectedKeys.add(key);
        }
      }
    });

    // 3. Bottom-up update parent node state - multiple iterations until state is stable
    let stateChanged = true;
    const updateParentState = (nodeKey: string) => {
      // Skip locked nodes
      if (lockedKeysSet.value.has(nodeKey)) {
        return;
      }

      // Get all child nodes of the node
      const childKeys = parentChildrenMap.value.get(nodeKey);
      if (!childKeys || childKeys.length === 0) {
        return;
      } // Leaf nodes already processed

      // Exclude locked child nodes
      const unlockedChildKeys = childKeys.filter(key => !lockedKeysSet.value.has(key));
      if (unlockedChildKeys.length === 0) {
        return;
      }

      // Calculate child node states
      const selectedChildCount = unlockedChildKeys.filter(key => newSelectedKeys.has(key)).length;
      const halfSelectedChildCount = unlockedChildKeys.filter(key => newHalfSelectedKeys.has(key)).length;

      // Determine parent node's new state
      const wasSelected = newSelectedKeys.has(nodeKey);
      const wasHalfSelected = newHalfSelectedKeys.has(nodeKey);

      if (selectedChildCount === unlockedChildKeys.length) {
        // All child nodes are selected -> parent node fully selected
        if (!wasSelected || wasHalfSelected) {
          newSelectedKeys.add(nodeKey);
          newHalfSelectedKeys.delete(nodeKey);
          stateChanged = true; // State has changed
        }
      } else if (selectedChildCount > 0 || halfSelectedChildCount > 0) {
        // Some child nodes are selected or half-selected -> parent node half-selected
        if (wasSelected || !wasHalfSelected) {
          newSelectedKeys.delete(nodeKey);
          newHalfSelectedKeys.add(nodeKey);
          stateChanged = true; // State has changed
        }
      } else if (wasSelected || wasHalfSelected) {
        // No child nodes are selected or half-selected -> parent node unselected
        newSelectedKeys.delete(nodeKey);
        newHalfSelectedKeys.delete(nodeKey);
        stateChanged = true; // State has changed
      }
    };

    while (stateChanged) {
      stateChanged = false;
      allNodes.forEach(updateParentState);
    }

    // 4. Only update when state actually changes
    if (!areSetsEqual(newSelectedKeys, selectedKeys.value)) {
      selectedKeys.value = newSelectedKeys;
    }
    if (!areSetsEqual(newHalfSelectedKeys, halfSelectedKeys.value)) {
      halfSelectedKeys.value = newHalfSelectedKeys;
    }
  };

  // Toggle selection state
  const toggle = (key: string) => {
    if (lockedKeysSet.value.has(key)) {
      return; // Locked items cannot be changed
    }

    const newSelectedKeys = new Set(selectedKeys.value);

    if (isTreeMode) {
      const isFullySelected = newSelectedKeys.has(key);
      const isHalfSelected = halfSelectedKeys.value.has(key);

      // Handle click behavior's three state transitions
      if (isFullySelected) {
        const cancelableLeafNodes = getCancelableLeafNodes(key);
        const selectedLeafNodes = getSelectedItems().filter(item => item.isLeafNode);
        const currentSelectedKeyCount = selectedLeafNodes.length;
        if (cancelableLeafNodes.length > 0) {
          if (currentSelectedKeyCount - cancelableLeafNodes.length >= minCount) {
            cancelableLeafNodes.forEach(node => {
              newSelectedKeys.delete(node.key);
            });
          } else {
            // TODO: trigger onMinCountExceed
          }
        }
      } else if (isHalfSelected) {
        /**
         * Half-selected -> Check if there are selectable leaf nodes
         * 1. No selectable leaf nodes -> Cancel selection of all child nodes
         * 2. Has selectable leaf nodes -> Select node and all its child nodes
         */
        const selectableChildLeafCount = getSelectableLeafNodes(key).length;
        if (selectableChildLeafCount === 0) {
          const cancelableLeafNodes = getCancelableLeafNodes(key);
          const selectedLeafNodes = getSelectedItems().filter(item => item.isLeafNode);
          const currentSelectedKeyCount = selectedLeafNodes.length;
          if (cancelableLeafNodes.length > 0) {
            if (currentSelectedKeyCount - cancelableLeafNodes.length >= minCount) {
              cancelableLeafNodes.forEach(node => {
                newSelectedKeys.delete(node.key);
              });
            } else {
              // TODO: trigger onMinCountExceed
            }
          }
        } else if (selectableChildLeafCount > 0) {
          const selectedLeafNodes = getSelectedItems().filter(item => item.isLeafNode);
          if (selectedLeafNodes.length + selectableChildLeafCount <= maxCount) {
            // If new leaf node count is within maximum selection range, then can select
            const selectableLeafNodes = getSelectableLeafNodes(key);
            selectableLeafNodes.forEach(node => {
              newSelectedKeys.add(node.key);
            });
          } else {
            // TODO: trigger onMaxCountExceed
          }
        }
      } else {
        // Unselected -> Fully selected: select node and all its child nodes
        // Calculate how many leaf nodes would be added (excluding already selected and locked)
        const selectableLeafNodes = getSelectableLeafNodes(key);

        // If new leaf node count is within maximum selection range, then can select
        if (selectableLeafNodes.length > 0) {
          const selectedLeafNodes = getSelectedItems().filter(item => item.isLeafNode);
          if (selectedLeafNodes.length + selectableLeafNodes.length <= maxCount) {
            selectableLeafNodes.forEach(node => {
              newSelectedKeys.add(node.key);
            });
          } else {
            // TODO: trigger onMaxCountExceed
          }
        }
      }
    } else {
      // List mode - simple toggle
      const isCurrentlySelected = newSelectedKeys.has(key);

      if (isCurrentlySelected) {
        newSelectedKeys.delete(key);
      } else if (newSelectedKeys.size < maxCount) {
        newSelectedKeys.add(key);
      } else {
        onMaxCountExceed?.(getSelectedItems());
      }
    }

    selectedKeys.value = newSelectedKeys;
  };

  // Get selected items
  const getSelectedItems = (): UserPickerResult<T> => {
    const result: UserPickerResult<T> = [];

    if (isTreeMode && isTreeDataSource(dataSource.value)) {
      const treeData = dataSource.value as UserPickerNode<T>[];

      // Helper function: find node - use array iteration instead of for...of loop
      const findNode = (key: string, nodes: UserPickerNode<T>[]): UserPickerNode<T> | null => {
        const found = nodes.find(node => node.key === key);
        if (found) {
          return found;
        }

        // Recursively search child nodes
        for (let i = 0; i < nodes.length; i += 1) {
          const node = nodes[i];
          if (node.children?.length) {
            const foundInChildren = findNode(key, node.children);
            if (foundInChildren) {
              return foundInChildren;
            }
          }
        }

        return null;
      };

      // Find the node corresponding to each selected key
      selectedKeys.value.forEach(key => {
        const node = findNode(key, treeData);
        if (node) {
          result.push({
            key: node.key,
            label: node.label,
            avatarUrl: node.avatarUrl,
            isLeafNode: node.isLeafNode,
            extraData: node.extraData,
            // Calculate node path
            path: [...getNodeParentKeyPath(node.key)].reverse(),
          });
        }
      });
    } else {
      // List mode
      const listData = dataSource.value as UserPickerRow<T>[];
      selectedKeys.value.forEach(key => {
        const item = listData.find(listItem => listItem.key === key);
        if (item) {
          result.push({
            key: item.key,
            label: item.label,
            avatarUrl: item.avatarUrl,
            extraData: item.extraData,
          });
        }
      });
    }

    return result;
  };

  // Watch for selection changes and notify external components
  watch(
    [selectedKeys, halfSelectedKeys],
    () => {
      if (isTreeMode) {
        updateSelectedStates();
      }

      // Trigger external callback
      if (onSelectedChange) {
        onSelectedChange(getSelectedItems());
      }
    },
    { deep: true }
  );

  return {
    selectedKeys,
    halfSelectedKeys,
    lockedKeys: lockedKeysSet,
    isSelected: (key: string) => selectedKeys.value.has(key),
    isHalfSelected: (key: string) => halfSelectedKeys.value.has(key),
    isLocked: (key: string) => lockedKeysSet.value.has(key),
    toggle,
    getSelectedItems,
    getNodeChildKeys,
    getSelectableLeafNodes,
    getCancelableLeafNodes,
    getNodeParentChildrenMap: () => parentChildrenMap.value,
    canSelectMore,
    reachMaxCount,
    allSelectedCount,
  };
}
