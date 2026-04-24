<script lang="ts" setup>
import { computed, useCssModule } from 'vue';
import cs from 'classnames';
import { View } from '../../../../baseComp/View';
import { isCallMessage as _isCallMessage } from '../../../../utils/call';
import { isRoomMessage } from '../../../../utils/room';
import { CallMessage } from './CallMessage';
import { QuickConferenceMessage } from './QuickConferenceMessage';
import type { MessageModel } from '../../../../types';

interface Props {
  message: MessageModel;
}

const customMessageClasses = computed(() => cs(
  classes['custom-message'],
  {
    [classes['custom-message--flow-in']]: props.message.flow === 'in',
    [classes['custom-message--flow-out']]: props.message.flow === 'out',
  },
));

interface CustomMessageData {
  businessID: string;
  [key: string]: any;
}

interface CustomMessagePayload {
  data: string;
  description: string;
  extension: string;
}

const props = defineProps<Props>();

const classes = useCssModule();

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
    :class="customMessageClasses"
  />

  <QuickConferenceMessage
    v-else-if="isRoomMessage(props.message)"
    :message="props.message"
  />

  <!-- text_link -->
  <View v-else-if="textLinkData" :class="customMessageClasses">
    <div>{{ textLinkData.text }}</div>
    <a :href="textLinkData.link">read more &nbsp;>>></a>
  </View>

  <div v-else :class="customMessageClasses">
    [custom message]
  </div>
</template>

<style lang="scss" module>
@use '../bubble-mixins' as bubble;

.custom-message {
  @include bubble.bubble-base();
  padding: 10px 12px;
}
</style>
