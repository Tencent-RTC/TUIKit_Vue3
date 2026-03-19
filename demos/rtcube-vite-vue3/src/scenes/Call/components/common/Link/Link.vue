<template>
  <a
    :class="['custom-link', { 'no-underline': !underline }]"
    :href="href"
    :target="target"
    @click="handleClick"
  >
    <slot />
  </a>
</template>

<script setup lang="ts">
interface Props {
  href?: string;
  target?: string;
  underline?: boolean;
}

withDefaults(defineProps<Props>(), {
  href: '',
  target: '_self',
  underline: true,
});

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void;
}>();

const handleClick = (event: MouseEvent) => {
  emit('click', event);
};
</script>

<style lang="scss" scoped>
.custom-link {
  color: #1C66E5;
  font-size: 14px;
  cursor: pointer;
  text-decoration: underline;

  &.no-underline {
    text-decoration: none;
  }

  &:hover {
    opacity: 0.8;
  }
}
</style>
