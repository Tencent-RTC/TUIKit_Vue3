<template>
  <div class="welcome">
    <div class="welcome-title">
      {{ t("Home.欢迎使用") }}
      <IconLogo
        class="logo"
        :size="40"
      />
      {{ t("即时通信") }}
    </div>
    <div
      class="welcome-content"
    >
      {{
        t(
          "Home.我们为您默认提供了一位\"示例好友\"和一个\"示例客服群\"您不用额外添加好友和群聊就可完整体验腾讯云 IM 单聊、群聊的所有功能。"
        )
      }}
      <br>
      {{ t("Home.随时随地") }}
    </div>
  </div>
</template>
<script setup lang="ts">
import { IconLogo } from '@tencentcloud/uikit-base-component-vue3';
import { useUIKit } from '@tencentcloud/chat-uikit-vue3';

const { t } = useUIKit();
</script>
<style lang="scss">
:root[tui-theme-mode='light'] {
  --welcome-background: url("../../../../assets/images/login-background.png") no-repeat;
}

:root[tui-theme-mode='dark'] {
  --welcome-background: var(--bg-color-topbar);
}

.welcome {
  flex: 1;
  box-sizing: border-box;
  padding-left: 40px;
  padding-top: 100px;
  display: flex;
  flex-direction: column;
  background: var(--welcome-background);
  background-size: cover;
  background-position-x: -17px;
  background-position-y: 173px;
  .welcome-title {
    font-size: 1.75rem;
    display: flex;
    align-items: center;
    font-family: PingFangSC-Medium;
    font-weight: 500;
    color: var(--text-color-primary);
    .logo {
      margin: 0 0.98rem;
    }
  }
  .welcome-content {
    padding-top: 1.88rem;
    max-width: 393px;
    font-size: 16px;
    line-height: 24px;
    font-family: PingFangSC-Regular;
    font-weight: 400;
    color: var(--text-color-secondary);
  }
}
</style>
