<script setup lang="ts">
import { onBeforeMount } from 'vue';
import { UIKitProvider, useUIKit } from '@tencentcloud/uikit-base-component-vue3';

const { setLanguage } = useUIKit();

onBeforeMount(() => {
  setLanguage('zh-CN');
});

</script>

<template>
  <UIKitProvider theme="light">
    <router-view />
  </UIKitProvider>
</template>

<style scoped>
</style>
