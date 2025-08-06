<template>
  <router-view />
</template>

<script lang="ts" setup>
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { enResource, zhResource, addI18n } from './i18n';

const { setLanguage } = useUIKit();

addI18n('en-US', { translation: enResource });
addI18n('zh-CN', { translation: zhResource });
setLanguage(navigator.language);
</script>

<style>
* {
  box-sizing: border-box;
  font-family: 'PingFang SC';
}

body {
  margin: 0;
  padding: 0;
}

#app {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
</style>
