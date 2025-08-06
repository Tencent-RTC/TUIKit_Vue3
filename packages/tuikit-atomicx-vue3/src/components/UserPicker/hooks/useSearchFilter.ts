import { ref, computed, type Ref } from 'vue';
import type { IUserPickerDataSource, IUserPickerNode, IUserPickerRow } from '../type';

interface UseSearchFilterOptions<T = unknown> {
  dataSource: Ref<IUserPickerDataSource<T>>;
  isTreeMode?: boolean;
  onSearch?: (value: string) => void;
  debounceTime?: number;
}

interface UseSearchFilterReturn<T = unknown> {
  searchValue: Ref<string>;
  setSearchValue: (value: string) => void;
  filteredData: Ref<IUserPickerDataSource<T>>;
  isSearching: Ref<boolean>;
  handleSearch: (value: string) => void;
  clearSearch: () => void;
  isSearchEmpty: Ref<boolean>;
}

// Check if it's tree data structure
function isTreeDataSource<T>(data: IUserPickerDataSource<T>): data is Array<IUserPickerNode<T>> {
  if (data.length === 0) {
    return false;
  }
  return 'isLeafNode' in data[0];
}

// Search tree structure
function searchTreeNodes<T>(nodes: Array<IUserPickerNode<T>>, searchValue: string): Array<IUserPickerNode<T>> {
  if (!searchValue.trim()) {
    return nodes;
  }

  // Helper function: check if node matches
  const isNodeMatched = (node: IUserPickerNode<T>): boolean =>
    node.label.toLowerCase().includes(searchValue.toLowerCase());

  // Helper function: recursively search nodes
  const searchNodes = (nodesList: Array<IUserPickerNode<T>>): Array<IUserPickerNode<T>> => {
    const matchedNodes: Array<IUserPickerNode<T>> = [];

    nodesList.forEach(node => {
      const isMatched = isNodeMatched(node);
      let matchedChildren: Array<IUserPickerNode<T>> = [];

      if (node.children && node.children.length) {
        matchedChildren = searchNodes(node.children);
      }

      // If current node matches or has matching child nodes, add to result
      if (isMatched || matchedChildren.length > 0) {
        matchedNodes.push({
          ...node,
          children: matchedChildren.length > 0 ? matchedChildren : node.children,
        } as IUserPickerNode<T>);
      }
    });

    return matchedNodes;
  };

  return searchNodes(nodes);
}

// Search list structure
function searchListItems<T>(items: Array<IUserPickerRow<T>>, searchValue: string): Array<IUserPickerRow<T>> {
  if (!searchValue.trim()) {
    return items;
  }

  return items.filter(item => item.label.toLowerCase().includes(searchValue.toLowerCase()));
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
    if (!searchValue.value.trim()) {
      return dataSource.value;
    }

    if (isTreeMode && isTreeDataSource(dataSource.value)) {
      return searchTreeNodes(dataSource.value as Array<IUserPickerNode<T>>, searchValue.value);
    }
    return searchListItems(dataSource.value as Array<IUserPickerRow<T>>, searchValue.value);
  });

  // Handle search input
  const handleSearch = (value: string) => {
    isSearching.value = true;
    searchValue.value = value;

    // Trigger external search callback
    if (onSearch) {
      onSearch(value);
    }

    isSearching.value = false;
  };

  // Clear search
  const clearSearch = () => {
    searchValue.value = '';
    if (onSearch) {
      onSearch('');
    }
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
