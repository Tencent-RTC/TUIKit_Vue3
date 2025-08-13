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
        v-if="ConversationSearch"
      />
      <component
        :is="ConversationCreate"
        :visible="enableCreate"
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
      :placeholder-empty-list="PlaceholderEmptyList"
      :placeholder-loading="PlaceholderLoading"
      :placeholder-load-error="PlaceholderLoadError"
    >
      <ConversationPreview
        v-for="conversation in renderConversationList"
        :key="conversation.conversationID"
        :conversation="conversation"
        :enable-actions="enableActions"
        :avatar="Avatar"
        :preview="Preview"
        :conversation-actions="ConversationActions"
        :actions-config="actionsConfig"
        @select="handleSelectConversation"
      />
    </component>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { useConversationListState } from '../../states/ConversationListState';
import {
  PlaceHolderTypes,
} from '../../types';
import { isH5 } from '../../utils';
import { Avatar as DefaultAvatar } from '../Avatar';
import { ConversationActions as DefaultConversationActions } from './ConversationActions';
import { ConversationCreate as DefaultConversationCreate } from './ConversationCreate';
import { ConversationListContent as DefaultConversationListContent } from './ConversationListContent';
import { ConversationListHeader as DefaultConversationListHeader } from './ConversationListHeader';
import PlaceHolder from './ConversationPlaceHolder';
import { ConversationPreview, ConversationPreviewUI as DefaultConversationPreviewUI } from './ConversationPreview';
import { ConversationSearch as DefaultConversationSearch } from './ConversationSearch';
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
  Header: () => DefaultConversationListHeader,
  List: () => DefaultConversationListContent,
  Preview: () => DefaultConversationPreviewUI,
  ConversationCreate: () => DefaultConversationCreate,
  ConversationSearch: () => DefaultConversationSearch,
  ConversationActions: () => DefaultConversationActions,
  PlaceholderEmptyList: () => ({
    component: PlaceHolder,
    props: { type: PlaceHolderTypes.NO_CONVERSATIONS },
  }),
  PlaceholderLoading: () => ({
    component: PlaceHolder,
    props: { type: PlaceHolderTypes.LOADING },
  }),
  PlaceholderLoadError: () => ({
    component: PlaceHolder,
    props: { type: PlaceHolderTypes.WRONG },
  }),
  Avatar: () => DefaultAvatar,
});

const emit = defineEmits<{
  selectConversation: [conversation: ConversationModel];
  beforeCreateConversation: [params: string | any];
  conversationCreated: [conversation: ConversationModel];
}>();

const enableCreateConversation = ref(false);
const conversationActionList = ref<string[]>([]);
const renderConversationList = ref<ConversationModel[]>([]);
const { conversationList = [], setActiveConversation } = useConversationListState();

watch(
  () => conversationList,
  (newList) => {
    let _conversationList = newList.value as ConversationModel[];
    if (props.filter) {
      _conversationList = props.filter(_conversationList);
    }
    if (props.sort) {
      _conversationList = props.sort(_conversationList);
    }
    renderConversationList.value = _conversationList;
  },
  { deep: true },
);

const isCreateModelShow = ref(false);
const actionsConfig = ref<ConversationActionsConfig>({
  enableDelete: true,
  enableMute: true,
  enableMarkUnread: true,
  enablePin: true,
});

const enableCreate = computed(() => (props.enableCreate || enableCreateConversation) ?? true);

watch(
  () => [props.actionsConfig, conversationActionList],
  ([newActionsConfig, newConversationActionList]) => {
    if (!newActionsConfig && !newConversationActionList) {
      actionsConfig.value = {
        enableDelete: true,
        enableMute: true,
        enableMarkUnread: true,
        enablePin: true,
      };
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
  if (props.onBeforeCreateConversation) {
    return props.onBeforeCreateConversation(params);
  }
  return params;
};

const handleCreated = (conversation: ConversationModel) => {
  emit('conversationCreated', conversation);
  if (props.onConversationCreated) {
    props.onConversationCreated(conversation);
  }
};
</script>

<style lang="scss" module>
@import './ConversationList.scss';
</style>
