<template>
  <View
    :class="cs('audio-message', {
      'audio-message--flow-in': !message.isSentBySelf,
      'audio-message--flow-out': message.isSentBySelf,
    })"
  >
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
        {{ formatDuration(messageContent.audioDuration) }}
      </View>
    </View>
  </View>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import cs from 'classnames';
import { View } from '../../../../baseComp/View';
import { useAudioControl } from '../../../../hooks/useAudioControl';
import PlayButton from './PlayButton.vue';
import WaveForm from './WaveForm.vue';
import type { MessageInfo, AudioMessagePayload } from '@atomicxcore/core';

interface IAudioMessageProps {
  message: MessageInfo;
}

const props = defineProps<IAudioMessageProps>();

const messageContent = computed(() => props.message.messagePayload as AudioMessagePayload);

const barCount = computed(() => {
  const count = messageContent.value.audioDuration;
  if (count <= 5) {
    return 10;
  }
  if (count <= 10) {
    return 14;
  }
  return 18;
});

// Generate unique ID
const audioId = computed(() => `audio-${props.message.msgID}`);

// Use audio control hook
const {
  isPlaying,
  progress,
  play,
  pause,
  setProgress,
} = useAudioControl({
  url: messageContent.value.audioURL ?? '',
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
@use '../bubble-mixins' as bubble;

.audio-message {
  @include bubble.bubble-base();
  padding: 10px 12px;

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
