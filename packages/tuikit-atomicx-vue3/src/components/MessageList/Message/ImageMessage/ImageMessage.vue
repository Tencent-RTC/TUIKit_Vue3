<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import cs from 'classnames';
import type { IMessageModel as MessageModel } from '@tencentcloud/chat-uikit-engine';

interface ImageMessageProps {
  message: MessageModel;
  isLastMessage?: boolean;
}

interface ImageMessageContent {
  url: string;
  width?: number;
  height?: number;
  showName?: string;
}

const MAX_HEIGHT = 320;
const MIN_HEIGHT = 50;
const DEFAULT_ASPECT_RATIO = 4 / 3;

const props = withDefaults(defineProps<ImageMessageProps>(), {
  isLastMessage: false,
});

const messageContent = computed(() => props.message.getMessageContent() as ImageMessageContent);

const getInitialLoadingState = (url: string): 'loading' | 'loaded' | 'error' => {
  // For blob URLs, usually newly created and need loading
  if (url.startsWith('blob:')) {
    return 'loading';
  }

  // Try quick cache detection (synchronous detection)
  const img = new Image();
  img.src = url;

  // If image is already fully loaded (in cache), show immediately
  if (img.complete && img.naturalWidth > 0) {
    return 'loaded';
  }

  return 'loading';
};

const loadingState = ref<'loading' | 'loaded' | 'error'>(getInitialLoadingState(messageContent.value.url));
const naturalSize = ref<{ width: number; height: number; aspectRatio: number } | null>(
  messageContent.value.width && messageContent.value.height
    ? {
      width: messageContent.value.width,
      height: messageContent.value.height,
      aspectRatio: messageContent.value.width / messageContent.value.height,
    }
    : null,
);

const imageRef = ref<HTMLImageElement | null>(null);
const containerRef = ref<HTMLDivElement | null>(null);
let observerRef: IntersectionObserver | null = null;

const isBlobImage = computed(() => messageContent.value.url.startsWith('blob'));

// Utility function to get image dimensions
const getImageDimensionsFromBlobImage = (url: string): Promise<{ width: number; height: number }> => new Promise((resolve, reject) => {
  const img = new Image();
  img.onload = () => {
    resolve({ width: img.naturalWidth, height: img.naturalHeight });
  };
  img.onerror = reject;
  img.src = url;
});

// Calculate final display size
const displaySize = computed(() => {
  // If no natural size info, use default values
  if (!naturalSize.value) {
    return {
      height: MAX_HEIGHT, // Use max height to avoid size changes after loading
      width: MAX_HEIGHT * DEFAULT_ASPECT_RATIO,
      aspectRatio: DEFAULT_ASPECT_RATIO,
    };
  }

  const { width: originalWidth, height: originalHeight, aspectRatio } = naturalSize.value;

  // Start from original dimensions
  let finalWidth = originalWidth;
  let finalHeight = originalHeight;

  // Step 1: If height exceeds max height, scale down proportionally
  if (finalHeight > MAX_HEIGHT) {
    finalHeight = MAX_HEIGHT;
    finalWidth = finalHeight * aspectRatio;
  }

  // Step 2: If height is less than min height, scale up proportionally
  if (finalHeight < MIN_HEIGHT) {
    finalHeight = MIN_HEIGHT;
    finalWidth = finalHeight * aspectRatio;
  }

  return {
    width: finalWidth,
    height: finalHeight,
    aspectRatio,
  };
});

// Initialize lazy loading
const initializeLazyLoading = async () => {
  await nextTick();

  if (!imageRef.value) {
    return;
  }

  if (loadingState.value === 'loaded') {
    imageRef.value.src = messageContent.value.url;
    return;
  }

  // create IntersectionObserver instance
  observerRef = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      // Image enters viewport, start loading
      if (imageRef.value) {
        imageRef.value.src = messageContent.value.url;
      }
      // Stop observing
      if (observerRef) {
        observerRef.disconnect();
      }
    }
  }, { threshold: 0.1 });

  // Start observing image element
  observerRef.observe(imageRef.value);
};

