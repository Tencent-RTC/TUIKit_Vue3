<script lang="ts" setup>
import { defineProps, computed } from 'vue';
import { IconCheckSm } from '@tencentcloud/uikit-base-component-vue3';
import cs from 'classnames';
import { Avatar } from '../../Avatar';
import { useConversationListState } from '../../../states/ConversationListState';

const props = defineProps<{
  conversationID: string;
  isSelected: boolean;
}>();

const { conversationList } = useConversationListState();

const conversation = computed(() =>
  conversationList.value?.find(_conversation => _conversation.conversationID === props.conversationID)
);

const conversationName = computed(() => conversation.value?.getShowName() || conversation.value?.conversationID || '');

const conversationAvatar = computed(() => conversation.value?.getAvatar());
</script>

<template>
  <div :class="cs('forward-list-item', { 'forward-list-item--selected': props.isSelected })">
    <Avatar :src="conversationAvatar" :style="{ marginRight: '8px' }" />
    <div class="forward-item__info">
      <div class="forward-item__name">
        {{ conversationName }}
      </div>
    </div>
    <IconCheckSm v-if="props.isSelected" class="forward-item__checkbox" />
  </div>
</template>

<style lang="scss" scoped>
@use '../../../styles/mixins/index' as mixin;

.forward-list-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 12px 8px;
  border-radius: 8px;
  cursor: pointer;

  &:hover {
    background-color: var(--dropdown-color-hover);
  }
}

.forward-item {
  &__info {
    flex: 1;
    margin-left: 12px;
  }

  &__name {
    font-size: 14px;
    font-weight: 500;
  }

  &__checkbox {
    color: #1890ff;
  }
}
</style>
