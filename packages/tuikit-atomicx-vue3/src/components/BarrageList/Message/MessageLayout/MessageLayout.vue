<script lang="ts" setup>
import { toRefs, computed, withDefaults, defineProps } from 'vue';
import TencentCloudChat from '@tencentcloud/chat-uikit-engine';
import cs from 'classnames';
import { CustomMessage } from '../CustomMessage';
import { FaceMessage } from '../FaceMessage';
import { GroupTipMessage } from '../GroupTipMessage';
import { ImageMessage } from '../ImageMessage';
import { MergerMessage } from '../MergerMessage';
import { RecalledMessage } from '../RecalledMessage';
import { TextMessage } from '../TextMessage';
import { MessageBubble } from './MessageBubble';
import { MessageMeta } from './MessageMeta';
import type { IMessageModel } from '@tencentcloud/chat-uikit-engine';

interface IMessageLayoutProps {
  message: IMessageModel;
  isLastInChunk?: boolean;
  // messageActionList?: IMessageAction[];
  className?: string;
  style?: Record<string, any>;
}

const props = withDefaults(defineProps<IMessageLayoutProps>(), {
  message: () => ({}) as IMessageModel,
  isLastInChunk: true,
  messageActionList: () => [],
  className: '',
  style: () => ({}),
});

const {
  message,
  isLastInChunk,
  // messageActionList,
  className,
  style,
} = toRefs(props);

const MessageComponentsFactory = {
  [TencentCloudChat.TYPES.MSG_TEXT]: TextMessage,
  [TencentCloudChat.TYPES.MSG_IMAGE]: ImageMessage,
  [TencentCloudChat.TYPES.MSG_FACE]: FaceMessage,
  [TencentCloudChat.TYPES.MSG_MERGER]: MergerMessage,
  [TencentCloudChat.TYPES.MSG_CUSTOM]: CustomMessage,
  [TencentCloudChat.TYPES.MSG_GRP_TIP]: GroupTipMessage,
};

const MessageComponent = computed(() => MessageComponentsFactory[message.value.type as any]);

const isMessageOwner = computed(() => message.value.flow === 'out');
</script>

<template>
  <RecalledMessage v-if="message.isRevoked" class="message-recalled" :message="message" />
  <GroupTipMessage
    v-else-if="
      message.type === TencentCloudChat.TYPES.MSG_GRP_TIP || message.type === TencentCloudChat.TYPES.MSG_CUSTOM
    "
    :message="message"
  />
  <div
    v-else-if="MessageComponent"
    :data-message-id="message.ID"
    :class="
      cs(
        'message-layout',
        {
          'message-layout--self': isMessageOwner,
          [`message-layout--not-last${isMessageOwner ? '--self' : ''}`]: !isLastInChunk,
        },
        className
      )
    "
    :style="style"
  >
    <div :class="cs('message-layout__wrapper', { 'message-layout__wrapper--self': isMessageOwner })">
      <div
        :class="
          cs('message-layout__wrapper__middle', {
            'message-layout__wrapper__middle--self': isMessageOwner,
          })
        "
      >
        <div
          v-if="isLastInChunk && message.type !== TencentCloudChat.TYPES.MSG_TEXT"
          :class="cs('message-layout__nick')"
        >
          {{ message.nick + ': ' }}
        </div>
        <MessageBubble
          :class="
            cs({
              [`message-layout__bubble--last${isMessageOwner ? '--self' : ''}`]: isLastInChunk,
            })
          "
          :message="message"
          :is-last-in-chunk="isLastInChunk"
        >
          <component :is="MessageComponent" :message="message" :is-last-in-chunk="isLastInChunk" />
        </MessageBubble>
      </div>
      <MessageMeta
        v-if="isLastInChunk"
        :class="
          cs('message-layout__meta', {
            'message-layout__meta--self': isMessageOwner,
          })
        "
        :status="message.status"
        :is-show-read-status="true"
        :timestamp="message.time"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '../../../../styles/mixins/text' as text;

$aggregation-distance-desktop: 40px;
$message-bubble-border-radius: 8px;

.message-layout {
  display: flex;
  flex-direction: row;
  width: 100%;
  position: relative;

  &--self {
    // flex-direction: row-reverse;
  }

  &--not-last {
    padding-left: $aggregation-distance-desktop;
  }

  &__wrapper {
    display: flex;
    flex-direction: row;
    gap: 8px;
    flex: 1 1 auto;

    &--self {
    }

    &__middle {
      flex-direction: row;
      display: flex;
      gap: 4px;
      position: relative;
      align-items: flex-start;

      &__bubble {
        flex: 1 1 auto;
      }
    }
  }

  &__avatar {
    flex: 0 0 auto;
  }

  &__nick {
    font-size: 12px;
    // min-width: min(70%, 200px);

    color: #7cd7f1;

    @include text.text-ellipsis;
  }

  &__bubble {
    background-color: yellow;
    display: flex;
    flex: 1 1 auto;
    &--last {
      border-bottom-left-radius: $message-bubble-border-radius;
    }

    &--last--self {
      border-bottom-right-radius: $message-bubble-border-radius;
    }
  }

  &__meta {
    flex: 0 0 auto;
    align-self: flex-end;
  }

  &__failed {
    color: #ff584c;
    margin-left: 8px;
    cursor: pointer;
  }
}
</style>
