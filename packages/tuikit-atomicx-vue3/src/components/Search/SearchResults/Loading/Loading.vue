<!-- eslint-disable import/extensions -->
<template>
  <div :class="$style.SearchLoading">{{ text }}</div>
</template>

<script lang="ts" setup>
import { defineProps } from 'vue';
interface ILoadingProps {
  text?: string;
}

const props = defineProps<ILoadingProps>();
</script>

<style lang="scss" module>
@import './Loading.scss';
</style>
