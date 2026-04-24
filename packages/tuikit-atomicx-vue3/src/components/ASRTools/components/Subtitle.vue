<template>
  <div v-if="displayMessages.length" class="asr-subtitle">
    <div class="subtitle-panel">
      <div v-if="$slots.actions" class="subtitle-actions">
        <slot name="actions" />
      </div>
      <div class="subtitle-scroll">
        <div
          v-for="item in displayMessages"
          :key="item.speakerUserId"
          class="subtitle-item"
        >
          <span class="subtitle-speaker" :title="getDisplayName(item.speakerUserId)">{{ getDisplayName(item.speakerUserId) }}：</span>
          <div class="subtitle-content">
            <span class="subtitle-text primary">
              {{ item.primaryLine }}
            </span>
            <span
              v-if="item.secondaryLine"
              class="subtitle-text secondary"
            >
              {{ item.secondaryLine }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useAITranscriberState } from '../../../states/AITranscriberState';
import { RealtimeTranscriberEvent } from '../../../types';
import { getDisplayName, getMessageDisplayLines } from '../utils/display';
import type { RealtimeTranscriberEventInfoMap, TranscriberMessage } from '../../../types';
import type { SubtitleDisplayMode } from '../../../types/asr';

const props = withDefaults(defineProps<{
  targetLanguage?: string;
  displayMode?: SubtitleDisplayMode;
}>(), {
  targetLanguage: '',
  displayMode: 'translation',
});

const { subscribeEvent, unsubscribeEvent } = useAITranscriberState();

const subtitleMessages = ref<{ [key: string]: TranscriberMessage }>({});
const subtitleTimeout: { [key: string]: ReturnType<typeof setTimeout> } = {};
const pendingDeletionSegmentIds: { [key: string]: string } = {};

const effectiveTargetLanguage = computed(() => props.targetLanguage);
const effectiveDisplayMode = computed(() => props.displayMode);

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

const displayMessages = computed(() => Object.values(subtitleMessages.value)
  .sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0))
  .map(message => ({
    ...message,
    lines: getMessageDisplayLines(
      message,
      effectiveTargetLanguage.value,
      effectiveDisplayMode.value,
    ),
  }))
  .filter(message => message.lines.length)
  .map(message => ({
    ...message,
    primaryLine: message.lines[0] || '',
    secondaryLine: effectiveDisplayMode.value === 'bilingual' ? (message.lines[1] || '') : '',
  }))
  .slice(-3));

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
  justify-content: center;
  pointer-events: none;
  text-align: initial;
  width: 50%;

}

.subtitle-panel {
  width: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-height: 132px;
  max-height: 176px;
  padding: 18px 22px;
  border-radius: 16px;
  background-color: var(--bg-color-mask);
  box-sizing: border-box;
  pointer-events: auto;
}

.subtitle-scroll {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 6px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    border-radius: 999px;
    background: transparent;
    transition: background 0.2s ease;
  }

  &:hover {
    scrollbar-color: rgba(255, 255, 255, 0.22) transparent;
  }

  &:hover::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.22);
  }
}

.subtitle-actions {
  margin-left: auto;
}

.subtitle-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  color: var(--text-color-button);
  font-size: 14px;
  line-height: 22px;
  width: 100%;
  min-width: 0;
}

.subtitle-speaker {
  opacity: 0.8;
  max-width: calc(100% - 8px);
  font-family: 'PingFang SC', sans-serif;
  font-size: 12px;
  font-weight: 400;
  line-height: 16px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.subtitle-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
  min-width: 0;
}

.subtitle-text {
  font-family: 'PingFang SC', sans-serif;
  font-size: 12px;
  font-weight: 400;
  flex: 0 1 auto;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 16px;
  min-height: 16px;

  &.primary {
    opacity: 1;
  }

  &.secondary {
    opacity: 1;
  }
}
</style>
