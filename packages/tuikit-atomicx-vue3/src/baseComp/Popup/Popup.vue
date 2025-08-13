<template>
  <Teleport :to="disablePortal ? undefined : 'body'" :disabled="disablePortal">
    <Transition name="popup">
      <div
        v-if="open && anchor"
        ref="popupRef"
        :class="['tui-kit-popup', $style.popup]"
      >
        <slot />
      </div>
    </Transition>
  </Teleport>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import type { CSSProperties } from 'vue';

export interface PopupProps {
  open?: boolean;
  anchor?: HTMLElement | null;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end' | 'left-start' | 'left-end' | 'right-start' | 'right-end';
  disablePortal?: boolean;
  strategy?: 'absolute' | 'fixed';
  offset?: number;
}

const props = withDefaults(defineProps<PopupProps>(), {
  open: false,
  placement: 'top',
  disablePortal: false,
  strategy: 'absolute',
  offset: 10,
});

const popupRef = ref<HTMLElement | null>(null);
const popupStyle = ref<CSSProperties>({});

const calculatePosition = () => {
  if (!props.anchor || !popupRef.value) return;

  const anchorRect = props.anchor.getBoundingClientRect();
  const popupRect = popupRef.value.getBoundingClientRect();
  
  let top = 0;
  let left = 0;

  switch (props.placement) {
    case 'top':
      top = anchorRect.top - popupRect.height - props.offset;
      left = anchorRect.left + (anchorRect.width - popupRect.width) / 2;
      break;
    case 'bottom':
      top = anchorRect.bottom + props.offset;
      left = anchorRect.left + (anchorRect.width - popupRect.width) / 2;
      break;
    case 'left':
      top = anchorRect.top + (anchorRect.height - popupRect.height) / 2;
      left = anchorRect.left - popupRect.width - props.offset;
      break;
    case 'right':
      top = anchorRect.top + (anchorRect.height - popupRect.height) / 2;
      left = anchorRect.right + props.offset;
      break;
    case 'top-start':
      top = anchorRect.top - popupRect.height - props.offset;
      left = anchorRect.left;
      break;
    case 'top-end':
      top = anchorRect.top - popupRect.height - props.offset;
      left = anchorRect.right - popupRect.width;
      break;
    case 'bottom-start':
      top = anchorRect.bottom + props.offset;
      left = anchorRect.left;
      break;
    case 'bottom-end':
      top = anchorRect.bottom + props.offset;
      left = anchorRect.right - popupRect.width;
      break;
    case 'left-start':
      top = anchorRect.top;
      left = anchorRect.left - popupRect.width - props.offset;
      break;
    case 'left-end':
      top = anchorRect.bottom - popupRect.height;
      left = anchorRect.left - popupRect.width - props.offset;
      break;
    case 'right-start':
      top = anchorRect.top;
      left = anchorRect.right + props.offset;
      break;
    case 'right-end':
      top = anchorRect.bottom - popupRect.height;
      left = anchorRect.right + props.offset;
      break;
  }

  // 边界检查
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  if (left < 0) left = 0;
  if (left + popupRect.width > viewportWidth) left = viewportWidth - popupRect.width;
  if (top < 0) top = 0;
  if (top + popupRect.height > viewportHeight) top = viewportHeight - popupRect.height;

  popupStyle.value = {
    position: props.strategy,
    top: `${top}px`,
    left: `${left}px`,
    zIndex: 1000,
  };
};

const updatePosition = () => {
  nextTick(() => {
    calculatePosition();
  });
};

// 监听 props 变化
watch([() => props.open, () => props.anchor, () => props.placement], updatePosition);

// 监听窗口变化
onMounted(() => {
  window.addEventListener('resize', updatePosition);
  window.addEventListener('scroll', updatePosition);
});

onUnmounted(() => {
  window.removeEventListener('resize', updatePosition);
  window.removeEventListener('scroll', updatePosition);
});
</script>

<style lang="scss" module>
.popup {
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  max-width: 300px;
  max-height: 400px;
  overflow: auto;
}

:global(.popup-enter-active),
:global(.popup-leave-active) {
  transition: opacity 0.2s ease;
}

:global(.popup-enter-from),
:global(.popup-leave-to) {
  opacity: 0;
}
</style>