<template>
  <div class="text-message">
    <div class="text-message__content">
      <component
        :is="context.slots['user-badge']"
        :message="message"
      />
      <span v-if="message.sender.userId === currentLive?.liveOwner.userId && !context.slots['user-badge']" class="user-badge">{{ t('Anchor') }}</span>
      <span
        class="text-message__content__nick"
        @click="handleNickClick"
      >
        {{
          `${message.sender.nameCard || message.sender.userName || message.sender.userId}: `
        }}</span>
      <template
        v-for="(item, index) in messageContent"
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
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { VueElement } from 'vue';
import { computed, withDefaults, defineProps } from 'vue';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useLiveListState } from '../../../../states/LiveListState';
import { useMessageListContext } from '../../MessageListContext';
import { BASEURL, BASIC_EMOJI_URL_MAPPING } from './emoji';
import type { Barrage } from '../../../../states/BarrageState';

const { currentLive } = useLiveListState();
const context: {
  slots: Record<string, () => VueElement>;
  nickClick: (data: { message: Barrage; event: MouseEvent }) => void;
} = useMessageListContext('');

const props = withDefaults(
  defineProps<{
    message: Barrage;
    isLastInChunk: boolean;
  }>(),
  {
    message: () => ({}) as Barrage,
    isLastInChunk: false,
  },
);

const { t } = useUIKit();

const messageContent = computed(() => {
  const renderDom = [];
  let temp = props.message.textContent || '';
  let left = -1;
  let right = -1;
  while (temp !== '') {
    left = temp.indexOf('[');
    right = temp.indexOf(']');
    switch (left) {
      case 0:
        if (right === -1) {
          renderDom.push({
            name: 'text',
            text: temp,
          });
          temp = '';
        } else {
          const emojiKey = temp.slice(0, right + 1);
          // 自定义 emoji 表情 emojiKey 必须带 @custom 标识，比如：'[@custom_Smile]'
          if (emojiKey.indexOf('@custom') > -1) {
            renderDom.push({
              name: 'img',
              src: '',
              type: 'custom',
              emojiKey,
            });
            temp = temp.substring(right + 1);
          } else if (BASIC_EMOJI_URL_MAPPING[emojiKey]) {
            renderDom.push({
              name: 'img',
              src: BASEURL.emoji + BASIC_EMOJI_URL_MAPPING[emojiKey],
              emojiKey,
            });
            temp = temp.substring(right + 1);
          } else {
            renderDom.push({
              name: 'text',
              text: '[',
            });
            temp = temp.slice(1);
          }
        }
        break;
      case -1:
        renderDom.push({
          name: 'text',
          text: temp,
        });
        temp = '';
        break;
      default:
        renderDom.push({
          name: 'text',
          text: temp.slice(0, left),
        });
        temp = temp.substring(left);
        break;
    }
  }
  return renderDom;
});

const handleNickClick = (event: MouseEvent) => {
  context.nickClick({
    message: props.message,
    event,
  });
};
</script>

<style lang="scss" scoped>
.text-message {
  font-size: 14px;
  display: flex;
  flex-direction: column;
  word-break: break-all;
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
    display: inline-block;
    word-break: break-word;
    white-space: pre-wrap;
    position: relative;
    min-width: auto;
    font-size: 12px;
    font-weight: 400;
    word-spacing: 0.2em;
    letter-spacing: 0.1em;

    .user-badge {
      background-color: var(--uikit-color-theme-6);
      border-radius: 12px;
      padding: 0px 8px;
      margin-right: 6px;
    }

    &__nick {
      color: var(--text-color-secondary);
      cursor: pointer;
    }

    &__nick:hover {
      // color: var(--text-color-link-active);
      // font-weight: 600;
    }

    &__text {
      display: inline;
      word-break: break-all;
      white-space: pre-wrap;
      line-height: 1.8;
    }

    &__img {
      display: inline;
      width: 20px;
      height: 20px;
      vertical-align: middle;
      line-height: 1;
      margin: 0 1px;
    }
  }
}

.text-danger {
  color: var(--text-color-error);
  background-color: var(--toast-color-error);

  &::before {
    background-color: var(--text-color-error);
  }
}
</style>
