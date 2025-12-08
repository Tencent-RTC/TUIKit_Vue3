// List item data structure
export interface UserPickerRow<T = unknown> {
  key: string; // Unique identifier
  label: string; // Display name
  avatarUrl?: string | undefined; // Avatar URL
  extraData?: T | undefined; // Extended data
}

// Tree node data structure
export interface UserPickerNode<T = unknown> {
  key: string; // Unique identifier
  label: string; // Display name
  isLeafNode: boolean; // Whether is leaf node
  avatarUrl?: string | undefined; // Avatar URL
  lazyLoad?: boolean; // Whether supports lazy loading
  children?: Array<UserPickerNode<T>>; // Child nodes
  extraData?: T | undefined; // Extended data
}

// Data source type
export type UserPickerDataSource<T = unknown> = Array<UserPickerRow<T>> | Array<UserPickerNode<T>>;

// Selection result item type
export interface UserPickerResultItem<T = unknown> {
  key: string;
  label: string;
  avatarUrl?: string | undefined;
  isLeafNode?: boolean | undefined; // Only meaningful in tree mode
  extraData?: T | undefined;
  path?: string[] | undefined; // Only meaningful in tree mode, records node path
}

// Selection result type
export type UserPickerResult<T = unknown> = Array<UserPickerResultItem<T>>;

// Component props interface
export interface UserPickerProps<T = unknown> {
  // Basic properties
  displayMode: 'list' | 'tree'; // Display mode
  dataSource: UserPickerDataSource<T>; // Data source
  defaultSelectedItems?: Array<{ key: string; [key: string]: any }>;
  lockedItems?: Array<{ key: string; [key: string]: any }>;
  maxCount?: number | undefined;
  minCount?: number | undefined;
  onMaxCountExceed?: (selectedItems: UserPickerResult<T>) => void;

  // Search related
  enableSearch?: boolean; // Whether to enable search
  searchPlaceholder?: string; // Search placeholder text
  onSearch?: (dataSource: Array<UserPickerRow<T>>, keyword: string) => Array<UserPickerRow<T>>; // Custom search function for list mode only

  // Custom rendering
  renderItem?: (data: UserPickerRow<T> | UserPickerNode<T>) => any; // Vue render function or component

  // Event callbacks
  onSelectedChange?: (selectedItems: UserPickerResult<T>) => void; // Selection change callback
  onReachEnd?: () => void; // List scroll to bottom callback (list mode)

  // Tree mode specific properties
  onExpand?: (node: UserPickerNode<T>) => void; // Expand callback for lazy loading child items
}

// Component ref interface
export interface UserPickerRef<T = unknown> {
  getSelectedItems: () => UserPickerResult<T>; // Get currently selected items
  updateListData: (newDataSource: Array<UserPickerRow<T>>) => void; // Update list data
  updateTreeData: (key: string, partialNewNode: Partial<UserPickerNode<T>>) => void; // Update tree data
}

// Selection state type (for internal state management)
export interface SelectionState {
  selectedKeys: Set<string>;
  halfSelectedKeys?: Set<string>; // Only valid in tree mode
}

// Tree node state type (for internal state management)
export interface TreeState {
  expandedKeys: Set<string>;
  loadingKeys: Set<string>;
}
