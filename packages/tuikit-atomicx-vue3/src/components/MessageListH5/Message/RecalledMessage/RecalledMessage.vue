<template>
  <View
    :class="cs('recalled-message', props.class)"
    :style="props.style"
  >
    <template v-if="isMessageOwner">
      {{ `${t('MessageList.you')} ${t('MessageList.recalled_a_message')}` }}
      <View
        v-if="isTextMessage"
        role="button"
        class="recalled-message__button"
        @click="recallMessageToInput"
      >
        {{ t('MessageList.reedit') }}
      </View>
    </template>
    <template v-else>
      {{ `${otherDisplayName} ${t('MessageList.recalled_a_message')}` }}
    </template>
  </View>
</template>

<script lang="ts" setup>
import { computed, inject } from 'vue';
import { MessageType } from '@atomicxcore/core';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import cs from 'classnames';
import { View } from '../../../../baseComp/View';
import { useChatUIState } from '../../../../context/useChatUIState';
import type { MessageInfo } from '@atomicxcore/core';

interface IRecalledMessageProps {
  message: MessageInfo;
  class?: string;
  style?: Record<string, any>;
}

const props = withDefaults(defineProps<IRecalledMessageProps>(), {
  class: undefined,
  style: undefined,
});

const { t } = useUIKit();
const channel = inject('channel', 'default') as string;
const { setInputContent, focusInput } = useChatUIState(channel);

const isTextMessage = computed(() => props.message.messageType === MessageType.Text);
const isMessageOwner = computed(() => props.message.isSentBySelf);
const otherDisplayName = computed(() => props.message.from.nickname || props.message.from.userID || '');

function recallMessageToInput() {
  const transformedText = (props.message.messagePayload as any)?.text ?? '';
  setInputContent(transformedText);
  focusInput();
}
</script>

<style lang="scss" scoped>
.recalled-message {
  display: flex;
  flex-direction: row;
  align-self: center;
  justify-content: center;
  font-size: 14px;
  white-space: pre-wrap;
  color: var(--text-color-secondary);

  &__button {
    cursor: pointer;
    text-decoration: underline;
    color: var(--text-color-link);
  }
}
</style>
