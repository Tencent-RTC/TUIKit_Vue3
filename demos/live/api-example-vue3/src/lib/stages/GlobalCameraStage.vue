<template>
  <!--
    Globally-persistent camera-preview stage.

    Mirrors GlobalLiveStage: a single camera-preview container hoisted to
    App level so it survives card switches. The local camera stream
    (`startCameraTest({ view })`) renders into the fixed container
    `#global-camera-preview`, and the widget only appears when camera
    testing is active (`isCameraTesting`).

    The container `<div>` is ALWAYS in the DOM (v-show, not v-if) so
    `startCameraTest` can find it even on the first call — the wrapper
    just hides itself visually when the camera isn't testing.

    Draggable: the title bar is the drag handle. After the first drag
    the widget's right/bottom anchor is replaced by inline top/left so
    the position survives across card switches and SDK events.
  -->
  <transition name="cam-stage">
    <div
      ref="rootEl"
      v-show="visible && isCameraTesting"
      :class="['cam-stage', { 'cam-stage--collapsed': collapsed }]"
      :style="containerStyle"
      @pointerdown="onPointerDown"
    >
      <div class="cam-stage__bar">
        <span class="cam-stage__title">
          {{ t('Stage.CameraTitle') }}
        </span>
        <button type="button" class="cam-stage__btn" @click="collapsed = !collapsed">
          {{ collapsed ? t('Common.Expand') : t('Common.Collapse') }}
        </button>
        <button type="button" class="cam-stage__btn" @click="onStop">{{ t('Common.Stop') }}</button>
      </div>
      <div v-show="!collapsed" class="cam-stage__body">
        <!--
          The container SDK renders the local camera stream into.
          Uses a fixed id so startCameraTest({ view }) can target it
          from any card without per-card derivation.
        -->
        <div id="global-camera-preview" class="cam-stage__preview" />
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { useDeviceState } from 'tuikit-atomicx-vue3';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useDraggable } from '../composables/useDraggable';

const device = useDeviceState();
const isCameraTesting = device.isCameraTesting;
const { t } = useUIKit();

// Local UI state — survives across card switches because the component is
// mounted at App level rather than per-card.
const visible = ref(true);
const collapsed = ref(false);
const rootEl = ref<HTMLElement | null>(null);

const { binding, reclamp } = useDraggable({
  handleSelector: '.cam-stage__bar',
});
const { style: dragStyle, onPointerDown } = binding;

// Re-clamp position after expand/collapse so the widget never overflows
// the viewport (drag-time clamp uses the pre-toggle dimensions).
watch(collapsed, () => {
  nextTick(() => {
    if (rootEl.value) {
      reclamp(rootEl.value.offsetWidth, rootEl.value.offsetHeight);
    }
  });
});

const containerStyle = computed(() => {
  if (dragStyle.top && dragStyle.left) {
    return { top: dragStyle.top, left: dragStyle.left, right: 'auto', bottom: 'auto' };
  }
  // Default above GlobalLiveStage (which sits at bottom: 16px). The
  // live stage is ~232px tall (360px wide * 9/16 + title bar), so we
  // offset by 260px to leave a 10px gap above it.
  return { right: '16px', bottom: '260px' };
});

// One-click stop: convenience so the operator can release the camera
// without navigating back to the stopCameraTest card.
async function onStop(): Promise<void> {
  try {
    await device.stopCameraTest();
  } catch {
    // Silently swallow — the widget is leaving anyway
  }
}
</script>

<style scoped lang="scss">
.cam-stage {
  position: fixed;
  z-index: 50;
  display: flex;
  flex-direction: column;
  width: 360px;
  background: #0b0d12;
  border: 1px solid #1f2937;
  border-radius: 10px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  user-select: none;

  &--collapsed { width: 240px; }

  &__bar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    font-size: 12px;
    color: #d1d5db;
    background: #111827;
    cursor: grab;

    &:active { cursor: grabbing; }
  }

  &__title {
    flex: 1;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  &__btn {
    padding: 2px 8px;
    font-size: 11px;
    color: #cbd5e1;
    cursor: pointer;
    background: #1f2937;
    border: 1px solid #374151;
    border-radius: 4px;

    &:hover { color: #fff; background: #374151; }
  }

  &__body {
    position: relative;
    width: 100%;
    aspect-ratio: 16 / 9;
    background: #000;
    overflow: hidden;
  }

  &__preview {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
}

.cam-stage-enter-active,
.cam-stage-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.cam-stage-enter-from,
.cam-stage-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
