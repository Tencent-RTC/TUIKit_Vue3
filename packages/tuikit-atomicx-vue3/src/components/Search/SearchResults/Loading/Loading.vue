<!-- eslint-disable import/extensions -->
<template>
  <div :class="$style.SearchLoading">{{ text }}</div>
</template>

<script lang="ts" setup>
interface ILoadingProps {
  text?: string;
}

const props = defineProps<ILoadingProps>();
</script>

<style lang="scss" module>
@use './Loading.scss';
</style>
