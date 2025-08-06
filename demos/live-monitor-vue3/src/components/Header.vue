<template>
  <div class="header-container">
    <div class="logo-info">
      <IconLogoInEnglish class="logo" />
      <span class="title">LiveKit</span>
      <span>{{ t('Monitor') }}</span>
    </div>
    <div class="login-info">
      <Avatar size="xs" />
      <span class="user-name">986644389</span>
      <IconArrowStrokeSelectDown class="arrow-down" />
    </div>
  </div>
</template>
<script lang="ts" setup>
import { Avatar } from 'tuikit-atomicx-vue3';
import { IconLogoInEnglish, IconArrowStrokeSelectDown, useUIKit } from '@tencentcloud/uikit-base-component-vue3';

const { t } = useUIKit();
</script>
<style lang="scss" scoped>
.header-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 72px;
  padding: 20px 40px;
  border-bottom: 1px solid var(--stroke-color-secondary);

  .logo-info {
    display: flex;
    align-items: center;
    color: var(--text-color-primary);
    font-size: 18px;
    font-weight: 500;
    .logo {
      width: 26px;
      height: 24px;
    }

    .title {
      margin: 0 12px 0 6px;
      padding-right: 12px;
      border-right: 2px solid var(--stroke-color-module);
    }
  }
  .login-info {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 32px;
    width: 146px;
    color: var(--text-color-primary);
    font-size: 14px;
    font-weight: 500;

    .user-name {
      max-width: 76px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .arrow-down:hover {
      cursor: pointer;
    }
  }
}
</style>
