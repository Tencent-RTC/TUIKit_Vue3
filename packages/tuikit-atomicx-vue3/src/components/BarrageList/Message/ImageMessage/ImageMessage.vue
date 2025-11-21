<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import cs from 'classnames';
import type { IMessageModel } from '@tencentcloud/chat-uikit-engine';

interface IImageMessageProps {
  message: IMessageModel;
  isLastInChunk?: boolean;
}

interface IImageMessageContent {
  url: string;
  width: number;
  height: number;
  showName: string;
}

const props = withDefaults(defineProps<IImageMessageProps>(), {
  isLastInChunk: false,
  message: () => ({} as IMessageModel),
});

const messageContent = props.message.getMessageContent() as IImageMessageContent;

const windowResize = ref(false);
const loaded = ref(false);
const naturalSize = ref<{ height: number; aspectRatio: number } | null>(
  messageContent.width && messageContent.height
    ? { height: messageContent.height, aspectRatio: messageContent.width / messageContent.height }
    : null,
);

const isMessageOwner = computed(() => props.message.flow === 'out');

// Calculate final display size
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
    // If image is horizontal, reduce height to 200
    return {
      aspectRatio,
      height: 200,
    };
  }
  // If image is vertical, fix height to 400
  return {
    aspectRatio,
    height: 400,
  };
});

const onResize = () => {
  windowResize.value = true;
};

const onImageLoad = (e: Event) => {
  const img = e.target as HTMLImageElement;
  naturalSize.value = {
    aspectRatio: img.naturalWidth / img.naturalHeight,
    height: img.naturalHeight,
  };
  loaded.value = true;
};

onMounted(() => {
  window.addEventListener('resize', onResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', onResize);
});

// Reset loading state when message ID changes
watch(() => props.message.ID, () => {
  loaded.value = false;
  naturalSize.value = messageContent.width && messageContent.height
    ? { height: messageContent.height, aspectRatio: messageContent.width / messageContent.height }
    : null;
});
</script>

<template>
  <div
    :class="cs('image-message', {
      'image-message--last--self': isMessageOwner && isLastInChunk,
      'image-message--last--other': !isMessageOwner && isLastInChunk,
      'image-message--loaded': loaded
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
      class="image-placeholder"
    />
    <img
      :src="messageContent.url"
      :class="cs('image', {
        'image--loaded': loaded
      })"
      @load="onImageLoad"
    >
  </div>
</template>

<style lang="scss" scoped>
.image-message {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  background-color: #f5f5f5;
  width: 100%;

  &--last--self {
    border-bottom-right-radius: 4px;
  }

  &--last--other {
    border-bottom-left-radius: 4px;
  }
}

.image-placeholder {
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

.image {
  max-width: 100%; // Ensure image doesn't exceed container
  max-height: 100%;
  width: 100%; // Keep original image ratio
  height: auto;
  object-fit: contain;
  opacity: 0;
  transition: opacity 0.2s ease;

  &--loaded {
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
