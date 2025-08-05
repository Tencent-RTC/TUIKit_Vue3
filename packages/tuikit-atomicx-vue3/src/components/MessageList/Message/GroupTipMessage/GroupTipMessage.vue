<script lang="ts" setup>
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import cs from 'classnames';
import { View } from '../../../../baseComp/View';
import type { IMessageModel } from '@tencentcloud/chat-uikit-engine';

interface IGroupTipMessageProps {
  message: IMessageModel;
}

interface IGroupTipMessageContent {
  text: string;
  businessID?: string;
  showName?: string;
}

interface ICustomMessageContent {
  businessID?: string;
  showName?: string;
  custom?: string;
}

enum CustomMessageAsGroupTipEnum {
  GROUP_CREATE = 'group_create',
}

const props = defineProps<IGroupTipMessageProps>();

const { t } = useUIKit();

const messageContent = props.message.getMessageContent() as IGroupTipMessageContent & ICustomMessageContent;

const renderText = () => {
  switch (messageContent.businessID) {
    case CustomMessageAsGroupTipEnum.GROUP_CREATE:
      return `${messageContent.showName || ''} ${t('TUIChat.create group')}`;
    default:
      return messageContent.text;
  }
};
</script>

<template>
  <div :class="cs('group-tip-message')">
    {{ renderText() }}
  </div>
</template>

<style lang="scss">
.group-tip-message {
  color: var(--text-color-secondary);
  text-align: center;
  font-size: 14px;
}
</style>
