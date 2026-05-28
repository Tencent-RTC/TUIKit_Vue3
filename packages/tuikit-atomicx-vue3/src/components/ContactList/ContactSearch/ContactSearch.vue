<template>
  <div
    :class="['contact-search', { 'contact-search--active': isShowSearch }]"
  >
    <div
      v-if="!isShowSearch"
      class="contact-search__pre-search"
      @click="openContactSearch"
    >
      <label
        htmlFor="contactSearch__label"
        class="contact-search__add"
      >
        <IconSearchMore />
      </label>
      <span class="contact-search__label">{{ t('TUIContact.Add friend/group') }}</span>
    </div>

    <Search
      v-else
      ref="searchRef"
      :variant="VariantType.EXACT"
      :SearchBar="CustomSearchBar"
      :SearchResultsPresearch="CustomSearchResultsPresearch"
      @keyword-change="handleKeywordChange"
      @result-item-click="handleResultItemClick"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, h } from 'vue';
import { IconSearchMore, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { VariantType, ContactItemType } from '../../../types';
import { SearchType } from '../../../types/search';
import { Search, SearchBar } from '../../Search';
import type {
  SearchResultItemType,
  SearchBarProps,
} from '../../../types';

const emit = defineEmits<{
  'result-click': [item: any];
  'keyword-change': [keyword: string];
}>();

const { t } = useUIKit();

const isShowSearch = ref(false);
const searchRef = ref<any>(null);

const handleResultItemClick = (item: SearchResultItemType, type: SearchType) => {
  if (type === SearchType.USER) {
    emit('result-click', {
      type: ContactItemType.SEARCH_USER,
      data: (item as any).profile,
    });
  }

  if (type === SearchType.GROUP) {
    emit('result-click', {
      type: ContactItemType.SEARCH_GROUP,
      data: (item as any).groupInfo,
    });
  }
};

const handleCancel = () => {
  searchRef.value?.setKeyword?.('');
  isShowSearch.value = false;
};

const openContactSearch = () => {
  isShowSearch.value = true;
};

const handleKeywordChange = (keyword: string) => {
  emit('keyword-change', keyword);
};

const CustomSearchResultsPresearch = () => null;

const CustomSearchBar = (searchBarProps: SearchBarProps) => h('div', { class: 'contact-search__search-bar-box' }, [
  h(SearchBar, {
    class: 'contact-search__search-bar',
    ...searchBarProps,
  }),
  h('span', {
    class: 'contact-search__cancel',
    onClick: handleCancel,
  }, t('TUIContact.Cancel')),
]);
</script>

<style scoped lang="scss">
@use './ContactSearch.scss';
</style>
