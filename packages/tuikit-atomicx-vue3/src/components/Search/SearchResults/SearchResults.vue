<!-- eslint-disable import/extensions -->
<template>
  <div v-if="!keyword">
    <component
      :is="SearchResultsPresearch"
      v-if="SearchResultsPresearch"
    />
    <component
      :is="SearchResultsEmpty"
      v-else
      :text="t('Search.input.placeholder.keywords')"
    />
  </div>
  <div
    v-else-if="error"
    :class="$style['SearchResults__error']"
  >
    {{ error.message }}
  </div>

  <div v-else-if="!results?.size && isLoading">
    <component :is="SearchResultsLoading" />
  </div>

  <div v-else-if="!results?.size && !isLoading">
    <component :is="SearchResultsEmpty" />
  </div>

  <div v-else-if="results.size > 0 && allZero">
    <component :is="SearchResultsEmpty" />
  </div>

  <div v-else-if="searchType !== 'all' && results?.get(searchType)?.totalCount === 0">
    <component :is="SearchResultsEmpty" />
  </div>

  <div
    v-else-if="showMessageDetail && isH5"
    :class="[
      variant === VariantType.EMBEDDED
        ? $style['SearchResults--embedded']
        : $style['SearchResults__message-detail-page'],
    ]"
  >
    <component
      :is="SearchResultsLoading"
      v-if="loadingType === SearchType.CHAT_MESSAGE"
    />
    <div v-else>
      <div
        v-if="variant !== VariantType.EMBEDDED"
        :class="$style['SearchResults__message-detail-header']"
      >
        <IconBack @click="handleBack" />
        <span :class="$style['SearchResults__message-detail-title']">
          {{ t('Search.results.relatedTo', { count: results?.get(SearchType.CHAT_MESSAGE)?.totalCount || 0 }) }}
          {{ t('Search.results.relatedToSuffix') }}
          <span :class="$style.SearchResults__highlight">  {{ keyword }}  </span>
        </span>
      </div>
      <div :class="$style['SearchResults__message-detail-content']">
        <div
          v-for="(item, index) in chatMessageResult?.messageList"
          :key="`${item.ID}-${index}`"
        >
          <component
            :is="SearchResultItem"
            :data="item"
            :type="SearchType.CHAT_MESSAGE"
            :keyword="keyword"
            v-bind="onResultItemClick && { onClick: onResultItemClick }"
          />
        </div>
        <div
          v-if="results?.get(SearchType.CHAT_MESSAGE)?.hasMore"
          :class="$style['SearchResults__section-footer']"
        >
          <TUIButton
            :class="$style['SearchResults__load-more-button']"
            type="text"
            :disabled="isLoading"
            @click="() => onLoadMore?.(SearchType.CHAT_MESSAGE)"
          >
            {{ isLoading ? t('Search.status.loading') : getLoadMoreText(SearchType.CHAT_MESSAGE) }}
          </TUIButton>
        </div>
      </div>
    </div>
  </div>

  <div
    v-else
    :class="$style.SearchResults"
  >
    <div
      v-if="currentResults?.size > 0"
      :class="$style.SearchResults__list"
    >
      <div
        v-for="type in renderOrder"
        :key="type"
        :class="$style['SearchResults__result-section']"
      >
        <div v-if="currentResults.get(type) && currentResults.get(type).totalCount > 0">
          <div
            v-if="searchType === 'all'"
            :class="$style['SearchResults__section-header']"
          >
            <h3>{{ t(typeLabels[type]) }}</h3>
          </div>
          <div :class="$style['SearchResults__result-items']">
            <div
              v-for="(item, index) in currentResults.get(type).resultList"
              :key="generateKey(type, item, index)"
              :class="generateActiveItemClassName(type, item)"
            >
              <component
                :is="SearchResultItem"
                :data="item"
                :type="type"
                :keyword="keyword"
                :class="$style['SearchResults__item-border']"
                @click="handleClickItem"
              />
            </div>
          </div>
          <div
            v-if="currentResults.get(type).hasMore"
            :class="$style['SearchResults__section-footer']"
          >
            <TUIButton
              :class="$style['SearchResults__load-more-button']"
              type="text"
              :disabled="loadingType === type"
              @click="() => handleLoadMore(type)"
            >
              {{ loadingType === type ? t('Search.status.loading') : getLoadMoreText(type) }}
            </TUIButton>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="activeConversation && !isH5"
      :class="$style.SearchResults__list"
    >
      <component
        :is="SearchResultsLoading"
        v-if="loadingType === SearchType.CHAT_MESSAGE"
      />
      <div v-else>
        <div
          v-if="variant === VariantType.STANDARD"
          :class="$style['SearchResults__section-header']"
        >
          <span :class="$style['SearchResults__section-header-title']">
            {{ t('Search.results.relatedTo', { count: results?.get(SearchType.CHAT_MESSAGE)?.totalCount || 0 }) }}
            <span :class="$style.SearchResults__highlight">  {{ keyword }}  </span>
            {{ t('Search.results.relatedToSuffix') }}
          </span>
          <TUIButton
            :class="$style['SearchResults__section-header-action']"
            type="text"
            @click="() => handleClickItem(chatMessageResult, SearchType.CHAT_MESSAGE)"
          >
            {{ t('Search.action.enterChat') }}
            <IconChevronRight :class="$style.SearchResults__highlight" />
          </TUIButton>
        </div>
        <div :class="$style['SearchResults__result-items']">
          <div
            v-for="(item, index) in chatMessageResult?.messageList"
            :key="`${item.ID}-${index}`"
          >
            <component
              :is="SearchResultItem"
              :data="item"
              :type="SearchType.CHAT_MESSAGE"
              :keyword="keyword"
              @click="handleClickItem"
            />
          </div>
        </div>
        <div
          v-if="results?.get(SearchType.CHAT_MESSAGE)?.hasMore"
          :class="$style['SearchResults__section-footer']"
        >
          <TUIButton
            :class="$style['SearchResults__load-more-button']"
            type="text"
            :disabled="isLoading"
            @click="() => onLoadMore?.(SearchType.CHAT_MESSAGE)"
          >
            {{ isLoading ? t('Search.status.loading') : getLoadMoreText(SearchType.CHAT_MESSAGE) }}
          </TUIButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, useCssModule, withDefaults, defineProps } from 'vue';
