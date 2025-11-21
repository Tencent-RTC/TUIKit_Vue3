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
import { computed } from 'vue';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import cs from 'classnames';
import { useMessageInputState } from '../../../../states/MessageInputState';
import { View } from '../../../../baseComp/View';
import { MessageType } from '../../../../types';
import type { MessageModel } from '../../../../types';

interface IRecalledMessageProps {
  message: MessageModel;
  class?: string;
  style?: Record<string, any>;
}

const props = withDefaults(defineProps<IRecalledMessageProps>(), {
  class: undefined,
  style: undefined,
});

const { t } = useUIKit();
const { setContent, focusEditor } = useMessageInputState();

const isTextMessage = computed(() => props.message.type === MessageType.TEXT as any);
const isMessageOwner = computed(() => props.message.flow === 'out');
const otherDisplayName = computed(() => props.message.nick || props.message.from || '');

function recallMessageToInput() {
  // Assuming Vue version has similar transformTextWithEmojiKeyToName function
  // Need to implement or import the corresponding function when actually used
  const transformedText = props.message.payload.text;
  setContent(transformedText);
  focusEditor();
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
