<template>
  <div :class="$style.conversationCreateSelectView">
    <div
      v-for="(profile, index) in selectList"
      :key="profile.userID"
      :class="$style.conversationCreateSelectView__item"
    >
      <div
        :class="$style.conversationCreateSelectView__close"
        @click="close(index)"
      >
        <IconCancel />
      </div>
      <Avatar :src="profile.avatar" />
      <div :class="$style.conversationCreateSelectView__nick">
        {{ profile.nick || profile.userID }}
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { IconCancel } from '@tencentcloud/uikit-base-component-vue3';
import { Avatar } from '../../../Avatar';
import type { ConversationCreateSelectViewProps, UserProfile } from '../../../../types';

const props = defineProps<ConversationCreateSelectViewProps>();

const emit = defineEmits<{
  'update:select-list': [list: UserProfile[]];
}>();

const close = (index: number) => {
  const newList = [...props.selectList];
  newList.splice(index, 1);
  props.setSelectList(newList);
  emit('update:select-list', newList);
};

</script>

<style lang="scss" module>
@import './ConversationCreateSelectView.scss';
</style>
