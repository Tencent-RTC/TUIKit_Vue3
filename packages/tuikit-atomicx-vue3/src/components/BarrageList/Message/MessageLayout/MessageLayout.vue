<script lang="ts" setup>
import { toRefs, computed, withDefaults, defineProps } from 'vue';
import cs from 'classnames';
import { BarrageType } from '../../../../states/BarrageState';
import { useLoginState } from '../../../../states/LoginState';
import { CustomMessage } from '../CustomMessage';
import { TextMessage } from '../TextMessage';
import { MessageBubble } from './MessageBubble';
import type { Barrage } from '../../../../states/BarrageState';

interface IMessageLayoutProps {
  message: Barrage;
  isLastInChunk?: boolean;
  className?: string;
  style?: Record<string, any>;
}

const props = withDefaults(defineProps<IMessageLayoutProps>(), {
  message: () => ({}) as Barrage,
  isLastInChunk: true,
  className: '',
  style: () => ({}),
});

const { loginUserInfo } = useLoginState();
const {
  message,
  isLastInChunk,
  className,
  style,
} = toRefs(props);

const MessageComponentsFactory = {
  [BarrageType.text]: TextMessage,
  [BarrageType.custom]: CustomMessage,
};

const MessageComponent = computed(() => MessageComponentsFactory[message.value.messageType]);

const isMessageOwner = computed(() => message.value.sender.userId === loginUserInfo.value?.userId);
</script>

<template>
  <div
    v-if="MessageComponent"
    :data-message-id="message.sequence"
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
          v-if="isLastInChunk && message.messageType !== BarrageType.text"
          :class="cs('message-layout__nick')"
        >
          {{ message.sender.nameCard || message.sender.userName || message.sender.userId + ': ' }}
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
          <component
            :is="MessageComponent"
            :message="message"
            :is-last-in-chunk="isLastInChunk"
          />
        </MessageBubble>
      </div>
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
  }

  &__failed {
    color: #ff584c;
    margin-left: 8px;
    cursor: pointer;
  }
}
</style>
