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
      @click="handleCloseQuotedMessage"
    />
  </div>
</template>

<script setup lang="ts">
import { watch, onUnmounted } from 'vue';
import { useUIKit, IconClose } from '@tencentcloud/uikit-base-component-vue3';
import { useMessageActionState } from '../../../states/MessageActionState';
import { useMessageInputState } from '../../../states/MessageInputState';
import { MessageType } from '../../../types/engine';
import { transformTextWithEmojiKeyToName } from '../../../utils';
import styles from './QuotedMessagePreview.module.scss';
import type { MessageModel } from '../../../types/engine';

const { t } = useUIKit();
const { focusEditor } = useMessageInputState();
const { quotedMessage, clearQuotedMessage } = useMessageActionState();

onUnmounted(() => {
  clearQuotedMessage();
});

watch(quotedMessage, (newVal) => {
  if (newVal) {
    focusEditor();
  }
});

const handleCloseQuotedMessage = () => {
  clearQuotedMessage();
};

const calculateReferenceContent = (message: MessageModel | undefined): string => {
  if (!message) {
    return 'no reference';
  }
  switch (message.type) {
    case MessageType.TEXT:
      return transformTextWithEmojiKeyToName(message.payload?.text || '');
    case MessageType.IMAGE:
      return t('MessageInput.image');
    case MessageType.AUDIO:
      return t('MessageInput.audio');
    case MessageType.VIDEO:
      return t('MessageInput.video');
    case MessageType.FILE:
      return t('MessageInput.file');
    case MessageType.LOCATION:
      return t('MessageInput.location');
    case MessageType.CUSTOM:
      return t('MessageInput.custom_message');
    default:
      return t('MessageInput.unknown');
  }
};
</script>
