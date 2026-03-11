<script lang="ts" setup>
import { ref, computed, watch } from 'vue';
import cs from 'classnames';
import { View } from '../../../../baseComp/View';
import type { MessageModel } from '../../../../types/engine';

interface VideoMessageProps {
  message: MessageModel;
  isLastInChunk?: boolean;
}

interface VideoMessageContent {
  showName: string;
  snapshotHeight: number;
  snapshotWidth: number;
  snapshotUrl: string;
  url: string;
}

const props = withDefaults(defineProps<VideoMessageProps>(), {
  isLastInChunk: false,
  message: () => ({} as MessageModel),
});

// SDK uses 200×200 as placeholder before actual dimensions are available
const isPlaceholderSize = (width: number, height: number): boolean => width === 200 && height === 200;

const messageContent = computed(() =>
  props.message.getMessageContent() as VideoMessageContent,
);

const videoNaturalSize = ref<{ height: number; aspectRatio: number } | null>(null);
const loaded = ref(false);

// Priority: video metadata > snapshot > null (for placeholder data)
const naturalSize = computed(() => {
  if (videoNaturalSize.value) {
    return videoNaturalSize.value;
  }

  const content = messageContent.value;

  if (isPlaceholderSize(content.snapshotWidth, content.snapshotHeight)) {
    return null;
  }

  if (content.snapshotWidth && content.snapshotHeight) {
    return {
      height: content.snapshotHeight,
      aspectRatio: content.snapshotWidth / content.snapshotHeight,
    };
  }

  return null;
});

const displaySize = computed(() => {
  const MAX_HEIGHT = 300;
  const PLACEHOLDER_HEIGHT = 200;
  const DEFAULT_RATIO = 3 / 4;

  if (!naturalSize.value) {
    return {
      height: PLACEHOLDER_HEIGHT,
      aspectRatio: DEFAULT_RATIO,
    };
  }

  const { aspectRatio } = naturalSize.value;

  if (aspectRatio > 1) {
    return {
      aspectRatio,
      height: 200,
    };
  }

  return {
    aspectRatio,
    height: MAX_HEIGHT,
  };
});

const isMessageOwner = computed(() => props.message.flow === 'out');

const onVideoLoad = (e: Event) => {
  const video = e.target as HTMLVideoElement;

  videoNaturalSize.value = {
    aspectRatio: video.videoWidth / video.videoHeight,
    height: video.videoHeight,
  };

  loaded.value = true;
};

// Reset state when message ID changes (e.g., URL switches from blob to real)
watch(() => props.message.ID, () => {
  loaded.value = false;
  videoNaturalSize.value = null;
});
</script>

<template>
  <View
    :class="cs('video-message', {
      'video-message--last--self': isMessageOwner && isLastInChunk,
      'video-message--last--other': !isMessageOwner && isLastInChunk,
      'video-message--loaded': loaded
    })"
    :style="{
      maxHeight: `${displaySize.height}px`,
      aspectRatio: naturalSize ? `${displaySize.aspectRatio}` : 'auto',
      width: !loaded ? `${displaySize.height * displaySize.aspectRatio}px` : undefined
    }"
  >
    <div
      v-if="!loaded"
      class="video-placeholder"
    />
    <video
      class="video-message__video"
      :src="messageContent.url"
      :poster="messageContent.snapshotUrl"
      controls
      muted
      :autoplay="false"
      @loadedmetadata="onVideoLoad"
    />
  </View>
</template>

<style lang="scss" scoped>
.video-message {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  background-color: #f5f5f5;
  max-width: 100%;

  &--last--self {
    border-bottom-right-radius: 4px;
  }

  &--last--other {
    border-bottom-left-radius: 4px;
  }

  &--loaded {
    background-color: transparent;
  }
}

.video-placeholder {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(
      90deg,
      rgba(245, 245, 245, 100%) 0%,
      rgba(235, 235, 235, 100%) 50%,
      rgba(245, 245, 245, 100%) 100%
    );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.video-message__video {
  max-width: 100%;
  max-height: 100%;
  width: 100%;
  height: auto;
  object-fit: contain;
  opacity: 0;
  transition: opacity 0.2s ease;

  .video-message--loaded & {
    opacity: 1;
  }
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }

  100% {
    background-position: -200% 0;
  }
}
</style>
