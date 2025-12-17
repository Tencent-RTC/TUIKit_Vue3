<script lang="ts" setup>
import { MessageLayout } from './MessageLayout';
import type { MessageAction } from '../../../hooks/useMessageActions';
import type { MessageModel } from '../../../types/engine';

interface MessageProps {
  message: MessageModel;
  nick?: string;
  alignment?: 'left' | 'right' | 'two-sided';
  messageActionList?: MessageAction[] | undefined;
  isAggregated?: boolean;
  isFirstInChunk?: boolean;
  isLastInChunk?: boolean;
  isHiddenMessageAvatar?: boolean;
  isHiddenMessageNick?: boolean;
  isHiddenMessageMeta?: boolean;
}

withDefaults(defineProps<MessageProps>(), {
  alignment: 'two-sided',
  nick: undefined,
  messageActionList: undefined,
  isAggregated: false,
  isFirstInChunk: undefined,
  isLastInChunk: undefined,
  isHiddenMessageAvatar: false,
  isHiddenMessageNick: false,
  isHiddenMessageMeta: false,
});
</script>

<template>
  <MessageLayout
    :nick="nick"
    :message="message"
    :messageActionList="messageActionList"
    :alignment="alignment"
    :is-aggregated="isAggregated"
    :is-first-in-chunk="isFirstInChunk"
    :is-last-in-chunk="isLastInChunk"
    :is-hidden-message-avatar="isHiddenMessageAvatar"
    :is-hidden-message-nick="isHiddenMessageNick"
    :is-hidden-message-meta="isHiddenMessageMeta"
  />
</template>

<style lang="scss" scoped></style>
