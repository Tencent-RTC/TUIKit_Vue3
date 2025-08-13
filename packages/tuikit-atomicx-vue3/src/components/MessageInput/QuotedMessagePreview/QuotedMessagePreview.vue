<template>
  <div
    v-if="quotedMessage"
    :class="styles['quoted__message__preview']"
  >
    <div :class="styles['quoted__message__preview__content']">
      <div :class="styles['quoted__message__preview__content--header']">
        <div :class="styles['quoted__message__preview__content--title']">
          {{ quotedMessage.nick || quotedMessage.from }}
        </div>
      </div>
      <div :class="styles['quoted__message__preview__content--text']">
        {{ calculateReferenceContent(quotedMessage) }}
      </div>
    </div>
    <IconClose
      :class="styles['quoted__message__preview__close']"
      size="16"
      @click="handleClose"
    />
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue';
import TencentCloudChat from '@tencentcloud/chat';
import { useUIKit, IconClose } from '@tencentcloud/uikit-base-component-vue3';
import { useConversationListState } from '../../../states/ConversationListState';
import { useMessageActionState } from '../../../states/MessageActionState';
import { useMessageInputState } from '../../../states/MessageInputState';
import styles from './QuotedMessagePreview.module.scss';
import type { IMessageModel } from '@tencentcloud/chat-uikit-engine';

const { t } = useUIKit();
const { currentConversation } = useConversationListState();
const { focusEditor } = useMessageInputState();
const { quotedMessage, clearQuotedMessage } = useMessageActionState();

// Watch referencedMessage changes
watch(quotedMessage, (newVal) => {
  if (newVal) {
    focusEditor();
  }
});

// Watch conversation changes
watch(currentConversation, () => {
  clearQuotedMessage();
});

const handleClose = () => {
  clearQuotedMessage();
};

const calculateReferenceContent = (message: IMessageModel | undefined): string => {
  if (!message) {
    return 'no reference';
  }
  switch (message.type) {
    case TencentCloudChat.TYPES.MSG_TEXT:
      return message.payload?.text;
    case TencentCloudChat.TYPES.MSG_IMAGE:
      return t('MessageInput.image');
    case TencentCloudChat.TYPES.MSG_AUDIO:
      return t('MessageInput.audio');
    case TencentCloudChat.TYPES.MSG_VIDEO:
      return t('MessageInput.video');
    case TencentCloudChat.TYPES.MSG_FILE:
      return t('MessageInput.file');
    case TencentCloudChat.TYPES.MSG_LOCATION:
      return t('MessageInput.location');
    case TencentCloudChat.TYPES.MSG_CUSTOM:
      return t('MessageInput.custom_message');
    default:
      return t('MessageInput.unknown');
  }
};
</script>
