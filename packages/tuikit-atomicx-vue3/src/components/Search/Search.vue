<!-- eslint-disable import/extensions -->
<template>
  <div
    :class="[$style.Search, props.className]"
    :style="props.style"
    @click="stopClickPropagation"
  >
    <component
      :is="SearchBar"
      :value="searchValue"
      :on-change="handleInputChange"
      :on-key-down="handleKeyDown"
      :on-clear="handleClear"
      :auto-focus="autoFocus"
      :variant="variant"
    />
    <component
      :is="SearchAdvanced"
      :variant="variant"
      :search-type="selectedSearchType"
      :advanced-params="searchAdvancedParams"
      :on-advanced-params-change="handleAdvancedChange"
    />
    <component
      :is="SearchResults"
      :results="results"
      :is-loading="isLoading"
      :error="error"
      :keyword="keyword"
      :type-labels="defaultTypeLabels"
      :search-type="selectedSearchType"
      :on-result-item-click="handleResultItemClick"
      :on-load-more="handleViewMore"
      :SearchResultsPresearch="SearchResultsPresearch"
      :SearchResultsLoading="SearchResultsLoading"
      :SearchResultsEmpty="SearchResultsEmpty"
      :SearchResultItem="SearchResultItem"
      :variant="variant"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, defineProps, withDefaults } from 'vue';
import { useSearchState } from '../../states/SearchState';
import { SearchType } from '../../types/engine';
import { VariantType, defaultTypeLabels } from '../../types/search';
import { debounce } from '../../utils/lodash';
import DefaultSearchAdvanced from './SearchAdvanced';
import DefaultSearchBar from './SearchBar';
import DefaultSearchResults from './SearchResults';
import type { SearchCloudMessagesResultItem, SearchParamsMap } from '../../types/engine';
import type { SearchResultItemType, SearchProps } from '../../types/search';

const props = withDefaults(defineProps<SearchProps>(), {
  SearchBar: DefaultSearchBar,
  SearchResults: DefaultSearchResults,
  SearchAdvanced: DefaultSearchAdvanced,
  debounceTime: 300,
  variant: VariantType.MINI,
  autoFocus: false,
  className: '',
  style: () => ({}),
  SearchResultsPresearch: undefined,
  SearchResultsLoading: undefined,
  SearchResultsEmpty: undefined,
  SearchResultItem: undefined,
});

const {
  keyword,
  results,
  isLoading,
  error,
  selectedSearchType,
  searchAdvancedParams,
  setKeyword,
  setSelectedType,
  loadMore,
  setSearchMessageAdvancedParams,
  setSearchUserAdvancedParams,
  setSearchGroupAdvancedParams,
} = useSearchState(props.variant);

const searchValue = ref(keyword.value);

const isExternalUpdate = ref(false);

const debouncedSearch = debounce(async (searchKeyword: string) => {
  try {
    isExternalUpdate.value = true;
    await setKeyword(searchKeyword);
  } catch (err) {
    props.onError?.(err as Error);
  }
}, props.debounceTime);

watch(
  searchValue,
  (newValue) => {
    if (!isExternalUpdate.value) {
      debouncedSearch(newValue);
    }
  },
  { immediate: false },
);

watch(keyword, (newKeyword) => {
  if (isExternalUpdate.value) {
    isExternalUpdate.value = false;
    return;
  }
  searchValue.value = newKeyword;
});

const handleInputChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  const { value } = target;
  searchValue.value = value;
  props.onKeywordChange?.(value);
  if (props.variant !== VariantType.EXACT) {
    debouncedSearch(value);
  }
};

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    debouncedSearch.cancel?.();
    isExternalUpdate.value = true;
    setKeyword(searchValue.value);
  }
};

const handleClear = () => {
  searchValue.value = '';
  debouncedSearch.cancel?.();
  isExternalUpdate.value = true;
  setKeyword('');
  props.onKeywordChange?.('');
};

const handleAdvancedChange = (type: SearchType, params: SearchParamsMap[SearchType]) => {
  const storeParams: any = searchAdvancedParams.value.get(type) || {};
  switch (type) {
    case SearchType.MESSAGE:
      setSearchMessageAdvancedParams({
        ...storeParams,
        ...params,
      });
      break;
    case SearchType.USER:
      setSearchUserAdvancedParams({
        ...storeParams,
        ...params,
      });
      break;
    case SearchType.GROUP:
      setSearchGroupAdvancedParams({
        ...storeParams,
        ...params,
      });
      break;
    default:
      break;
  }
};

const handleResultItemClick = (item: SearchResultItemType, type: SearchType) => {
  if (props.onResultItemClick) {
    props.onResultItemClick(item, type);
  }
  if (type === SearchType.MESSAGE) {
    const { conversationID = '' } = (item as SearchCloudMessagesResultItem).conversation || {};
    handleAdvancedChange(SearchType.MESSAGE, { conversationID });
  }
};

const handleViewMore = (type: SearchType) => {
  if (props.variant === VariantType.STANDARD && type !== SearchType.CHAT_MESSAGE) {
    setSelectedType(type);
  }
  loadMore?.(type);
};

const stopClickPropagation = (e: Event) => {
  e.stopPropagation();
};
</script>

<style lang="scss" module>
@import './Search.scss';
</style>
