<script lang="ts" setup>
import { computed } from 'vue';
import type { CSSProperties } from 'vue';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import cs from 'classnames';
import { View } from '../../../../../baseComp/View';
import { getTimeStampAuto } from '../../../../../utils/time';

import MessageStatusIcon from './MessageStatusIcon.vue';

interface MessageMetaProps {
  isGroup: boolean;
  timestamp: number;
  flow: string;
  needReadReceipt?: boolean;
  readReceiptInfo?: {
    readCount: number;
    unreadCount: number;
    isPeerRead: boolean;
  };
  status?: 'unSend' | 'success' | 'fail' | string;
  class?: string;
  style?: CSSProperties;
}

const props = withDefaults(defineProps<MessageMetaProps>(), {
  timestamp: 0,
  flow: '',
  needReadReceipt: false,
  readReceiptInfo: undefined,
  status: undefined,
  class: undefined,
  style: undefined,
});

const emits = defineEmits(['onReadReceiptTextClick']);

const { t } = useUIKit();

const displayTime = computed(() => getTimeStampAuto(props.timestamp));

const handleGroupUnreadClick = () => {
  emits('onReadReceiptTextClick');
};

const shouldShowStatusIcon = computed(() => (
  props.flow === 'out'
  && (!props.needReadReceipt
    || props.status === 'unSend'
    || props.status === 'fail')));

const readReceiptText = computed(() => {
  if (!props.needReadReceipt || props.status !== 'success' || !props.readReceiptInfo) {
    return '';
  }

  if (props.isGroup) {
    if (props.readReceiptInfo.unreadCount > 0) {
      return `${props.readReceiptInfo.unreadCount} ${t('MessageList.unread')} ·`;
    }
    return `${t('MessageList.all_read')} ·`;
  }
  if (props.readReceiptInfo.isPeerRead) {
    return `${t('MessageList.read')} ·`;
  }
  return `${t('MessageList.unread')} ·`;
});
</script>

<template>
  <View
    :class="cs('message-meta', props.class)"
    dir="row"
    align="center"
    :style="props.style"
  >
    <!-- Show status icon case -->
    <template v-if="shouldShowStatusIcon">
      <MessageStatusIcon
        v-if="props.status"
        :status="props.status"
      />
    </template>

    <!-- Show read receipt text case -->
    <template v-else>
      <span
        v-if="readReceiptText && !props.isGroup"
        class="message-meta__read-status"
      >
        {{ readReceiptText }}
      </span>
      <span
        v-else-if="readReceiptText && props.isGroup && props.readReceiptInfo && props.readReceiptInfo.unreadCount > 0"
        class="message-meta__group-unread"
        @click="handleGroupUnreadClick"
      >
        {{ readReceiptText }}
      </span>
      <span
        v-else-if="readReceiptText && props.isGroup"
        class="message-meta__group-all-read"
      >
        {{ readReceiptText }}
      </span>
    </template>

    <!-- Time display -->
    <span
      v-if="displayTime"
      class="message-meta__time"
    >
      {{ displayTime }}
    </span>
  </View>
</template>

<style lang="scss" scoped>
.message-meta {
  gap: 4px;
  font-size: 12px;
  color: var(--text-color-secondary);

  &__read-status {
    font-size: 12px;
  }

  &__group-unread {
    font-size: 12px;
    color: var(--text-color-link);
    cursor: pointer;

    &:hover {
      text-decoration: underline;
      color: var(--text-color-link-hover);
    }
  }

  &__group-all-read {
    font-size: 12px;
  }

  &__time {
    font-size: 12px;
  }
}
</style>
