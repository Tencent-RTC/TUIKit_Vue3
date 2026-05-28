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
      @tab-change="handleTabChange"
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
import { ref, computed, watch, inject } from 'vue';
import { useChatContext, useSearchStore, useContactStore, useGroupStore } from '../../chat-store';
import { SearchType as CoreSearchType } from '@atomicxcore/core';
import type { SearchOption } from '@atomicxcore/core';
import type { SearchStoreAPI } from '../../chat-store';
import { SearchType } from '../../types/search';
import { VariantType, defaultTypeLabels } from '../../types/search';
import { debounce } from '../../utils/lodash';
import DefaultSearchAdvanced from './SearchAdvanced';
import DefaultSearchBar from './SearchBar';
import DefaultSearchResults from './SearchResults';
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

// --- Store: prefer injected instance (shared by ConversationSearch), else create own ---
const injectedStore = inject<SearchStoreAPI | null>('searchStore', null);
const ownStore = injectedStore ? null : useSearchStore();
const store = (injectedStore ?? ownStore) as SearchStoreAPI;

// For EXACT mode: precise lookup by userID / groupID
const { getContactInfo } = useContactStore();
const { getGroupInfo } = useGroupStore();

// For EMBEDDED mode: read activeConversation from ChatContext.
const channel = inject('channel', 'default') as string;
const { activeConversation } = useChatContext(channel);

// Separate store instance for CHAT_MESSAGE sub-search (conversation-scoped message search).
// This keeps the main MESSAGE results intact while showing per-conversation messages on the right.
const chatMessageStore = computed(() => {
  if (activeConversation.value?.conversationID) {
    return useSearchStore();
  }
  return null;
});

// --- Component-managed state ---
const searchValue = ref('');
const selectedSearchType = ref<SearchType | 'all'>('all');
const searchAdvancedParams = ref<Map<SearchType, any>>(new Map());
const error = ref<Error | null>(null);
const keyword = computed(() => searchValue.value);
const isLoadingMore = ref(false);
const isSearchingLocal = ref(false);
const isChatMessageSearching = ref(false);
const isLoading = computed(() => isSearchingLocal.value || isLoadingMore.value || isChatMessageSearching.value || isExactSearching.value);

// EXACT mode results (user + group precise lookup)
const exactUserResults = ref<any[]>([]);
const exactGroupResults = ref<any[]>([]);
const isExactSearching = ref(false);

// --- Core SearchType mapping ---
const coreSearchTypeMap: Record<string, CoreSearchType> = {
  [SearchType.USER]: CoreSearchType.User,
  [SearchType.GROUP]: CoreSearchType.Group,
  [SearchType.MESSAGE]: CoreSearchType.Message,
  [SearchType.CHAT_MESSAGE]: CoreSearchType.Message,
};

// --- Build SearchOption from variant + advancedParams ---
function buildSearchOption(): SearchOption {
  const option: SearchOption = {};

  if (props.variant === VariantType.EMBEDDED) {
    option.searchScope = [CoreSearchType.Message];
    // Prefer activeConversation from UIContext, then prop, then advancedParams
    const conversationID = activeConversation.value?.conversationID
      || props.conversationID
      || (searchAdvancedParams.value.get(SearchType.CHAT_MESSAGE) as any)?.conversationID;
    if (conversationID) {
      option.messageFilter = { conversationID };
    }
  } else if (props.variant === VariantType.EXACT) {
    return option;
  } else {
    // MINI / STANDARD
    const selected = selectedSearchType.value;
    if (selected === 'all') {
      option.searchScope = [CoreSearchType.User, CoreSearchType.Group, CoreSearchType.Message];
    } else if (selected === SearchType.MESSAGE) {
      option.searchScope = [CoreSearchType.Message];
      const msgParams = searchAdvancedParams.value.get(SearchType.MESSAGE) as any;
      if (msgParams) {
        option.messageFilter = {
          senderUserIDList: msgParams.senderUserIDList,
          messageTypeList: msgParams.messageTypeList,
          searchTimePosition: msgParams.timePosition,
          searchTimePeriod: msgParams.timePeriod,
        };
      }
    } else if (selected === SearchType.USER) {
      option.searchScope = [CoreSearchType.User];
      const userParams = searchAdvancedParams.value.get(SearchType.USER) as any;
      if (userParams) {
        option.userFilter = {
          gender: userParams.gender,
          minBirthday: userParams.minBirthday,
          maxBirthday: userParams.maxBirthday,
        };
      }
    } else if (selected === SearchType.GROUP) {
      option.searchScope = [CoreSearchType.Group];
    }
  }
  return option;
}

