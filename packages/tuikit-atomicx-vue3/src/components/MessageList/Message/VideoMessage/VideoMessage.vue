<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import cs from 'classnames';
import { View } from '../../../../baseComp/View';
import type { IMessageModel } from '@tencentcloud/chat-uikit-engine';

interface IVideoMessageProps {
  message: IMessageModel;
  isLastInChunk?: boolean;
}

interface IVideoMessageContent {
  showName: string;
  snapshotHeight: number;
  snapshotWidth: number;
  snapshotUrl: string;
  url: string;
}

const props = withDefaults(defineProps<IVideoMessageProps>(), {
  isLastInChunk: false,
  message: () => ({} as IMessageModel),
});

const messageContent = props.message.getMessageContent() as IVideoMessageContent;

const windowResize = ref(false);
const loaded = ref(false);
const naturalSize = ref<{ height: number; aspectRatio: number } | null>(
  messageContent.snapshotWidth && messageContent.snapshotHeight
    ? {
      height: messageContent.snapshotHeight,
      aspectRatio: messageContent.snapshotWidth / messageContent.snapshotHeight,
    }
    : null,
);

const isMessageOwner = computed(() => props.message.flow === 'out');

const displaySize = computed(() => {
  const MAX_HEIGHT = 400;
  const DEFAULT_RATIO = 3 / 4;

  if (!naturalSize.value) {
    return {
      height: MAX_HEIGHT,
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

const onResize = () => {
  windowResize.value = true;
};

const onVideoLoad = (e: Event) => {
  const video = e.target as HTMLVideoElement;
  naturalSize.value = {
    aspectRatio: video.videoWidth / video.videoHeight,
    height: video.videoHeight,
  };
  loaded.value = true;
};

onMounted(() => {
  window.addEventListener('resize', onResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', onResize);
});

watch(() => props.message.ID, () => {
  loaded.value = false;
  naturalSize.value = messageContent.snapshotWidth && messageContent.snapshotHeight
    ? {
      height: messageContent.snapshotHeight,
      aspectRatio: messageContent.snapshotWidth / messageContent.snapshotHeight,
    }
    : null;
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
      minHeight: windowResize ? 'auto' : `${displaySize.height}px`,
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
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
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
