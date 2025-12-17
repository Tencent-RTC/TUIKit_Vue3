<!-- eslint-disable import/extensions -->
<template>
  <div :class="$style.SearchMessage">
    <div :class="$style['SearchMessage__avatar-wrapper']">
      <Avatar :src="avatar" :alt="name" />
    </div>
    <div :class="$style.SearchMessage__content">
      <div :class="$style.SearchMessage__header">
        <span :class="$style.SearchMessage__name" v-html="highlightedName" />
        <span v-if="time" :class="$style.SearchMessage__time">
          {{ formatTime(time) }}
        </span>
      </div>
      <div :class="$style.SearchMessage__container">
        <div :class="$style['SearchMessage__container-content']">
          <component :is="renderMessageContent(data, keyword)" />
        </div>
        <div :class="$style['SearchMessage__container-action']" @click="handleClick">
          {{ t('Search.action.locateToChat') }}
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, h, useCssModule } from 'vue';
import TUIChatEngine from '@tencentcloud/chat-uikit-engine';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { SearchType } from '../../../../../types/engine';
import { Avatar } from '../../../../Avatar';
import { highlightText } from '../utils';
import type { MessageModel } from '../../../../../types/engine';
import type { ResultItemProps } from '../../../../../types/search';

const $style = useCssModule();

const formatTime = (timestamp: number): string => new Date(timestamp * 1000).toLocaleString();

const props = defineProps<ResultItemProps<SearchType.CHAT_MESSAGE>>();

const { t } = useUIKit();

const { nick, avatar, nameCard, from, time } = props.data as MessageModel;
const name = computed(() => nameCard || nick || from);

const highlightedName = computed(() => {
  if (!props.keyword) {
    return name.value;
  }
  return highlightText(name.value, props.keyword, $style.SearchMessage__highlight);
});

const renderTextContent = (messageContent: any, keyword: string) => {
  if (messageContent.text && Array.isArray(messageContent.text)) {
    return messageContent.text
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
    innerHTML: highlightText(messageContent.text, keyword, $style.SearchMessage__highlight),
  });
};

const renderMessageContent = (message: MessageModel, searchKeyword: string) => {
  const messageContent = message.getMessageContent?.() || {};
  const messageType = message.type;

  switch (messageType) {
    case TUIChatEngine.TYPES.MSG_TEXT:
      return h(
        'div',
        {
          class: $style.SearchMessage__text,
        },
        renderTextContent(messageContent, searchKeyword),
      );

    case TUIChatEngine.TYPES.MSG_IMAGE:
      return h('img', {
        src: messageContent.url,
        class: $style['SearchMessage__image-thumb'],
        alt: t('Search.messageType.image'),
      });

    case TUIChatEngine.TYPES.MSG_VIDEO:
      return h(
        'div',
        {
          class: $style['SearchMessage__video-thumb'],
        },
        [
          h('img', {
            src: messageContent.snapshotUrl,
            alt: t('Search.messageType.videoCover'),
          }),
          h(
            'span',
            {
              class: $style['SearchMessage__play-icon'],
            },
            [
              h(
                'svg',
                {
                  width: '24',
                  height: '24',
                  viewBox: '0 0 24 24',
                  fill: 'none',
                },
                [
                  h('circle', {
                    cx: '12',
                    cy: '12',
                    r: '12',
                    fill: 'rgba(43,93,245,0.15)',
                  }),
                  h('polygon', {
                    points: '9,7 18,12 9,17',
                    fill: '#2B5DF5',
                  }),
                ],
              ),
            ],
          ),
        ],
      );

    case TUIChatEngine.TYPES.MSG_FILE:
      return h(
        'div',
        {
          class: $style['SearchMessage__file-box'],
        },
        [
          h(
            'span',
            {
              class: $style.SearchMessage__text,
            },
            messageContent.name,
          ),
          h(
            'span',
            {
              class: $style.SearchMessage__text,
            },
            messageContent.size,
          ),
        ],
      );

    case TUIChatEngine.TYPES.MSG_AUDIO:
      return h(
        'div',
        {
          class: $style['SearchMessage__audio-box'],
        },
        [
          h(
            'span',
            {
              class: $style['SearchMessage__audio-icon'],
            },
            [
              h(
                'svg',
                {
                  width: '20',
                  height: '20',
                  viewBox: '0 0 20 20',
                  fill: 'none',
                },
                [
                  h('rect', {
                    x: '3',
                    y: '7',
                    width: '4',
                    height: '6',
                    rx: '1',
                    fill: '#2B5DF5',
                  }),
                  h('rect', {
                    x: '8',
                    y: '5',
                    width: '4',
                    height: '10',
                    rx: '1',
                    fill: '#2B5DF5',
                    fillOpacity: '0.7',
                  }),
                  h('rect', {
                    x: '13',
                    y: '9',
                    width: '4',
                    height: '2',
                    rx: '1',
                    fill: '#2B5DF5',
                    fillOpacity: '0.4',
                  }),
                ],
              ),
            ],
          ),
          h('span', `${messageContent.second}s`),
        ],
      );

    case TUIChatEngine.TYPES.MSG_LOCATION:
      if (messageContent.businessID === 'text_link') {
        return h(
          'span',
          {
            class: $style.SearchMessage__text,
          },
          [
            messageContent.text,
            h(
              'a',
              {
                href: messageContent.link,
                target: '_blank',
                rel: 'noopener noreferrer',
              },
              `${t('Search.action.readMore')}>>>`,
            ),
          ],
        );
      }
      return h('span', t('Search.messageType.custom'));

    default:
      return h('span', t('Search.messageType.unsupported'));
  }
};

const handleClick = () => {
  props.onClick?.(props.data, SearchType.CHAT_MESSAGE);
};
</script>

<style lang="scss" module>
@use './Message.scss';
</style>
