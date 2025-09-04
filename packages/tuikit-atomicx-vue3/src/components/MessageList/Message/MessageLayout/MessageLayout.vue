<script lang="ts" setup>
import { ref, computed } from 'vue';
import ChatEngine from '@tencentcloud/chat-uikit-engine';
import cs from 'classnames';
import { View } from '../../../../baseComp/View';
import { Avatar } from '../../../Avatar';
import { ReadReceiptInfo } from '../../ReadReceiptInfo';
import { AudioMessage } from '../AudioMessage';
import { CustomMessage } from '../CustomMessage';
import { FaceMessage } from '../FaceMessage';
import { FileMessage } from '../FileMessage';
import { GroupTipMessage } from '../GroupTipMessage';
import { ImageMessage } from '../ImageMessage';
import { LocationMessage } from '../LocationMessage';
import { MergerMessage } from '../MergerMessage';
import { RecalledMessage } from '../RecalledMessage';
import { TextMessage } from '../TextMessage';
import { VideoMessage } from '../VideoMessage';
import { MessageBubble } from './MessageBubble';
import { MessageMeta } from './MessageMeta';
import { useMessageLayoutClasses } from './useMessageLayoutClasses';
import type { MessageAction } from '../../../../hooks/useMessageActions';
import type { IMessageModel as MessageModel } from '@tencentcloud/chat-uikit-engine';

interface MessageLayoutProps {
  message: MessageModel;
  isAggregated?: boolean;
  isHiddenMessageAvatar?: boolean;
  isHiddenMessageMeta?: boolean;
  isFirstInChunk?: boolean;
  isLastInChunk?: boolean;
  alignment?: 'left' | 'right' | 'two-sided';
  messageActionList?: MessageAction[];
  className?: string;
  style?: Record<string, any>;
}

const props = withDefaults(defineProps<MessageLayoutProps>(), {
  message: () => ({}) as MessageModel,
  alignment: 'two-sided',
  isAggregated: false,
  isHiddenMessageAvatar: false,
  isHiddenMessageMeta: false,
  isFirstInChunk: undefined,
  isLastInChunk: undefined,
  messageActionList: undefined,
  className: '',
  style: undefined,
});

const isReadReceiptInfoOpen = ref(false);

const MessageComponentsFactory = {
  [ChatEngine.TYPES.MSG_TEXT]: TextMessage,
  [ChatEngine.TYPES.MSG_IMAGE]: ImageMessage,
  [ChatEngine.TYPES.MSG_AUDIO]: AudioMessage,
  [ChatEngine.TYPES.MSG_VIDEO]: VideoMessage,
  [ChatEngine.TYPES.MSG_FILE]: FileMessage,
  [ChatEngine.TYPES.MSG_FACE]: FaceMessage,
  [ChatEngine.TYPES.MSG_LOCATION]: LocationMessage,
  [ChatEngine.TYPES.MSG_MERGER]: MergerMessage,
  [ChatEngine.TYPES.MSG_CUSTOM]: CustomMessage,
  [ChatEngine.TYPES.MSG_GRP_TIP]: GroupTipMessage,
};

const MessageComponent = computed(() => MessageComponentsFactory[props.message.type as any]);

const isMessageOwner = computed(() => props.message.flow === 'out');

const {
  layoutClasses,
  wrapperClasses,
  avatarClasses,
  bubbleClasses,
  metaClasses,
} = useMessageLayoutClasses({
  isMessageOwner: isMessageOwner.value,
  alignment: props.alignment,
  isAggregated: props.isAggregated,
});

function handleReadReceiptOpen() {
  isReadReceiptInfoOpen.value = true;
}

function handleReadReceiptClose() {
  isReadReceiptInfoOpen.value = false;
}
</script>

<template>
  <RecalledMessage
    v-if="message.isRevoked"
    class="message-recalled"
    :message="message"
  />
  <GroupTipMessage
    v-else-if="
      message.type === ChatEngine.TYPES.MSG_GRP_TIP
        || (message.type === ChatEngine.TYPES.MSG_CUSTOM && message.getMessageContent().businessID === 'group_create')
    "
    :message="message"
  />
  <View
    v-else-if="MessageComponent"
    :data-message-id="message.ID"
    :class="layoutClasses"
    :style="style"
  >
    <Avatar
      v-if="!isHiddenMessageAvatar"
      :class="cs(avatarClasses)"
      :src="message.avatar"
    />
    <View :class="cs(wrapperClasses)">
      <MessageBubble
        :class="bubbleClasses"
        :message="message"
        :alignment="alignment"
        :isLastInChunk="false"
        :messageActionList="messageActionList"
      >
        <component
          :is="MessageComponent"
          :message="message"
        />
      </MessageBubble>
      <MessageMeta
        v-if="!isHiddenMessageMeta"
        :class="metaClasses"
        :status="message.status"
        :timestamp="message.time * 1000"
        :need-read-receipt="message.needReadReceipt"
        :read-receipt-info="message.readReceiptInfo"
        :is-group="message.conversationType === ChatEngine.TYPES.CONV_GROUP"
        @on-read-receipt-text-click="handleReadReceiptOpen"
      />
    </View>
  </View>
  <ReadReceiptInfo
    :open="isReadReceiptInfoOpen"
    :messageID="message.ID"
    :read-count="message.readReceiptInfo.readCount"
    :unread-count="message.readReceiptInfo.unreadCount"
    :is-peer-read="message.readReceiptInfo.isPeerRead"
    @on-close="handleReadReceiptClose"
  />
</template>

<style lang="scss" scoped>
@use '../../../../styles/mixins' as mixin;

$message-avatar-size: 40px;
$message-avatar-gap: 8px;

.message-layout {
  display: flex;
  flex-direction: row;
  width: 100%;
  position: relative;
  gap: $message-avatar-gap;

  &--left {
    flex-direction: row;
  }
  &--right {
    flex-direction: row-reverse;
  }

  &__avatar {
    flex: 0 0 auto;
  }

  &__nick {
    font-size: 12px;
    min-width: min(70%, 200px);
    color: var(--text-color-tertiary);
    @include mixin.text-ellipsis;
  }
}

.message-layout__wrapper {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  flex: 1 1 auto;

  &--left {
    align-items: flex-start;
  }
  &--right {
    align-items: flex-end;
  }
  &--aggregated {
    &.message-layout__wrapper--left {
      padding-left: calc(#{$message-avatar-size} + #{$message-avatar-gap});
    }
    // 右侧聚合时反转 padding
    &.message-layout__wrapper--right {
      padding-right: calc(#{$message-avatar-size} + #{$message-avatar-gap});
    }
    &.message-layout__wrapper--no-padding {
      padding: 0;
    }
  }
}

.message-layout__bubble {
  flex: 1 1 auto;
  max-width: 90%;

  @include mixin.tablet-and-up {
    max-width: 80%;
  }

  @include mixin.desktop-and-up {
    max-width: 70%;
  }

  &--left {}
  &--right {}
  &--aggregated {}
}

.message-layout__meta {
  flex: 1 1 auto;
  &--left {}
  &--right {}
}

.message-layout__failed {
  color: #ff584c;
  margin-left: 8px;
  cursor: pointer;
}
</style>
