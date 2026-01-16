<template>
  <div
    ref="conversationContainerRef"
    class="conversation"
    @scroll="handleScroll"
  >
    <div
      v-for="group in transcribedMessageList"
      :key="`${group.sender}-${group.startMsTs}`"
      class="conversation-group"
    >
      <div class="title">
        <span class="speaker">{{ getDisplayName(group.sender) }}</span>
        <span class="timestamp">
          {{ formatTimestampToTime(group.startMsTs) }}
        </span>
      </div>
      <div
        v-for="(message, messageIndex) in group.messages"
        :key="message.segmentId || messageIndex"
        class="content"
      >
        {{ message.sourceText }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick, watch } from 'vue';
import { useAITranscriberState } from '../../states/AITranscriberState';
import { formatTimestampToTime } from '../../utils/utils';
import { getDisplayName } from './utils';
import type { TranscriberMessage } from '../../types/asr';

interface MessageGroup {
  sender: string;
  startMsTs: number;
  messages: TranscriberMessage[];
}

const conversationContainerRef = ref<HTMLElement>();
const isUserScrolling = ref(false);
const timeInterval = 60 * 1000; // 60 seconds

const { realtimeMessageList } = useAITranscriberState();

const isAtBottom = (): boolean => {
  if (!conversationContainerRef.value) {
    return false;
  }
  const { scrollTop, scrollHeight, clientHeight } = conversationContainerRef.value;

  return Math.ceil(scrollTop + clientHeight) >= scrollHeight - 50;
};

const scrollToBottom = () => {
  if (!conversationContainerRef.value || isUserScrolling.value) {
    return;
  }
  requestAnimationFrame(() => {
    if (conversationContainerRef.value) {
      conversationContainerRef.value.scrollTop = conversationContainerRef.value.scrollHeight;
    }
  });
};

onMounted(() => {
  scrollToBottom();
});

const handleScroll = () => {
  if (conversationContainerRef.value) {
    isUserScrolling.value = !isAtBottom();
  }
};

const transcribedMessageList = computed((): MessageGroup[] => {
  // Filter only completed messages and sort by timestamp
  const completedMessages = realtimeMessageList.value
    .filter(msg => msg.sourceText?.trim())
    .sort((a, b) => a.timestamp - b.timestamp);

  if (completedMessages.length === 0) {
    return [];
  }

  // Group messages by speaker and time interval
  const aggregatedMessageList: MessageGroup[] = [];
  let currentGroup: MessageGroup | null = null;

  completedMessages.forEach((message) => {
    const speakerId = message.speakerUserId || 'unknown';

    if (
      !currentGroup
      || speakerId !== currentGroup.sender
      || message.timestamp - currentGroup.startMsTs > timeInterval
    ) {
      // Create a new group
      currentGroup = {
        sender: speakerId,
        startMsTs: message.timestamp,
        messages: [message],
      };
      aggregatedMessageList.push(currentGroup);
    } else {
      // Add to current group
      currentGroup.messages.push(message);
    }
  });

  return aggregatedMessageList;
});

watch(() => realtimeMessageList.value.length, () => {
  nextTick(() => {
    if (!isUserScrolling.value) {
      scrollToBottom();
    }
  });
});

</script>

<style scoped lang="scss">
.conversation {
  height: 100%;
  padding: 20px;
  overflow-y: auto;
  text-align: initial;

  :deep(::-webkit-scrollbar-track) {
    background: transparent;
    margin: 16px 0;
  }

  :deep(::-webkit-scrollbar) {
    width: 6px;
  }

  :deep(::-webkit-scrollbar-thumb) {
    border-radius: 3px;
    background-color: var(--stroke-color-secondary);
  }
}

.conversation-group {
  margin-bottom: 20px;
}

.title {
  display: flex;
  gap: 10px;
  align-items: center;
  font-size: 14px;
  font-weight: 400;
  line-height: 22px;
  text-align: left;
  color: var(--text-color-secondary);

  .speaker {
    max-width: 150px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.content {
  padding: 8px;
  margin-top: 5px;
  font-size: 14px;
  font-weight: 400;
  line-height: 22px;
  text-align: left;
  border-radius: 8px;
  background-color: var(--bg-color-bubble-reciprocal);
}
</style>
