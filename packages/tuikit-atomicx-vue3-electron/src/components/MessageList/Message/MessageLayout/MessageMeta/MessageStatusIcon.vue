<script lang="ts" setup>
import { IconLoading, IconSuccess, IconErrorToast } from '@tencentcloud/uikit-base-component-vue3';
import { View } from '../../../../../baseComp/View';

defineProps<{
  status: 'unSend' | 'success' | 'fail' | string;
}>();
</script>

<template>
  <View>
    <IconLoading
      v-if="status === 'unSend'"
      class="message-meta__status--unSend"
      :size="14"
    />
    <IconSuccess
      v-else-if="status === 'success'"
      :size="14"
    />
    <IconErrorToast
      v-else-if="status === 'fail'"
      :size="14"
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
