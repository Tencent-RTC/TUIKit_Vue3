<script setup lang="ts">
import { UIKitProvider } from '@tencentcloud/chat-uikit-vue3';
</script>

<template>
  <UIKitProvider language="zh-CN" theme="light">
    <router-view />
  </UIKitProvider>
</template>

<style scoped>
</style>
