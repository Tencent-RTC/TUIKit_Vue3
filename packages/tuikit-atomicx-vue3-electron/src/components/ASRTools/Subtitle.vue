<template>
  <div v-if="displayMessages.length" class="asr-subtitle">
    <div
      v-for="item in displayMessages"
      :key="item.speakerUserId"
      class="subtitle-item"
    >
      <span class="subtitle-speaker">{{ getDisplayName(item.speakerUserId) }}：</span>
      <span class="subtitle-text">{{ item.sourceText }}</span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useAITranscriberState } from '../../states/AITranscriberState';
import { RealtimeTranscriberEvent } from '../../types';
import { getDisplayName } from './utils';
import type { RealtimeTranscriberEventInfoMap, TranscriberMessage } from '../../types';

const { subscribeEvent, unsubscribeEvent } = useAITranscriberState();

const subtitleMessages = ref<{ [key: string]: TranscriberMessage }>({});
const subtitleTimeout: { [key: string]: ReturnType<typeof setTimeout> } = {};
const pendingDeletionSegmentIds: { [key: string]: string } = {};

const resetSubtitleTimeout = (speakerUserId: string, fn: () => void) => {
  if (subtitleTimeout[speakerUserId]) {
    clearTimeout(subtitleTimeout[speakerUserId]);
  }
  subtitleTimeout[speakerUserId] = setTimeout(fn, 3000);
};

const handleTranscriberMessage = (message: TranscriberMessage) => {
  const { speakerUserId } = message;
  const existingMessage = subtitleMessages.value[speakerUserId];
  const pendingSegmentId = pendingDeletionSegmentIds[speakerUserId];

  if (message.isCompleted && pendingSegmentId === message.segmentId) {
    return;
  }

  if (!message.isCompleted) {
    if (subtitleTimeout[speakerUserId]) {
      clearTimeout(subtitleTimeout[speakerUserId]);
      delete subtitleTimeout[speakerUserId];
    }
    delete pendingDeletionSegmentIds[speakerUserId];
    subtitleMessages.value[speakerUserId] = message;
    return;
  }

  const isNewCompletedMessage = !existingMessage
    || existingMessage.segmentId !== message.segmentId
    || !existingMessage.isCompleted;

  subtitleMessages.value[speakerUserId] = message;

  if (isNewCompletedMessage) {
    pendingDeletionSegmentIds[speakerUserId] = message.segmentId;

    resetSubtitleTimeout(speakerUserId, () => {
      if (
        subtitleMessages.value[speakerUserId]?.isCompleted
        && subtitleMessages.value[speakerUserId]?.segmentId === message.segmentId
      ) {
        delete subtitleMessages.value[speakerUserId];
      }
      delete subtitleTimeout[speakerUserId];
      delete pendingDeletionSegmentIds[speakerUserId];
    });
  }
};

const onReceiveTranscriberMessageHandler = (eventInfo: RealtimeTranscriberEventInfoMap[RealtimeTranscriberEvent.onReceiveTranscriberMessage]) => {
  handleTranscriberMessage(eventInfo.message);
};

onMounted(() => {
  subscribeEvent(RealtimeTranscriberEvent.onReceiveTranscriberMessage, onReceiveTranscriberMessageHandler as any);
});

const displayMessages = computed(() => Object.values(subtitleMessages.value));

onUnmounted(() => {
  unsubscribeEvent(RealtimeTranscriberEvent.onReceiveTranscriberMessage, onReceiveTranscriberMessageHandler as any);
  Object.values(subtitleTimeout).forEach((timeout) => {
    clearTimeout(timeout);
  });
});

</script>

<style scoped lang="scss">
.asr-subtitle {
  position: absolute;
  left: 50%;
  bottom: 80px;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  pointer-events: none;
  z-index: 9;
  text-align: initial;
}

.subtitle-item {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 8px 12px;
  background-color: var(--bg-color-mask);
  border-radius: 10px;
  color: var(--text-color-button);
  font-size: 14px;
  line-height: 22px;
  white-space: pre-wrap;
  word-break: break-word;
  max-width: 90vw;
  width: fit-content;
}

.subtitle-speaker {
  font-weight: 600;
  flex-shrink: 0;
}

.subtitle-text {
  font-weight: 500;
  flex: 0 1 auto;
}
</style>
