<template>
  <div
    class="message-bubble"
    :class="
      cs({
        [`bubble-${flow}`]: flow && true,
        'all-round-radius': !isLastInChunk,
      })
    "
  >
    <slot />
  </div>
</template>

<script lang="ts" setup>
import { toRefs, defineProps, withDefaults } from 'vue';
import cs from 'classnames';
import { useLoginState } from '../../../../../states/LoginState';
import type { Barrage } from '../../../../../states/BarrageState';

interface IMessageBubbleProps {
  message: Barrage;
  isLastInChunk: boolean;
}

const { loginUserInfo } = useLoginState();

const props = withDefaults(defineProps<IMessageBubbleProps>(), {
  message: () => ({}) as Barrage,
  isLastInChunk: false,
});

const { message, isLastInChunk } = toRefs(props);
const flow = message.value.sender.userId === loginUserInfo.value?.userId ? 'in' : 'out';
</script>

<style lang="scss" scoped>
$message-bubble-border-radius: 8px;

.message-bubble {
  border-radius: $message-bubble-border-radius;
  flex: 1;

  &.all-round-radius {
    border-radius: $message-bubble-border-radius;
  }
}

.bubble-in {
  border-top-left-radius: 0px;
}

.bubble-out {
  border-top-right-radius: 0px;
}
</style>
