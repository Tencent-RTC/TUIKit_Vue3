<template>
  <TUIButton
    type="primary"
    radius="round"
    size="medium"
    :disabled="disabled"
    @click="onSendButtonClick"
  >
    {{ t('MessageInput.send') }}
  </TUIButton>
</template>

<script setup lang="ts">
import { TUIButton, useUIKit } from '@tencentcloud/uikit-base-component-vue3';

interface SendButtonProps {
  onClick?: (e: TouchEvent) => void;
  disabled?: boolean;
}

const props = defineProps<SendButtonProps>();

const { t } = useUIKit();

function onSendButtonClick(e: TouchEvent) {
  if (!props.disabled && props.onClick) {
    props.onClick(e);
  }
}
</script>
