<script lang="ts" setup>
import { computed, useCssModule } from 'vue';
import cs from 'classnames';
import { View } from '../../../../baseComp/View';
import { isCallMessage as _isCallMessage } from '../../../../utils/call';
import { isRoomMessage } from '../../../../utils/room';
import { CallMessage } from './CallMessage';
import { QuickConferenceMessage } from './QuickConferenceMessage';
import type { CustomMessagePayload, MessageInfo } from '@atomicxcore/core';

interface Props {
  message: MessageInfo;
}

const props = defineProps<Props>();

const classes = useCssModule();

const customMessageClasses = computed(() => cs(
  classes['custom-message'],
  {
    [classes['custom-message--flow-in']]: !props.message.isSentBySelf,
    [classes['custom-message--flow-out']]: props.message.isSentBySelf,
  },
));

interface CustomMessageData {
  businessID: string;
  [key: string]: any;
}

const isCallMessage = computed(() => _isCallMessage(props.message));
const _isRoomMsg = computed(() => isRoomMessage(props.message));

const textLinkData = computed<{ text?: string; link?: string } | null>(() => {
  try {
    const payload = props.message.messagePayload as CustomMessagePayload;
    const parsed = JSON.parse(payload.customData || '{}') as CustomMessageData;
    if (parsed.businessID === 'text_link') {
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
    v-else-if="_isRoomMsg"
    :message="(props.message as any)"
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
