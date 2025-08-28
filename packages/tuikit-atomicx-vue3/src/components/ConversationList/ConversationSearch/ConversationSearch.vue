<template>
  <div
    v-if="visible"
    :class="[$style.conversationSearch, className, {
      [$style['conversationSearch--active']]: isActive && !isShowStandard
    }]"
    :style="style"
  >
    <div
      :class="[$style.conversationSearch]"
    >
      <component
        :is="SearchBar"
        v-if="isShowStandard"
        :class="$style.conversationSearch__bar"
      />

      <div
        v-if="!isShowStandard"
        :class="$style.conversationSearch__box"
      >
        <component
          :is="Search"
          :class="[$style.conversationSearch__content, {
            [$style['searchContainer--h5']]: !isPC
          }]"
          :variant="VariantType.MINI"
          :SearchBar="SearchBar"
          :SearchResultsPresearch="SearchResultsPresearch || (() => h('div'))"
          :SearchResultsLoading="SearchResultsLoading"
          :SearchResultsEmpty="SearchResultsEmpty"
          :SearchResultItem="SearchResultItem"
          @result-item-click="handleOnSelectResult"
          @search-complete="onSearchComplete"
          @error="onError"
        />
      </div>

      <TUIDialog
        appendTo="body"
        :customClasses="[$style.conversationSearch__advanced]"
        :visible="isShowStandard"
        :show-close="false"
        :show-confirm="false"
        :show-cancel="false"
        @close="handleCloseStandard"
      >
        <component
          :is="Search"
          :class="[$style.conversationSearch__content, {
            [$style['searchContainer--h5']]: !isPC
          }]"
          :variant="VariantType.STANDARD"
          :SearchBar="SearchBar"
          :SearchResultsPresearch="SearchResultsPresearch"
          :SearchResultsLoading="SearchResultsLoading"
          :SearchResultsEmpty="SearchResultsEmpty"
          :SearchResultItem="SearchResultItem"
          @result-item-click="handleOnSelectResult"
          @search-complete="onSearchComplete"
          @error="onError"
        />
        <template #footer>
          <div />
        </template>
      </TUIDialog>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, h } from 'vue';
import type { Component } from 'vue';
import { TUIDialog, TUIToast, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useConversationListState } from '../../../states/ConversationListState';
import { useSearchState } from '../../../states/SearchState';
import { SearchType, VariantType } from '../../../types';
import { isPC } from '../../../utils';
import { Search, SearchBar } from '../../Search';
import type {
  SearchProps,
  SearchResultItemType,
  MessageModel,
  SearchCloudUsersResultItem,
  SearchCloudGroupsResultItem,
  SearchCloudMessagesResultItem,
} from '../../../types';

interface ConversationSearchProps extends SearchProps {
  visible?: boolean;
  Search?: Component<SearchProps>;
}

const props = withDefaults(defineProps<ConversationSearchProps>(), {
  visible: true,
  Search: () => Search,
  SearchBar: () => SearchBar,
});

const emit = defineEmits<{
  keywordChange: [value: string];
  resultItemClick: [item: SearchResultItemType, type: SearchType];
  searchComplete: [];
  error: [error: any];
}>();

const isActive = ref(false);
const isShowStandard = ref(false);
const searchMode = ref(VariantType.MINI);

const { t } = useUIKit();
const { keyword, setKeyword, setSelectedType } = useSearchState();
const { setActiveConversation } = useConversationListState();

const handleCloseStandard = () => {
  isShowStandard.value = false;
  searchMode.value = VariantType.MINI;
  setKeyword('');
};

const handleSearchChange = (value: string) => {
  isActive.value = !!value;
  const isMiniSearchClose = !value && searchMode.value === VariantType.MINI;
  const isStandardSearchClose = !isPC && searchMode.value === VariantType.STANDARD && !value;

  if (isMiniSearchClose || isStandardSearchClose) {
    handleCloseStandard();
  }
  emit('keywordChange', value);
};

const handleSearchUserClick = (item: SearchCloudUsersResultItem) => {
  const { profile } = item || {};
  const conversationID = `C2C${profile.userID}`;
  setActiveConversation(conversationID);
  handleCloseStandard();
};

const handleSearchGroupClick = (item: SearchCloudGroupsResultItem) => {
  const { conversation } = item || {};
  if (conversation) {
    setActiveConversation(conversation.conversationID);
  } else {
    TUIToast.error({
      message: t('TUIConversation.You are not in the group, please join the group first'),
    });
  }
  handleCloseStandard();
};

const handleSearchChatMessageClick = (item: SearchResultItemType) => {
  const { conversationID: messageConversationID = '' } = (item as MessageModel) || {};
  const { conversationID = '' } = (item as SearchCloudMessagesResultItem)?.conversation || {};
  const targetConversationID = conversationID || messageConversationID;
  if (targetConversationID) {
    setActiveConversation(targetConversationID);
    handleCloseStandard();
  }
};

const handleOnSelectResult = (item: SearchResultItemType, type: SearchType) => {
  if (props.onResultItemClick) {
    emit('resultItemClick', item, type);
    return;
  }

  switch (type) {
    case SearchType.USER:
      handleSearchUserClick(item as SearchCloudUsersResultItem);
      break;
    case SearchType.GROUP:
      handleSearchGroupClick(item as SearchCloudGroupsResultItem);
      break;
    case SearchType.CHAT_MESSAGE:
      handleSearchChatMessageClick(item);
      break;
    default:
      if (searchMode.value === VariantType.MINI) {
        isShowStandard.value = true;
        searchMode.value = VariantType.STANDARD;
        setSelectedType(type);
      }
      break;
  }
};

watch(keyword, handleSearchChange, { immediate: true });
</script>

<style lang="scss" module>
@import './ConversationSearch.scss';
</style>
