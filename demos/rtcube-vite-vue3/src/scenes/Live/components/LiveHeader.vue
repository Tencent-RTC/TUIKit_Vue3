<template>
  <header class="live-header">
    <div class="header-left" @click="handleHomeClick">
    </div>
    <div class="header-right">
      <TUIButton
        v-if="props.showStartButton && !isH5"
        class="btn-start-live"
        type="primary"
        @click="handleStartLive"
      >
        {{ t('Start live') }}
      </TUIButton>
    </div>
  </header>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import { TUIButton, TUIMessageBox, TUIToast, TOAST_TYPE, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useLoginState, useLiveListState, Avatar, UIKitModal } from 'tuikit-atomicx-vue3';
import { isH5 } from '../TUILiveKit/utils/environment';
import { errorHandler } from '../TUILiveKit/utils/errorHandler';
import logoSvg from '../assets/logo.svg';

const props = withDefaults(defineProps<{
  showStartButton?: boolean;
  showLoginButton?: boolean;
}>(), {
  showStartButton: false,
  showLoginButton: true,
});

const emit = defineEmits<{
  (e: 'start-live'): void;
  (e: 'go-home'): void;
}>();

const { t } = useUIKit();
const { login, loginUserInfo, logout } = useLoginState();
const { currentLive, endLive } = useLiveListState();
const loginLoading = ref(false);

const logoSrc = computed(() => logoSvg);

function handleStartLive() {
  emit('start-live');
}

function handleHomeClick() {
  emit('go-home');
}

async function handleLogin() {
  try {
    loginLoading.value = true;
    const storedData = sessionStorage.getItem('tuiLive-userInfo') || '{}';
    const liveUserInfo = JSON.parse(storedData);
    await login({
      userId: liveUserInfo.userID,
      userSig: liveUserInfo.userSig,
      sdkAppId: liveUserInfo.SDKAppID,
      testEnv: localStorage.getItem('tuikit-live-env') === 'TestEnv',
    });
  } catch (error) {
    console.error(error);
    const errorInfo = errorHandler.parseError(error);
    UIKitModal.openModal({
      id: errorInfo.code,
      title: t('Login failed'),
      content: t(errorInfo.message),
      type: 'error',
    });
  } finally {
    loginLoading.value = false;
  }
}

function proceedLogout() {
  logout();
  sessionStorage.removeItem('tuiLive-userInfo');
}

function handleLogout() {
  if (currentLive.value?.liveId) {
    TUIMessageBox.confirm({
      title: t('You are currently live streaming. Logging out will automatically end the live stream. Are you sure you want to log out?'),
      showClose: false,
      callback: async (action) => {
        if (action === 'confirm') {
          try {
            await endLive();
          } catch (error) {
            console.warn('End live failed when log out:', error);
            TUIToast({
              message: t('End live failed when log out'),
              type: TOAST_TYPE.ERROR,
            });
            return;
          }
          proceedLogout();
        }
      },
    });
  } else {
    proceedLogout();
  }
}
</script>

<style lang="scss" scoped>
.live-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  user-select: none;
  padding: 16px;

  .header-left {
    display: flex;
    align-items: center;
    gap: 4px;

    &:hover {
      cursor: pointer;
    }

    .header-left-logo {
      width: 26px;
      height: 24px;
    }

    .header-left-title {
      font-size: 18px;
      font-weight: 600;
      color: var(--text-color-primary);
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 8px;

    .btn-start-live {
      margin-right: 20px;
    }

    .header-right-name {
      font-size: 14px;
      font-weight: 400;
    }
  }
}
</style>
