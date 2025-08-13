<template>
  <div
    v-if="visible"
    :class="[$style.conversationCreate__container, className]"
    :style="style"
  >
    <ConversationCreateButton
      v-if="!showCreateConversation"
      @click="toggleCreateConversation(true)"
    />

    <div
      v-if="showCreateConversation"
      :class="$style.conversationCreate__main"
    >
      <div :class="$style.conversationCreate__header">
        <div
          :class="$style.conversationCreate__icon"
          @click="back"
        >
          <IconArrowStrokeBack />
        </div>
        <div :class="$style.conversationCreate__title">
          {{ !isCreateGroup ? t('TUIConversation.Start chat') : t('TUIConversation.Add Participants') }}
        </div>
      </div>

      <ConversationCreateUserSelectList
        v-if="pageState === PageStateTypes.USER_SELECT"
        :is-create-group="isCreateGroup"
        :set-is-create-group="setIsCreateGroup"
        :select-list="selectList"
        :set-select-list="setSelectList"
        :conversation-list="conversationList"
        :set-page-state="setPageState"
        :on-before-create-conversation="handleBeforeCreate"
        :on-conversation-created="handleCreated"
      />

      <ConversationCreateGroupDetail
        v-else
        :page-state="pageState"
        :profile-list="selectList"
        :set-page-state="setPageState"
        :on-before-create-conversation="handleBeforeCreate"
        :on-conversation-created="handleCreated"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import { TUIConversationService } from '@tencentcloud/chat-uikit-engine';
import { IconArrowStrokeBack, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { PageStateTypes } from '../../../types';
import ConversationCreateButton from './ConversationCreateButton/ConversationCreateButton.vue';
import ConversationCreateGroupDetail from './ConversationCreateGroupDetail/ConversationCreateGroupDetail.vue';
import ConversationCreateUserSelectList from './ConversationCreateUserSelectList/ConversationCreateUserSelectList.vue';
import type { ConversationModel, ConversationCreateProps, CreateGroupParams } from '../../../types';

const props = withDefaults(defineProps<ConversationCreateProps>(), {
  visible: true,
  conversationList: () => [],
});

const emit = defineEmits<{
  'update:visible': [visible: boolean];
  'beforeCreateConversation': [params: string | any];
  'conversationCreated': [conversation: ConversationModel];
}>();

const { t } = useUIKit();

const showCreateConversation = ref(false);
const isCreateGroup = ref(false);
const pageState = ref<PageStateTypes>(PageStateTypes.USER_SELECT);
const selectList = ref<any[]>([]);

const setIsCreateGroup = (value: boolean) => {
  isCreateGroup.value = value;
};

const setPageState = (value: PageStateTypes) => {
  pageState.value = value;
};

const setSelectList = (value: any[]) => {
  selectList.value = value;
};

const toggleCreateConversation = (value: boolean) => {
  showCreateConversation.value = value;
};

const resetCreatePageState = () => {
  isCreateGroup.value = false;
  pageState.value = PageStateTypes.USER_SELECT;
  selectList.value = [];
};

const _onConversationCreated = (conversation: ConversationModel) => {
  toggleCreateConversation(false);
  resetCreatePageState();
  TUIConversationService.switchConversation(conversation.conversationID);
  emit('conversationCreated', conversation);
};

const back = () => {
  if (isCreateGroup.value) {
    switch (pageState.value) {
      case PageStateTypes.USER_SELECT:
        setIsCreateGroup(false);
        break;
      case PageStateTypes.CREATE_DETAIL:
        setPageState(PageStateTypes.USER_SELECT);
        setSelectList([]);
        break;
      case PageStateTypes.GROUP_TYPE:
        setPageState(PageStateTypes.CREATE_DETAIL);
        break;
      default:
        break;
    }
  } else {
    toggleCreateConversation(false);
    resetCreatePageState();
  }
};

const handleBeforeCreate = (params: string | CreateGroupParams) => {
  if (props.onBeforeCreateConversation) {
    return props.onBeforeCreateConversation(params);
  }
  return params;
};

const handleCreated = (conversation: ConversationModel) => {
  _onConversationCreated(conversation);
};

watch(showCreateConversation, (newValue) => {
  emit('update:visible', newValue);
});
</script>

<style lang="scss" module>
@import './ConversationCreate.scss';
</style>
