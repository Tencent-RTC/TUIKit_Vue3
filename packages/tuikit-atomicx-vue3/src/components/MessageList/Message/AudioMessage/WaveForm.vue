<template>
  <div
    class="wave-form"
    @click="handleClick"
    :style="waveFormStyle"
  >
    <div
      v-for="(height, index) in waveBarHeights"
      :key="index"
      class="wave-form__bar"
      :class="{ 'wave-form__bar--active': isBarActive(index) }"
      :style="{ height: `${height}px` }"
    />
    <div
      class="wave-form__cursor"
      :style="cursorStyle"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';

interface WaveFormProps {
  progress: number | undefined;
  barsCount?: number;
  width?: string | number;
}

const props = withDefaults(defineProps<WaveFormProps>(), {
  barsCount: 30,
  width: '100%'
});

const emit = defineEmits<{
  (e: 'seek', progress: number): void;
}>();

// Calculate wave form container style
const waveFormStyle = computed(() => ({
  width: typeof props.width === 'number' ? `${props.width}px` : props.width
}));

// Generate fixed wave bar heights array to avoid height changes on re-render
const waveBarHeights = ref<number[]>([]);

// Generate random heights on component mount and keep them constant during component lifecycle
onMounted(() => {
  const heights = [];
  for (let i = 0; i < props.barsCount; i++) {
    // Generate random heights between 8px and 24px
    heights.push(Math.random() * 16 + 8);
  }
  waveBarHeights.value = heights;
});

// Check if wave bar is active
const isBarActive = (index: number) => {
  const barProgress = (index + 1) / props.barsCount;
  return (props.progress || 0) >= barProgress;
};

// Calculate cursor position style
const cursorStyle = computed(() => ({
  left: `${(props.progress || 0) * 100}%`
}));

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

  &__cursor {
    position: absolute;
    top: 0;
    width: 2px;
    height: 100%;
    background-color: rgba(0, 0, 0, 20%);
    pointer-events: none;
  }
}
</style>
