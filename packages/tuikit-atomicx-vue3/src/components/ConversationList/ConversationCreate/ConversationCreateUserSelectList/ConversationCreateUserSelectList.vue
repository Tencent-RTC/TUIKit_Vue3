<template>
  <div :class="[$style.conversationCreateUserSelectList]">
    <div :class="$style.conversationCreateUserSelectList__searchInput">
      <TUIInput
        v-model="searchValue"
        :prefixIcon="IconSearchChat"
        :placeholder="t('TUIConversation.Search')"
        @change="searchValueChange"
      />
    </div>

    <ConversationCreateSelectView
      v-if="isCreateGroup"
      :select-list="selectList"
      :set-select-list="handleSelectListUpdate"
    />

    <div
      v-if="!isCreateGroup"
      role="presentation"
      :class="[$style.conversationCreateUserSelectList__user, $style['conversationCreateUserSelectList__user--active']]"
      @click="createGroup"
    >
      <IconSearchMore size="24px" />
      <div :class="$style.conversationCreateUserSelectList__userName">
        {{ t('TUIConversation.New group chat') }}
      </div>
    </div>

    <div :class="[$style.conversationCreateUserSelectList__container, className]">
      <div :class="$style.conversationCreateUserSelectList__list">
        <div :class="$style.conversationCreateUserSelectList__groupContainer">
          <div
            v-for="(group, key) in friendList"
            v-show="group.length !== 0"
            :key="key"
            :class="$style.conversationCreateUserSelectList__groupBox"
          >
            <div :class="$style.conversationCreateUserSelectList__title">
              {{ key }}
            </div>
            <label
              v-for="profile in group"
              :key="profile.userID"
              role="presentation"
              :class="$style.conversationCreateUserSelectList__user"
              :for="`userChecked-${key}-${profile.userID}`"
              @click="handleUserItem(profile)"
            >
              <Avatar :src="profile.avatar" />
              <div :class="$style.conversationCreateUserSelectList__userName">
                {{ profile.nick || profile.userID }}
              </div>
              <div
                v-if="isCreateGroup"
                :class="$style.conversationCreateUserSelectList__userCheckbox"
              >
                <IconCheckSm
                  v-if="selectList.find(item => item.userID === profile.userID)"
                  :class="$style.conversationCreateUserSelectList__activeIcon"
                />
                <IconAddCircle v-else />
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="isCreateGroup"
      :class="$style.conversationCreateUserSelectList__nextContainer"
    >
      <TUIButton @click="next">
        {{ t('TUIConversation.Next') }}
      </TUIButton>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import {
  TUIInput,
  TUIButton,
  IconSearchMore,
  IconCheckSm,
  IconAddCircle,
  IconSearchChat,
  TUIToast,
  useUIKit,
} from '@tencentcloud/uikit-base-component-vue3';
import { useContactListState } from '../../../../states/ContactListState';
import { useConversationListState } from '../../../../states/ConversationListState';
import { PageStateTypes } from '../../../../types';
import { Avatar } from '../../../Avatar';
import { ConversationCreateSelectView } from '../ConversationCreateSelectView';
import { useConversationCreate } from '../hooks/useConversationCreate';
import type {
  ConversationCreateUserSelectListProps,
  UserProfile,
  ConversationCreateUsers,
  ConversationModel,
} from '../../../../types';

const props = defineProps<ConversationCreateUserSelectListProps>();

const emit = defineEmits<{
  'update:is-create-group': [value: boolean];
  'update:select-list': [list: UserProfile[]];
  'update:page-state': [state: PageStateTypes];
  'beforeCreateConversation': [userID: string];
  'conversationCreated': [conversation: ConversationModel];
}>();

const { t } = useUIKit();
const { friendList: friendListResult } = useContactListState();
const { createC2CConversation } = useConversationListState();

const searchValue = ref('');
const conversationList = ref(props.conversationList);
const friendList = ref<ConversationCreateUsers>({});

const {
  friendListSortResult,
  getFriendListSortSearchResult,
} = useConversationCreate(
  conversationList,
  friendListResult,
);

// Methods
const searchValueChange = (value: string | number) => {
  const stringValue = String(value);
  searchValue.value = stringValue;
  friendList.value = getFriendListSortSearchResult(stringValue);
};

const createGroup = () => {
  emit('update:is-create-group', true);
  props.setSelectList([]);
  props.setIsCreateGroup(true);
};

const userSelectListChange = (profile: UserProfile) => {
  const { userID } = profile;
  const newList = [...props.selectList];

  if (!newList.find(item => item.userID === userID)) {
    newList.push(profile);
  } else {
    const index = newList.findIndex(item => item.userID === userID);
    newList.splice(index, 1);
  }
  emit('update:select-list', newList);
  props.setSelectList(newList);
};

const _createConversation = async (profile: UserProfile) => {
  if (props.isCreateGroup) {
    return;
  }

  const { userID } = profile;
  emit('beforeCreateConversation', userID);
  props.onBeforeCreateConversation?.(userID);

  try {
    const conversation = await createC2CConversation(userID);
    emit('conversationCreated', conversation);
    props.onConversationCreated?.(conversation);
  } catch (error: any) {
    TUIToast.error({ message: error.message });
  }
};

const handleUserItem = (profile: UserProfile) => {
  if (props.isCreateGroup) {
    userSelectListChange(profile);
  } else {
    _createConversation(profile);
  }
};

const next = () => {
  if (!props.selectList || props.selectList.length === 0) {
    TUIToast.error({ message: t('TUIConversation.Participant cannot be empty') });
    return;
  }
  emit('update:page-state', PageStateTypes.CREATE_DETAIL);
  props.setPageState(PageStateTypes.CREATE_DETAIL);
};

const handleSelectListUpdate = (list: UserProfile[]) => {
  emit('update:select-list', list);
  props.setSelectList(list);
};

watch(friendListSortResult, (newValue) => {
  friendList.value = newValue;
}, { immediate: true });
</script>

<style lang="scss" module>
@import './ConversationCreateUserSelectList.scss';
</style>
