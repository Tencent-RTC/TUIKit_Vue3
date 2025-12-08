import { ref, computed } from 'vue';
import type { Ref } from 'vue';
import type { UserPickerDataSource, UserPickerNode, UserPickerRow } from '../type';

interface UseSearchFilterOptions<T = unknown> {
  dataSource: Ref<UserPickerDataSource<T>>;
  isTreeMode?: boolean;
  onSearch?: (dataSource: Array<UserPickerRow<T>>, keyword: string) => Array<UserPickerRow<T>>;
  debounceTime?: number;
}

interface UseSearchFilterReturn<T = unknown> {
  searchValue: Ref<string>;
  setSearchValue: (value: string) => void;
  filteredData: Ref<UserPickerDataSource<T>>;
  isSearching: Ref<boolean>;
  handleSearch: (value: string) => void;
  clearSearch: () => void;
  isSearchEmpty: Ref<boolean>;
}

// Check if it's tree data structure
function isTreeDataSource<T>(data: UserPickerDataSource<T>): data is Array<UserPickerNode<T>> {
  if (data.length === 0) {
    return false;
  }
  return 'isLeafNode' in data[0];
}

// Search tree structure
function searchTreeNodes<T>(nodes: Array<UserPickerNode<T>>, searchValue: string): Array<UserPickerNode<T>> {
  if (!searchValue.trim()) {
    return nodes;
  }

  const lowerSearchValue = searchValue.toLowerCase();

  // Helper function: check if node matches (support both key and label)
  const isNodeMatched = (node: UserPickerNode<T>): boolean =>
    node.key.toLowerCase().includes(lowerSearchValue)
    || node.label.toLowerCase().includes(lowerSearchValue);

  // Helper function: recursively search nodes
  const searchNodes = (nodesList: Array<UserPickerNode<T>>): Array<UserPickerNode<T>> => {
    const matchedNodes: Array<UserPickerNode<T>> = [];

    nodesList.forEach((node) => {
      const isMatched = isNodeMatched(node);
      let matchedChildren: Array<UserPickerNode<T>> = [];

      if (node.children && node.children.length) {
        matchedChildren = searchNodes(node.children);
      }

      // If current node matches or has matching child nodes, add to result
      if (isMatched || matchedChildren.length > 0) {
        matchedNodes.push({
          ...node,
          children: matchedChildren.length > 0 ? matchedChildren : node.children,
        } as UserPickerNode<T>);
      }
    });

    return matchedNodes;
  };

  return searchNodes(nodes);
}

// Search list structure (default implementation)
function searchListItems<T>(items: Array<UserPickerRow<T>>, searchValue: string): Array<UserPickerRow<T>> {
  if (!searchValue.trim()) {
    return items;
  }

  const lowerSearchValue = searchValue.toLowerCase();

  return items.filter(item =>
    item.key.toLowerCase().includes(lowerSearchValue)
    || item.label.toLowerCase().includes(lowerSearchValue),
  );
}

export function useSearchFilter<T = unknown>({
  dataSource,
  isTreeMode = false,
  onSearch,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  debounceTime = 300,
}: UseSearchFilterOptions<T>): UseSearchFilterReturn<T> {
  const searchValue = ref<string>('');
  const isSearching = ref<boolean>(false);

  // Filter data based on search value
  const filteredData = computed(() => {
    const keyword = searchValue.value.trim();

    // No search keyword, return original data
    if (!keyword) {
      return dataSource.value;
    }

    // Tree mode: always use default search (custom search not supported)
    if (isTreeMode && isTreeDataSource(dataSource.value)) {
      return searchTreeNodes(dataSource.value as Array<UserPickerNode<T>>, keyword);
    }

    // List mode: use custom search if provided, otherwise use default search
    if (onSearch) {
      return onSearch(dataSource.value as Array<UserPickerRow<T>>, keyword);
    }

    return searchListItems(dataSource.value as Array<UserPickerRow<T>>, keyword);
  });

  // Handle search input
  const handleSearch = (value: string) => {
    isSearching.value = true;
    searchValue.value = value;
    isSearching.value = false;
  };

  // Clear search
  const clearSearch = () => {
    searchValue.value = '';
  };

  // Set search value
  const setSearchValue = (value: string) => {
    searchValue.value = value;
  };

  // Determine if search result is empty
  const isSearchEmpty = computed(() => {
    if (!searchValue.value.trim()) {
      return false;
    }
    return Array.isArray(filteredData.value) && filteredData.value.length === 0;
  });

  return {
    searchValue,
    setSearchValue,
    filteredData,
    isSearching,
    handleSearch,
    clearSearch,
    isSearchEmpty,
  };
}
