<script lang="ts" setup>
import { ref, watch, onMounted, onUnmounted } from 'vue';
import cs from 'classnames';

interface ImagePreviewProps {
  open: boolean;
  src: string;
  alt?: string;
}

defineOptions({ inheritAttrs: false });

const props = defineProps<ImagePreviewProps>();
const emit = defineEmits<{
  (e: 'close'): void;
}>();

const scale = ref(1);
const translate = ref({ x: 0, y: 0 });
const isDragging = ref(false);
const lastPointer = ref({ x: 0, y: 0 });
const isError = ref(false);

let pinchStartDistance: number | null = null;
let pinchStartScale = 1;

const MIN_SCALE = 0.5;
const MAX_SCALE = 3;

function clampScale(value: number) {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, value));
}

function resetTransform() {
  scale.value = 1;
  translate.value = { x: 0, y: 0 };
}

function handleClose() {
  emit('close');
  resetTransform();
}

function handleImageError() {
  isError.value = true;
}

function handleWheel(event: WheelEvent) {
  event.preventDefault();
  const delta = event.deltaY > 0 ? -0.2 : 0.2;
  const next = clampScale(scale.value + delta);
  scale.value = next;
}

function handleDoubleClick() {
  scale.value = scale.value === 1 ? 2 : 1;
  if (scale.value === 1) {
    translate.value = { x: 0, y: 0 };
  }
}

function handlePointerDown(event: PointerEvent) {
  isDragging.value = true;
  lastPointer.value = { x: event.clientX, y: event.clientY };
  (event.target as HTMLElement)?.setPointerCapture(event.pointerId);
}

function handlePointerMove(event: PointerEvent) {
  if (!isDragging.value) {
    return;
  }
  const dx = event.clientX - lastPointer.value.x;
  const dy = event.clientY - lastPointer.value.y;
  translate.value = {
    x: translate.value.x + dx,
    y: translate.value.y + dy,
  };
  lastPointer.value = { x: event.clientX, y: event.clientY };
}

function handlePointerUp(event: PointerEvent) {
  isDragging.value = false;
  (event.target as HTMLElement)?.releasePointerCapture(event.pointerId);
}

function getTouchDistance(touches: TouchList) {
  if (touches.length < 2) {
    return null;
  }
  const [t1, t2] = [touches[0], touches[1]];
  const dx = t1.clientX - t2.clientX;
  const dy = t1.clientY - t2.clientY;
  return Math.hypot(dx, dy);
}

function handleTouchStart(event: TouchEvent) {
  if (event.touches.length === 2) {
    pinchStartDistance = getTouchDistance(event.touches);
    pinchStartScale = scale.value;
  }
}

function handleTouchMove(event: TouchEvent) {
  if (event.touches.length === 2 && pinchStartDistance) {
    event.preventDefault();
    const currentDistance = getTouchDistance(event.touches);
    if (!currentDistance) {
      return;
    }
    const factor = currentDistance / pinchStartDistance;
    scale.value = clampScale(pinchStartScale * factor);
  }
}

function handleTouchEnd() {
  pinchStartDistance = null;
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    handleClose();
  }
}

watch(() => props.open, (isOpen) => {
  if (!isOpen) {
    resetTransform();
    isError.value = false;
  }
});

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});
</script>

<template>
  <teleport to="body">
    <div
      v-if="open"
      class="image-preview"
      v-bind="$attrs"
    >
      <div class="image-preview__mask" @click="handleClose" />
      <button
        class="image-preview__close"
        type="button"
        aria-label="Close preview"
        @click="handleClose"
      />
      <div class="image-preview__content">
        <div class="image-preview__inner">
          <div
            class="image-preview__viewport"
          >
            <div :class="cs('image-preview__img-wrap', { 'image-preview__img-wrap--error': isError })">
              <img
                v-if="!isError"
                :src="src"
                :alt="alt || 'image preview'"
                :style="{
                  transform: `translate3d(${translate.x}px, ${translate.y}px, 0) scale(${scale})`,
                }"
                class="image-preview__img"
                draggable="false"
                @error="handleImageError"
                @wheel.prevent="handleWheel"
                @dblclick.prevent="handleDoubleClick"
                @pointerdown="handlePointerDown"
                @pointermove="handlePointerMove"
                @pointerup="handlePointerUp"
                @pointercancel="handlePointerUp"
                @touchstart.passive="handleTouchStart"
                @touchmove.prevent="handleTouchMove"
                @touchend="handleTouchEnd"
                @touchcancel="handleTouchEnd"
              >
              <div v-else class="image-preview__error">
                <div class="image-preview__error-icon" />
                <span class="image-preview__error-text">Preview failed</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<style scoped lang="scss">
.image-preview {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.image-preview__mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(2px);
  z-index: 1;
}

.image-preview__close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.55);
  cursor: pointer;
  z-index: 3;
}

.image-preview__close::before,
.image-preview__close::after {
  content: "";
  position: absolute;
  top: 15px;
  left: 8px;
  width: 16px;
  height: 2px;
  background: #fff;
}

.image-preview__close::before {
  transform: rotate(45deg);
}

.image-preview__close::after {
  transform: rotate(-45deg);
}

.image-preview__content {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  box-sizing: border-box;
  z-index: 2;
  pointer-events: none;
}

.image-preview__inner {
  max-width: 100%;
  max-height: 100%;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.image-preview__viewport {
  position: relative;
  max-width: 100vw;
  max-height: 100vh;
  width: auto;
  height: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  touch-action: none;
  pointer-events: none;
  overflow: visible;
}

.image-preview__img-wrap {
  position: relative;
  max-width: 100vw;
  max-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible;
  border-radius: 0;
  background: transparent;
  pointer-events: auto;
}

.image-preview__img {
  max-width: 100vw;
  max-height: 100vh;
  object-fit: contain;
  user-select: none;
  transition: transform 0.1s ease-out;
  pointer-events: auto;
}

.image-preview__img-wrap--error {
  background: rgba(255, 255, 255, 0.06);
}

.image-preview__error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px;
  color: #fff;
  font-size: 14px;
}

.image-preview__error-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  position: relative;
}

.image-preview__error-icon::before,
.image-preview__error-icon::after {
  content: "";
  position: absolute;
  top: 22px;
  left: 14px;
  width: 20px;
  height: 2px;
  background: #fff;
}

.image-preview__error-icon::before { transform: rotate(45deg); }
.image-preview__error-icon::after { transform: rotate(-45deg); }

.image-preview__error-text {
  color: #fff;
}
</style>
