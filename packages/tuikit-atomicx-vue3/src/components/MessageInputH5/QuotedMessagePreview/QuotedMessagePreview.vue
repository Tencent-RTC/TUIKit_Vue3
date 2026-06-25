<template>
  <div
    v-if="quotedMessage"
    :class="styles['quoted__message__preview']"
  >
    <div :class="styles['quoted__message__preview__body']">
      <div :class="styles['quoted__message__preview__content']">
        <div :class="styles['quoted__message__preview__content--header']">
          <div :class="styles['quoted__message__preview__content--title']">
            {{ quotedMessage.from?.nickname || quotedMessage.from?.userID }}
          </div>
        </div>
        <div :class="styles['quoted__message__preview__content--text']">
          {{ calculateReferenceContent(quotedMessage) }}
        </div>
      </div>
    </div>
    <button
      type="button"
      :class="styles['quoted__message__preview__close']"
      @click="handleCloseQuotedMessage"
    >
      <IconClose size="16" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { inject, watch, onUnmounted } from 'vue';
import { MessageType } from '@atomicxcore/core';
import { useUIKit, IconClose } from '@tencentcloud/uikit-base-component-vue3';
import { useChatUIState } from '../../../context/useChatUIState';
import { transformTextWithEmojiKeyToName } from '../../../utils';
import styles from './QuotedMessagePreview.module.scss';
import type { MessageInfo } from '@atomicxcore/core';

const { t } = useUIKit();
const channel = inject('channel', 'default') as string;
const { quotedMessage, clearQuotedMessage, focusInput } = useChatUIState(channel);

onUnmounted(() => {
  clearQuotedMessage();
});

watch(quotedMessage, (newVal) => {
  if (newVal) {
    focusInput();
  }
});

const handleCloseQuotedMessage = () => {
  clearQuotedMessage();
};

const calculateReferenceContent = (message: MessageInfo | undefined): string => {
  if (!message) {
    return 'no reference';
  }
  switch (message.messageType) {
    case MessageType.Text:
      return transformTextWithEmojiKeyToName((message.messagePayload as any)?.text || '');
    case MessageType.Image:
      return t('MessageInput.image');
    case MessageType.Audio:
      return t('MessageInput.audio');
    case MessageType.Video:
      return t('MessageInput.video');
    case MessageType.File:
      return t('MessageInput.file');
    case MessageType.Custom:
      return t('MessageInput.custom_message');
    default:
      return t('MessageInput.unknown');
  }
};
</script>
