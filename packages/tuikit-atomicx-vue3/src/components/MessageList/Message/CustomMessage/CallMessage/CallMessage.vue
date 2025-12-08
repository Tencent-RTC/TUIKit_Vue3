<script setup lang="ts">
import { computed, useCssModule } from 'vue';
import { IconCall1Filled, IconVideoDefaultFilled, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { View } from '../../../../../baseComp/View';
import { useConversationListState } from '../../../../../states/ConversationListState';
import { ConversationType } from '../../../../../types/engine';
import { parseCallMessage, startCall, parseCallMessageText } from '../../../../../utils/call';
import type { MessageModel } from '../../../../../types';

interface Props {
  message: MessageModel;
}

const props = defineProps<Props>();

const { t } = useUIKit();
const classes = useCssModule();
const { activeConversation } = useConversationListState();

const text = computed(() => parseCallMessageText(props.message, t));
const payload = computed(() => parseCallMessage(props.message));

const callAgain = () => {
  if (!activeConversation.value || !payload.value || props.message.conversationType === ConversationType.GROUP) {
    return;
  }

  startCall({
    type: payload.value.data.data.call_type,
    userIDList: [activeConversation.value.userProfile?.userID],
  });
};
</script>

<template>
  <View
    v-if="props.message.conversationType === ConversationType.C2C"
    :gap="8"
    dir="row"
    :class="classes['call-message-c2c']"
    @click="callAgain"
  >
    <IconCall1Filled v-if="payload?.data.data.call_type === 1" :class="classes['call-message-c2c__icon']" />
    <IconVideoDefaultFilled v-else :class="classes['call-message-c2c__icon']" />
    {{ text }}
  </View>
  <View v-else :class="classes['call-message-group']">
    {{ text }}
  </View>
</template>

<style lang="scss" module>
.call-message-c2c {
  cursor: pointer;
  align-items: center;
  font-weight: normal;
  font-size: 14px;

  &__icon {
    color: var(--text-color-link);
  }
}

.call-message-group {
  align-items: center;
  font-weight: normal;
  font-size: 14px;
}
</style>
