<template>
  <PreConferenceView
    class="home-pre"
    :uiOptions="uiOptions"
    @logout="handleLogout"
    @create-room="handleCreateRoom"
    @join-room="handleJoinRoom"
    @camera-preference-change="handleCameraPreferenceChange"
    @microphone-preference-change="handleMicrophonePreferenceChange"
  />
</template>

<script setup lang="ts">
import { PreConferenceView } from '@tencentcloud/roomkit-web-vue3';
import { useMediaPreference } from '../hooks/useMediaPreference';
import { computed } from 'vue';

const emit = defineEmits<{
  (e: 'logout'): void;
  (e: 'create-room', roomId: string, roomType: number): void;
  (e: 'join-room', roomId: string, roomType: number): void;
}>();

const uiOptions = computed(() => ({
  showHeader: false,
}));

const { setMicrophonePreference, setCameraPreference } = useMediaPreference();

const handleCameraPreferenceChange = (isOpen: boolean) => {
  setCameraPreference(isOpen);
};

const handleMicrophonePreferenceChange = (isOpen: boolean) => {
  setMicrophonePreference(isOpen);
};

const handleLogout = () => {
  emit('logout');
};

const handleCreateRoom = async (roomId: string, roomType: number) => {
  sessionStorage.setItem(`room-${roomId}-isCreate`, 'true');
  emit('create-room', roomId, roomType);
};

const handleJoinRoom = async (roomId: string, roomType: number) => {
  sessionStorage.setItem(`room-${roomId}-isCreate`, 'false');
  emit('join-room', roomId, roomType);
};
</script>

<style lang="scss" scoped>
.home-pre {
    min-height: 100% !important;
    padding: 0 50px;
    margin: 0;
}
</style>
