<template>
  <div :class="$style.SearchSlider">
    <div :class="$style.SearchSlider__rail" ref="trackRef">
      <div
        :class="$style.SearchSlider__track"
        :style="{
          left: `${getPercent(value[0])}%`,
          width: `${getPercent(value[1]) - getPercent(value[0])}%`,
        }"
      ></div>
      <div
        :class="$style.SearchSlider__thumb"
        :style="{ left: `${getPercent(value[0])}%` }"
        @mousedown="e => handleStart('min', e)"
        @touchstart="e => handleStart('min', e)"
      ></div>
      <div
        :class="$style.SearchSlider__thumb"
        :style="{ left: `${getPercent(value[1])}%` }"
        @mousedown="e => handleStart('max', e)"
        @touchstart="e => handleStart('max', e)"
      ></div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, withDefaults, defineProps } from 'vue';

interface SliderProps {
  value: [number, number];
  min?: number;
  max?: number;
  onChange?: (value: [number, number]) => void;
}

const props = withDefaults(defineProps<SliderProps>(), {
  min: 0,
  max: 99,
});

const trackRef = ref<HTMLDivElement>();

const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

const getPercent = (val: number) => ((val - props.min) / (props.max - props.min)) * 100;

const handleDrag = (e: MouseEvent | TouchEvent, type: 'min' | 'max') => {
  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
  const track = trackRef.value;
  if (!track) return;
  const rect = track.getBoundingClientRect();
  const percent = clamp((clientX - rect.left) / rect.width, 0, 1);
  const val = Math.round(percent * (props.max - props.min) + props.min);
  let newValue: [number, number] = props.value;
  if (type === 'min') {
    newValue = [clamp(val, props.min, props.value[1]), props.value[1]];
  } else {
    newValue = [props.value[0], clamp(val, props.value[0], props.max)];
  }
  props.onChange?.(newValue);
};

const handleStart = (type: 'min' | 'max', e: MouseEvent | TouchEvent) => {
  handleDrag(e, type);
  const moveHandler = (moveEvent: MouseEvent | TouchEvent) => handleDrag(moveEvent, type);
  const upHandler = () => {
    window.removeEventListener('mousemove', moveHandler);
    window.removeEventListener('touchmove', moveHandler);
    window.removeEventListener('mouseup', upHandler);
    window.removeEventListener('touchend', upHandler);
  };
  window.addEventListener('mousemove', moveHandler);
  window.addEventListener('touchmove', moveHandler);
  window.addEventListener('mouseup', upHandler);
  window.addEventListener('touchend', upHandler);
};
</script>

<style lang="scss" module>
@import './Slider.scss';
</style>
