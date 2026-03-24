<template>
  <div class="room-scene">
    <!-- Room View (Conference) -->
    <RoomView
      v-if="isInRoom"
      :room-id="roomId"
      :room-type="roomType"
      :password="password"
      @back="handleBackHome"
    />
    <!-- Pre-Conference View (Home) -->
    <HomeView
      v-else
      @logout="handleLogout"
      @create-room="handleCreateRoom"
      @join-room="handleJoinRoom"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { conference } from '@tencentcloud/roomkit-web-vue3';
import { useLoginState } from '@tencentcloud/chat-uikit-vue3';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import HomeView from './components/home.vue';
import RoomView from './components/room.vue';

const { loginUserInfo } = useLoginState();
const { language, theme } = useUIKit();

const isInRoom = ref(false);
const roomId = ref('');
const roomType = ref<number>(0);
const password = ref<string | undefined>(undefined);
const isConferenceLoggedIn = ref(false);

// Initialize conference settings
watch([language, theme], ([newLanguage, newTheme]) => {
  if (newLanguage) {
    try {
      (conference as any).setLanguage?.(newLanguage === 'zh-CN' ? 'zh-CN' : 'en-US');
    } catch (e) {
      console.warn('setLanguage not supported:', e);
    }
  }
  if (newTheme) {
    try {
      (conference as any).setTheme?.(newTheme === 'dark' ? 'dark' : 'light');
    } catch (e) {
      console.warn('setTheme not supported:', e);
    }
  }
}, { immediate: true });

// Login to conference when user info is available
watch(() => loginUserInfo.value, async (info) => {
  if (info?.userId && info?.userSig && !isConferenceLoggedIn.value) {
    try {
      await conference.login({
        sdkAppId: Number(info.sdkAppId),
        userId: info.userId,
        userSig: info.userSig,
      });
      await conference.setSelfInfo({
        userName: info.userId,
        avatarUrl: '',
      });
      isConferenceLoggedIn.value = true;
    } catch (error) {
      console.error('Conference login failed:', error);
    }
  }
}, { immediate: true });

const handleLogout = () => {
  // Handle logout - emit event to parent or navigate
  console.log('User logged out');
};

const handleCreateRoom = (newRoomId: string, newRoomType: number) => {
  roomId.value = newRoomId;
  roomType.value = newRoomType;
  isInRoom.value = true;
};

const handleJoinRoom = (newRoomId: string, newRoomType: number) => {
  roomId.value = newRoomId;
  roomType.value = newRoomType;
  isInRoom.value = true;
};

const handleBackHome = () => {
  isInRoom.value = false;
  roomId.value = '';
  roomType.value = 0;
  password.value = undefined;
};
</script>

<style lang="scss" scoped>
.room-scene {
  flex: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}
</style>
