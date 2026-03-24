<template>
  <ConferenceMainViewH5 />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, watch, computed } from 'vue';
import { ComponentName, conference, ConferenceMainViewH5, RoomEvent as ConferenceRoomEvent } from '@tencentcloud/roomkit-web-vue3';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useLoginState } from '@tencentcloud/chat-uikit-vue3';

conference.setComponentConfig({ componentName: ComponentName.AIToolsButton, visible: true });

const props = defineProps<{
  roomId: string;
  password?: string;
}>();

const emit = defineEmits<{
  (e: 'back'): void;
}>();

const { t } = useUIKit();
const { loginUserInfo } = useLoginState();

// Use a computed property to determine if user is logged in
const userId = computed(() => loginUserInfo.value?.userId);
const currentRoomId = computed(() => props.roomId);

// Track if we're already in a room
let isInRoom = false;

watch([userId, currentRoomId], async ([newUserId, newRoomId]) => {
  if (!newUserId || !newRoomId || isInRoom) {
    return;
  }
  await handleEnterRoom();
}, { immediate: true });

async function handleEnterRoom() {
  const isCreateKey = `room-${props.roomId}-isCreate`;
  const isCreate = sessionStorage.getItem(isCreateKey) === 'true';
  sessionStorage.removeItem(isCreateKey);
  try {
    if (isCreate) {
      await handleStartConference();
    } else {
      await handleJoinConference();
    }
    isInRoom = true;
  } catch (error) {
    console.error('Failed to enter room:', error);
    emit('back');
  }
}

async function handleStartConference() {
  await conference.start({
    roomId: props.roomId,
    options: {
      roomName: `${loginUserInfo.value?.userId || 'User'}${t('Room.TemporaryMeeting') || "'s meeting"}`,
    },
  });
}

async function handleJoinConference() {
  await conference.join({
    roomId: props.roomId,
    options: { password: props.password },
  });
}

const handleBackHome = () => {
  isInRoom = false;
  emit('back');
};

onMounted(() => {
  conference.on(ConferenceRoomEvent.ROOM_DISMISS, handleBackHome);
  conference.on(ConferenceRoomEvent.ROOM_LEAVE, handleBackHome);
  conference.on(ConferenceRoomEvent.ROOM_ERROR, handleBackHome);
  conference.on(ConferenceRoomEvent.KICKED_OUT, handleBackHome);
});

onUnmounted(() => {
  conference.off(ConferenceRoomEvent.ROOM_DISMISS, handleBackHome);
  conference.off(ConferenceRoomEvent.ROOM_LEAVE, handleBackHome);
  conference.off(ConferenceRoomEvent.ROOM_ERROR, handleBackHome);
  conference.off(ConferenceRoomEvent.KICKED_OUT, handleBackHome);
  isInRoom = false;
});

</script>

<style lang="scss" scoped>
</style>
