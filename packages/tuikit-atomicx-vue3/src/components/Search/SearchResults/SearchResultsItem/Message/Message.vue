<!-- eslint-disable import/extensions -->
<template>
  <div :class="$style.SearchMessage">
    <div :class="$style['SearchMessage__avatar-wrapper']">
      <Avatar :src="senderAvatar" />
    </div>
    <div :class="$style.SearchMessage__content">
      <div :class="$style.SearchMessage__header">
        <span :class="$style.SearchMessage__name" v-html="highlightedName" />
        <span v-if="messageTime" :class="$style.SearchMessage__time">
          {{ formatTime(messageTime) }}
        </span>
      </div>
      <div :class="$style.SearchMessage__container">
        <div :class="$style['SearchMessage__container-content']">
          <component :is="renderMessageContent(message, keyword)" />
        </div>
        <div :class="$style['SearchMessage__container-action']" @click="handleClick">
          {{ t('Search.action.locateToChat') }}
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, h, inject, useCssModule } from 'vue';
import { MessageType } from '@atomicxcore/core';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { SearchType } from '../../../../../types/search';
import { useChatContext } from '../../../../../chat-store';
import { useChatUIState } from '../../../../../context/useChatUIState';
import { Avatar } from '../../../../Avatar';
import { highlightText } from '../utils';
import type { ResultItemProps } from '../../../../../types/search';
import type { MessageInfo } from '@atomicxcore/core';
import { transformTextWithEmojiKeyToName } from '../../../../../utils';

const $style = useCssModule();

const formatTime = (date?: Date): string => date ? date.toLocaleString() : '';

const props = defineProps<ResultItemProps<SearchType.CHAT_MESSAGE>>();

const { t } = useUIKit();

const message = computed(() => props.data as MessageInfo);
const senderName = computed(() =>
  message.value.from?.nameCard || message.value.from?.nickname || message.value.from?.userID || '',
);
const senderAvatar = computed(() => message.value.from?.avatarURL);
const messageTime = computed(() => message.value.timestamp);

const highlightedName = computed(() => {
  if (!props.keyword) {
    return senderName.value;
  }
  return highlightText(senderName.value, props.keyword, $style.SearchMessage__highlight);
});

const renderTextContent = (payload: any, keyword: string) => {
  const text = payload?.text;
  if (text && Array.isArray(text)) {
    return text
      .map((item: any, idx: number) => {
        if (item.name === 'text') {
          return h('span', {
            key: idx,
            innerHTML: highlightText(item.text, keyword, $style.SearchMessage__highlight),
          });
        }
        if (item.name === 'img') {
          return h('img', {
            'key': idx,
            'src': item.src,
            'alt': item.emojiKey || '',
            'class': $style['SearchMessage__emoji-img'],
            'draggable': false,
            'data-emoji-key': item.emojiKey || '',
          });
        }
        return null;
      })
      .filter(Boolean);
  }
  return h('span', {
    innerHTML: highlightText(typeof text === 'string' ? transformTextWithEmojiKeyToName(text) : '', keyword, $style.SearchMessage__highlight),
  });
};

const renderMessageContent = (msg: MessageInfo, searchKeyword: string) => {
  const payload = msg.messagePayload as any;

  switch (msg.messageType) {
    case MessageType.Text:
      return h(
        'div',
        { class: $style.SearchMessage__text },
        renderTextContent(payload, searchKeyword),
      );

    case MessageType.Image:
      return h('img', {
        src: payload?.originalImageUrl || payload?.thumbImageUrl || payload?.url,
        class: $style['SearchMessage__image-thumb'],
        alt: t('Search.messageType.image'),
      });

    case MessageType.Video:
      return h(
        'div',
        { class: $style['SearchMessage__video-thumb'] },
        [
          h('img', {
            src: payload?.videoSnapshotUrl || payload?.snapshotUrl,
            alt: t('Search.messageType.videoCover'),
          }),
          h(
            'span',
            { class: $style['SearchMessage__play-icon'] },
            [
              h(
                'svg',
                { width: '24', height: '24', viewBox: '0 0 24 24', fill: 'none' },
                [
                  h('circle', { cx: '12', cy: '12', r: '12', fill: 'rgba(43,93,245,0.15)' }),
                  h('polygon', { points: '9,7 18,12 9,17', fill: '#2B5DF5' }),
                ],
              ),
            ],
          ),
        ],
      );

    case MessageType.File:
      return h(
        'div',
        { class: $style['SearchMessage__file-box'] },
        [
          h('span', { class: $style.SearchMessage__text }, payload?.fileName),
          h('span', { class: $style.SearchMessage__text }, payload?.fileSize),
        ],
      );

    case MessageType.Audio:
      return h(
        'div',
        { class: $style['SearchMessage__audio-box'] },
        [
          h(
            'span',
            { class: $style['SearchMessage__audio-icon'] },
            [
              h(
                'svg',
                { width: '20', height: '20', viewBox: '0 0 20 20', fill: 'none' },
                [
                  h('rect', { x: '3', y: '7', width: '4', height: '6', rx: '1', fill: '#2B5DF5' }),
                  h('rect', { x: '8', y: '5', width: '4', height: '10', rx: '1', fill: '#2B5DF5', fillOpacity: '0.7' }),
                  h('rect', { x: '13', y: '9', width: '4', height: '2', rx: '1', fill: '#2B5DF5', fillOpacity: '0.4' }),
                ],
              ),
            ],
          ),
          h('span', `${payload?.audioDuration ?? 0}s`),
        ],
      );

    default:
      return h('span', t('Search.messageType.unsupported'));
  }
};

// --- Navigate to message via split chat data and UI state contexts ---
const channel = inject('channel', 'default') as string;
const { setActiveConversation } = useChatContext(channel);
const { setPendingLocateMessage } = useChatUIState(channel);

const handleClick = async () => {
  const msg = props.data as MessageInfo;
  const conversationID = (msg as any).conversationID
    || (msg.conversationType === 'c2c'
      ? `C2C${msg.from?.userID}`
      : `GROUP${msg.to}`);

  if (conversationID) {
    setPendingLocateMessage({
      conversationID,
      messageID: msg.msgID,
      sequence: msg.sequence,
      time: msg.timestamp ? Math.floor(msg.timestamp.getTime() / 1000) : undefined,
    });
    setActiveConversation(conversationID);
  }
  props.onClick?.(props.data, SearchType.CHAT_MESSAGE);
};
</script>

<style lang="scss" module>
@use './Message.scss';
</style>
