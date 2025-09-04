<template>
  <View
    :class="cs('recalled-message', props.class)"
    :style="props.style"
  >
    <template v-if="isMessageOwner">
      {{ t('TUIChat.You') }}{{ t('TUIChat.recalled a message') }}
      <View
        v-if="isTextMessage"
        role="button"
        class="recalled-message__button"
        @click="recallMessageToInput"
      >
        {{ t('TUIChat.Re-edit') }}
      </View>
    </template>
    <template v-else>
      {{ otherDisplayName }} {{ t('TUIChat.recalled a message') }}
    </template>
  </View>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import TUIChatEngine from '@tencentcloud/chat-uikit-engine';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import cs from 'classnames';
import { View } from '../../../../baseComp/View';
import type { IMessageModel } from '@tencentcloud/chat-uikit-engine';

interface IRecalledMessageProps {
  message: IMessageModel;
  class?: string;
  style?: Record<string, any>;
}

const props = withDefaults(defineProps<IRecalledMessageProps>(), {
  class: undefined,
  style: undefined,
});

const { t } = useUIKit();

// Assuming Vue version has similar inputStore
// Need to implement or import the corresponding store when actually used
const setInputValue = (text: string) => {
  // Implement logic to set input value
  console.log('Set input value:', text);
};
const inputElementRef = {
  current: null as HTMLElement | null,
};

const isTextMessage = computed(() => props.message.type === TUIChatEngine.TYPES.MSG_TEXT);
const isMessageOwner = computed(() => props.message.flow === 'out');
const otherDisplayName = computed(() => props.message.nick || props.message.from || '');

function recallMessageToInput() {
  // Assuming Vue version has similar transformTextWithEmojiKeyToName function
  // Need to implement or import the corresponding function when actually used
  const transformedText = props.message.payload.text;
  setInputValue(transformedText);
  inputElementRef.current?.focus();
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
