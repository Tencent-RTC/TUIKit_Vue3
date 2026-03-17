<template>
  <View class="text-message">
    <View
      v-if="referencedInfo.content"
      :class="cs('text-message__reference', {
        'text-danger': isOriginMessageHasRecalled
      })"
      @click="handleReferenceClick"
    >
      <template v-if="isOriginMessageHasRecalled">
        {{ t('MessageList.origin_message_has_been_recalled') }}
      </template>
      <template v-else>
        <View class="text-message__reference__header">
          {{ referencedInfo.sender }}
        </View>
        <View class="text-message__reference__content">
          {{ referencedInfo.content }}
        </View>
      </template>
    </View>
    <View class="text-message__content">
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
    </View>
  </View>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { TUIStore } from '@tencentcloud/chat-uikit-engine-lite';
import { useUIKit, TUIToast } from '@tencentcloud/uikit-base-component-vue3';
import cs from 'classnames';
import { View } from '../../../../baseComp/View';
import { useScroll } from '../../../../hooks/useScroll';
import { useMessageListState } from '../../../../states/MessageListState';
import { safeJSONParse } from '../../../../utils/json';
import type { ICloudCustomData } from '../../../../types/message';
import type { IMessageModel } from '@tencentcloud/chat-uikit-engine-lite';

const props = withDefaults(defineProps<{
  message: IMessageModel;
}>(), {
  message: () => ({} as IMessageModel),
});

const { t } = useUIKit();
const { scrollToMessage } = useScroll();
const {
  highlightMessageIDSet,
  recalledMessageIDSet,
  highlightMessage,
} = useMessageListState();

const messageContent = computed(() => props.message.getMessageContent() as {
  showName: string;
  text: any[];
});

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
        message: t('MessageList.origin_message_has_been_recalled'),
      });
      return;
    }

    const isExist = highlightMessageIDSet.value.has(messageID);

    if (!isExist) {
      highlightMessage({
        messageID,
        duration: 3000,
      });
    }

    scrollToMessage(messageID, {
      block: 'center',
      skipIfVisible: true,
      behavior: 'instant',
    }).catch(() => {});
  }
};

</script>

<style lang="scss" scoped>
.text-message {
  font-size: 14px;
  padding: 12px;
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
