<template>
  <div :class="$style.conversationPreview__abstract">
    <template v-if="draftTextAbstract">
      <label :class="$style.conversationPreview__abstract__drafts">[{{ t('TUIConversation.Drafts') }}]</label>
      {{ ' ' }}
      {{ draftTextAbstract }}
    </template>
    <template v-else>
      <label v-if="atInfoPreview" :class="$style['conversationPreview__abstract__at-info']">{{ atInfoPreview }}</label>
      {{ latestMessagePreview }}
    </template>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { GroupAtType } from '@atomicxcore/core';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { JSONStringToParse } from '../../../utils';
import { getLatestMessagePreview } from './utils';
import type { ConversationInfo } from '@atomicxcore/core';

const props = defineProps<{
  conversation: ConversationInfo;
}>();

const { t } = useUIKit();

const draftTextAbstract = computed(() => {
  const { draft = '' } = props?.conversation || {};
  return JSONStringToParse(draft)?.abstract || draft;
});

const latestMessagePreview = computed(() => getLatestMessagePreview(props.conversation, t));

/**
 * Get group @ info preview text based on GroupAtType enum.
 */
const atInfoPreview = computed(() => {
  const { type, groupAtInfoList } = props?.conversation || {};

  // Only show @ info for group conversations with valid groupAtInfoList
  if (type !== 'group' || !groupAtInfoList?.length) {
    return '';
  }

  let atInfo = '';
  groupAtInfoList.forEach((item) => {
    switch (item.atType) {
      case GroupAtType.AtMe:
        atInfo = `[${t('TUIConversation.someone_at_me')}]`;
        break;
      case GroupAtType.AtAll:
        atInfo = `[${t('TUIConversation.at_all')}]`;
        break;
      case GroupAtType.AtAllAtMe:
        atInfo = `[${t('TUIConversation.at_all')}][${t('TUIConversation.someone_at_me')}]`;
        break;
      default:
        break;
    }
  });

  return atInfo;
});
</script>

<style lang="scss" module>
@use './ConversationPreview.scss';
</style>
