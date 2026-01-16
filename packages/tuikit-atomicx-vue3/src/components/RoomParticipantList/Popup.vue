<template>
  <teleport to="body">
    <transition
      name="popup-fade"
      @enter="onEnter"
      @leave="onLeave"
    >
      <div
        v-if="visible"
        class="popup-overlay"
        :class="overlayClass"
        :style="{ zIndex }"
        @click="handleOverlayClick"
      >
        <transition
          :name="`popup-${placement}`"
          appear
        >
          <div
            v-if="visible"
            class="popup-container"
            :class="[
              `popup-container--${placement}`,
              containerClass
            ]"
            :style="containerStyle"
            @click.stop
          >
            <div class="popup-main-header">
              <span class="icon-container" @click="handleClose">
                <IconArrowStrokeBack size="10" class="close-icon" />
              </span>
              <span class="sidebar-title">{{ title }}</span>
            </div>
            <div class="popup-main-content">
              <slot name="sidebarContent" />
            </div>
            <div class="popup-main-footer">
              <slot name="sidebarFooter" />
            </div>
          </div>
        </transition>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { watch, nextTick } from 'vue';
import { IconArrowStrokeBack } from '@tencentcloud/uikit-base-component-vue3';

interface Props {
  title: string;
  visible: boolean;
  placement?: 'top' | 'bottom' | 'center' | 'left' | 'right';
  overlay?: boolean;
  overlayClass?: string;
  containerClass?: string;
  containerStyle?: Record<string, string>;
  closeOnOverlayClick?: boolean;
  zIndex?: number;
  destroyOnClose?: boolean;
  lockScroll?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  placement: 'bottom',
  overlay: true,
  overlayClass: '',
  containerClass: '',
  containerStyle: () => ({}),
  closeOnOverlayClick: true,
  zIndex: 1000,
  destroyOnClose: false,
  lockScroll: true,
});

const emit = defineEmits<{
  'update:visible': [visible: boolean];
  'close': [];
  'open': [];
  'opened': [];
  'closed': [];
}>();

const handleClose = () => {
  emit('update:visible', false);
  emit('close');
};

const handleOverlayClick = () => {
  if (props.closeOnOverlayClick) {
    handleClose();
  }
};

const onEnter = () => {
  emit('open');
  nextTick(() => {
    emit('opened');
  });
};

const onLeave = () => {
  emit('closed');
};

// Prevent body scroll when popup is visible
watch(() => props.visible, (visible) => {
  if (!props.lockScroll) {
    return;
  }

  nextTick(() => {
    if (visible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  });
});
</script>
<style lang="scss" scoped>
.popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  background-color: rgba(0, 0, 0, 0.5);

  &.no-overlay {
    background-color: transparent;
  }
}

.popup-container {
  position: relative;
  background-color: var(--bg-color-topbar);
  border-radius: 8px;
  max-width: 100%;
  max-height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  &--center {
    margin: auto;
    max-width: 90%;
    max-height: 90%;
  }

  &--top {
    align-self: flex-start;
    width: 100%;
    border-radius: 0 0 16px 16px;
    max-height: 80%;
  }

  &--bottom {
    align-self: flex-end;
    width: 100%;
    border-radius: 16px 16px 0 0;
    max-height: 90%;
  }

  &--left {
    align-self: stretch;
    height: 100%;
    border-radius: 0 16px 16px 0;
    max-width: 80%;
  }

  &--right {
    align-self: stretch;
    height: 100%;
    margin-left: auto;
    border-radius: 16px 0 0 16px;
    max-width: 80%;
  }

  .popup-main-header {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 60px;
    position: relative;

    .icon-container {
      position: absolute;
      top: 0;
      left: 0;
      box-sizing: content-box;
      width: 10px;
      height: 18px;
      padding: 20px 25px;
      background-size: cover;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .sidebar-title {
      font-family: 'PingFang SC';
      font-size: 16px;
      font-style: normal;
      font-weight: 500;
      line-height: 22px;
      text-align: center;
      color: var(--text-color-primary);
    }

    .close-icon {
      background-size: cover;
    }
  }

  .popup-main-content {
    width: 100%;
    flex: 1;
    overflow: hidden;
  }

  .popup-main-footer {
    position: sticky;
    bottom: 0;
    width: 100%;
    height: auto;
  }
}

// Fade transition for overlay
.popup-fade-enter-active,
.popup-fade-leave-active {
  transition: opacity 0.3s ease;
}

.popup-fade-enter-from,
.popup-fade-leave-to {
  opacity: 0;
}

// Slide transitions for different placements
.popup-bottom-enter-active,
.popup-bottom-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.popup-bottom-enter-from,
.popup-bottom-leave-to {
  transform: translateY(100%);
}

.popup-top-enter-active,
.popup-top-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.popup-top-enter-from,
.popup-top-leave-to {
  transform: translateY(-100%);
}

.popup-left-enter-active,
.popup-left-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.popup-left-enter-from,
.popup-left-leave-to {
  transform: translateX(-100%);
}

.popup-right-enter-active,
.popup-right-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.popup-right-enter-from,
.popup-right-leave-to {
  transform: translateX(100%);
}

.popup-center-enter-active,
.popup-center-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.popup-center-enter-from,
.popup-center-leave-to {
  transform: scale(0.8);
  opacity: 0;
}
</style>
