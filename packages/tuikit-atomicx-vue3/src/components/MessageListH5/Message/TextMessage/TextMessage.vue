<template>
  <View
    :class="cs('text-message', {
      'text-message--flow-in': !message.isSentBySelf,
      'text-message--flow-out': message.isSentBySelf,
    })"
  >
    <View
      v-if="$props.message.quoteInfo"
      :class="cs('text-message__reference', {
        'text-danger': isOriginMessageHasRecalled || props.message.quoteInfo?.messageType === MessageType.Unknown
      })"
      @click="handleReferenceClick"
    >
      <template v-if="isOriginMessageHasRecalled || props.message.quoteInfo?.messageType === MessageType.Unknown">
        {{ t('MessageList.origin_message_has_been_recalled') }}
      </template>
      <template v-else>
        <View class="text-message__reference__header">
          {{ $props.message.quoteInfo?.sender?.nickname || $props.message.quoteInfo?.sender?.userID }}
        </View>
        <View class="text-message__reference__content">
          {{ quotePreview }}
        </View>
      </template>
    </View>
    <View class="text-message__content">
      <template
        v-for="(item, index) in renderContent"
        :key="index"
      >
        <span
          v-if="item.name === 'text'"
          class="text-message__content__text"
        >
          {{ item.text }}
        </span>
        <img
          v-else
          class="text-message__content__img"
          :src="item.src"
          :alt="item.emojiKey || ''"
        >
      </template>
    </View>
  </View>
</template>

<script lang="ts" setup>
import { computed, inject } from 'vue';
import { MessageStatus, MessageType } from '@atomicxcore/core';
import { useUIKit, TUIToast } from '@tencentcloud/uikit-base-component-vue3';
import cs from 'classnames';
import { View } from '../../../../baseComp/View';
import { useChatContext } from '../../../../chat-store';
import { emojiUrlMap, emojiBaseUrl } from '../../../../constants/emoji';
import { useChatUIState } from '../../../../context/useChatUIState';
import { useMessageNavigation } from '../../../../hooks/useMessageNavigation';
import { transformTextWithEmojiKeyToName } from '../../../../utils/emoji';
import type { MessageInfo, TextMessagePayload } from '@atomicxcore/core';

const props = withDefaults(defineProps<{
  message: MessageInfo;
}>(), {
  message: () => ({} as MessageInfo),
});

const { t } = useUIKit();
const channel = inject('channel', 'default') as string;
const { messageList } = useChatContext(channel);
const chatUIState = useChatUIState(channel);
const { navigateToMessage } = useMessageNavigation(channel);

const messageContent = computed(() => props.message.messagePayload as TextMessagePayload);

const quotePreview = computed(() => {
  const q = props.message.quoteInfo;
  if (!q) {
    return '';
  }
  switch (q.messageType) {
    case MessageType.Text: return transformTextWithEmojiKeyToName((q.messagePayload as TextMessagePayload)?.text || '');
    case MessageType.Image: return t('MessageList.quote_image');
    case MessageType.Audio: return t('MessageList.quote_audio');
    case MessageType.Video: return t('MessageList.quote_video');
    case MessageType.File: return t('MessageList.quote_file');
    case MessageType.Face: return t('MessageList.quote_face');
    case MessageType.Custom: return t('MessageList.quote_custom');
    case MessageType.Merged: return t('MessageList.quote_merged');
    default: return t('MessageList.quote_unknown');
  }
});

// Emoji key pattern: [TUIEmoji_Xxx]
const EMOJI_PATTERN = /(\[TUIEmoji_\w+\])/;

type TextNode = { name: 'text'; text: string };
type EmojiNode = { name: 'img'; src: string; emojiKey: string };
type RenderNode = TextNode | EmojiNode;

const renderContent = computed((): RenderNode[] => {
  const raw = messageContent.value?.text ?? '';
  return raw
    .split(EMOJI_PATTERN)
    .filter(segment => segment !== '')
    .map((segment): RenderNode => {
      const url = emojiUrlMap[segment];
      if (url) {
        return { name: 'img', src: `${emojiBaseUrl}${url}`, emojiKey: segment };
      }
      return { name: 'text', text: segment };
    });
});

// const referencedInfo = computed(() => {
//   const quoteInfo = props.message.quoteInfo;
//   return {
//     content: (quoteInfo?.messagePayload as TextMessagePayload)?.text,
//     sender: quoteInfo?.sender?.nickname,
//     messageID: quoteInfo?.msgID,
//     sequence: quoteInfo?.sequence,
//     time: quoteInfo?.timestamp,
//   };
// });

const isOriginMessageHasRecalled = computed(() => chatUIState.recalledMessageIDSet.value.has(props.message.quoteInfo?.msgID!));

const handleReferenceClick = () => {
  if (props.message.quoteInfo?.msgID) {
    const { msgID } = props.message.quoteInfo;
    const targetMessage = messageList.value.find(item => item.msgID === msgID);

    if (isOriginMessageHasRecalled.value || targetMessage?.status === MessageStatus.Deleted || targetMessage?.status === MessageStatus.Recalled) {
      TUIToast.error({
        message: t('MessageList.origin_message_has_been_recalled'),
      });
      return;
    }

    navigateToMessage({
      messageID: msgID,
      cursor: props.message.quoteInfo as unknown as MessageInfo,
    });
  }
};

</script>

<style lang="scss" scoped>
@use '../bubble-mixins' as bubble;

.text-message {
  @include bubble.bubble-base();
  font-size: 14px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  word-break: break-word;
  white-space: pre-wrap;
  position: relative;
  line-height: 1.3125;
  font-weight: 500;
  color: var(--text-color-primary);

  &__reference {
    margin-bottom: 8px;
    padding: 10px 16px;
    background-color: rgba(0, 0, 0, 0.05);
    cursor: pointer;
    position: relative;
    border-radius: 4px;

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      background-color: #999;
      border-top-left-radius: 4px;
      border-bottom-left-radius: 4px;
    }

    &__header {
      font-size: 12px;
      color: var(--text-color-primary);
      margin-bottom: 4px;
    }

    &__content {
      font-size: 13px;
      color: var(--text-color-secondary);
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      line-clamp: 2;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }
  }

  &__content {
    display: block;
    word-break: break-word;
    white-space: pre-wrap;
    position: relative;

    &__text {
      display: inline;
      word-break: break-word;
      white-space: pre-wrap;
    }

    &__img {
      display: inline;
      width: 20px;
      height: 20px;
      vertical-align: middle;
      line-height: 1;
      margin: 0 1px;
      user-select: text;
    }
  }
}

.text-danger {
  color: var(--text-color-tertiary);
  background-color: var(--button-color-secondary-hover);

  &:hover {
    background-color: var(--button-color-secondary-hover);
  }

  &:active {
    background-color: var(--button-color-secondary-active);
  }

  &::before {
    background-color: var(--text-color-tertiary);
  }
}
</style>