// --- Execute main search ---
async function doSearch(searchKeyword: string) {
  const trimmed = searchKeyword.trim();
  if (!trimmed) return;
  try {
    error.value = null;
    isSearchingLocal.value = true;
    await store.search([trimmed], buildSearchOption());
  } catch (err) {
    error.value = err as Error;
    props.onError?.(err as Error);
  } finally {
    isSearchingLocal.value = false;
  }
}

// --- Execute EXACT search (precise userID / groupID lookup) ---
async function doExactSearch(keyword: string) {
  const trimmed = keyword.trim();
  if (!trimmed) return;
  try {
    isExactSearching.value = true;
    error.value = null;
    exactUserResults.value = [];
    exactGroupResults.value = [];
    const [users, group] = await Promise.allSettled([
      getContactInfo([trimmed]),
      getGroupInfo(trimmed),
    ]);
    if (users.status === 'fulfilled' && users.value.length > 0) {
      exactUserResults.value = users.value.map(u => ({ profile: u }));
    }
    if (group.status === 'fulfilled' && group.value?.groupID) {
      const g = group.value;
      exactGroupResults.value = [{
        groupInfo: {
          groupID: g.groupID,
          groupName: g.groupName,
          groupAvatarURL: g.avatarURL,
          groupType: g.groupType,
          memberCount: g.memberCount,
          introduction: g.introduction,
        },
      }];
    }
  } catch (err) {
    error.value = err as Error;
  } finally {
    isExactSearching.value = false;
  }
}
async function doChatMessageSearch(conversationID: string) {
  if (!searchValue.value.trim() || !conversationID) return;
  try {
    isChatMessageSearching.value = true;
    const msgParams = searchAdvancedParams.value.get(SearchType.MESSAGE) as any;
    await chatMessageStore.value?.search([searchValue.value.trim()], {
      searchScope: [CoreSearchType.Message],
      messageFilter: {
        conversationID,
        senderUserIDList: msgParams?.senderUserIDList,
        messageTypeList: msgParams?.messageTypeList,
        searchTimePosition: msgParams?.timePosition,
        searchTimePeriod: msgParams?.timePeriod,
      },
    });
  } catch (err) {
    console.error('[Search] chatMessageSearch error', err);
  } finally {
    isChatMessageSearching.value = false;
  }
}

// --- Convert flat store results to Map<SearchType, SearchResult> for SearchResults ---
const results = computed(() => {
  const map = new Map();

  // EXACT mode: use precise lookup results instead of cloud search
  if (props.variant === VariantType.EXACT) {
    if (exactUserResults.value.length > 0) {
      map.set(SearchType.USER, {
        resultList: exactUserResults.value,
        hasMore: false,
        totalCount: exactUserResults.value.length,
        cursor: '',
        params: {},
      });
    }
    if (exactGroupResults.value.length > 0) {
      map.set(SearchType.GROUP, {
        resultList: exactGroupResults.value,
        hasMore: false,
        totalCount: exactGroupResults.value.length,
        cursor: '',
        params: {},
      });
    }
    return map;
  }

  if (store.userList.value.length > 0 || store.userTotalCount.value > 0) {
    map.set(SearchType.USER, {
      resultList: store.userList.value.map(profile => ({ profile })),
      hasMore: store.hasMoreUsers.value,
      totalCount: store.userTotalCount.value,
      cursor: '',
      params: {},
    });
  }

  if (store.groupList.value.length > 0 || store.groupTotalCount.value > 0) {
    map.set(SearchType.GROUP, {
      resultList: store.groupList.value.map(groupInfo => ({ groupInfo })),
      hasMore: store.hasMoreGroups.value,
      totalCount: store.groupTotalCount.value,
      cursor: '',
      params: {},
    });
  }

  // MESSAGE results from main store (global message search, grouped by conversation)
  if (store.messageResults.value.length > 0 || store.messageResultTotalCount.value > 0) {
    map.set(SearchType.MESSAGE, {
      resultList: store.messageResults.value,
      hasMore: store.hasMoreMessageResults.value,
      totalCount: store.messageResultTotalCount.value,
      cursor: '',
      params: {},
    });
  }

  // CHAT_MESSAGE results from chatMessageStore (conversation-scoped sub-search)
  if (
    chatMessageStore.value?.messageResults.value.length! > 0
    || chatMessageStore.value?.messageResultTotalCount.value! > 0
  ) {
    map.set(SearchType.CHAT_MESSAGE, {
      resultList: chatMessageStore.value?.messageResults.value,
      hasMore: chatMessageStore.value?.hasMoreMessageResults.value,
      totalCount: chatMessageStore.value?.messageResultTotalCount.value,
      cursor: '',
      params: {},
    });
  }

  return map;
});

