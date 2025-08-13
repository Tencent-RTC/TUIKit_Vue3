<script lang="ts" setup>
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import cs from 'classnames';
import { resolveGroupTipMessage } from './resolveGroupTipMessage';
import type { IMessageModel as MessageModel } from '@tencentcloud/chat-uikit-engine';

interface GroupTipMessageProps {
  message: MessageModel;
}

interface GroupTipMessageContent {
  text: string;
  businessID?: string;
  showName?: string;
}

interface CustomMessageContent {
  businessID?: string;
  showName?: string;
  custom?: string;
}

enum CustomMessageAsGroupTipEnum {
  GROUP_CREATE = 'group_create',
}

const props = defineProps<GroupTipMessageProps>();

const { t } = useUIKit();

const messageContent = props.message.getMessageContent() as GroupTipMessageContent & CustomMessageContent;

const renderText = () => {
  switch (messageContent.businessID) {
    case CustomMessageAsGroupTipEnum.GROUP_CREATE:
      return `${messageContent.showName || ''} ${t('MessageList.create_group')}`;
    default:
      return resolveGroupTipMessage(props.message).text;
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
