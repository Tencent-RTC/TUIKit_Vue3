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
import { computed, defineProps } from 'vue';
import TUIChatEngine from '@tencentcloud/chat-uikit-engine';
import { SearchType } from '../../../../../types/engine';
import type { ResultItemProps } from '../../../../../types/search';
import { Avatar } from '../../../../Avatar';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { highlightText } from '../utils';

const props = defineProps<ResultItemProps<SearchType.MESSAGE>>();

const { t } = useUIKit();

const conversation = computed(() => props.data.conversation);
const messageCount = computed(() => props.data.messageCount);
const messageList = computed(() => props.data.messageList);

const conversationType = computed(() => conversation.value?.type);

const avatar = computed(() =>
  conversationType.value === TUIChatEngine.TYPES.CONV_C2C
    ? conversation.value?.userProfile?.avatar
    : conversation.value?.groupProfile?.avatar
);

const name = computed(() =>
  conversationType.value === TUIChatEngine.TYPES.CONV_C2C
    ? conversation.value?.userProfile?.nick || conversation.value?.userProfile?.userID
    : conversation.value?.groupProfile?.name || conversation.value?.groupProfile?.groupID
);

const messageText = computed(() =>
  messageList.value?.[0]?.payload?.text || t('Search.results.foundMessages', { count: messageCount.value })
);

const handleClick = () => {
  props.onClick?.(props.data, SearchType.MESSAGE);
};
</script>

<style lang="scss" module>
@import './Conversation.scss';
</style>
