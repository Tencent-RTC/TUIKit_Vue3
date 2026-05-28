<!-- eslint-disable import/extensions -->
<template>
  <div :class="$style.conversationItem" @click="handleClick">
    <div :class="$style.avatarWrapper">
      <Avatar :src="avatar" :alt="name" />
    </div>
    <div :class="$style.conversationContent">
      <div :class="$style.conversationHeader">
        <span :class="$style.name" v-html="highlightText(name, keyword, $style.highlight)"></span>
      </div>
      <div :class="$style.showText" v-html="highlightText(messageText, keyword, $style.highlight)"></div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { MessageType } from '@atomicxcore/core';
import { SearchType } from '../../../../../types/search';
import type { ResultItemProps } from '../../../../../types/search';
import { Avatar } from '../../../../Avatar';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { highlightText } from '../utils';

const props = defineProps<ResultItemProps<SearchType.MESSAGE>>();

const { t } = useUIKit();

const avatar = computed(() => props.data.conversationAvatarURL);
const name = computed(() => props.data.conversationShowName || props.data.conversationID);
const messageCount = computed(() => props.data.messageCount);
const messageList = computed(() => props.data.messageList);

const messageText = computed(() => {
  const firstMsg = messageList.value?.[0];
  if (firstMsg && firstMsg.messageType === MessageType.Text) {
    const payload = firstMsg.messagePayload as any;
    // payload.text can be string or array of {name, text, src} items
    if (typeof payload?.text === 'string') {
      return payload.text;
    }
    if (Array.isArray(payload?.text)) {
      return payload.text
        .filter((item: any) => item.name === 'text')
        .map((item: any) => item.text)
        .join('');
    }
  }
  return t('Search.results.foundMessages', { count: messageCount.value });
});

const handleClick = () => {
  props.onClick?.(props.data, SearchType.MESSAGE);
};
</script>

<style lang="scss" module>
@use './Conversation.scss';
</style>
