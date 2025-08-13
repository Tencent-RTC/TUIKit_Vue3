<template>
  <div :class="$style.conversationPreview__time">
    {{ time }}
  </div>
</template>

<script lang="ts" setup>
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { getTimeStamp } from '../../../utils/time';
import type { ConversationModel } from '../../../types';

const props = defineProps<{
  conversation: ConversationModel;
}>();

const { language } = useUIKit();

const time = getTimeStamp({
  time: Number(props.conversation?.lastMessage?.lastTime || 0) * 1000,
  language,
}) || '';

</script>

<style lang="scss" module>
@import './ConversationPreview.scss';
</style>
