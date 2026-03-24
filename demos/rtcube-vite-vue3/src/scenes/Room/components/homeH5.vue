<template>
  <PreConferenceViewH5
    @logout="handleLogout"
    @create-room="handleCreateRoom"
    @join-room="handleJoinRoom"
    @camera-preference-change="handleCameraPreferenceChange"
    @microphone-preference-change="handleMicrophonePreferenceChange"
  />
</template>

<script setup lang="ts">
import { PreConferenceViewH5 } from '@tencentcloud/roomkit-web-vue3';
import { useMediaPreference } from '../hooks/useMediaPreference';

const emit = defineEmits<{
  (e: 'logout'): void;
  (e: 'create-room', roomId: string, roomType: number): void;
  (e: 'join-room', roomId: string, roomType: number): void;
}>();

const { setCameraPreference, setMicrophonePreference } = useMediaPreference();

const handleCameraPreferenceChange = (isOpen: boolean) => {
  setCameraPreference(isOpen);
};

const handleMicrophonePreferenceChange = (isOpen: boolean) => {
  setMicrophonePreference(isOpen);
};

const handleLogout = () => {
  emit('logout');
};

// Note: PreConferenceViewH5 only provides roomId, so we use default roomType (0)
const handleCreateRoom = async (roomId: string) => {
  sessionStorage.setItem(`room-${roomId}-isCreate`, 'true');
  emit('create-room', roomId, 0);
};

const handleJoinRoom = async (roomId: string) => {
  sessionStorage.setItem(`room-${roomId}-isCreate`, 'false');
  emit('join-room', roomId, 0);
};
</script>

<style lang="scss" scoped></style>
