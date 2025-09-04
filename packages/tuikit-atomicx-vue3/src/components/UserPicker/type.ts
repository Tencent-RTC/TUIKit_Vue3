// List item data structure
export interface IUserPickerRow<T = unknown> {
  key: string; // Unique identifier
  label: string; // Display name
  avatarUrl?: string | undefined; // Avatar URL
  extraData?: T | undefined; // Extended data
}

// Tree node data structure
export interface IUserPickerNode<T = unknown> {
  key: string; // Unique identifier
  label: string; // Display name
  isLeafNode: boolean; // Whether is leaf node
  avatarUrl?: string | undefined; // Avatar URL
  lazyLoad?: boolean; // Whether supports lazy loading
  children?: Array<IUserPickerNode<T>>; // Child nodes
  extraData?: T | undefined; // Extended data
}

// Data source type
export type IUserPickerDataSource<T = unknown> = Array<IUserPickerRow<T>> | Array<IUserPickerNode<T>>;

// Selection result item type
export interface IUserPickerResultItem<T = unknown> {
  key: string;
  label: string;
  avatarUrl?: string | undefined;
  isLeafNode?: boolean | undefined; // Only meaningful in tree mode
  extraData?: T | undefined;
  path?: string[] | undefined; // Only meaningful in tree mode, records node path
}

// Selection result type
export type IUserPickerResult<T = unknown> = Array<IUserPickerResultItem<T>>;

// Component props interface
export interface IUserPickerProps<T = unknown> {
  // Basic properties
  displayMode: 'list' | 'tree'; // Display mode
  dataSource: IUserPickerDataSource<T>; // Data source
  defaultSelectedItems?: Array<{ key: string; [key: string]: any }>;
  lockedItems?: Array<{ key: string; [key: string]: any }>;
  maxCount?: number | undefined;
  minCount?: number | undefined;
  onMaxCountExceed?: (selectedItems: IUserPickerResult<T>) => void;

  // Search related
  enableSearch?: boolean; // Whether to enable search
  searchPlaceholder?: string; // Search placeholder text
  onSearch?: (value: string) => void; // Search callback

  // Custom rendering
  renderItem?: (data: IUserPickerRow<T> | IUserPickerNode<T>) => any; // Vue render function or component

  // Event callbacks
  onSelectedChange?: (selectedItems: IUserPickerResult<T>) => void; // Selection change callback
  onReachEnd?: () => void; // List scroll to bottom callback (list mode)

  // Tree mode specific properties
  onExpand?: (node: IUserPickerNode<T>) => void; // Expand callback for lazy loading child items
}

// Component ref interface
export interface IUserPickerRef<T = unknown> {
  getSelectedItems: () => IUserPickerResult<T>; // Get currently selected items
  updateListData: (newDataSource: Array<IUserPickerRow<T>>) => void; // Update list data
  updateTreeData: (key: string, partialNewNode: Partial<IUserPickerNode<T>>) => void; // Update tree data
}

// Selection state type (for internal state management)
export interface ISelectionState {
  selectedKeys: Set<string>;
  halfSelectedKeys?: Set<string>; // Only valid in tree mode
}

// Tree node state type (for internal state management)
export interface ITreeState {
  expandedKeys: Set<string>;
  loadingKeys: Set<string>;
}
