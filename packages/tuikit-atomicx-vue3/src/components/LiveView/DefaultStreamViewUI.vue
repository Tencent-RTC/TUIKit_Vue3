<template>
  <div class="stream-cover">
    <template v-if="userInfo.userId">
      <div v-if="!isVideoAvailable" class="no-video-container">
        <canvas
          v-if="needCanvasMaskList.length > 0"
          ref="canvasRef"
          class="canvas-mask"
        />
        <div v-else class="mask" />
        <Avatar
          class="avatar"
          :size="avatarSize"
          :src="userInfo.avatarUrl"
        />
      </div>
      <div v-if="seatListWithUser.length > 1" class="user-details">
        <AudioIcon
          v-if="shouldShowMutedAudioIcon"
          class="audio-icon"
          :isMuted="true"
          :audioVolume="speakingUsers.get(userInfo.userId) || 0"
        />
        <div class="username">
          {{ displayName }}
        </div>
      </div>
    </template>
    <div
      v-if="!userInfo.userId"
      class="empty-position"
      :class="{ 'clickable': !isAnchor }"
    >
      <span
        class="text"
        :title="t('LiveView.WaitingForConnection')"
      >{{ t('LiveView.WaitingForConnection') }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick, onUnmounted } from 'vue';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import AudioIcon from '../../baseComp/AudioIcon.vue';
import { useLiveListState } from '../../states/LiveListState';
import { useLiveSeatState } from '../../states/LiveSeatState';
import { useLoginState } from '../../states/LoginState';
import { DeviceStatus } from '../../types';
import { Avatar } from '../Avatar';
import type { SeatUserInfo } from '../../types';

interface Props {
  userInfo: SeatUserInfo;
  streamViewInfoList: Array<{ userInfo: SeatUserInfo; region: {
    left: string;
    top: string;
    width: string;
    height: string;
    zIndex: number;
  }; }>;
}

const props = defineProps<Props>();

const { t } = useUIKit();
const canvasRef = ref<HTMLCanvasElement | null>(null);

const { loginUserInfo } = useLoginState();
const { speakingUsers, seatList } = useLiveSeatState();
const { currentLive } = useLiveListState();

const isAnchor = computed(() => loginUserInfo.value?.userId === currentLive.value?.liveOwner.userId);

const seatListWithUser = computed(() => seatList.value.filter(item => item.userInfo && item.userInfo.userId !== ''));

const currentStreamViewSize = computed(() => {
  const currentStreamViewInfo = props.streamViewInfoList.find(item => item.userInfo?.userId === props.userInfo?.userId);
  if (!currentStreamViewInfo) {
    return { width: 0, height: 0 };
  }
  return {
    width: parseInt(currentStreamViewInfo?.region.width),
    height: parseInt(currentStreamViewInfo?.region.height),
  };
});

const avatarSize = computed(() => {
  const defaultAvatarSize = 54;
  const minSize = Math.min(currentStreamViewSize.value.width, currentStreamViewSize.value.height);
  if (minSize < defaultAvatarSize + 10) {
    return minSize - 10;
  }
  return defaultAvatarSize;
});

const needCanvasMaskList = computed(() => {
  const currentStreamViewInfo = props.streamViewInfoList.find(item => item.userInfo?.userId === props.userInfo?.userId);
  if (!currentStreamViewInfo) {
    return [];
  }
  return props.streamViewInfoList.filter((item) => {
    const isHigher = item.region.zIndex > currentStreamViewInfo?.region.zIndex;
    const isHorizontalOverlap = parseInt(item.region.left) > parseInt(currentStreamViewInfo?.region.left) && parseInt(item.region.left) < parseInt(currentStreamViewInfo?.region.left) + parseInt(currentStreamViewInfo?.region.width);
    const isVerticalOverlap = parseInt(item.region.top) > parseInt(currentStreamViewInfo?.region.top) && parseInt(item.region.top) < parseInt(currentStreamViewInfo?.region.top) + parseInt(currentStreamViewInfo?.region.height);
    return isHigher && isHorizontalOverlap && isVerticalOverlap;
  }).map(item => ({
    left: parseInt(item.region.left) - parseInt(currentStreamViewInfo?.region.left),
    top: parseInt(item.region.top) - parseInt(currentStreamViewInfo?.region.top),
    width: parseInt(item.region.width),
    height: parseInt(item.region.height),
  }));
});

const drawCanvas = () => {
  if (!canvasRef.value) {
    return;
  }

  const canvas = canvasRef.value;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return;
  }

  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;

  ctx.fillStyle = '#1F2024';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  needCanvasMaskList.value.forEach((item) => {
    ctx.clearRect(item.left, item.top, item.width, item.height);
  });
};

let resizeObserver: ResizeObserver | null = null;

watch(() => needCanvasMaskList.value.length, async () => {
  if (needCanvasMaskList.value.length > 0) {
    await nextTick();
    if (canvasRef.value) {
      drawCanvas();
      resizeObserver = new ResizeObserver(() => {
        drawCanvas();
      });
      resizeObserver.observe(canvasRef.value);
    }
  } else if (resizeObserver && canvasRef.value) {
    resizeObserver.unobserve(canvasRef.value);
  }
}, { immediate: true });

onUnmounted(() => {
  if (resizeObserver && canvasRef.value) {
    resizeObserver.unobserve(canvasRef.value);
  }
});

const displayName = computed(() => props.userInfo?.userName || props.userInfo?.userId);

const isAudioAvailable = computed(() => props.userInfo?.microphoneStatus === DeviceStatus.On);

const isVideoAvailable = computed(() => props.userInfo?.cameraStatus === DeviceStatus.On);

const shouldShowMutedAudioIcon = computed(() => {
  if (isAudioAvailable.value) {
    return false;
  }
  return isVideoAvailable.value;
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
  box-sizing: border-box;
  border: 1px solid var(--bg-color-topbar);

  .no-video-container {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;

    .canvas-mask {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }

    .mask {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: var(--uikit-color-gray-3);
    }
  }

  .user-details {
    text-align: center;
    position: absolute;
    bottom: 6px;
    left: 6px;
    display: flex;
    align-items: center;
    background-color: var(--uikit-color-black-5);
    padding: 2px 8px;
    border-radius: 100px;
    max-width: 80%;
    box-sizing: border-box;

    .audio-icon {
      zoom: 0.6;
    }

    .username {
      font-size: 12px;
      font-weight: 500;
      margin-left: 2px;
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

    &.clickable {
      cursor: pointer;
    }

    .number {
      font-size: 18px;
      margin-bottom: 10px;
    }

    .text {
      font-size: 14px;
      max-width: 80%;
      text-overflow: ellipsis;
      white-space: nowrap;
      overflow: hidden;
      color: var(--text-color-primary);
      font-weight: 400;
    }
  }
}
</style>
