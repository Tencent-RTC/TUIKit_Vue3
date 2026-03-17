<script lang="ts" setup>
import { computed, useCssModule } from 'vue';
import { View } from '../../../../baseComp/View';
import { isCallMessage as _isCallMessage } from '../../../../utils/call';
import { CallMessage } from './CallMessage';
import type { MessageModel } from '../../../../types';

interface Props {
  message: MessageModel;
}
const props = defineProps<Props>();

const classes = useCssModule();

interface CustomMessageData {
  businessID: string;
  [key: string]: any;
}
interface CustomMessagePayload {
  data: string;
  description: string;
  extension: string;
}

const isCallMessage = computed(() => _isCallMessage(props.message));

const textLinkData = computed<{ text?: string; link?: string } | null>(() => {
  try {
    const payload = props.message.payload as unknown as CustomMessagePayload;
    const parsed = JSON.parse(payload?.data || '{}') as CustomMessageData;
    if (parsed?.businessID === 'text_link') {
      const { text, link } = parsed;
      return { text, link };
    }
    return null;
  } catch {
    return null;
  }
});
</script>

<template>
  <CallMessage
    v-if="isCallMessage"
    :message="props.message"
    :class="classes['custom-message']"
  />

  <!-- text_link -->
  <View v-else-if="textLinkData" :class="classes['custom-message']">
    <div>{{ textLinkData.text }}</div>
    <a :href="textLinkData.link">read more &nbsp;>>></a>
  </View>

  <div v-else :class="classes['custom-message']">
    [custom message]
  </div>
</template>

<style lang="scss" module>
.custom-message {
  padding: 8px 16px;
}
</style>
