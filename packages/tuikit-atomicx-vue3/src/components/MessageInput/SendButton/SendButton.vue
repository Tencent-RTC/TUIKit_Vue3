<template>
  <TUIButton
    type="primary"
    shape="round"
    size="medium"
    :disabled="disabled"
    @click="onSendButtonClick"
  >
    {{ t('TUIChat.Send') }}
  </TUIButton>
</template>

<script setup lang="ts">
import { TUIButton, useUIKit } from '@tencentcloud/uikit-base-component-vue3';

interface Props {
  onClick?: (e: MouseEvent) => void;
  disabled?: boolean;
}

const props = defineProps<Props>();
const { t } = useUIKit();
function onSendButtonClick(e: MouseEvent) {
  if (!props.disabled && props.onClick) {
    props.onClick(e);
  }
}
</script>
