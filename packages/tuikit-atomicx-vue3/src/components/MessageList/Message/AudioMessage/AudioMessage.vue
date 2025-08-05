<template>
  <View class="audio-message">
    <View class="audio-message__content">
      <PlayButton
        :is-playing="isPlaying"
        @click="isPlaying ? pause() : play()"
      />
      <WaveForm
        :progress="progress"
        :bars-count="barCount"
        @seek="setProgress"
      />
      <View class="audio-message__duration">
        {{ formatDuration(messageContent.second) }}
      </View>
    </View>
  </View>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { View } from '../../../../baseComp/View';
import { useAudioControl } from '../../../../hooks/useAudioControl';
import PlayButton from './PlayButton.vue';
import WaveForm from './WaveForm.vue';
import type { IMessageModel } from '@tencentcloud/chat-uikit-engine';

interface IAudioMessageProps {
  message: IMessageModel;
}

interface IAudioMessageContent {
  url: string;
  second: number;
}

const props = defineProps<IAudioMessageProps>();

const messageContent = computed(() => props.message.getMessageContent() as IAudioMessageContent);
const barCount = computed(() => {
  const count = messageContent.value.second;
  if (count <= 5) {
    return 10;
  }
  if (count <= 10) {
    return 14;
  }
  return 18;
});

// Generate unique ID
const audioId = computed(() => `audio-${props.message.ID}`);

// Use audio control hook
const {
  isPlaying,
  progress,
  play,
  pause,
  setProgress,
} = useAudioControl({
  url: messageContent.value.url,
  audioId: audioId.value,
});

// Format audio duration
const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};
</script>

<style lang="scss" scoped>
.audio-message {
  padding: 8px 16px;

  &__content {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 12px;
  }

  &__duration {
    flex-shrink: 0;
    font-size: 14px;
    color: #999;
    min-width: 36px;
  }
}
</style>
