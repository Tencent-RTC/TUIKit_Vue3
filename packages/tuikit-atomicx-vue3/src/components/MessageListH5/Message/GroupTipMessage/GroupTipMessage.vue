<script lang="ts" setup>
import { computed } from 'vue';
import { ConversationType, MessageType } from '@atomicxcore/core';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import cs from 'classnames';
import { isCallMessage, parseCallMessageText, isCreateGroupMessage } from '../../../../utils/call';
import { resolveGroupTipMessage } from '../../../../utils/resolveGroupTipMessage';
import type { MessageInfo, TipsMessageInfo } from '@atomicxcore/core';

interface GroupTipMessageProps {
  message: MessageInfo;
}

const props = defineProps<GroupTipMessageProps>();

const { t } = useUIKit();

const renderText = computed(() => {
  if (isCreateGroupMessage(props.message)) {
    const {
      nameCard,
      nickname,
      userID,
    } = props.message.from;
    return `${nameCard || nickname || userID} ${t('MessageList.create_group')}`;
  }
  if (isCallMessage(props.message) && props.message.conversationType === ConversationType.Group) {
    return parseCallMessageText(props.message, t);
  }
  if (props.message.messageType === MessageType.Tips) {
    return resolveGroupTipMessage(props.message as TipsMessageInfo).text;
  }
  return '';
});
</script>

<template>
  <div :class="cs('group-tip-message')">
    {{ renderText }}
  </div>
</template>

<style lang="scss">
.group-tip-message {
  color: var(--text-color-secondary);
  text-align: center;
  font-size: 14px;
  margin: 4px 0;
}
</style>
