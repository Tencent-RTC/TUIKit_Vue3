<template>
  <TUICallKit
    :class="callClass"
    :allowedMinimized="true"
    :allowedFullScreen="true"
  />
  <div class="call-scene">
    <Container @back="goHome">
      <Home v-if="currentPage === 'home'" @goCall="goCall" @goGroupCall="goGroupCall" />
      <CallPage v-else-if="currentPage === 'call'" @back="goHome" />
      <GroupCallPage v-else-if="currentPage === 'groupCall'" @back="goHome" />
    </Container>
  </div>
</template>

<script setup lang="ts">
import { computed, provide, reactive, ref, watch, onMounted, onUnmounted } from 'vue';
import { TUICallKit } from '@trtc/calls-uikit-vue';
import { useLoginState } from '@tencentcloud/chat-uikit-vue3';
import { UserInfoContextKey, UserInfoContextDefaultValue } from './context';
import type { IUserInfoContext } from './context';
import { isH5 } from './utils';
import Container from './components/Layout/Container/Container.vue';
import Home from './pages/Home/Home.vue';
import CallPage from './pages/Call/Call.vue';
import GroupCallPage from './pages/GroupCall/GroupCall.vue';
// Aegis data reporting (remove for GitHub demo)
import { createSceneDurationTracker } from '@/utils/aegis';

const { loginUserInfo } = useLoginState();
const currentPage = ref<'home' | 'call' | 'groupCall'>('home');

// Scene duration tracking (remove for GitHub demo)
let durationTracker: { cleanup: () => void } | null = null;

onMounted(() => {
  durationTracker = createSceneDurationTracker('call');
});

onUnmounted(() => {
  durationTracker?.cleanup();
});

const userInfoValue = reactive<IUserInfoContext>({
  ...UserInfoContextDefaultValue,
  userID: loginUserInfo.value?.userId || '',
  SDKAppID: Number(loginUserInfo.value?.sdkAppId) || 0,
  SecretKey: '',
  userSig: loginUserInfo.value?.userSig || '',
  isLogin: !!loginUserInfo.value?.userId,
});

const callClass = computed(() => {
  return isH5 ? 'call-uikit-h5' : 'call-uikit-pc';
})

provide(UserInfoContextKey, userInfoValue);

const goCall = () => {
  currentPage.value = 'call';
  userInfoValue.currentPage = 'call';
}

const goGroupCall = () => {
  currentPage.value = 'groupCall';
  userInfoValue.currentPage = 'groupCall';
}

const goHome = () => {
  currentPage.value = 'home';
  userInfoValue.currentPage = 'home';
}

// Watch for loginUserInfo changes and update userInfoValue
watch(loginUserInfo, (info) => {
  if (info) {
    userInfoValue.userID = info.userId || '';
    userInfoValue.SDKAppID = Number(info.sdkAppId) || 0;
    userInfoValue.userSig = info.userSig || '';
    userInfoValue.isLogin = !!info.userId;
  }
}, { immediate: true, deep: true });
</script>

<style lang="scss" scoped>
.call-scene {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-color-operate);
}

.call-uikit-pc {
  width: 950px;
  height: 650px;
  position: absolute !important;
  z-index: 100;
  transform: translate(-50%, -50%);
  top: 50%;
  left: 50%;
}
.call-uikit-h5 {
  position: absolute;
  z-index: 200;
}
</style>
