<template>
  <div class="stream-cover">
    <template v-if="userInfo?.userId">
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
          :src="userInfo?.avatarUrl"
        />
      </div>
      <div
        v-if="seatListWithUser.length > 1"
        class="user-details"
        :style="{ '--widget-scale': widgetScale }"
      >
        <AudioIcon
          v-if="!isAudioAvailable"
          class="audio-icon"
          :isMuted="!isAudioAvailable"
          :audioVolume="speakingUsers.get(userInfo?.userId) || 0"
        />
        <div class="username">
          {{ displayName }}
        </div>
      </div>
    </template>
    <div
      v-if="!userInfo?.userId"
      class="empty-position"
      :class="{ 'clickable': !isAnchor }"
    >
      <div class="seat-display" :style="{ '--widget-scale': widgetScale }">
        <IconPlus v-if="!isAnchor" />
        <span v-else class="seat-index">{{ props.seatIndex }}</span>
        <span class="text">{{ isAnchor ? t('LiveView.WaitingForConnection') : t('LiveView.ApplyForConnection') }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick, onUnmounted } from 'vue';
import { useUIKit, IconPlus } from '@tencentcloud/uikit-base-component-vue3';
import AudioIcon from '../../baseComp/AudioIcon.vue';
import { useLiveListState } from '../../states/LiveListState';
import { useLiveSeatState } from '../../states/LiveSeatState';
import { useLoginState } from '../../states/LoginState';
import { DeviceStatus } from '../../types';
import { Avatar } from '../Avatar';
import { useWidgetScale } from './useWidgetScale';
import type { SeatUserInfo } from '../../types';

interface Props {
  userInfo?: SeatUserInfo;
  streamViewInfoList: Array<{ userInfo?: SeatUserInfo; region: {
    left: string;
    top: string;
    width: string;
    height: string;
    zIndex: number;
  }; }>;
  seatIndex: number;
}

const props = defineProps<Props>();

const { t } = useUIKit();
const canvasRef = ref<HTMLCanvasElement | null>(null);

const { loginUserInfo } = useLoginState();
const { speakingUsers, seatList } = useLiveSeatState();
const { currentLive } = useLiveListState();

const isAnchor = computed(() => {
  if (!loginUserInfo.value?.userId || !currentLive.value?.liveOwner?.userId) {
    return false;
  }
  return loginUserInfo.value.userId === currentLive.value.liveOwner.userId;
});

const seatListWithUser = computed(() => seatList.value.filter(item => item.userInfo && item.userInfo.userId !== ''));

const currentStreamViewSize = computed(() => {
  // Match by userId when occupied; fall back to the positional region
  // (seatIndex - 1) so empty seats can still derive their size for scaling.
  const currentStreamViewInfo = props.streamViewInfoList.find(item => item.userInfo?.userId === props.userInfo?.userId)
    ?? props.streamViewInfoList[props.seatIndex - 1];
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

// Lower bound for the text-overlay scale. Smaller than the badge floor (0.6)
// because wrapped captions stay readable even when shrunk further.
const TEXT_WIDGET_MIN_SCALE = 0.5;

// Uniform scale for overlay widgets so they shrink proportionally on small
// seats. Text always stays visible (wrapping instead of being clipped),
// honoring the goal of keeping captions fully readable.
const widgetScale = useWidgetScale(currentStreamViewSize, { min: TEXT_WIDGET_MIN_SCALE });

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
      // Disconnect previous observer before creating a new one to avoid memory leaks
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      resizeObserver = new ResizeObserver(() => {
        drawCanvas();
      });
      resizeObserver.observe(canvasRef.value);
    }
  } else if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
}, { immediate: true });

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
});

const displayName = computed(() => props.userInfo?.userName || props.userInfo?.userId);

const isAudioAvailable = computed(() => props.userInfo?.microphoneStatus === DeviceStatus.On);

const isVideoAvailable = computed(() => props.userInfo?.cameraStatus === DeviceStatus.On);

</script>

<style lang="scss" scoped>
.stream-cover {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-color-primary);
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  box-sizing: border-box;

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
      background-color: var(--uikit-color-gray-2);
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
    color: var(--text-color-button);
    padding: 2px 8px;
    border-radius: 100px;
    max-width: 80%;
    box-sizing: border-box;
    transform: scale(var(--widget-scale, 1));
    transform-origin: bottom left;

    .audio-icon {
      zoom: 0.6;
    }

    .username {
      font-size: 12px;
      font-weight: 500;
      margin-left: 2px;
      // Single-line with ellipsis — the pill is meant to be a compact
      // identifier, not a multi-line block. Capping at one line keeps
      // the video tile clear and the pill height predictable.
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
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
    pointer-events: auto;
    box-shadow: 0 0 0 1px var(--bg-color-topbar);

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
      // Wrap freely instead of clipping: the empty seat lays out vertically
      // and has spare height, so the full prompt stays readable on small seats.
      white-space: normal;
      word-break: break-word;
      text-align: center;
      color: var(--text-color-primary);
      font-weight: 400;
    }

    .seat-display {
      display: flex;
      flex-direction: column;
      width: 100%;
      color: var(--text-color-primary);
      align-items: center;
      gap: 12px;
      transform: scale(var(--widget-scale, 1));
      transform-origin: center center;
    }

    .seat-index {
      font-size: 24px;
      font-weight: 500;
      color: var(--text-color-secondary);
    }
  }
}
</style>
