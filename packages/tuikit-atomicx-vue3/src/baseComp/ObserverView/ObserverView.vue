<template>
  <div
    :id="id"
    ref="viewRef"
    :class="cs('observer-view', props.class)"
    :style="style"
    v-bind="$attrs"
  >
    <slot />
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import cs from 'classnames';

defineOptions({
  name: 'ObserverView',
  inheritAttrs: false,
});

interface IObserverViewProps {
  id?: string;
  class?: string;
  style?: Record<string, any>;

  // Basic IntersectionObserver configuration
  threshold?: number | number[];
  rootMargin?: string;
  root?: string | null; // Root element selector

  // Advanced configuration
  observerOptions?: IntersectionObserverInit;

  // Other control options
  disabled?: boolean;
  delay?: number;
}

const props = withDefaults(defineProps<IObserverViewProps>(), {
  id: undefined,
  class: undefined,
  style: undefined,
  threshold: 0,
  rootMargin: '0px',
  root: null,
  observerOptions: undefined,
  disabled: false,
  delay: 0,
});

const emit = defineEmits<{
  onShow: [];
  onShowOnce: [];
  onHide: [];
}>();

const viewRef = ref<HTMLElement | null>(null);
const hasShownOnce = ref(false);
let observer: IntersectionObserver | null = null;
let timeoutId: number | null = null;

// Create and start observer
const setupObserver = () => {
  if (!viewRef.value || props.disabled) {
    return;
  }

  // Clean up existing observer
  cleanupObserver();

  // Build observer options
  const options: IntersectionObserverInit = props.observerOptions || {
    threshold: props.threshold,
    rootMargin: props.rootMargin,
    root: props.root ? document.querySelector(props.root) : null,
  };

  observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        // Element enters viewport
        const triggerShow = () => {
          // Trigger show event
          emit('onShow');

          // If element has not been shown before, trigger showOnce event
          if (!hasShownOnce.value) {
            emit('onShowOnce');
            hasShownOnce.value = true;
          }
        };

        // Handle delay
        if (props.delay && props.delay > 0) {
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          timeoutId = window.setTimeout(triggerShow, props.delay);
        } else {
          triggerShow();
        }
      } else {
        // Element leaves viewport, trigger hide event
        emit('onHide');
      }
    });
  }, options);

  observer.observe(viewRef.value);
};

// Clean up observer
function cleanupObserver() {
  if (observer) {
    observer.disconnect();
    observer = null;
  }

  if (timeoutId) {
    clearTimeout(timeoutId);
    timeoutId = null;
  }
}

// Watch for configuration changes, reset observer
watch(
  [
    () => props.disabled,
    () => props.threshold,
    () => props.rootMargin,
    () => props.root,
    () => props.observerOptions,
  ],
  () => {
    if (viewRef.value) {
      setupObserver();
    }
  },
);

onMounted(() => {
  setupObserver();
});

onUnmounted(() => {
  cleanupObserver();
});
</script>

<style lang="scss" scoped>
.observer-view {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-content: flex-start;
  border: 0 solid black;
  margin: 0;
  padding: 0;
  min-width: 0;
}
</style>
