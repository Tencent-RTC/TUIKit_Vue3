<template>
  <div
    :class="['conversationCreate__container', {['conversationCreate__detail']: !enableSearch }]"
  >
    <ConversationCreateButton @click="openCreateConversation" />

    <TUIDialog
      :visible="showCreateConversation"
      :title="dialogTitles"
      :confirm-text="dialogConfirmText"
      :cancel-text="dialogCancelText"
      :custom-classes="[isH5 ? 'conversationCreate__dialog' : '']"
      @confirm="handleConfirm"
      @cancel="handleCancel"
      @close="resetCreatePageState"
    >
      <ConversationCreateUserSelectList
        v-if="pageState === PageStateTypes.USER_SELECT"
        :is-create-group="isCreateGroup"
        :select-list="selectList"
        :set-select-list="setSelectList"
        :set-page-state="setPageState"
      />

      <ConversationCreateGroupDetail
        v-else
        :page-state="pageState"
        :profile-list="selectList"
        :group-info="groupInfo"
        :set-page-state="setPageState"
        @update-group-info="updateGroupInfo"
      />
    </TUIDialog>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { TUIConversationService } from '@tencentcloud/chat-uikit-engine';
import { useUIKit, TUIDialog, TUIToast } from '@tencentcloud/uikit-base-component-vue3';
import { useConversationListState } from '../../../states/ConversationListState';
import { useLoginState } from '../../../states/LoginState';
import { PageStateTypes, CreateConvTypes, GroupType } from '../../../types';
import { isH5 } from '../../../utils/env';
import { useConversation } from '../hooks/useConversation';
import { useConversationCreate } from '../hooks/useConversationCreate';
import ConversationCreateButton from './ConversationCreateButton/ConversationCreateButton.vue';
import ConversationCreateGroupDetail from './ConversationCreateGroupDetail/ConversationCreateGroupDetail.vue';
import ConversationCreateUserSelectList from './ConversationCreateUserSelectList/ConversationCreateUserSelectList.vue';
import type { ConversationModel, ConversationCreateProps, CreateGroupParams, CreateGroupInfo, Friend } from '../../../types';

const { t } = useUIKit();
const { enableSearch } = useConversation();
const { getDefaultAvatar } = useConversationCreate();
const { loginUserInfo } = useLoginState();
const { createC2CConversation, createGroupConversation } = useConversationListState();

const GROUP_NAME_LIMIT = 20;
const GROUP_INFO_DEFAULTS: CreateGroupInfo = {
  avatar: getDefaultAvatar(GroupType.WORK),
  name: '',
  groupID: '',
  type: GroupType.WORK,
};

const props = withDefaults(defineProps<ConversationCreateProps>(), {
  conversationList: () => [],
});

const emit = defineEmits<{
  'update:visible': [visible: boolean];
  'beforeCreateConversation': [params: string | any];
  'conversationCreated': [conversation: ConversationModel];
}>();

const showCreateConversation = ref(false);
const isCreateGroup = ref(false);
const pageState = ref<PageStateTypes>(PageStateTypes.USER_SELECT);
const selectList = ref<Friend[]>([]);
const groupInfo = ref<CreateGroupInfo>({
  avatar: getDefaultAvatar(GroupType.WORK),
  name: '',
  groupID: '',
  type: GroupType.WORK,
});

const setIsCreateGroup = (value: boolean) => {
  isCreateGroup.value = value;
};

const setPageState = (value: PageStateTypes) => {
  pageState.value = value;
};

const setSelectList = (value: Friend[]) => {
  selectList.value = value;
};

const openCreateConversation = (value: CreateConvTypes) => {
  if (value === CreateConvTypes.GROUP) {
    setIsCreateGroup(true);
  } else {
    setIsCreateGroup(false);
  }
  showCreateConversation.value = true;
};

const toggleCreateConversation = (value: boolean) => {
  showCreateConversation.value = value;
};

const resetCreatePageState = () => {
  toggleCreateConversation(false);
  groupInfo.value = GROUP_INFO_DEFAULTS;
  isCreateGroup.value = false;
  pageState.value = PageStateTypes.USER_SELECT;
  selectList.value = [];
};

