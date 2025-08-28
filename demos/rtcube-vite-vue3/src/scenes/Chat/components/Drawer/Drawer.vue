<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import type { PropType } from 'vue';

const props = defineProps({
  open: { type: Boolean, required: true },
  placement: {
    type: String as PropType<'right' | 'left' | 'bottom'>,
    default: 'right',
  },
  duration: { type: Number, default: 300 },
  container: {
    type: [String, Object] as PropType<string | HTMLElement>,
    default: 'body',
  },
  zIndex: { type: Number, default: 1000 },
  maskClosable: { type: Boolean, default: true },
});

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const isRendered = ref(false);
const isVisible = ref(false);
const isAnimating = ref(false);

const containerTarget = computed(() => props.container ?? 'body');
const cssVars = computed(() => ({
  '--duration': `${props.duration}ms`,
  '--z-index': String(props.zIndex),
}));

watch(
  () => props.open,
  async (nextOpen) => {
    if (nextOpen) {
      // open drawer
      if (!isRendered.value) {
        isRendered.value = true;
      }
      // wait for DOM render
      await nextTick();
      // force repaint, ensure initial state is applied
      requestAnimationFrame(() => {
        isVisible.value = true;
        isAnimating.value = true;
      });
    } else {
      // close drawer
      isVisible.value = false;
      isAnimating.value = true;
    }
  },
  { immediate: true },
);

function onMaskClick() {
  if (props.maskClosable) {
    emit('close');
  }
}

function handlePanelTransitionEnd(e: TransitionEvent) {
  if (e.propertyName !== 'transform') {
    return;
  }
  isAnimating.value = false;
  if (!isVisible.value) {
    isRendered.value = false;
  }
}

function handleMaskTransitionEnd(e: TransitionEvent) {
  if (e.propertyName !== 'opacity') {
    // mask animation end
  }
}
</script>

<template>
  <Teleport :to="containerTarget">
    <div
      v-if="isRendered"
      :class="[$style.wrapper, isVisible ? $style['wrapper-open'] : '']"
      :style="cssVars"
    >
      <div
        :class="[$style.mask, isVisible ? $style['mask-open'] : '']"
        @click="onMaskClick"
        @transitionend="handleMaskTransitionEnd"
      />
      <div
        :class="[
          $style.panel,
          $style[`from-${props.placement}`],
          isVisible ? $style['panel-open'] : ''
        ]"
        @click.stop
        @transitionend="handlePanelTransitionEnd"
      >
        <slot />
      </div>
    </div>
  </Teleport>
</template>

<style module lang="scss">
.wrapper {
  position: fixed;
  inset: 0;
  z-index: var(--z-index);
  pointer-events: none;
}

.wrapper-open {
  pointer-events: auto;
}

.mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  opacity: 0;
  transition: opacity var(--duration) ease;
  pointer-events: auto;
}

.mask-open {
  opacity: 1;
}

.panel {
  position: absolute;
  background: var(--bg-color-operate);
  max-width: 100%;
  max-height: 100%;
  transition: transform var(--duration) ease;
  pointer-events: auto;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: row;
}

.from-right {
  top: 0;
  right: 0;
  height: 100%;
  width: 320px;
  transform: translateX(100%);
}

.from-left {
  top: 0;
  left: 0;
  height: 100%;
  width: 320px;
  transform: translateX(-100%);
}

.from-bottom {
  left: 0;
  bottom: 0;
  width: 100%;
  height: 40%;
  transform: translateY(100%);
}

.panel-open.from-right,
.panel-open.from-left,
.panel-open.from-bottom {
  transform: translate(0, 0);
}
</style>
