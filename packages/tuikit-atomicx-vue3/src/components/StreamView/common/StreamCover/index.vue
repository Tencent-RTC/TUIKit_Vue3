<template>
  <div class="stream-cover">
    <div class="avatar-container" v-if="showAvatar">
      <img
        v-if="userInfo.avatarUrl"
        class="avatar"
        :src="userInfo.avatarUrl"
        :alt="displayName"
      />
      <div v-else class="avatar avatar-placeholder">
        {{ displayName.slice(0, 1).toUpperCase() }}
      </div>
    </div>
    <div class="user-details">
      <span
        class="audio-status"
        :class="{ 'audio-on': isAudioAvailable, 'audio-off': !isAudioAvailable }"
      >
        <i class="audio-icon"></i>
      </span>
      <div class="username">{{ displayName }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { TUIVideoStreamType } from '@tencentcloud/tuiroom-engine-js';
import { DeviceStatus, type UserInfo } from '../../../../types';
// import useUserState from '../../../../hooks/UserState/index';

// const { mixUserInfo } = useUserState();

const props = defineProps<{
  userInfo: UserInfo;
  streamType: TUIVideoStreamType;
}>();

const streamTypeText = computed(() => {
  if (props.streamType === TUIVideoStreamType.kCameraStream) {
    return '摄像头';
  } else if (props.streamType === TUIVideoStreamType.kScreenStream) {
    return '屏幕分享';
  } else if (props.streamType === TUIVideoStreamType.kCameraStreamLow) {
    return '低清摄像头';
  }
  return '';
});

const showAvatar = computed(() => {
  const hasNoCameraStream = props.streamType === TUIVideoStreamType.kCameraStream && props.userInfo.cameraStatus !== DeviceStatus.On;
  // const hasNoMixUserInfo = !mixUserInfo.value;
  // return hasNoCameraStream && hasNoMixUserInfo;
  return hasNoCameraStream;
});

const displayName = computed(() => {
  return props.userInfo.nameCard || props.userInfo.userName || props.userInfo.userId;
});

const isVideoAvailable = computed(() => {
  const isCamera = props.streamType === TUIVideoStreamType.kCameraStream || props.streamType === TUIVideoStreamType.kCameraStreamLow;
  return isCamera ? props.userInfo.cameraStatus === 'On' : props.userInfo.screenStatus === 'On';
});

const isAudioAvailable = computed(() => {
  return props.userInfo.microphoneStatus === 'On';
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

  .avatar-container {
    margin-bottom: 12px;

    .avatar {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid rgba(255, 255, 255, 0.6);
    }

    .avatar-placeholder {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background-color: #2a6af3;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      font-weight: bold;
    }
  }

  .user-details {
    text-align: center;
    position: absolute;
    bottom: 10px;
    left: 10px;
    display: flex;
    background-color: rgba(0, 0, 0, 0.5);
    padding: 2px 8px;
    border-radius: 20px;

    .audio-status {
        display: flex;
        align-items: center;
        margin-right: 6px;

        .audio-icon {
          display: inline-block;
          width: 16px;
          height: 16px;
          background-size: contain;
          background-repeat: no-repeat;
        }

        &.audio-on .audio-icon {
          background-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTggMS43NUM2Ljc1NzQgMS43NSA1Ljc1IDIuNzU3NCA1Ljc1IDRWOEM1Ljc1IDkuMjQyNiA2Ljc1NzQgMTAuMjUgOCAxMC4yNUM5LjI0MjYgMTAuMjUgMTAuMjUgOS4yNDI2IDEwLjI1IDhWNEMxMC4yNSAyLjc1NzQgOS4yNDI2IDEuNzUgOCAxLjc1Wk03IDRDNyAzLjQ0NzcgNy40NDc3MiAzIDggM0M4LjU1MjI4IDMgOSAzLjQ0NzcyIDkgNFY4QzkgOC41NTIyOCA4LjU1MjI4IDkgOCA5QzcuNDQ3NzIgOSA3IDguNTUyMjggNyA4VjRaIiBmaWxsPSIjMDBGRjAwIi8+PHBhdGggZD0iTTMuNzUgNy4yNUMzLjc1IDYuOTczODYgMy41MjYxNCA2Ljc1IDMuMjUgNi43NUMyLjk3Mzg2IDYuNzUgMi43NSA2Ljk3Mzg2IDIuNzUgNy4yNVY4QzIuNzUgMTAuODk5NSA1LjEwMDUgMTMuMjUgOCAxMy4yNUMxMC44OTk1IDEzLjI1IDEzLjI1IDEwLjg5OTUgMTMuMjUgOFY3LjI1QzEzLjI1IDYuOTczODYgMTMuMDI2MSA2Ljc1IDEyLjc1IDYuNzVDMTIuNDczOSA2Ljc1IDEyLjI1IDYuOTczODYgMTIuMjUgNy4yNVY4QzEyLjI1IDEwLjM0NzIgMTAuMzQ3MiAxMi4yNSA4IDEyLjI1QzUuNjUyNzkgMTIuMjUgMy43NSAxMC4zNDcyIDMuNzUgOFY3LjI1WiIgZmlsbD0iIzAwRkYwMCIvPjwvc3ZnPg==');
        }

        &.audio-off .audio-icon {
          background-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTggMS43NUM2Ljc1NzQgMS43NSA1Ljc1IDIuNzU3NCA1Ljc1IDRWOEM1Ljc1IDkuMjQyNiA2Ljc1NzQgMTAuMjUgOCAxMC4yNUM5LjI0MjYgMTAuMjUgMTAuMjUgOS4yNDI2IDEwLjI1IDhWNEMxMC4yNSAyLjc1NzQgOS4yNDI2IDEuNzUgOCAxLjc1Wk03IDRDNyAzLjQ0NzcgNy40NDc3MiAzIDggM0M4LjU1MjI4IDMgOSAzLjQ0NzcyIDkgNFY4QzkgOC41NTIyOCA4LjU1MjI4IDkgOCA5QzcuNDQ3NzIgOSA3IDguNTUyMjggNyA4VjRaIiBmaWxsPSIjRkY0NDQwIi8+PHBhdGggZD0iTTMuNzUgNy4yNUMzLjc1IDYuOTczODYgMy41MjYxNCA2Ljc1IDMuMjUgNi43NUMyLjk3Mzg2IDYuNzUgMi43NSA2Ljk3Mzg2IDIuNzUgNy4yNVY4QzIuNzUgMTAuODk5NSA1LjEwMDUgMTMuMjUgOCAxMy4yNUMxMC44OTk1IDEzLjI1IDEzLjI1IDEwLjg5OTUgMTMuMjUgOFY3LjI1QzEzLjI1IDYuOTczODYgMTMuMDI2MSA2Ljc1IDEyLjc1IDYuNzVDMTIuNDczOSA2Ljc1IDEyLjI1IDYuOTczODYgMTIuMjUgNy4yNVY4QzEyLjI1IDEwLjM0NzIgMTAuMzQ3MiAxMi4yNSA4IDEyLjI1QzUuNjUyNzkgMTIuMjUgMy43NSAxMC4zNDcyIDMuNzUgOFY3LjI1WiIgZmlsbD0iI0ZGNDI0MCIvPjxwYXRoIGQ9Ik0xLjUyOTQxIDAuNDY5NjdDMS4yMzY1MiAwLjE3Njc3OCAxLjc2MzU2IC0wLjM0OTkyIDIuMDU2NDUgLTAuMDU3MDMxNEwxNS4wNTY1IDEyLjk0M0MxNS4zNDkzIDEzLjIzNTkgMTQuODIyMyAxMy43NjI5IDE0LjUyOTQgMTMuNDdMMS41Mjk0MSAwLjQ2OTY3WiIgZmlsbD0iI0ZGNDI0MCIvPjwvc3ZnPg==');
        }
      }

    .username {
      font-size: 16px;
      font-weight: 500;
      margin-bottom: 6px;
      max-width: 200px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
}
</style>