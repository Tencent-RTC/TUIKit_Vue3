<template>
  <div
    class="pull-to-refresh"
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
    @touchcancel="onTouchEnd"
  >
    <!-- Refresh indicator -->
    <div
      class="refresh-indicator"
      :class="[refreshState, { visible: isIndicatorVisible }]"
      :style="{ transform: `translateY(${translateY}px)` }"
    >
              <!-- refresh-arrow -->
        <IconArrowUpNew
          v-if="refreshState !== RefreshState.Loading && refreshState !== RefreshState.Success && refreshState !== RefreshState.Error"
          class="refresh-arrow"
          :class="{ releasing: refreshState === RefreshState.Releasing }"
          :size="16"
        />
      <!-- refresh-loading -->
      <div v-if="refreshState === RefreshState.Loading" class="refresh-loading"></div>
      <!-- refresh-success -->
      <IconCheck v-if="refreshState === RefreshState.Success" class="refresh-success" :size="16" />
      <!-- refresh-error -->
      <IconErrorToast v-if="refreshState === RefreshState.Error" class="refresh-error" :size="16" />
      <!-- refresh-text -->
      <span class="refresh-text">{{ statusText }}</span>
    </div>

    <!-- Content slot -->
    <div ref="contentRef" class="refresh-content" :style="{ transform: `translateY(${contentTranslateY}px)` }"
      @scroll="handleScroll"
      @wheel="handleWheel">
      <slot></slot>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import { IconCheck, IconArrowUpNew, IconErrorToast } from '@tencentcloud/uikit-base-component-vue3';

interface Props {
  threshold?: number;
  resistance?: number;
  disabled?: boolean;
  resultDuration?: number;
  text?: {
    pull: string;
    release: string;
    loading: string;
    success: string;
    error: string;
  };
}

/**
 * Pull-to-refresh state enumeration
 * Defines the various states that the component can be in during the entire pull-to-refresh flow
 */
enum RefreshState {
  /**
   * Pulling state
   * - User is dragging down but hasn't reached the refresh threshold yet
   * - Shows down arrow icon, indicating user can continue pulling down
   * - Content area follows finger movement, providing visual feedback
   */
  Pulling = 'pulling',

  /**
   * Releasing state
   * - User has pulled down to or beyond the threshold (props.threshold)
   * - Shows up arrow icon, indicating user can release to trigger refresh
   * - Releasing at this point will immediately enter refresh state
   */
  Releasing = 'releasing',

  /**
   * Loading state
   * - Component enters refresh state after user releases
   * - Shows loading animation (spinning circle)
   * - Content area stays at threshold height, displaying refresh indicator
   * - Parent component starts executing actual refresh logic
   */
  Loading = 'loading',

  /**
   * Success state
   * - Parent component refresh operation completed successfully
   * - Shows green checkmark icon and success text
   * - Content area stays at threshold height, displaying success indicator
   * - Automatically resets after displaying for props.resultDuration time
   */
  Success = 'success',

  /**
   * Error state
   * - Parent component refresh operation failed (e.g., network error, API exception)
   * - Shows red error icon and failure text
   * - Content area stays at threshold height, displaying error indicator
   * - Automatically resets after displaying for props.resultDuration time
   */
  Error = 'error',
}

const refreshState = ref(RefreshState.Pulling);
const startY = ref(0);
const currentY = ref(0);
const isTouching = ref(false);
const contentRef = ref<HTMLElement | null>(null);
let timer: number | null = null;

const props = withDefaults(defineProps<Props>(), {
  threshold: 60,
  resistance: 2.5,
  disabled: false,
  resultDuration: 500,
  text: () => ({
    pull: 'LiveList.PullDownToRefresh',
    release: 'LiveList.ReleaseToRefresh',
    loading: 'LiveList.Loading',
    success: 'LiveList.RefreshSuccess',
    error: 'LiveList.RefreshFailed',
  }),
});

const emit = defineEmits<{
  refresh: [completeRefresh: (success?: boolean) => void];
  loadMore: [];
}>();

defineExpose({
  completeRefresh,
});

const pullDistance = computed(() => {
  if (refreshState.value === RefreshState.Loading) {
    return props.threshold;
  }
  if (!isTouching.value) return 0;
  return Math.max(0, (currentY.value - startY.value) / props.resistance);
});

const contentTranslateY = computed(() => {
  if (refreshState.value === RefreshState.Loading || refreshState.value === RefreshState.Success || refreshState.value === RefreshState.Error) {
    return props.threshold;
  }
  return Math.min(pullDistance.value, props.threshold);
});

