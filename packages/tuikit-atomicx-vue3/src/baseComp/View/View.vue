<template>
  <div
    :class="computedClass"
    :style="{
      gap: gap ? `${gap}px` : undefined,
    }"
  >
    <slot />
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import cs from 'classnames';

defineOptions({
  // eslint-disable-next-line vue/no-reserved-component-names
  name: 'View',
});

interface ViewProps {
  gap?: number;
  // dir: row | column
  dir?: 'row' | 'column';
  // main aix：flex-start | flex-end | center | space-between | space-around | space-evenly
  justify?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
  // cross aix：flex-start | flex-end | center | baseline | stretch
  align?: 'flex-start' | 'flex-end' | 'center' | 'baseline' | 'stretch';
}

const props = withDefaults(defineProps<ViewProps>(), {
  gap: undefined,
  dir: 'column',
  justify: undefined,
  align: undefined,
});

const computedClass = computed(() => cs(
  'view__v',
  {
    'view__v--dir-row': props.dir === 'row',
    [`view__v--justify-${props.justify}`]: props.justify,
    [`view__v--align-${props.align}`]: props.align,
  },
));
</script>

<style lang="scss">
.view__v {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  align-content: flex-start;
  border: 0 solid black;
  margin: 0;
  padding: 0;
  min-width: 0;

  // direction class
  &--dir-row {
    flex-direction: row;
  }

  // justify-content class
  &--justify-flex-start {
    justify-content: flex-start;
  }

  &--justify-flex-end {
    justify-content: flex-end;
  }

  &--justify-center {
    justify-content: center;
  }

  &--justify-space-between {
    justify-content: space-between;
  }

  &--justify-space-around {
    justify-content: space-around;
  }

  &--justify-space-evenly {
    justify-content: space-evenly;
  }

  // align-items class
  &--align-flex-start {
    align-items: flex-start;
  }

  &--align-flex-end {
    align-items: flex-end;
  }

  &--align-center {
    align-items: center;
  }

  &--align-baseline {
    align-items: baseline;
  }

  &--align-stretch {
    align-items: stretch;
  }
}
</style>
