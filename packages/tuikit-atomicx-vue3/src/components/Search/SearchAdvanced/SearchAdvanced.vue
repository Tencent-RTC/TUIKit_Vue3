<!-- eslint-disable import/extensions -->
<template>
  <div :class="$style.SearchAdvanced">
    <SearchTab v-if="variant === VariantType.STANDARD" :active-tab="searchType" @tab-change="handleTabChange" />
    <MessageAdvanced
      v-if="variant === VariantType.STANDARD && searchType === SearchType.MESSAGE"
      :variant="variant"
      :advanced-params="advancedParams"
      @advanced-params-change="handleMessageAdvancedChange"
    />
    <UserAdvanced
      v-if="variant === VariantType.STANDARD && searchType === SearchType.USER"
      :variant="variant"
      :advanced-params="advancedParams"
      @advanced-params-change="handleUserAdvancedChange"
    />
  </div>
</template>

<script lang="ts" setup>
import { defineProps, withDefaults } from 'vue';
import { VariantType } from '../../../types/search';
import { SearchType } from '../../../types/engine';
import { useSearchState } from '../../../states/SearchState';
import type { SearchAdvancedProps, SearchTabType } from '../../../types/search';
import { SearchTab } from './SearchTab';
import { MessageAdvanced } from './MessageAdvanced';
import { UserAdvanced } from './UserAdvanced';

const props = withDefaults(defineProps<SearchAdvancedProps>(), {
  variant: VariantType.STANDARD,
  searchType: 'all',
});

const { setSelectedType } = useSearchState(props.variant);

const handleTabChange = (tab: SearchTabType) => {
  setSelectedType(tab);
};

// 处理 MessageAdvanced 组件的回调
const handleMessageAdvancedChange = (params: Map<SearchType, any>) => {
  const messageParams = params.get(SearchType.MESSAGE);
  if (messageParams) {
    props.onAdvancedParamsChange(SearchType.MESSAGE, messageParams);
  }
};

// 处理 UserAdvanced 组件的回调
const handleUserAdvancedChange = (params: Map<SearchType, any>) => {
  const userParams = params.get(SearchType.USER);
  if (userParams) {
    props.onAdvancedParamsChange(SearchType.USER, userParams);
  }
};
</script>

<style lang="scss" module>
@import './SearchAdvanced.scss';
</style>
