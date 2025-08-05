<template>
  <div class="stream-cover">
    <template v-if="userInfo.userId">
      <div class="no-video-container" v-if="!isVideoAvailable">
        <Avatar class="avatar" :size="avatarSize" :src="userInfo.avatarUrl" :alt="displayName" />
      </div>
      <div class="user-details">
        <AudioIcon
          :isMuted="!isAudioAvailable"
          :audioVolume="speakingUsers.get(userInfo.userId) || 0"
          size="small"
        />
        <div class="username">{{ displayName }}</div>
      </div>
    </template>
    <div v-if="!userInfo.userId" class="empty-position">
      <div class="text" v-if="localCoGuestStatus === CoGuestStatus.Connected">{{ t('Waiting for connection') }}</div>
      <div class="text" v-else>{{ t('Waiting for connection') }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { DeviceStatus, SeatUserInfo, CoGuestStatus } from '../../types';
import { useCoGuestState } from '../../states/CoGuestState';
import { Avatar } from '../Avatar';
import AudioIcon from '../../baseComp/AudioIcon.vue';
import { useLiveSeatState } from '../../states/LiveSeatState';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';

const { t } = useUIKit();
const props = withDefaults(
  defineProps<{
    userInfo?: SeatUserInfo;
    containerStyle?: {
      width: string;
      height: string;
      top: string;
      left: string;
    };
  }>(),
  {
    containerStyle: undefined,
    userInfo: undefined,
  }
);

const { localCoGuestStatus } = useCoGuestState();
const { speakingUsers } = useLiveSeatState();

const avatarSize = computed(() => {
  // The avatar size for background mixing is region.width / 5
  const radio = 4.9;
  if (parseInt(props.containerStyle?.width || '0') / radio > 80) {
    return Math.ceil(parseInt(props.containerStyle?.width || '0') / radio);
  }
  return 80;
});

const displayName = computed(() => {
  return props.userInfo?.userName || props.userInfo?.userId;
});

const isAudioAvailable = computed(() => {
  return props.userInfo?.microphoneStatus === DeviceStatus.On;
});

const isVideoAvailable = computed(() => {
  return props.userInfo?.cameraStatus === DeviceStatus.On;
});
</script>

<style lang="scss" scoped>
.stream-cover {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  border: 1px solid var(--uikit-color-black-6);

  .no-video-container {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;

    .avatar {
      border: 2px solid rgba(255, 255, 255, 0.6);
    }
  }

  .user-details {
    text-align: center;
    position: absolute;
    bottom: 6px;
    left: 6px;
    display: flex;
    background-color: rgba(34, 38, 46, 0.40);
    padding: 2px 6px;
    border-radius: 20px;
    max-width: 80%;
    box-sizing: border-box;

    .username {
      font-size: 16px;
      font-weight: 500;
      margin-left: 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  .empty-position {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    background: var(--uikit-color-gray-2);
    color: #fff;
    font-weight: bold;
    pointer-events: auto;

    .number {
      font-size: 18px;
      margin-bottom: 10px;
    }

    .text {
      font-size: 14px;
    }
  }
}
</style>