import { IconBack, IconChevronRight, TUIButton, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { SearchType } from '../../../types/engine';
import { VariantType, defaultTypeLabels } from '../../../types/search';
import { isH5 } from '../../../utils';
import { EmptyResult } from './EmptyResult';
import { Loading } from './Loading';
import DefaultSearchResultsItem from './SearchResultsItem';
import type {
  SearchCloudMessagesResultItem,
  ConversationModel,
  MessageModel,
  SearchCloudUsersResultItem,
  SearchCloudGroupsResultItem,
} from '../../../types/engine';
import type { SearchResultItemType, SearchResultsProps } from '../../../types/search';

const props = withDefaults(defineProps<SearchResultsProps>(), {
  variant: VariantType.STANDARD,
  searchType: 'all',
  isLoading: false,
  keyword: '',
  typeLabels: () => (defaultTypeLabels),
  SearchResultsLoading: Loading,
  SearchResultsEmpty: EmptyResult,
  SearchResultItem: DefaultSearchResultsItem,
});

const $style = useCssModule();

const { t } = useUIKit();

const defaultMiniInitLimits = new Map([
  [SearchType.MESSAGE, 3],
  [SearchType.USER, 3],
  [SearchType.GROUP, 3],
]);

const miniInitLimits = ref<Map<SearchType, number>>(defaultMiniInitLimits);
const loadingType = ref<SearchType | ''>('');
const showMessageDetail = ref(false);
const activeConversation = ref<ConversationModel | undefined>(undefined);

function updateActiveConversation() {
  const newResults = props.results;
  const { conversation } = (newResults?.get(SearchType.CHAT_MESSAGE)?.resultList[0]
    || {}) as SearchCloudMessagesResultItem;
  const { resultList = [] } = newResults?.get(SearchType.MESSAGE) || {};
  const existConversation = resultList.find((item: any) => {
    const { conversationID } = (item as SearchCloudMessagesResultItem).conversation || {};
    return conversationID === conversation?.conversationID;
  });
  const showStandardMessageList = props.variant === VariantType.STANDARD && props.searchType === SearchType.MESSAGE;
  const isEmbedded = props.variant === VariantType.EMBEDDED;
  const shouldSetConversation = showStandardMessageList && existConversation && !isH5;
  const currentConversation = shouldSetConversation || isEmbedded ? conversation : undefined;
  activeConversation.value = currentConversation;
  if (isEmbedded && isH5) {
    showMessageDetail.value = true;
  }
}

watch([() => props.results, () => props.searchType, () => props.variant], updateActiveConversation, { deep: true });

watch(
  () => props.keyword,
  () => {
    if (props.variant === VariantType.MINI) {
      miniInitLimits.value = new Map(defaultMiniInitLimits);
    }
  },
);

watch(
  () => props.isLoading,
  (newIsLoading) => {
    if (newIsLoading === false) {
      loadingType.value = '';
    }
  },
);

const allZero = computed(() => {
  if (!props.results) {
    return false;
  }
  return Array.from(props.results.values()).every(value => value.totalCount === 0);
});

const currentResults = computed(() => {
  if (!props.results || props.variant === VariantType.EMBEDDED) {
    return new Map();
  }
  if (props.variant === VariantType.MINI) {
    const limitedResults = new Map();
    props.results.forEach((value, key) => {
      const limitedNum: number = miniInitLimits.value.get(key) || 0;
      if (key !== SearchType.CHAT_MESSAGE) {
        limitedResults.set(key, {
          ...value,
          resultList: limitedNum !== 0 ? value.resultList.slice(0, limitedNum) : value.resultList,
          hasMore: limitedNum !== 0 ? value.resultList.length > limitedNum : value.hasMore,
        });
      }
    });
    return limitedResults;
  }
  const filtered = new Map();
  if (props.searchType === 'all') {
    props.results.forEach((value, key) => {
      if (key !== SearchType.CHAT_MESSAGE) {
        filtered.set(key, value);
      }
    });
  } else if (props.results.has(props.searchType)) {
    filtered.set(props.searchType, props.results.get(props.searchType));
  } else if (props.searchType === SearchType.MESSAGE && props.results.has(SearchType.CHAT_MESSAGE)) {
    filtered.set(props.searchType, props.results.get(SearchType.CHAT_MESSAGE));
  }
  return filtered;
});

const chatMessageResult = computed(
  () => props.results?.get(SearchType.CHAT_MESSAGE)?.resultList[0] as SearchCloudMessagesResultItem,
);

const renderOrder = computed(() => {
  if (props.variant !== VariantType.EXACT) {
    return [SearchType.MESSAGE, SearchType.USER, SearchType.GROUP];
  }
  return [SearchType.USER, SearchType.GROUP];
});

const getLoadMoreText = (type: SearchType) => {
  if (type === SearchType.CHAT_MESSAGE) {
    return t('Search.loadMore.messages');
  }
  if (type === SearchType.MESSAGE) {
    return t('Search.loadMore.messages');
  }
  if (type === SearchType.USER) {
    return t('Search.loadMore.users');
  }
  if (type === SearchType.GROUP) {
    return t('Search.loadMore.groups');
  }
  return t('Search.loadMore.default');
};

const generateActiveItemClassName = (type: SearchType, item: SearchResultItemType) => {
  if (type !== SearchType.MESSAGE || !chatMessageResult.value) {
    return '';
  }
  const { conversationID } = (item as SearchCloudMessagesResultItem).conversation || {};
  const { conversationID: currentConversationID } = chatMessageResult.value.conversation || {};
  return conversationID === currentConversationID ? $style['SearchResults__item--active'] : '';
};

const handleLoadMore = (type: SearchType) => {
  if (props.variant === VariantType.MINI) {
    miniInitLimits.value = new Map(miniInitLimits.value).set(type, 0);
  }
  loadingType.value = type;
  props.onLoadMore?.(type);
};

const handleClickItem = (data: SearchResultItemType, type: SearchType) => {
  if (type === SearchType.MESSAGE) {
    showMessageDetail.value = true;
    loadingType.value = SearchType.CHAT_MESSAGE;
  }
  props.onResultItemClick?.(data, type);
};

const handleBack = () => {
  showMessageDetail.value = false;
};

const generateKey = (type: SearchType, item: SearchResultItemType, index: number) => {
  if (type === SearchType.MESSAGE) {
    return `${type}-${(item as SearchCloudMessagesResultItem).conversation?.conversationID}-${index}`;
  }
  if (type === SearchType.CHAT_MESSAGE) {
    return `${type}-${(item as MessageModel)?.ID}-${index}`;
  }
  if (type === SearchType.USER) {
    return `${type}-${(item as SearchCloudUsersResultItem)?.profile.userID}-${index}`;
  }
  if (type === SearchType.GROUP) {
    return `${type}-${(item as SearchCloudGroupsResultItem)?.groupInfo.groupID}-${index}`;
  }
};
</script>

<style lang="scss" module>
@import './SearchResults.scss';
</style>
