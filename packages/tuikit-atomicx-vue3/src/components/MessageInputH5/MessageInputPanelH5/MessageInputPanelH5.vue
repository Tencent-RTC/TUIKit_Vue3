<template>
  <PopoverRoot
    :open="open"
    :modal="false"
    @update:open="handleOpenChange"
  >
    <PopoverAnchor
      v-if="virtualAnchor"
      :reference="virtualAnchor"
    />
    <PopoverPortal>
      <PopoverContent
        :class="[
          $style['message-input-panel-h5'],
          $style[`message-input-panel-h5--${size}`],
        ]"
        side="top"
        align="center"
        :side-offset="offset"
        :collision-padding="8"
        :avoid-collisions="false"
        @open-auto-focus.prevent
        @interact-outside="handleInteractOutside"
        @pointer-down-outside="handleInteractOutside"
      >
        <slot />
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { PopoverAnchor, PopoverContent, PopoverPortal, PopoverRoot } from 'reka-ui';

type PanelSize = 'full' | 'inset';

interface MessageInputPanelH5Props {
  open?: boolean;
  anchorElement?: HTMLElement | null;
  offset?: number;
  size?: PanelSize;
}

const props = withDefaults(defineProps<MessageInputPanelH5Props>(), {
  open: false,
  anchorElement: null,
  offset: 8,
  size: 'full',
});

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
}>();

const virtualAnchor = computed(() => {
  const element = props.anchorElement;
  if (!element) {
    return null;
  }

  return {
    getBoundingClientRect: () => element.getBoundingClientRect(),
  };
});

function handleOpenChange(value: boolean): void {
  emit('update:open', value);
}

function getOutsideEventTarget(event: Event): EventTarget | null {
  const customEvent = event as CustomEvent<{ originalEvent?: Event }>;
  return customEvent.detail?.originalEvent?.target ?? event.target;
}

function handleInteractOutside(event: Event): void {
  const target = getOutsideEventTarget(event);
  if (!(target instanceof Element)) {
    return;
  }

  if (target.closest('.tui-dialog-mask') || target.closest('.group-call-dialog')) {
    event.preventDefault();
  }
}
</script>

<style lang="scss" module>
.message-input-panel-h5 {
  z-index: 1600;
  box-sizing: border-box;
  overflow: hidden;
  background-color: var(--bg-color-operate);
  border: 1px solid var(--stroke-color-secondary);
  border-radius: 20px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.16);
  outline: none;
  transform-origin: bottom center;

  &[data-state='open'] {
    animation: message-input-panel-h5-enter 180ms cubic-bezier(0.16, 1, 0.3, 1);
  }

  &[data-state='closed'] {
    animation: message-input-panel-h5-exit 120ms ease-in;
  }
}

.message-input-panel-h5--full {
  width: 100vw;
  max-width: 100vw;
}

.message-input-panel-h5--inset {
  width: calc(100vw - 24px);
  max-width: calc(100vw - 24px);
}

@keyframes message-input-panel-h5-enter {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.98);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes message-input-panel-h5-exit {
  from {
    opacity: 1;
    transform: translateY(0) scale(1);
  }

  to {
    opacity: 0;
    transform: translateY(6px) scale(0.98);
  }
}
</style>
