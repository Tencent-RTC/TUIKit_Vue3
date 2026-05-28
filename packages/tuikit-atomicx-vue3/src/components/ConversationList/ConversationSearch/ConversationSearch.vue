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
          ref="miniSearchRef"
          :class="[$style.conversationSearch__content, {
            [$style['searchContainer--h5']]: !isPC
          }]"
          :variant="VariantType.MINI"
          :SearchBar="SearchBar"
          :SearchResultsPresearch="SearchResultsPresearch || (() => h('div'))"
          :SearchResultsLoading="SearchResultsLoading"
          :SearchResultsEmpty="SearchResultsEmpty"
          :SearchResultItem="SearchResultItem"
          :on-keyword-change="handleSearchChange"
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
        @close="handleCloseStandard"
      >
        <component
          :is="Search"
          ref="standardSearchRef"
          :class="[$style.conversationSearch__content, {
            [$style['searchContainer--h5']]: !isPC
          }]"
          :variant="VariantType.STANDARD"
          :SearchBar="SearchBar"
          :SearchResultsPresearch="SearchResultsPresearch"
          :SearchResultsLoading="SearchResultsLoading"
          :SearchResultsEmpty="SearchResultsEmpty"
          :SearchResultItem="SearchResultItem"
          :on-keyword-change="handleSearchChange"
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
import { ref, provide, h, inject, nextTick } from 'vue';
import type { Component } from 'vue';
import { TUIDialog, TUIToast, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useSearchStore } from '../../../chat-store';
import type { SearchStoreAPI } from '../../../chat-store';
import { useChatContext, useGroupStore } from '../../../chat-store';
import { SearchType, VariantType } from '../../../types';
import { isPC } from '../../../utils';
import { Search, SearchBar } from '../../Search';
import type { SearchProps, SearchResultItemType } from '../../../types/search';
import { ConversationType } from '@atomicxcore/core';

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
const currentKeyword = ref('');

const { t } = useUIKit();
const channel = inject('channel', 'default') as string;

// Create a shared search store instance, provide for child Search components
const searchStore = useSearchStore();
provide('searchStore', searchStore);

const { getConversationInfo, setActiveConversation } = useChatContext(channel);
const groupStore = useGroupStore();

const miniSearchRef = ref<any>(null);
const standardSearchRef = ref<any>(null);

const activateConversationByID = async (conversationID: string): Promise<void> => {
  try {
    const info = await getConversationInfo(conversationID);
    if (info.type === ConversationType.Group) {
      const groupID = conversationID.replace(/^GROUP/, '');
      try {
        const groupInfo = await groupStore.getGroupInfo(groupID);
        await groupStore.loadJoinedGroups();
        const isInGroup = !!groupStore.joinedGroupList.value.find(g => g.groupID === groupID);
        if (!groupInfo?.groupID) {
          TUIToast.error({ message: t('TUIConversation.the_group_chat_has_been_disbanded') });
          return;
        } else if (!isInGroup) {
          TUIToast.error({ message: t('TUIConversation.You are not in the group, please join the group first') });
        }
      } catch {
        TUIToast.error({ message: t('TUIConversation.the_group_chat_has_been_disbanded') });
        return;
      }
    }
    setActiveConversation(info.conversationID);
  } catch (err) {
    TUIToast.error({ message: t('TUIConversation.conversation_not_found') });
    console.error('[ConversationSearch.activateConversationByID] failed', err);
  }
};

const handleCloseStandard = () => {
  isShowStandard.value = false;
  // Clear keyword on the search refs
  miniSearchRef.value?.setKeyword?.('');
  standardSearchRef.value?.setKeyword?.('');
  isActive.value = false;
};

const handleSearchChange = (value: string) => {
  isActive.value = !!value;
  currentKeyword.value = value;
  const isMiniSearchClose = !value && !isShowStandard.value;
  const isStandardSearchClose = !isPC && isShowStandard.value && !value;

  if (isMiniSearchClose || isStandardSearchClose) {
    handleCloseStandard();
  }
  emit('keywordChange', value);
};

const handleSearchUserClick = (item: any) => {
  const { profile } = item || {};
  const conversationID = `C2C${profile?.userID}`;
  activateConversationByID(conversationID);
  handleCloseStandard();
};

const handleSearchGroupClick = (item: any) => {
  const { groupInfo } = item || {};
  if (groupInfo?.groupID) {
    const conversationID = `GROUP${groupInfo.groupID}`;
    activateConversationByID(conversationID);
  } else {
    TUIToast.error({
      message: t('TUIConversation.You are not in the group, please join the group first'),
    });
  }
  handleCloseStandard();
};

const handleOnSelectResult = (item: SearchResultItemType, type: SearchType) => {
  if (props.onResultItemClick) {
    emit('resultItemClick', item, type);
    return;
  }

  switch (type) {
    case SearchType.USER:
      handleSearchUserClick(item);
      break;
    case SearchType.GROUP:
      handleSearchGroupClick(item);
      break;
    case SearchType.MESSAGE:
      if (!isShowStandard.value) {
        isShowStandard.value = true;
        isActive.value = false;
        const clickedConversationID = (item as any)?.conversationID;
        nextTick(async () => {
          await standardSearchRef.value?.setKeyword?.(currentKeyword.value);
          standardSearchRef.value?.setSelectedType?.(SearchType.MESSAGE);
          if (clickedConversationID) {
            standardSearchRef.value?.triggerMessageDetail?.(clickedConversationID);
          }
        });
      } else {
        standardSearchRef.value?.setSelectedType?.(SearchType.MESSAGE);
      }
      break;
    case SearchType.CHAT_MESSAGE: {
      const conversationID = (item as any)?.conversationID;
      if (conversationID) {
        activateConversationByID(conversationID);
      }
      handleCloseStandard();
      break;
    }
    default:
      if (!isShowStandard.value) {
        isShowStandard.value = true;
        isActive.value = false;
        nextTick(() => {
          standardSearchRef.value?.setKeyword?.(currentKeyword.value);
          standardSearchRef.value?.setSelectedType?.(type);
        });
      }
      break;
  }
};

const onSearchComplete = () => {
  emit('searchComplete');
};

const onError = (error: any) => {
  emit('error', error);
};
</script>

<style lang="scss" module>
@use './ConversationSearch.scss';
</style>
