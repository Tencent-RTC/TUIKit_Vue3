import { ref, type Ref } from 'vue';
import type { IUserPickerNode } from '../type';

interface UseTreeStateOptions<T = unknown> {
  onExpand?: (node: IUserPickerNode<T>) => void;
}

interface UseTreeStateReturn<T = unknown> {
  expandedKeys: Ref<Set<string>>;
  loadingKeys: Ref<Set<string>>;
  checkNodeIsExpanded: (key: string) => boolean;
  checkNodeIsLoading: (key: string) => boolean;
  toggleExpand: (node: IUserPickerNode<T>) => void;
  setNodeLoading: (key: string, loading: boolean) => void;
}

export function useTreeState<T = unknown>({ onExpand }: UseTreeStateOptions<T> = {}): UseTreeStateReturn<T> {
  // State
  const expandedKeys = ref<Set<string>>(new Set());
  const loadingKeys = ref<Set<string>>(new Set());

  // Check if node is expanded
  const checkNodeIsExpanded = (key: string): boolean => expandedKeys.value.has(key);

  // Check if node is loading
  const checkNodeIsLoading = (key: string): boolean => loadingKeys.value.has(key);

  // Set node loading state
  const setNodeLoading = (key: string, loading: boolean) => {
    const newKeys = new Set(loadingKeys.value);

    if (loading) {
      newKeys.add(key);
    } else {
      newKeys.delete(key);
    }

    loadingKeys.value = newKeys;
  };

  // Toggle node expand state
  const toggleExpand = (node: IUserPickerNode<T>) => {
    // If node is leaf node, no need to handle
    if (node.isLeafNode) {
      return;
    }

    const newKeys = new Set(expandedKeys.value);

    if (newKeys.has(node.key)) {
      // Already expanded, then collapse
      newKeys.delete(node.key);
    } else {
      // Not expanded, then expand
      newKeys.add(node.key);

      // If node needs lazy loading and has onExpand callback, trigger it
      if (node.lazyLoad && onExpand) {
        setNodeLoading(node.key, true);
        onExpand(node);
      }
    }

    expandedKeys.value = newKeys;
  };

  return {
    expandedKeys,
    loadingKeys,
    checkNodeIsExpanded,
    checkNodeIsLoading,
    toggleExpand,
    setNodeLoading,
  };
}
