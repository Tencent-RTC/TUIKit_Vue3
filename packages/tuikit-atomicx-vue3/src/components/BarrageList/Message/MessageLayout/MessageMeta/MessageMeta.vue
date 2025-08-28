<template>
  <div
    :class="cs('message-meta', props.class)"
    :style="props.style"
  >
    <span
      v-if="props.isShowTime"
      class="message-meta__time"
    >{{ getTimeStampAuto(props.timestamp) }}</span>
    <div
      v-if="showStatus"
      class="message-meta__status"
    >
      <MessageStatusIcon :status="props.status" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import cs from 'classnames';
import { getTimeStampAuto } from '../../../../../utils/time';
import MessageStatusIcon from './MessageStatusIcon.vue';

interface IMessageMetaProps {
  timestamp: number;
  /**
   * - unSend: not sent
   * - success: sent successfully
   * - fail: sending failed
   */
  isShowSendStatus?: boolean;
  isShowReadStatus?: boolean;
  isShowTime?: boolean;
  status?: string;
  class?: string;
  style?: Record<string, any>;
}

const props = withDefaults(defineProps<IMessageMetaProps>(), {
  isShowSendStatus: false,
  isShowReadStatus: false,
  isShowTime: false,
  status: '',
  class: undefined,
  style: undefined,
});

const showStatus = computed(() => (props.status && props.isShowSendStatus) || props.status === 'fail');
</script>

<style lang="scss" scoped>
.message-meta {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #999;
  margin-top: 4px;

  .time {
    line-height: 1;
  }

  &__status {
    color: #2a7bfa;
  }
}
</style>
