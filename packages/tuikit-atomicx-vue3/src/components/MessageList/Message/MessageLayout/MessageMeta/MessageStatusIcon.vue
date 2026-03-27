<script lang="ts" setup>
import { IconLiveLoading, IconSuccess, IconErrorToast } from '@tencentcloud/uikit-base-component-vue3';
import { View } from '../../../../../baseComp/View';

defineProps<{
  status: 'unSend' | 'success' | 'fail' | string;
}>();
</script>

<template>
  <View>
    <IconLiveLoading
      v-if="status === 'unSend'"
      class="message-meta__status--unSend"
      :size="16"
    />
    <IconSuccess
      v-else-if="status === 'success'"
      :size="16"
    />
    <IconErrorToast
      v-else-if="status === 'fail'"
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
