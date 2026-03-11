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
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { ConversationType } from '../../../types';
import { JSONStringToParse } from '../../../utils';
import { getLatestMessagePreview } from './utils';
import type { ConversationModel } from '../../../types';

const props = defineProps<{
  conversation: ConversationModel;
}>();

const { t } = useUIKit();

const draftTextAbstract = computed(() => {
  const { draftText = '' } = props?.conversation || {};
  return JSONStringToParse(draftText)?.abstract || draftText;
});

const latestMessagePreview = computed(() => getLatestMessagePreview(props.conversation, t));

/**
 * Get group @ info preview text.
 * atTypeArray[0] values: 1 = someone @me, 2 = @all, 3 = @all + someone @me
 */
const atInfoPreview = computed(() => {
  const { type, groupAtInfoList } = props?.conversation || {};

  // Only show @ info for group conversations with valid groupAtInfoList
  if (type !== ConversationType.GROUP || !groupAtInfoList?.length) {
    return '';
  }

  const atInfoTextList: string[] = [
    `[${t('TUIConversation.someone_at_me')}]`,
    `[${t('TUIConversation.at_all')}]`,
    `[${t('TUIConversation.at_all')}][${t('TUIConversation.someone_at_me')}]`,
  ];

  let atInfo = '';
  groupAtInfoList.forEach((item) => {
    const atType = item?.atTypeArray?.[0];
    if (atType && atType >= 1 && atType <= 3) {
      atInfo = atInfoTextList[atType - 1];
    }
  });

  return atInfo;
});
</script>

<style lang="scss" module>
@use './ConversationPreview.scss';
</style>
