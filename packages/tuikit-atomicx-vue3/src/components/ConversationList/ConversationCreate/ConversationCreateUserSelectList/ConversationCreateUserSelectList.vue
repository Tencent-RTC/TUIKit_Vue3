<template>
  <div
    :class="[
      $style.conversationCreateUserSelectList,
      isH5 && $style['conversationCreateUserSelectList--h5'],
    ]"
  >
    <UserPicker
      displayMode="list"
      :data-source="renderFriendList"
      :default-selected-items="selectList"
      :maxCount="!isCreateGroup ? 1: undefined"
      :onSelectedChange="handleSelectListUpdate"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useContactListState } from '../../../../states/ContactListState';
import { isH5 } from '../../../../utils/env';
import { UserPicker } from '../../../UserPicker';
import type {
  ConversationCreateUserSelectListProps,
  Friend,
} from '../../../../types';
import type { UserPickerResult } from '../../../UserPicker';

const props = defineProps<ConversationCreateUserSelectListProps>();

const emit = defineEmits<{
  'update:is-create-group': [value: boolean];
  'update:select-list': [list: Friend[]];
}>();

const { friendList } = useContactListState();

const selectList = computed(() => props.selectList.map((item) => {
  const { userID, nick, avatar, remark } = item;
  return {
    key: userID,
    label: remark || nick || userID,
    avatarUrl: avatar,
  };
}));

const renderFriendList = computed(() => friendList.value.map((item) => {
  const { userID, nick, avatar, remark } = item;
  return {
    key: userID,
    label: remark || nick || userID,
    avatarUrl: avatar,
  };
}));

const handleSelectListUpdate = (list: UserPickerResult) => {
  const selectFriendList = friendList.value.filter(item => list.some(selected => selected.key === item.userID));
  emit('update:select-list', selectFriendList);
  props.setSelectList(selectFriendList);
};
</script>

<style lang="scss" module>
@import './ConversationCreateUserSelectList.scss';
</style>