// --- Debounced search ---
const debouncedSearch = debounce(async (searchKeyword: string) => {
  if (props.variant === VariantType.EMBEDDED) {
    const conversationID = activeConversation.value?.conversationID || props.conversationID;
    if (conversationID) {
      await doChatMessageSearch(conversationID);
    }
  } else {
    await doSearch(searchKeyword);
  }
}, props.debounceTime);

// --- Event handlers ---
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
    if (props.variant === VariantType.EMBEDDED) {
      const conversationID = activeConversation.value?.conversationID || props.conversationID;
      if (conversationID) {
        doChatMessageSearch(conversationID);
      }
    } else if (props.variant === VariantType.EXACT) {
      doExactSearch(searchValue.value);
    } else {
      doSearch(searchValue.value);
    }
  }
};

const handleClear = () => {
  searchValue.value = '';
  debouncedSearch.cancel?.();
  error.value = null;
  searchAdvancedParams.value = new Map();
  selectedSearchType.value = 'all';
  exactUserResults.value = [];
  exactGroupResults.value = [];
  props.onKeywordChange?.('');
};

watch(() => activeConversation.value?.conversationID, (newID, oldID) => {
  if (props.variant === VariantType.EMBEDDED && newID !== oldID) {
    handleClear();
    props.onKeywordChange?.('');
  }
}, { immediate: true });

const handleAdvancedChange = (type: SearchType, params: any) => {
  const currentParams: any = searchAdvancedParams.value.get(type) || {};
  const newParams = new Map(searchAdvancedParams.value);
  newParams.set(type, { ...currentParams, ...params });
  searchAdvancedParams.value = newParams;

  if (searchValue.value) {
    doSearch(searchValue.value);
  }
};

const handleResultItemClick = (item: SearchResultItemType, type: SearchType) => {
  if (props.onResultItemClick) {
    props.onResultItemClick(item, type);
  }
  if (type === SearchType.MESSAGE) {
    // User clicked a conversation in MESSAGE results → trigger CHAT_MESSAGE sub-search
    const conversationID = (item as any).conversationID ?? '';
    if (conversationID) {
      doChatMessageSearch(conversationID);
    }
  }
  if (type === SearchType.CHAT_MESSAGE) {
    // "Enter chat" button or clicking a specific message in CHAT_MESSAGE results.
    // Navigation is handled by Message.vue for individual messages.
    // For the "Enter chat" button, item is a MessageSearchResultItem with conversationID.
    // The parent (ConversationSearch) will handle closing the search panel via its own onResultItemClick.
  }
};

const handleViewMore = (type: SearchType) => {
  if (props.variant === VariantType.STANDARD && type !== SearchType.CHAT_MESSAGE) {
    selectedSearchType.value = type;
  }
  // CHAT_MESSAGE load-more uses the chatMessageStore
  if (type === SearchType.CHAT_MESSAGE) {
    isLoadingMore.value = true;
    chatMessageStore.value?.searchMore(CoreSearchType.Message).finally(() => {
      isLoadingMore.value = false;
    });
    return;
  }
  const coreType = coreSearchTypeMap[type];
  if (coreType) {
    isLoadingMore.value = true;
    store.searchMore(coreType).finally(() => {
      isLoadingMore.value = false;
    });
  }
};

// --- Expose setSelectedType for ConversationSearch ---
const setSelectedType = (type: SearchType | 'all') => {
  selectedSearchType.value = type;
  if (searchValue.value) {
    doSearch(searchValue.value);
  }
};

const handleTabChange = (tab: SearchType | 'all') => {
  setSelectedType(tab);
};

defineExpose({
  setSelectedType,
  setKeyword: async (k: string) => {
    searchValue.value = k;
    if (k.trim()) {
      debouncedSearch.cancel?.();
      await doSearch(k);
    }
  },
  triggerMessageDetail: (conversationID: string) => {
    if (conversationID) {
      doChatMessageSearch(conversationID);
    }
  },
});

const stopClickPropagation = (e: Event) => {
  e.stopPropagation();
};
</script>

<style lang="scss" module>
@use './Search.scss';
</style>
