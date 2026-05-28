<script lang="ts" setup>
import { MessageStatus } from '@atomicxcore/core';
import { IconLiveLoading, IconSuccess, IconErrorToast } from '@tencentcloud/uikit-base-component-vue3';
import { View } from '../../../../../baseComp/View';

defineProps<{
  status: MessageStatus;
}>();
</script>

<template>
  <View>
    <IconLiveLoading
      v-if="status === MessageStatus.Sending"
      class="message-meta__status--unSend"
      :size="16"
    />
    <IconSuccess
      v-else-if="status === MessageStatus.SendSuccess"
      :size="16"
    />
    <IconErrorToast
      v-else-if="status === MessageStatus.SendFail"
      :size="16"
    />
  </View>
</template>

<style lang="scss" scoped>
.message-meta__status--unSend {
  animation: rotate-infinite 1s linear infinite;
}

@keyframes rotate-infinite {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>
