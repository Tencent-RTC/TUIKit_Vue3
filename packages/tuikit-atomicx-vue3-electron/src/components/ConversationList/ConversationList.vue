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
      :loading="!conversationList"
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
import { computed, ref, watch } from 'vue';
import { useConversationListState } from '../../states/ConversationListState';
import { isH5 } from '../../utils';
import { Avatar as DefaultAvatar } from '../Avatar';
import { ConversationActions as DefaultConversationActions } from './ConversationActions';
import { ConversationCreate as DefaultConversationCreate } from './ConversationCreate';
import { ConversationListContent as DefaultConversationListContent } from './ConversationListContent';
import { ConversationListHeader as DefaultConversationListHeader } from './ConversationListHeader';
import { ConversationPreview, ConversationPreviewUI as DefaultConversationPreviewUI } from './ConversationPreview';
import { ConversationSearch as DefaultConversationSearch } from './ConversationSearch';
import { useConversation } from './hooks/useConversation';
import type {
  CreateGroupParams,
  ConversationModel,
  ConversationListProps,
  ConversationActionsConfig,
  ConversationActionsBaseConfig,
} from '../../types';

interface Props extends ConversationListProps {
  children?: any;
}

const props = withDefaults(defineProps<Props>(), {
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
  selectConversation: [conversation: ConversationModel];
  beforeCreateConversation: [params: string | CreateGroupParams];
  conversationCreated: [conversation: ConversationModel];
}>();

const {
  enableActions,
  actionsConfig: propActionsConfig,
  enableCreate: propEnableCreate,
  enableSearch: propEnableSearch,
  onBeforeCreateConversation,
  onConversationCreated,
} = props;
const { conversationList, setActiveConversation } = useConversationListState();
const { setEnableCreate, setEnableSearch } = useConversation();

const conversationActionList = ref<string[]>([]);

const renderConversationList = computed(() => {
  if (!conversationList.value) {
    return [];
  }

  let _conversationList = conversationList.value;

  if (props.filter && typeof props.filter === 'function') {
    _conversationList = props.filter(_conversationList);
  }

  if (props.sort && typeof props.sort === 'function') {
    _conversationList = props.sort(_conversationList);
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
  ([newActionsConfig, newConversationActionList]) => {
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

const handleSelectConversation = (conversation: ConversationModel) => {
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

const handleCreated = (conversation: ConversationModel) => {
  emit('conversationCreated', conversation);
  if (onConversationCreated) {
    onConversationCreated(conversation);
  }
};
</script>

<style lang="scss" module>
@use './ConversationList.scss';
</style>