// Handle blob image dimension fetching
const fetchBlobDimensions = async () => {
  if (isBlobImage.value && !naturalSize.value) {
    try {
      const dimensions = await getImageDimensionsFromBlobImage(messageContent.value.url);
      if (dimensions) {
        naturalSize.value = {
          width: dimensions.width,
          height: dimensions.height,
          aspectRatio: dimensions.width / dimensions.height,
        };
      }
    } catch (_error) {
      naturalSize.value = {
        width: 400,
        height: 300,
        aspectRatio: DEFAULT_ASPECT_RATIO,
      };
    }
  }
};

// Handle image load event
const handleImageLoad = (e: Event) => {
  const img = e.target as HTMLImageElement;

  // Update natural size (if not obtained before)
  if (!naturalSize.value || isBlobImage.value) {
    naturalSize.value = {
      width: img.naturalWidth,
      height: img.naturalHeight,
      aspectRatio: img.naturalWidth / img.naturalHeight,
    };
  }

  loadingState.value = 'loaded';
};

// Handle image load error
const handleImageError = () => {
  loadingState.value = 'error';
};

// Watch for message content changes
watch(() => messageContent.value.url, () => {
  loadingState.value = getInitialLoadingState(messageContent.value.url);
  naturalSize.value = messageContent.value.width && messageContent.value.height
    ? {
      width: messageContent.value.width,
      height: messageContent.value.height,
      aspectRatio: messageContent.value.width / messageContent.value.height,
    }
    : null;

  initializeLazyLoading();
  fetchBlobDimensions();
});

onMounted(() => {
  initializeLazyLoading();
  fetchBlobDimensions();
});

onUnmounted(() => {
  // Stop observing when component unmounts
  if (observerRef) {
    observerRef.disconnect();
  }
});
</script>

<template>
  <div
    ref="containerRef"
    :class="cs('image-message', {
      'image-message--loading': loadingState === 'loading',
      'image-message--error': loadingState === 'error',
      'image-message--loaded': loadingState === 'loaded',
    })"
    :style="{
      width: `${displaySize.width}px`,
      height: `${displaySize.height}px`,
      aspectRatio: `${displaySize.aspectRatio}`,
    }"
  >
    <!-- skeleton -->
    <div
      v-if="loadingState === 'loading'"
      class="image-placeholder"
    />

    <!-- error state -->
    <div
      v-if="loadingState === 'error'"
      class="image-error"
    >
      <div class="image-error__icon" />
      <span class="image-error__text">Load failed</span>
    </div>

    <!-- image -->
    <img
      ref="imageRef"
      :class="cs('image', {
        'image--visible': loadingState === 'loaded',
      })"
      :alt="messageContent.showName || 'image message'"
      loading="lazy"
      @load="handleImageLoad"
      @error="handleImageError"
    >
  </div>
</template>

<style lang="scss" scoped>
.image-message {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  border-radius: 20px;
  overflow: hidden;
  transition: all 0.3s ease-in-out;
  min-height: 50px;
  max-width: 100%;

  &--loading {
    background-color: #f0f0f0;
  }

  &--error {
    background-color: #fff0f0;
  }

  &--loaded {
    background-color: transparent;
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

.image-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 16px;
  min-height: 50px;

  &__icon {
    width: 32px;
    height: 32px;
    margin-bottom: 8px;
    background-color: #fdd;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;

    &::before,
    &::after {
      content: "";
      position: absolute;
      width: 16px;
      height: 2px;
      background-color: #ff6b6b;
      transform: rotate(45deg);
    }

    &::after {
      transform: rotate(-45deg);
    }
  }

  &__text {
    font-size: 12px;
    color: #ff6b6b;
  }
}

.image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 0.3s ease-in-out;
  min-height: 50px;

  &--visible {
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
