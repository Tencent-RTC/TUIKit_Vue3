<template>
  <div class="text-message">
    <div
      v-if="referencedInfo.content"
      :class="
        cs('text-message__reference', {
          'text-danger': isOriginMessageHasRecalled,
        })
      "
      @click="handleReferenceClick"
    >
      <template v-if="isOriginMessageHasRecalled">
        {{ t('TUIChat.origin message has been recalled') }}
      </template>
      <template v-else>
        <div class="text-message__reference__header">
          {{ referencedInfo.sender }}
        </div>
        <div class="text-message__reference__content">
          {{ referencedInfo.content }}
        </div>
      </template>
    </div>
    <div class="text-message__content">
      <component
        :is="context.slots['user-badge']"
        :message="message"
      />
      <span class="user-badge" v-if="message.from === currentLive?.liveOwner.userId && !context.slots['user-badge']">{{ t('Anchor') }}</span>
      <span
        class="text-message__content__nick"
        @click="handleNickClick"
      >
        {{
          `${message.nick || message.from}: `
        }}</span>
      <template
        v-for="(item, index) in messageContent.text"
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
import { TUIStore } from '@tencentcloud/chat-uikit-engine';
import { useUIKit, TUIToast } from '@tencentcloud/uikit-base-component-vue3';
import cs from 'classnames';
import { useScroll } from '../../../../hooks/useScroll';
import { useBarrageListState } from '../../../../states/BarrageListState';
import { useLiveState } from '../../../../states/LiveState';
import { safeJSONParse } from '../../../../utils/json';
import { useMessageListContext } from '../../MessageListContext';
import type { ICloudCustomData } from '../../../../types/message';
import type { IMessageModel } from '@tencentcloud/chat-uikit-engine';

const { currentLive } = useLiveState();
const context: {
  slots: Record<string, () => VueElement>;
  nickClick: (payload: { message: IMessageModel; event: MouseEvent }) => void;
} = useMessageListContext('');

const props = withDefaults(
  defineProps<{
    message: IMessageModel;
    isLastInChunk: boolean;
  }>(),
  {
    message: () => ({}) as IMessageModel,
    isLastInChunk: false,
  },
);

const { t } = useUIKit();
const { scrollToMessage } = useScroll();
const { highlightMessageIDList, recalledMessageIDSet } = useBarrageListState();

const messageContent = computed(
  () =>
    props.message.getMessageContent() as {
      showName: string;
      text: Array<
        | {
          name: 'text';
          text: string;
        }
        | {
          name: 'img';
          src: string;
          emojiKey?: string;
        }
      >;
    },
);

const referencedInfo = computed(() => {
  const cloudCustomData = safeJSONParse(props.message?.cloudCustomData, {}) as Partial<ICloudCustomData>;
  const content = cloudCustomData?.messageReply?.messageAbstract || '';
  const sender = cloudCustomData?.messageReply?.messageSender || '';
  const messageID = cloudCustomData?.messageReply?.messageID || '';
  return {
    content,
    sender,
    messageID,
  };
});

const isOriginMessageHasRecalled = computed(() => recalledMessageIDSet.value.has(referencedInfo.value.messageID));

const handleReferenceClick = () => {
  if (referencedInfo.value.messageID) {
    const { messageID } = referencedInfo.value;

    const messageModel = TUIStore.getMessageModel(messageID);
    if (isOriginMessageHasRecalled.value || !messageModel || messageModel.isDeleted || messageModel.isRevoked) {
      TUIToast.error({
        message: t('TUIChat.Message has been deleted or recalled'),
      });
      return;
    }

    const isExist = highlightMessageIDList.value.includes(messageID);

    if (!isExist) {
      highlightMessageIDList.value.push(messageID);
      setTimeout(() => {
        highlightMessageIDList.value = highlightMessageIDList.value.filter(id => id !== messageID);
      }, 3000);
    }

    scrollToMessage(messageID, {
      block: 'center',
      skipIfVisible: true,
      behavior: 'instant',
    }).catch(() => {});
  }
};

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
      color: var(--uikit-color-theme-8);
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
