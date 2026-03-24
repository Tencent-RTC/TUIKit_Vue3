<template>
  <div class="main">
    <UIKitProvider theme="light">
      <router-view />
    </UIKitProvider>
  </div>
</template>

<script setup lang="ts">
import { onBeforeMount } from 'vue';
import { UIKitProvider, useUIKit } from '@tencentcloud/uikit-base-component-vue3';

const { setLanguage } = useUIKit();

onBeforeMount(() => {
  setLanguage('zh-CN');
});
</script>

<style scoped>
.main {
  height: 100vh;
}
.main::-webkit-scrollbar {
  display: none;
  /* Chrome Safari */
  -ms-overflow-style: none;
  /* IE 10+ */
  scrollbar-width: none;
  /* Firefox */
}
</style>