const translateY = computed(() => {
  if (refreshState.value === RefreshState.Loading || refreshState.value === RefreshState.Success || refreshState.value === RefreshState.Error) {
    return 0;
  }
  return Math.min(pullDistance.value, props.threshold) - props.threshold;
});

const isIndicatorVisible = computed(() => {
  if (refreshState.value === RefreshState.Loading || refreshState.value === RefreshState.Success || refreshState.value === RefreshState.Error) {
    return true;
  }
  return pullDistance.value > 10;
});

const statusText = computed(() => {
  switch (refreshState.value) {
    case RefreshState.Releasing:
      return props.text.release;
    case RefreshState.Loading:
      return props.text.loading;
    case RefreshState.Success:
      return props.text.success;
    case RefreshState.Error:
      return props.text.error;
    default:
      return props.text.pull;
  }
});

function isScrollAtBottom(threshold = 50) {
  if (!contentRef.value) {
    return false;
  }

  return (
    contentRef.value.scrollTop + contentRef.value.clientHeight >=
    contentRef.value.scrollHeight - threshold
  );
}

function handleWheel(event: WheelEvent) {
  if (!contentRef.value) {
    return;
  }

  if (event.deltaY > 0 && isScrollAtBottom()) {
    emit('loadMore');
  }
}

function handleScroll() {
  if (!contentRef.value) {
    return;
  }

  if (isScrollAtBottom()) {
    emit('loadMore');
  }
}

function checkIsAtTop() {
  if (!contentRef.value) return true;
  return contentRef.value.scrollTop === 0;
}

function onTouchStart(event: TouchEvent) {
  if (props.disabled || refreshState.value === RefreshState.Loading) return;
  if (!checkIsAtTop()) return;

  isTouching.value = true;
  startY.value = event.touches[0].clientY;
  currentY.value = startY.value;
  refreshState.value = RefreshState.Pulling;
}

function onTouchMove(event: TouchEvent) {
  if (!isTouching.value || props.disabled || refreshState.value === RefreshState.Loading) return;
  currentY.value = event.touches[0].clientY;

  if (pullDistance.value > 0 && checkIsAtTop()) {
    event.preventDefault();
  }

  refreshState.value = pullDistance.value > props.threshold ? RefreshState.Releasing : RefreshState.Pulling;
}

function onTouchEnd() {
  if (!isTouching.value || props.disabled) return;
  isTouching.value = false;

  if (refreshState.value === RefreshState.Loading) return;

  if (refreshState.value === RefreshState.Releasing) {
    startRefresh();
  } else {
    resetPullState();
  }
}

function startRefresh() {
  refreshState.value = RefreshState.Loading;
  emit('refresh', completeRefresh);
}

function completeRefresh(success: boolean = true) {
  refreshState.value = success ? RefreshState.Success : RefreshState.Error;
  
  if (timer) {
    clearTimeout(timer);
  }
  timer = setTimeout(() => {
    resetPullState();
  }, props.resultDuration) as unknown as number;
}

function resetPullState() {
  startY.value = 0;
  currentY.value = 0;
  if (refreshState.value !== RefreshState.Loading) {
    refreshState.value = RefreshState.Pulling;
  }
}
</script>

<style lang="scss" scoped>
.pull-to-refresh {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  touch-action: pan-y;

  .refresh-indicator {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: v-bind('props.threshold + "px"');
    display: flex;
    justify-content: center;
    align-items: center;
    color: #666;
    font-size: 14px;
    opacity: 0;
    transition: opacity 0.2s;
    background-color: transparent;
    z-index: 10;

    &.visible {
      opacity: 1;
    }

    .refresh-arrow {
      width: 16px;
      height: 16px;
      margin-right: 8px;
      rotate: 180deg;
      transition: transform 0.3s;
      fill: currentColor;

      &.releasing {
        transform: rotate(180deg);
      }
    }

    .refresh-loading {
      width: 18px;
      height: 18px;
      margin-right: 8px;
      border: 2px solid #e0e0e0;
      border-top: 2px solid #007aff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    .refresh-success {
      width: 18px;
      height: 18px;
      margin-right: 8px;
      color: #4caf50;
    }

    .refresh-error {
      width: 18px;
      height: 18px;
      margin-right: 8px;
      color: #f44336;
    }

    .refresh-text {
      font-weight: 500;
    }
  }

  .refresh-content {
    transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    height: 100%;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
