<template>
  <div :class="$style.conversationPreview__abstract">
    <template v-if="draftTextAbstract">
      <label :class="$style.conversationPreview__drafts">{{ t('TUIChat.[Drafts]') }}</label>
      {{ ' ' }}
      {{ draftTextAbstract }}
    </template>
    <template v-else>
      {{ latestMessagePreview }}
    </template>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
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
</script>

<style lang="scss" module>
@import './ConversationPreview.scss';
</style>
