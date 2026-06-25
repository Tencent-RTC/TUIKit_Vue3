<template>
  <div
    class="wave-form"
    :style="waveFormStyle"
    @click="handleClick"
  >
    <div
      v-for="(height, index) in waveBarHeights"
      :key="index"
      class="wave-form__bar"
      :class="{ 'wave-form__bar--active': activeStates[index] }"
      :style="{ height: `${height}px` }"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

interface WaveFormProps {
  progress: number | undefined;
  barsCount?: number;
  width?: string | number;
}

const props = withDefaults(defineProps<WaveFormProps>(), {
  barsCount: 30,
  width: '100%',
});

const emit = defineEmits<{
  (e: 'seek', progress: number): void;
}>();

// Calculate wave form container style
const waveFormStyle = computed(() => ({
  width: typeof props.width === 'number' ? `${props.width}px` : props.width,
}));

// Generate fixed wave bar heights array to avoid height changes on re-render
const waveBarHeights = Array.from({ length: props.barsCount }, () => Math.random() * 16 + 4);

// Compute active states for all bars
const activeStates = computed(() => {
  const currentProgress = props.progress || 0;

  if (currentProgress === 0) {
    return Array(props.barsCount).fill(false);
  }

  const _activeStates = Array.from({ length: props.barsCount }, (_, index) => {
    const barProgress = index / props.barsCount;
    return currentProgress >= barProgress;
  });

  return _activeStates;
});

// Handle click event, calculate new progress
const handleClick = (event: MouseEvent) => {
  const waveElement = event.currentTarget as HTMLElement;
  const rect = waveElement.getBoundingClientRect();
  const offsetX = event.clientX - rect.left;
  const newProgress = offsetX / rect.width;

  // Ensure progress value is between 0-1
  const validProgress = Math.max(0, Math.min(1, newProgress));
  emit('seek', validProgress);
};
</script>

<style lang="scss" scoped>
.wave-form {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 2px;
  height: 24px;
  cursor: pointer;
  padding: 0 2px;

  &__bar {
    flex: 1;
    width: 3px;
    background-color: rgba(0, 0, 0, 10%);
    border-radius: 1.5px;
    transition: background-color 0.2s ease;

    &--active {
      background-color: #4080ff;
    }
  }

}
</style>
