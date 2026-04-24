<template>
  <Transition name="autoplay-prompt-fade">
    <div v-if="visible" class="default-autoplay-prompt">
      <div class="autoplay-prompt-content">
        <p>{{ t('LiveView.AutoPlayPromptDesc') }}</p>
        <button class="autoplay-prompt-action" @click="emit('resume')">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8 5v14l11-7L8 5z" />
          </svg>
          <span>{{ t('LiveView.StartPlay') }}</span>
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';

defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  (e: 'resume'): void;
}>();

const { t } = useUIKit();
</script>

<style scoped lang="scss">
.default-autoplay-prompt {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
  background:
    radial-gradient(circle at 16% 18%, rgba(255, 226, 160, 0.26), transparent 38%),
    radial-gradient(circle at 14% 24%, rgba(255, 255, 255, 0.14), transparent 42%),
    linear-gradient(180deg, rgba(2, 5, 14, 0.48), rgba(1, 3, 10, 0.74));
  backdrop-filter: blur(3px);
}

.autoplay-prompt-content {
  width: min(640px, calc(100% - 72px));
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;

  p {
    margin: 0;
    color: rgba(248, 250, 252, 0.95);
    font-size: 19px;
    font-weight: 650;
    line-height: 1.42;
    letter-spacing: 0.01em;
    text-shadow: 0 2px 10px rgba(2, 6, 23, 0.45);
  }
}

.autoplay-prompt-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 38px;
  padding: 0 15px;
  border-radius: 9px;
  border: 1px solid rgba(203, 213, 225, 0.34);
  background: rgba(148, 163, 184, 0.18);
  color: rgba(248, 250, 252, 0.94);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 180ms ease, border-color 180ms ease, color 180ms ease, transform 180ms ease;

  svg {
    width: 16px;
    height: 16px;
    fill: currentColor;
  }

  &:hover {
    background: rgba(148, 163, 184, 0.26);
    border-color: rgba(226, 232, 240, 0.5);
    transform: translateY(-1px);
  }

  &:active {
    transform: scale(0.97);
  }
}

.autoplay-prompt-fade-enter-active,
.autoplay-prompt-fade-leave-active {
  transition: opacity 220ms ease;
}

.autoplay-prompt-fade-enter-from,
.autoplay-prompt-fade-leave-to {
  opacity: 0;
}
</style>
