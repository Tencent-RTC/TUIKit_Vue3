<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useLoginState } from '@tencentcloud/chat-uikit-vue3';
import { TUIButton } from '@tencentcloud/uikit-base-component-vue3';
import { useRoute, useRouter } from 'vue-router';
import Logo from '@/assets/RTCubeLogo.png';
import Chat from '@/scenes/Chat/Chat.vue';

const { login, logout: _logout } = useLoginState();

const route = useRoute();
const router = useRouter();

type Scene = {
  key: string;
  label: string;
  desc: string;
};

const scenes: Scene[] = [
  { key: 'chat', label: 'Chat', desc: '即时聊天场景 Demo' },
];

const currentKey = computed<string>(() => (route.params.sceneId as string) || 'chat');

function switchScene(key: string) {
  if (key === currentKey.value) {
    return;
  }
  router.replace({ name: 'Stages', params: { sceneId: key } });
}

onMounted(() => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  if (userInfo.userID) {
    const { SDKAppID, userID, userSig } = userInfo;
    login({
      sdkAppId: SDKAppID,
      userId: userID,
      userSig,
      useUploadPlugin: true,
    }).then(() => []).catch((error) => {
      console.error('Login failed:', error);
      logout();
    });
  } else {
    router.replace({ name: 'Home' });
  }
});

function logout() {
  _logout();
  localStorage.removeItem('userInfo');
  router.replace({ name: 'Home' });
}

</script>

<template>
  <div class="stage-page">
    <header class="stage-header">
      <div class="stage-header__left">
        <img
          :src="Logo"
          alt="RTCube Logo"
          class="stage-header__logo"
          @click="router.replace('/')"
        >
        <button
          v-for="s in scenes"
          :key="s.key"
          class="pill"
          :class="{ active: s.key === currentKey }"
          @click="switchScene(s.key)"
        >
          {{ s.label }}
        </button>
      </div>
      <div class="stage-header__right">
        <TUIButton @click="logout">
          Logout
        </TUIButton>
      </div>
    </header>

    <div class="stage-content">
      <Chat v-if="currentKey === 'chat'" class="scene" />
      <div v-else-if="currentKey === 'live'" class="scene">
        Live Scene
      </div>
      <div v-else class="scene">
        Placeholder Scene
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.stage-page {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.stage-header {
  position: sticky;
  top: 0;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  gap: 12px;
  background: linear-gradient(180deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.12) 100%);
  backdrop-filter: saturate(160%) blur(12px);
  -webkit-backdrop-filter: saturate(160%) blur(12px);
  border-bottom: 1px solid rgba(0,0,0,0.06);
  box-shadow: 0 4px 24px rgba(0,0,0,0.08), inset 0 -1px 0 rgba(255,255,255,0.05);

  &__logo {
    height: 32px;
    margin: 0 12px;
    cursor: pointer;
  }

  &__left {
    display: flex;
    gap: 12px;
  }

  &__right {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 140px;
  }
}

.stage-content {
  flex: 1;
  display: flex;
  flex-direction: row;
  min-height: 0;
}

.pill {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 36px;
  padding: 0 16px;
  border-radius: 12px;
  color: rgba(0,0,0,0.75);
  background:
    radial-gradient(120% 120% at 0% 0%, rgba(111,161,255,0.18), transparent 60%),
    linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(245,247,255,0.8) 100%);
  cursor: pointer;
  transition: transform .15s ease, box-shadow .2s ease, background .2s ease;
}
.pill:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 24px rgba(40,81,163,0.18), inset 0 1px 0 rgba(255,255,255,0.9);
}
.pill:active {
  transform: translateY(0);
  border: 2px solid rgba(0,0,0,0.8);
}
.pill.active {
  color: #0b121f;
  border: 2px solid #4172ea;
  box-shadow: 0 10px 24px rgba(64,160,120,0.25), inset 0 1px 0 rgba(255,255,255,0.85);
}
</style>
