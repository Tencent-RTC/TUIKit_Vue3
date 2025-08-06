<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import {
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
} from 'reka-ui';

interface Props {
  /** Whether to show the modal */
  open: boolean;
  /** Whether to close on overlay click */
  closeOnOverlay?: boolean;
  /** Class name passed to DialogContent */
  contentClass?: string;
}

interface Emits {
  (e: 'onClose', reason?: 'overlay' | 'escape'): void;
}

withDefaults(defineProps<Props>(), {
  open: false,
  closeOnOverlay: true,
  contentClass: '',
});

const emit = defineEmits<Emits>();

const handleClose = (reason?: 'overlay' | 'escape') => {
  emit('onClose', reason);
};

const handleUpdateOpen = (value: boolean) => {
  if (!value) {
    handleClose('escape');
  }
};

</script>

<template>
  <DialogRoot
    :open="open"
    @update:open="handleUpdateOpen"
  >
    <DialogPortal to="body">
      <DialogOverlay
        class="modal-overlay"
        @click="closeOnOverlay && handleClose('overlay')"
      />
      <DialogContent :class="['modal-content', contentClass]">
        <slot />
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<style lang="scss" scoped>
$animationDuration: 200ms;

.modal-overlay {
  background-color: rgba(0, 0, 0, 0.5);
  position: fixed;
  inset: 0;

  &[data-state="open"] {
    animation: overlayIn $animationDuration ease-out;
  }

  &[data-state="closed"] {
    animation: overlayOut $animationDuration ease-out;
  }
}

.modal-content {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: var(--bg-color-operate);
  border-radius: 8px;
  box-shadow:
    0px 10px 38px -10px rgba(22, 23, 24, 0.35),
    0px 10px 20px -15px rgba(22, 23, 24, 0.2);

  &[data-state="open"] {
    animation: contentIn $animationDuration ease-out;
  }

  &[data-state="closed"] {
    animation: contentOut $animationDuration ease-out;
  }
}

@keyframes overlayIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes overlayOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

@keyframes contentIn {
  from {
    opacity: 0;
    transform: translate(-50%, -46%) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

@keyframes contentOut {
  from {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
  to {
    opacity: 0;
    transform: translate(-50%, -46%) scale(0.96);
  }
}
</style>
