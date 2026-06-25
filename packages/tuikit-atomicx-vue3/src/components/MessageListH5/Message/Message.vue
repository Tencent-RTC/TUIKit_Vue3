<script lang="ts" setup>
import type { Component } from 'vue';
import { MessageLayout } from './MessageLayout';
import type { MessageAction } from '../../../hooks/useMessageActions';
import type { MessageInfo } from '@atomicxcore/core';

interface MessageProps {
  message: MessageInfo;
  nick?: string;
  alignment?: 'left' | 'right' | 'two-sided';
  messageActionList?: MessageAction[] | undefined;
  messageAvatar?: Component | undefined;
  isAggregated?: boolean;
  isFirstInChunk?: boolean;
  isLastInChunk?: boolean;
  isHiddenMessageAvatar?: boolean;
  removeAvatar?: boolean;
  isHiddenMessageNick?: boolean;
  isHiddenMessageMeta?: boolean;
}

withDefaults(defineProps<MessageProps>(), {
  alignment: 'two-sided',
  nick: undefined,
  messageActionList: undefined,
  messageAvatar: undefined,
  isAggregated: false,
  isFirstInChunk: undefined,
  isLastInChunk: undefined,
  isHiddenMessageAvatar: false,
  removeAvatar: false,
  isHiddenMessageNick: false,
  isHiddenMessageMeta: false,
});
</script>

<template>
  <MessageLayout
    :nick="nick"
    :message="message"
    :messageActionList="messageActionList"
    :message-avatar="messageAvatar"
    :alignment="alignment"
    :is-aggregated="isAggregated"
    :is-first-in-chunk="isFirstInChunk"
    :is-last-in-chunk="isLastInChunk"
    :is-hidden-message-avatar="isHiddenMessageAvatar"
    :remove-avatar="removeAvatar"
    :is-hidden-message-nick="isHiddenMessageNick"
  />
</template>

<style lang="scss" scoped></style>
