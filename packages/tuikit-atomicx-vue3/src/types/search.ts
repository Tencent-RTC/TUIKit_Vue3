import type { Component, CSSProperties } from 'vue';
import type { MessageInfo } from '@atomicxcore/core';
// import { SearchType } from './engine';
import type {
  // SearchResult,
  // SearchCloudMessagesResultItem,
  // SearchCloudUsersResultItem,
  // SearchCloudGroupsResultItem,
  // SearchParamsMap,
  // MessageModel,
} from './engine';

export enum VariantType {
  MINI = 'mini',
  STANDARD = 'standard',
  EMBEDDED = 'embedded',
  EXACT = 'exact',
}

export enum SearchType {
  MESSAGE = 'message',
  CHAT_MESSAGE = 'chat_message',
  USER = 'user',
  GROUP = 'group',
}

export type SearchTabType = SearchType | 'all';

export interface AdvancedProps {
  variant: VariantType;
  advancedParams?: Map<SearchType, any>;
  onAdvancedParamsChange?: (type: SearchType, params: any) => void;
}

export interface SearchTabProps {
  activeTab: SearchTabType;
  onTabChange?: (tab: SearchTabType) => void;
}

export type SearchResultItemType =
  | MessageInfo;

interface ResultItemMap {
  [SearchType.MESSAGE]: any;
  [SearchType.CHAT_MESSAGE]: MessageInfo;
  [SearchType.USER]: any;
  [SearchType.GROUP]: any;
}

export interface ResultItemProps<T extends SearchType> {
  keyword: string;
  data: ResultItemMap[T];
  type?: T;
  className?: string;
  style?: CSSProperties;
  onClick?: (data: SearchResultItemType, type: SearchType) => void;
}

export interface SearchBarProps {
  value?: string;
  onChange?: (e: Event) => void;
  onKeyDown?: (e: KeyboardEvent) => void;
  onClear?: () => void;
  placeholder?: string;
  SearchIcon?: Component | undefined;
  ClearIcon?: Component | undefined;
  className?: string;
  style?: CSSProperties;
  onFocus?: (e: FocusEvent) => void;
  onBlur?: (e: FocusEvent) => void;
  autoFocus?: boolean;
  variant?: VariantType;
}

export interface SearchAdvancedProps {
  variant: VariantType;
  searchType: SearchTabType;
  advancedParams: Map<SearchType, any>;
  onAdvancedParamsChange: (type: SearchType, params: any) => void;
}

export interface SearchResultsProps {
  results: Map<SearchType, any>;
  isLoading: boolean;
  error?: Error | null;
  keyword: string;
  typeLabels: Record<SearchType, string>;
  onLoadMore?: (type: SearchType) => void;
  onResultItemClick?: (data: SearchResultItemType, type: SearchType) => void;
  SearchResultsPresearch?: Component;
  SearchResultsLoading?: Component;
  SearchResultsEmpty?: Component;
  SearchResultItem?: Component<ResultItemProps<SearchType>>;
  variant?: VariantType;
  searchType?: SearchType | 'all';
}

export interface SearchProps {
  // 搜索模式
  variant?: VariantType;

  /**
   * For EMBEDDED variant: scope the message search to this conversation.
   */
  conversationID?: string;

  // 自定义组件
  SearchBar?: Component<SearchBarProps> | undefined;
  SearchResults?: Component<SearchResultsProps> | undefined;
  SearchAdvanced?: Component<SearchAdvancedProps> | undefined;
  SearchResultsPresearch?: Component | undefined;
  SearchResultsLoading?: Component | undefined;
  SearchResultsEmpty?: Component | undefined;
  SearchResultItem?: Component<ResultItemProps<SearchType>> | undefined;

  // 控制选项
  debounceTime?: number;
  autoFocus?: boolean;

  // 样式属性
  className?: string;
  style?: CSSProperties;

  // 事件回调
  onKeywordChange?: (keyword: string) => void;
  onSearchComplete?: (results: Map<SearchType, any>) => void;
  onResultItemClick?: (data: SearchResultItemType, type: SearchType) => void;
  onError?: (error: Error) => void;
}

export const defaultTypeLabels: Record<string, string> = {
  [SearchType.MESSAGE]: 'Search.type.messages',
  [SearchType.CHAT_MESSAGE]: 'Search.type.messages',
  [SearchType.USER]: 'Search.type.users',
  [SearchType.GROUP]: 'Search.type.groups',
};
