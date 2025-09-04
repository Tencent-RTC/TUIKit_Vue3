<template>
  <div
    :class="computedClass"
    :style="props.style"
  >
    <slot />
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import type { CSSProperties } from 'vue';
import cs from 'classnames';

defineOptions({
  // eslint-disable-next-line vue/no-reserved-component-names
  name: 'View',
  inheritAttrs: true,
});

interface ViewProps {
  // 方向：row | column
  dir?: 'row' | 'column';
  // 主轴对齐：flex-start | flex-end | center | space-between | space-around | space-evenly
  justify?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
  // 交叉轴对齐：flex-start | flex-end | center | baseline | stretch
  align?: 'flex-start' | 'flex-end' | 'center' | 'baseline' | 'stretch';
  // 原有属性
  class?: string;
  style?: CSSProperties;
}

const props = withDefaults(defineProps<ViewProps>(), {
  dir: 'column',
  justify: undefined,
  align: undefined,
  class: undefined,
  style: undefined,
});

// 计算最终的 class
const computedClass = computed(() => cs(
  'view__v',
  {
    'view__v--dir-row': props.dir === 'row',
    [`view__v--justify-${props.justify}`]: props.justify,
    [`view__v--align-${props.align}`]: props.align,
  },
  props.class,
));
</script>

<style lang="scss" scoped>
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

  // 方向类
  &--dir-row {
    flex-direction: row;
  }

  // justify-content 类
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

  // align-items 类
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
