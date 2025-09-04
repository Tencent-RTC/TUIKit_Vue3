<script lang="ts" setup>
import { IconLoading, IconSuccess } from '@tencentcloud/uikit-base-component-vue3';

defineProps<{
  status: string;
}>();
</script>

<template>
  <IconLoading
    v-if="status === 'unSend'"
    class="message-meta__status--unSend"
    :size="16"
  />
  <IconSuccess
    v-else-if="status === 'success'"
    name="&#xe60a;"
    :size="16"
  />
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
