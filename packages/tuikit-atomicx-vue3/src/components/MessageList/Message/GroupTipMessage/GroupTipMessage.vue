<script lang="ts" setup>
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import cs from 'classnames';
import { ConversationType } from '../../../../types/engine';
import { isCallMessage, parseCallMessageText } from '../../../../utils/call';
import { resolveGroupTipMessage } from './resolveGroupTipMessage';
import type { MessageModel } from '../../../../types/engine';

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

const props = defineProps<GroupTipMessageProps>();

const { t } = useUIKit();

const messageContent = props.message.getMessageContent() as GroupTipMessageContent & CustomMessageContent;

const renderText = () => {
  if (messageContent.businessID === 'group_create') {
    return `${messageContent.showName || ''} ${t('MessageList.create_group')}`;
  }
  if (isCallMessage(props.message) && props.message.conversationType === ConversationType.GROUP) {
    return parseCallMessageText(props.message);
  }
  return resolveGroupTipMessage(props.message).text;
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