const _onConversationCreated = (conversation: ConversationModel) => {
  resetCreatePageState();
  TUIConversationService.switchConversation(conversation.conversationID);
  emit('conversationCreated', conversation);
  props.onConversationCreated?.(conversation);
};

const pageStateTitle = {
  [PageStateTypes.USER_SELECT]: t('TUIConversation.Add Participants'),
  [PageStateTypes.CREATE_DETAIL]: t('TUIConversation.New group chat'),
  [PageStateTypes.GROUP_TYPE]: t('TUIConversation.New group chat'),
};

const pageStateConfirmText = {
  [PageStateTypes.USER_SELECT]: t('TUIConversation.Next'),
  [PageStateTypes.CREATE_DETAIL]: t('TUIConversation.Start chat'),
  [PageStateTypes.GROUP_TYPE]: t('TUIConversation.Confirm'),
};
const pageStateCancelText = {
  [PageStateTypes.USER_SELECT]: t('TUIConversation.Cancel'),
  [PageStateTypes.CREATE_DETAIL]: t('TUIConversation.Prev'),
  [PageStateTypes.GROUP_TYPE]: t('TUIConversation.Prev'),
};
const dialogCancelText = computed(() => {
  if (!isCreateGroup.value) {
    return t('TUIConversation.Cancel');
  }
  return pageStateCancelText[pageState.value];
});

const dialogTitles = computed(() => {
  if (!isCreateGroup.value) {
    return t('TUIConversation.Start chat');
  }
  return pageStateTitle[pageState.value];
});

const dialogConfirmText = computed(() => !isCreateGroup.value ? t('TUIConversation.Start chat') : pageStateConfirmText[pageState.value]);

const updateGroupInfo = (value: CreateGroupInfo) => {
  groupInfo.value = value;
};

const handleCreateC2CConversation = async () => {
  const { userID } = selectList.value[0];
  emit('beforeCreateConversation', userID);
  props.onBeforeCreateConversation?.(userID);

  try {
    const conversation = await createC2CConversation(userID);
    _onConversationCreated(conversation);
  } catch (error: any) {
    TUIToast.error({ message: error.message });
  }
};

const handleCreateGroupConversation = async () => {
  const options = {
    ...groupInfo.value,
    memberList: selectList.value.map(item => ({
      userID: item.userID,
    })),
  } as unknown as CreateGroupParams;

  emit('beforeCreateConversation', options);
  props.onBeforeCreateConversation?.(options);

  try {
    const conversation = await createGroupConversation(options);
    _onConversationCreated(conversation);
  } catch (error: any) {
    TUIToast.error({ message: error.message });
  }
};

const generateGroupName = (userList: Friend[]) => {
  const selfName = loginUserInfo.value?.userName || loginUserInfo.value?.userId || '';
  const name = selfName + userList.map(item => item?.remark || item?.nick || item?.userID).join('、');
  return name.length >= GROUP_NAME_LIMIT ? name.slice(0, GROUP_NAME_LIMIT) : name;
};

const handleConfirm = () => {
  if (selectList.value.length === 0) {
    TUIToast.error({ message: t('TUIConversation.Participant cannot be empty') });
    return;
  }
  if (!isCreateGroup.value) {
    handleCreateC2CConversation();
    toggleCreateConversation(false);
  } else if (pageState.value === PageStateTypes.USER_SELECT) {
    groupInfo.value.name = generateGroupName(selectList.value);
    setPageState(PageStateTypes.CREATE_DETAIL);
  } else if (pageState.value === PageStateTypes.CREATE_DETAIL) {
    handleCreateGroupConversation();
    toggleCreateConversation(false);
  } else {
    setPageState(PageStateTypes.CREATE_DETAIL);
  }
};

const handleCancel = () => {
  if (pageState.value === PageStateTypes.USER_SELECT) {
    toggleCreateConversation(false);
    resetCreatePageState();
  } else if (pageState.value === PageStateTypes.CREATE_DETAIL) {
    setPageState(PageStateTypes.USER_SELECT);
  } else if (pageState.value === PageStateTypes.GROUP_TYPE) {
    setPageState(PageStateTypes.CREATE_DETAIL);
  }
};
</script>

<style lang="scss" scoped>
@import './ConversationCreate.scss';
</style>
