<template>
  <div
    :class="[$style.conversationList, className, {
      [$style['conversationList--mobile']]: isH5
    }]"
    :style="style"
  >
    <component
      :is="Header"
      v-if="Header"
      :class="{
        [$style.conversationList__headerCreating]: isCreateModelShow
      }"
    >
      <component
        :is="ConversationSearch"
        v-if="enableSearch"
      />
      <component
        :is="ConversationCreate"
        v-if="enableCreate"
        :conversation-list="conversationList"
        @update:visible="setIsCreateModelShow"
        @before-create="handleBeforeCreate"
        @created="handleCreated"
      />
    </component>
    <component
      :is="List"
      :empty="renderConversationList.length === 0"
      :loading="isLoading"
      :error="false"
      :PlaceholderEmptyList="PlaceholderEmptyList"
      :PlaceholderLoading="PlaceholderLoading"
      :PlaceholderLoadError="PlaceholderLoadError"
    >
      <ConversationPreview
        v-for="conversation in renderConversationList"
        :key="conversation.conversationID"
        :conversation="conversation"
        :enable-actions="enableActions"
        :Avatar="Avatar"
        :Preview="Preview"
        :ConversationActions="ConversationActions"
        :actions-config="actionsConfig"
        @select-conversation="handleSelectConversation"
      />
    </component>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch, provide } from 'vue';
import { useChatContext, useLoginStore } from '../../chat-store';
import { isH5 } from '../../utils';
import { Avatar as DefaultAvatar } from '../Avatar';
import { ConversationActions as DefaultConversationActions } from './ConversationActions';
import { ConversationCreate as DefaultConversationCreate } from './ConversationCreate';
import { ConversationListContent as DefaultConversationListContent } from './ConversationListContent';
import { ConversationListHeader as DefaultConversationListHeader } from './ConversationListHeader';
import { ConversationPreview, ConversationPreviewUI as DefaultConversationPreviewUI } from './ConversationPreview';
import { ConversationSearch as DefaultConversationSearch } from './ConversationSearch';
import { useConversation } from './hooks/useConversation';
import { ConversationMarkType } from '@atomicxcore/core';
import type {
  CreateGroupParams,
  ConversationListProps,
  ConversationActionsConfig,
  ConversationActionsBaseConfig,
} from '../../types';
import type { ConversationInfo } from '@atomicxcore/core';

interface Props extends ConversationListProps {
  /** Channel key for multi-panel isolation. Default: 'default'. */
  channel?: string;
  children?: any;
}

const props = withDefaults(defineProps<Props>(), {
  channel: 'default',
  enableActions: true,
  enableCreate: true,
  enableSearch: true,
  Header: () => DefaultConversationListHeader,
  List: () => DefaultConversationListContent,
  Preview: () => DefaultConversationPreviewUI,
  ConversationCreate: () => DefaultConversationCreate,
  ConversationSearch: () => DefaultConversationSearch,
  ConversationActions: () => DefaultConversationActions,
  PlaceholderEmptyList: undefined,
  PlaceholderLoading: undefined,
  PlaceholderLoadError: undefined,
  Avatar: () => DefaultAvatar,
});

const emit = defineEmits<{
  selectConversation: [conversation: ConversationInfo];
  beforeCreateConversation: [params: string | CreateGroupParams];
  conversationCreated: [conversation: ConversationInfo];
}>();

const {
  enableActions,
  actionsConfig: propActionsConfig,
  enableCreate: propEnableCreate,
  enableSearch: propEnableSearch,
  onBeforeCreateConversation,
  onConversationCreated,
} = props;

const {
  conversationList,
  loadConversations,
  setActiveConversation,
  clearConversationUnreadCount,
  markConversation,
} = useChatContext(props.channel);
provide('channel', props.channel);

const { setEnableCreate, setEnableSearch } = useConversation();
const { loginStatus } = useLoginStore();

// Loading: true until logged in and loadConversations has settled
// (which now waits for isSyncCompleted from SDK).
const loaded = ref(false);
const isLoading = computed(() => loginStatus.value !== 'logined' || !loaded.value);

watch(loginStatus, (status) => {
  if (status === 'logined') {
    loaded.value = false;
    loadConversations().finally(() => {
      loaded.value = true;
    });
  }
}, { immediate: true });

const conversationActionList = ref<string[]>([]);

const renderConversationList = computed(() => {
  if (!conversationList.value) {
    return [];
  }

  let _conversationList = conversationList.value as ConversationInfo[];

  if (props.filter && typeof props.filter === 'function') {
    _conversationList = (props.filter as (list: ConversationInfo[]) => ConversationInfo[])(_conversationList);
  }

  if (props.sort && typeof props.sort === 'function') {
    _conversationList = (props.sort as (list: ConversationInfo[]) => ConversationInfo[])(_conversationList);
  }

  return _conversationList;
});

const isCreateModelShow = ref(false);
const actionsConfig = ref<ConversationActionsConfig>({});

const enableCreate = computed(() => propEnableCreate);
const enableSearch = computed(() => propEnableSearch);
setEnableCreate(enableCreate.value);
setEnableSearch(enableSearch.value);

watch(
  (): [ConversationActionsConfig | undefined, string[] | null] => [propActionsConfig, conversationActionList.value],
  ([newActionsConfig, newConversationActionList]: [ConversationActionsConfig | undefined, string[] | null]) => {
    if (!newActionsConfig && !newConversationActionList) {
      return;
    }

    if (newActionsConfig) {
      actionsConfig.value = newActionsConfig;
      return;
    }

    if (newConversationActionList && newConversationActionList.length > 0) {
      const config: ConversationActionsConfig = {};
      newConversationActionList.forEach((action: string) => {
        const key = `enable${action.charAt(0).toUpperCase()}${action.slice(1)}` as keyof ConversationActionsBaseConfig;
        config[key] = config[key] ?? true;
      });
      actionsConfig.value = config;
    }
  },
  { immediate: true },
);

const handleSelectConversation = (conversation: ConversationInfo) => {
  clearConversationUnreadCount(conversation.conversationID).catch(() => {});
  markConversation([conversation.conversationID], ConversationMarkType.Unread, false).catch(() => {});
  setActiveConversation(conversation.conversationID);
  emit('selectConversation', conversation);
};

const setIsCreateModelShow = (visible: boolean) => {
  isCreateModelShow.value = visible;
};

const handleBeforeCreate = (params: string | CreateGroupParams) => {
  emit('beforeCreateConversation', params);
  if (onBeforeCreateConversation) {
    return onBeforeCreateConversation(params);
  }
  return params;
};

const handleCreated = (conversation: ConversationInfo) => {
  emit('conversationCreated', conversation);
  if (onConversationCreated) {
    onConversationCreated(conversation);
  }
};
</script>

<style lang="scss" module>
@use './ConversationList.scss';
</style>
