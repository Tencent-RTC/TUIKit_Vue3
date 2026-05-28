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
import { computed, watch } from 'vue';
import { useContactStore, useLoginStore } from '../../../../chat-store';
import { isH5 } from '../../../../utils/env';
import { UserPicker } from '../../../UserPicker';
import type { ConversationCreateUserSelectListProps } from '../../../../types';
import type { UserPickerResult } from '../../../UserPicker';
import type { ContactInfo } from '@atomicxcore/core';

const props = defineProps<ConversationCreateUserSelectListProps>();

const emit = defineEmits<{
  'update:is-create-group': [value: boolean];
  'update:select-list': [list: ContactInfo[]];
}>();

const { friendList, loadFriends } = useContactStore();
const { loginStatus } = useLoginStore();

// Ensure the friend list is populated once logged in.
watch(loginStatus, (status) => {
  if (status === 'logined') {
    loadFriends().catch(err =>
      console.error('[ConversationCreateUserSelectList loadFriends]', err),
    );
  }
}, { immediate: true });

const selectList = computed(() =>
  props.selectList.map((item) => {
    const { userID, nickname, avatarURL, friendRemark } = item;
    return {
      key: userID,
      label: friendRemark || nickname || userID,
      avatarUrl: avatarURL ?? '',
    };
  }),
);

const renderFriendList = computed(() =>
  friendList.value.map((item) => {
    const { userID, nickname, avatarURL, friendRemark } = item;
    return {
      key: userID,
      label: friendRemark || nickname || userID,
      avatarUrl: avatarURL ?? '',
    };
  }),
);

const handleSelectListUpdate = (list: UserPickerResult) => {
  const selectFriendList = friendList.value.filter(
    item => list.some(selected => selected.key === item.userID),
  );
  emit('update:select-list', selectFriendList);
  props.setSelectList(selectFriendList);
};
</script>

<style lang="scss" module>
@use './ConversationCreateUserSelectList.scss';
</style>
