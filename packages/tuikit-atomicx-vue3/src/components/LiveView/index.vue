<template>
  <div
    id="live-core-view-container"
    ref="liveCoreViewContainerRef"
    class="live-core-view-container"
    :class="{ 'align-center': isAlignCenter }"
  >
    <div
      class="live-core-view"
      :style="streamViewStyle"
    >
      <div
        :id="LIVE_STREAM_CONTENT_VIEW"
        class="stream-content"
      />
      <!-- Center overlay slot for custom content (pause button, watermark, etc.) -->
      <div
        v-if="$slots['center-overlay']"
        class="center-overlay"
      >
        <slot name="center-overlay" v-bind="{ isLoading }" />
      </div>
      <div
        v-if="needPlayStreamViewInfo.length > 0 && !isPictureInPicture"
        class="live-core-ui"
        :style="{ pointerEvents: isAnchor ? 'none' : 'auto' }"
      >
        <div
          v-for="(item, index) in needPlayStreamViewInfo"
          :key="`seat-${index}`"
          :style="item.region"
          @click="handleEmptySeatClick(index, item)"
        >
          <slot
            name="streamViewUI"
            v-bind="{ userInfo: item.userInfo }"
          />
          <DefaultStreamViewUI
            v-if="!$slots.streamViewUI"
            :streamViewInfoList="needPlayStreamViewInfo"
            :userInfo="item.userInfo"
            :seatIndex="index + 1"
          />
        </div>
      </div>
      <slot
        v-if="$slots.localVideo && isMounted"
        name="localVideo"
        v-bind="{ style: localStreamViewInfo?.region }"
      />
      <LiveCoreDecorate v-if="!isPictureInPicture" :seatListWithRealSize="seatListWithRealSize" />
    </div>
    <!-- Loading overlay: shown when entering room, placed at container level to avoid 0-size stream view -->
    <div
      v-if="isLoading && !$slots['center-overlay']"
      class="entering-room-loading"
    >
      <IconLoading class="entering-room-loading-icon" size="40" />
    </div>
    <!-- Voice chat room overlay: web does not support voice chat rooms -->
    <div
      v-if="isVoiceChatRoom"
      class="voice-chat-overlay"
    >
      <IconCall size="50" />
      <span class="voice-chat-overlay-text">{{ t('LiveView.VoiceChatNotSupported') }}</span>
    </div>
    <!-- Anchor away overlay: shown when seatList is empty and the viewer is not the anchor -->
    <div
      v-if="isAnchorAway"
      class="anchor-away-overlay"
    >
      <div class="anchor-away-content">
        <div class="anchor-away-icon">
          <IconCoffee :size="58" />
        </div>
        <div class="anchor-away-text">
          {{ t('LiveView.AnchorAway') }}
        </div>
      </div>
    </div>
    <!-- Autoplay prompt overlay: shown when browser autoplay policy blocks playback -->
    <div
      v-if="isAutoPlayFailed && !isAnchor"
      class="autoplay-prompt-overlay"
    >
      <slot name="autoplay-prompt" v-bind="{ resume: handleAutoPlayResume }">
        <DefaultAutoPlayPrompt :visible="true" @resume="handleAutoPlayResume" />
      </slot>
    </div>
    <Teleport
      to="body"
      :disabled="!isMobile || isFullscreen"
    >
      <PlayerControl v-if="isShowPlayerControl" :isLandscapeStyleMode="isLandscapeStyleMode" />
    </Teleport>
    <div :id="SVGA_PLAYER_VIEW" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, useSlots, Teleport } from 'vue';
import type { ComputedRef } from 'vue';
import { TUIRoomEvents } from '@tencentcloud/tuiroom-engine-js';
import { useUIKit, IconCall, IconCoffee, IconLoading } from '@tencentcloud/uikit-base-component-vue3';
import useRoomEngine from '../../hooks/useRoomEngine';
import { useCoGuestState } from '../../states/CoGuestState';
import { useCoHostState } from '../../states/CoHostState';
import { setGiftPlayerView } from '../../states/LiveGiftState';
import { useLiveListState } from '../../states/LiveListState';
import { useLiveSeatState } from '../../states/LiveSeatState';
import { useLoginState } from '../../states/LoginState';
import { useDeviceState } from '../../states/DeviceState';
import { CoHostStatus } from '../../types';
import { isMobile } from '../../utils';
import { getContentSize } from '../../utils/domOperation';
import LiveCoreDecorate from './CoreViewDecorate/LiveCoreDecorate.vue';
import DefaultAutoPlayPrompt from './DefaultAutoPlayPrompt.vue';
import DefaultStreamViewUI from './DefaultStreamViewUI.vue';
import { useOverlayState } from './OverlayState';
import { usePlayerControlState } from './PlayerControl';
import { LIVE_STREAM_CONTENT_VIEW } from './index';
import PlayerControl from './PlayerControl/PlayerControl.vue';
import type { SeatInfo, SeatUserInfo } from '../../types';

const emit = defineEmits(['empty-seat-click']);

defineSlots<{
  'center-overlay'(props: { isLoading: boolean }): any;
  'autoplay-prompt'(props: { resume: () => void }): any;
  'streamViewUI'(props: { userInfo: SeatUserInfo }): any;
  'localVideo'(props: { style: any }): any;
}>();

const { isFullscreen, isPlaying, isLandscapeStyleMode, isPictureInPicture, exitPictureInPicture, exitFullscreen } = usePlayerControlState();
const { t } = useUIKit();
const { seatList, canvas, startPlayStream, stopPlayStream } = useLiveSeatState();
const { setCaptureVolume, setOutputVolume } = useDeviceState();
const { currentLive } = useLiveListState();
const { coHostStatus } = useCoHostState();
const { disConnect } = useCoGuestState();

const slots = useSlots();
const SVGA_PLAYER_VIEW = 'svga-player-view';
const isInStreamMixerComp = computed(() => slots.localVideo);

const { loginUserInfo } = useLoginState();
const { isAnchor, isVoiceChatRoom, isAnchorAway, isLoading, startObserving, stopObserving } = useOverlayState({
  viewId: LIVE_STREAM_CONTENT_VIEW,
});

const roomEngine = useRoomEngine();
const isAutoPlayFailed = ref(false);
let cachedAutoPlayResume: (() => void) | null = null;

const handleAutoPlayFailed = (callbackInfo: { resume: () => void }) => {
  if (!isAutoPlayFailed.value) {
    isAutoPlayFailed.value = true;
    cachedAutoPlayResume = callbackInfo.resume;
  }
};

function handleAutoPlayResume() {
  if (cachedAutoPlayResume) {
    cachedAutoPlayResume();
    cachedAutoPlayResume = null;
  }
  isAutoPlayFailed.value = false;
  isPlaying.value = true;
}

// Dismiss the autoplay prompt as soon as the user interacts with ANY part
// of the page. Browsers unlock autoplay after a user gesture (click or
// touch), so by that point the stream has almost certainly resumed.
// Keeping the prompt up would be a stale UX.
// Note: keyboard events don't count as autoplay-unlocking gestures in most
// browsers, so we only listen for pointer-based gestures (click / touchstart).
const dismissAutoPlayPromptOnGesture = () => {
  cachedAutoPlayResume = null;
  isAutoPlayFailed.value = false;
  isPlaying.value = true;
};

// `capture: true` so we observe the gesture even if child handlers call
// stopPropagation. `once: true` cleans up automatically after first fire.
const autoPlayGestureOpts: AddEventListenerOptions = { capture: true, once: true };

watch(isAutoPlayFailed, (failed) => {
  if (failed) {
    document.addEventListener('click', dismissAutoPlayPromptOnGesture, autoPlayGestureOpts);
    document.addEventListener('touchstart', dismissAutoPlayPromptOnGesture, autoPlayGestureOpts);
  } else {
    document.removeEventListener('click', dismissAutoPlayPromptOnGesture, autoPlayGestureOpts);
    document.removeEventListener('touchstart', dismissAutoPlayPromptOnGesture, autoPlayGestureOpts);
  }
});

const isMounted = ref(false);
const seatListWithRealSize = ref<Array<{ userInfo: SeatUserInfo; region: any }>>([]);
// The distance of the horizontal video from the top and bottom edges.
const topAndBottomMargin = 60;
// The distance of the audio connect view from the right edge.
const audioConnectRightPosition = 30;
const audioConnectGap = 5;
// The height ratio of the audio connect view in portrait container.
const audioConnectHeightInPortraitContainerRatio = 156 / 1280;
const isLocalUserOnSeat = computed(() => seatList.value.some(seat => seat.userInfo?.userId === loginUserInfo.value?.userId));
const isLandscapeVideoAndAudioConnect = computed(() => {
  const layoutTemplate = currentLive.value?.layoutTemplate;
  return layoutTemplate !== undefined && layoutTemplate >= 200 && layoutTemplate <= 399;
});
const isAlignCenter = computed(() => {
  if (isLandscapeVideoAndAudioConnect.value && isMobile) {
    return false;
  }
  if (!isInStreamMixerComp.value && isPortraitContainer.value && widthRatio.value < heightRatio.value && isMobile) {
    return false;
  }
  return true;
});
const isShowPlayerControl = computed(() =>
  !isLoading.value
  && !isAnchorAway.value
  && !isAutoPlayFailed.value
  && currentLive.value?.liveId
  && !seatList.value.some(item => item.userInfo?.userId === loginUserInfo.value?.userId),
);

onMounted(async () => {
  isMounted.value = true;
  // Listen for browser autoplay policy restriction
  roomEngine.instance?.on(TUIRoomEvents.onAutoPlayFailed, handleAutoPlayFailed);
  // Start playing the stream first
  await startPlayStream({ view: LIVE_STREAM_CONTENT_VIEW });
  // Set volume for audience
  if (!isAnchor.value) {
    setCaptureVolume(100);
    setOutputVolume(100);
  }
  // Then start observing for video ready state
  startObserving();
});

onBeforeUnmount(async () => {
  if (isPictureInPicture.value) {
    exitPictureInPicture();
  }
  isMounted.value = false;
  roomEngine.instance?.off(TUIRoomEvents.onAutoPlayFailed, handleAutoPlayFailed);
  isAutoPlayFailed.value = false;
  cachedAutoPlayResume = null;
  // Defensive cleanup: if the component is unmounted while the autoplay
  // prompt is still showing, the `once: true` listeners would normally be
  // cleaned up by the `watch(isAutoPlayFailed)` handler above (since we
  // reset the flag right before this). Still, remove them explicitly in
  // case the watcher fires after we've detached.
  document.removeEventListener('click', dismissAutoPlayPromptOnGesture, autoPlayGestureOpts);
  document.removeEventListener('touchstart', dismissAutoPlayPromptOnGesture, autoPlayGestureOpts);
  // Clean up observer first, then stop the stream
  stopObserving();
  await stopPlayStream();
});

const isPortraitContainer = ref(true);
const liveCoreViewContainerRef = ref<HTMLDivElement>();

const liveCoreViewContainerSize = ref<{ width: number; height: number }>({
  width: 0,
  height: 0,
});
const originStreamViewStyle = ref({
  width: 0,
  height: 0,
  transformX: 0,
  transformY: 0,
  scale: 1,
});

const ratioLayoutList = computed(() => {
  const layoutCanvas = canvas.value;
  const layoutList = seatList.value?.map(seat => ({ userId: seat.userInfo?.userId, ...seat.region }));
  if (!layoutList) {
    return [];
  }

  handleLandscapeVideoLayoutForAudioConnect(layoutList);
  return layoutList.map((item: any) => ({
    userId: item.userId,
    x: item.x / layoutCanvas.width,
    y: item.y / layoutCanvas.width,
    width: item.w / layoutCanvas.width,
    height: item.h === layoutCanvas.height ? -1 : item.h / layoutCanvas.width,
    zOrder: item.zOrder,
  }));
});

function handleLandscapeVideoLayoutForAudioConnect(layoutList: any[]) {
  if (!isLandscapeVideoAndAudioConnect.value) {
    return;
  }

  if (layoutList.length - 1 <= 0) {
    return;
  }

  const audioLayoutTemplate = [];
  if (isMobile) {
    audioLayoutTemplate.push({ x: 20, y: 460, w: 150, h: 150 });
    audioLayoutTemplate.push({ x: 20, y: 300, w: 150, h: 150 });
    audioLayoutTemplate.push({ x: 20, y: 140, w: 150, h: 150 });
  } else {
    audioLayoutTemplate.push({ x: 20, y: 510, w: 120, h: 120 });
    audioLayoutTemplate.push({ x: 20, y: 380, w: 120, h: 120 });
    audioLayoutTemplate.push({ x: 20, y: 250, w: 120, h: 120 });
  }

  for (let i = 1; i < layoutList.length && (i - 1) < audioLayoutTemplate.length; ++i) {
    const layout = layoutList[i];
    layout.w = audioLayoutTemplate[i - 1].w;
    layout.h = audioLayoutTemplate[i - 1].h;
    layout.x = audioLayoutTemplate[i - 1].x;
    layout.y = audioLayoutTemplate[i - 1].y;
  }
}

const streamViewSize = computed(() => ({
  width: Math.ceil(originStreamViewStyle.value.width * originStreamViewStyle.value.scale),
  height: Math.ceil(originStreamViewStyle.value.height * originStreamViewStyle.value.scale),
}));

const handleLandscapeVideoForAudioConnectInPortraitContainer = (index: number): any => {
  const layout = ratioLayoutList.value[index];
  const seat = seatList.value[index];
  const connectVideoHeight = liveCoreViewContainerSize.value.height * audioConnectHeightInPortraitContainerRatio;

  seatListWithRealSize.value.push({
    userInfo: seat.userInfo as SeatUserInfo,
    region: {
      position: 'absolute' as const,
      right: `${audioConnectRightPosition}px`,
      top: `${liveCoreViewContainerSize.value.height - topAndBottomMargin * 2 - index * (connectVideoHeight + audioConnectGap)}px`,
      width: `${connectVideoHeight}px`,
      height: `${connectVideoHeight}px`,
      zIndex: Number(layout.zOrder) || 0,
    },
  });
};

watch(() => [seatList.value, streamViewSize.value, liveCoreViewContainerSize.value], () => {
  seatListWithRealSize.value = [];
  const isPortraitAndFill = isPortraitContainer.value && fillMode.value === StreamFillMode.Fill;
  seatList.value.forEach((item: SeatInfo, index: number) => {
    const ratioLayout = ratioLayoutList.value[index];
    const isSampleWithCanvas = seatList.value.length === 1 || (item.region?.w === canvas.value.width && item.region?.h === canvas.value.height);
    if (!isInStreamMixerComp.value && isPortraitAndFill && isSampleWithCanvas) {
      seatListWithRealSize.value.push({
        userInfo: item.userInfo as SeatUserInfo,
        region: {
          position: 'absolute' as const,
          left: '50%',
          top: '50%',
          width: `${liveCoreViewContainerSize.value.width}px`,
          height: `${liveCoreViewContainerSize.value.height}px`,
          transform: 'translate(-50%, -50%)',
          zIndex: Number(ratioLayout.zOrder) || 0,
        },
      });
    } else if (isLandscapeVideoAndAudioConnect.value && isPortraitContainer.value && isMobile && item.region?.h === 0 && item.region?.w === 0) {
      return handleLandscapeVideoForAudioConnectInPortraitContainer(index);
    } else {
      seatListWithRealSize.value.push({
        userInfo: item.userInfo as SeatUserInfo,
        region: {
          position: 'absolute' as const,
          left: `${Math.floor(streamViewSize.value.width * ratioLayout.x) - 1}px`,
          top: `${Math.floor(streamViewSize.value.width * ratioLayout.y) - 1}px`,
          width: `${Math.ceil(streamViewSize.value.width * ratioLayout.width) + 1}px`,
          height:
            ratioLayout.height === -1
              ? `${Math.ceil(streamViewSize.value.height) + 1}px`
              : `${Math.ceil(streamViewSize.value.width * ratioLayout.height) + 1}px`,
          zIndex: Number(ratioLayout.zOrder) || 0,
        },
      });
    }
  });
});

const localStreamViewInfo = computed(() => seatListWithRealSize.value.find(item => item?.userInfo?.userId === loginUserInfo.value?.userId));

const needPlayStreamViewInfo = computed(() => {
  if (isInStreamMixerComp.value) {
    return seatListWithRealSize.value.filter(item => item.userInfo?.userId !== loginUserInfo.value?.userId);
  }
  return seatListWithRealSize.value;
});

// ----- Layout Processing -----
// Get a stream layout container B based on the size of streamView's parent element A, container B conforms to aspectRatio proportion
// Based on the passed props.config.layoutList, using stream layout container B as canvas size, calculate the size of all visible areas C and the center coordinates of visible area C
// Based on the size ratio of visible area C and A, calculate container B's scale. Based on the center coordinates of C and B, calculate container B's transformX and transformY (to ensure C's center point is at the center of streamView's parent element B)
// Based on container B's scale and transformX, transformY, calculate container B's actual width, height, transformX, transformY (scale is not used here to avoid affecting the size of text and img in child elements)
// Based on container B's actual size, calculate the actual position and size of each child element

const visualStreamSize = computed(() => {
  if (!isPortraitContainer.value && widthRatio.value < heightRatio.value && ratioLayoutList.value.length > 0) {
    const absoluteLayoutList = ratioLayoutList.value.map(item => ({
      userId: item.userId,
      left: originStreamViewStyle.value.width * item.x,
      top: originStreamViewStyle.value.width * item.y,
      width: originStreamViewStyle.value.width * item.width,
      height: item.height === -1 ? originStreamViewStyle.value.height : originStreamViewStyle.value.width * item.height,
      zIndex: item.zOrder,
    }));
    const minX = Math.min(...absoluteLayoutList.map(item => item.left));
    const minY = Math.min(...absoluteLayoutList.map(item => item.top));
    const maxX = Math.max(...absoluteLayoutList.map(item => item.left + item.width));
    const maxY = Math.max(...absoluteLayoutList.map(item => item.top + item.height));
    return {
      width: maxX - minX,
      height: maxY - minY,
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2,
    };
  }
  return {
    width: 0,
    height: 0,
    centerX: 0,
    centerY: 0,
  };
});

watch(visualStreamSize, () => {
  handleStreamListTransform();
});

function handleStreamListTransform() {
  if (!liveCoreViewContainerRef.value) {
    return;
  }

  if (visualStreamSize.value.width && visualStreamSize.value.height) {
    const containerRect = liveCoreViewContainerRef.value.getBoundingClientRect();
    const containerWidth = Math.floor(containerRect.width);
    const containerHeight = Math.floor(containerRect.height);

    const scaleWidth = containerWidth / visualStreamSize.value.width;
    const scaleHeight = containerHeight / visualStreamSize.value.height;
    originStreamViewStyle.value.scale = Math.min(scaleWidth, scaleHeight);
    originStreamViewStyle.value.transformX = originStreamViewStyle.value.width / 2 - visualStreamSize.value.centerX;
    originStreamViewStyle.value.transformY = originStreamViewStyle.value.height / 2 - visualStreamSize.value.centerY;
  } else {
    handleStreamRegionSize();
    originStreamViewStyle.value.scale = 1;
    originStreamViewStyle.value.transformX = 0;
    originStreamViewStyle.value.transformY = 0;
  }
}

const streamViewStyle = computed(() => {
  if (isLandscapeVideoAndAudioConnect.value && isPortraitContainer.value) {
    return {
      top: `${topAndBottomMargin}px`,
      width: `${Math.ceil(originStreamViewStyle.value.width * originStreamViewStyle.value.scale)}px`,
      height: `${Math.ceil(originStreamViewStyle.value.height * originStreamViewStyle.value.scale)}px`,
      transform: `translate(${originStreamViewStyle.value.transformX * originStreamViewStyle.value.scale}px, ${
        originStreamViewStyle.value.transformY * originStreamViewStyle.value.scale
      }px)`,
    };
  }
  return {
    width: `${Math.ceil(originStreamViewStyle.value.width * originStreamViewStyle.value.scale)}px`,
    height: `${Math.ceil(originStreamViewStyle.value.height * originStreamViewStyle.value.scale)}px`,
    transform: `translate(${originStreamViewStyle.value.transformX * originStreamViewStyle.value.scale}px, ${
      originStreamViewStyle.value.transformY * originStreamViewStyle.value.scale
    }px)`,
  };
});

const aspectRatio = computed(() => {
  if (canvas.value.width && canvas.value.height) {
    return `${canvas.value.width}:${canvas.value.height}`;
  }
  if (currentLive.value && currentLive.value?.layoutTemplate >= 200 && currentLive.value?.layoutTemplate <= 599) {
    return '16:9';
  }
  return '9:16';
});

const widthRatio: ComputedRef<number> = computed(() => {
  if (!aspectRatio.value || aspectRatio.value.indexOf(':') < 0) {
    return 0;
  }
  return Number(aspectRatio.value.split(':')[0]);
});
const heightRatio: ComputedRef<number> = computed(() => {
  if (!aspectRatio.value || aspectRatio.value.indexOf(':') < 0) {
    return 0;
  }
  return Number(aspectRatio.value.split(':')[1]);
});

/**
 * fillMode rules:
 * Rule 1: If there is only one user in seatList, fillMode is Fill
 * Rule 2: If a user's region in seatList matches the canvas size, fillMode is Fill
 * Rule 3: If in landscape mode, fillMode must be Fit
 */
enum StreamFillMode {
  Fit = 'fit',
  Fill = 'fill',
}

const fillMode = ref<StreamFillMode>(StreamFillMode.Fit);

watch(() => [canvas.value, seatList.value], () => {
  if (canvas.value.width > canvas.value.height) {
    fillMode.value = StreamFillMode.Fit;
    handleStreamRegionSize();
    return;
  }
  const onlyOneSeat = seatList.value.length === 1;
  const hasOneFullScreenUser = seatList.value.find((item: any) => item.region?.w === canvas.value.width && item.region?.h === canvas.value.height);
  if (!isInStreamMixerComp.value && (onlyOneSeat || hasOneFullScreenUser)) {
    fillMode.value = StreamFillMode.Fill;
  } else {
    fillMode.value = StreamFillMode.Fit;
  }
  handleStreamRegionSize();
}, { deep: true });

function handleStreamRegionSize() {
  if (!liveCoreViewContainerRef.value) {
    return;
  }
  const containerWidth = getContentSize(liveCoreViewContainerRef.value).width;
  const containerHeight = getContentSize(liveCoreViewContainerRef.value).height;
  let width = containerWidth;
  let height = containerHeight;

  if (widthRatio.value && heightRatio.value) {
    const scaleWidth = containerWidth / widthRatio.value;
    const scaleHeight = containerHeight / heightRatio.value;

    if (fillMode.value === StreamFillMode.Fit) {
      if (scaleWidth > scaleHeight) {
        width = (containerHeight / heightRatio.value) * widthRatio.value;
        height = containerHeight;
      }
      if (scaleWidth <= scaleHeight) {
        width = containerWidth;
        height = (containerWidth / widthRatio.value) * heightRatio.value;
      }
    } else {
      // Fill mode: ensure video fills container in at least one dimension without exceeding
      // Skip boundary check on mobile devices
      if (scaleWidth > scaleHeight) {
        width = containerWidth;
        height = (containerWidth / widthRatio.value) * heightRatio.value;
        // Check if height exceeds container (only on PC), if so, use container height as base
        if (!isMobile && height > containerHeight) {
          width = (containerHeight / heightRatio.value) * widthRatio.value;
          height = containerHeight;
        }
      }
      if (scaleWidth <= scaleHeight) {
        width = (containerHeight / heightRatio.value) * widthRatio.value;
        height = containerHeight;
        // Check if width exceeds container (only on PC), if so, use container width as base
        if (!isMobile && width > containerWidth) {
          width = containerWidth;
          height = (containerWidth / widthRatio.value) * heightRatio.value;
        }
      }
    }
  }

  originStreamViewStyle.value.width = width;
  originStreamViewStyle.value.height = height;
}

watch(
  () => aspectRatio.value,
  () => {
    handleStreamRegionSize();
  },
);

const getContainerOrientation = () => {
  if (!liveCoreViewContainerRef.value) {
    return;
  }
  const containerRect = liveCoreViewContainerRef.value.getBoundingClientRect();
  isPortraitContainer.value = containerRect.width < containerRect.height;
  liveCoreViewContainerSize.value = {
    width: containerRect.width,
    height: containerRect.height,
  };
};

// The `region` property in the item uses SCSS styling and does not have a fixed format.
const handleEmptySeatClick = (seatIndex: number, item: { userInfo: SeatUserInfo; region: object }) => {
  if (item.userInfo && item.userInfo.userId) {
    return;
  }
  if (isFullscreen.value) {
    exitFullscreen();
  }
  emit('empty-seat-click', seatIndex);
};

const handleBeforeUnload = async (event: Event) => {
  if (isLocalUserOnSeat.value) {
    event.preventDefault();
    // @ts-ignore - Compatible with older browser versions: https://developer.mozilla.org/zh-CN/docs/Web/API/Window/beforeunload_event
    event.returnValue = '';
    if (coHostStatus.value !== CoHostStatus.Connected && loginUserInfo.value?.userId !== currentLive.value?.liveOwner.userId) {
      await disConnect();
    }
  }
};

const ro = new ResizeObserver(() => {
  getContainerOrientation();
  handleStreamRegionSize();
  handleStreamListTransform();
});

onMounted(() => {
  ro.observe(liveCoreViewContainerRef.value as Element);
  setGiftPlayerView({
    view: SVGA_PLAYER_VIEW,
  });
  getContainerOrientation();
  window.addEventListener('beforeunload', handleBeforeUnload);
});

onBeforeUnmount(() => {
  ro.unobserve(liveCoreViewContainerRef.value as Element);
  window.removeEventListener('beforeunload', handleBeforeUnload);
});
</script>

<style scoped lang="scss">
.live-core-view-container {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  justify-content: center;
  overflow: hidden;
  background-color: var(--uikit-color-gray-1);

  &.align-center {
    align-items: center;
  }
  .live-core-placeholder {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    .placeholder-text {
      color: var(--text-color-secondary, rgba(255, 255, 255, 0.55));
      font-size: 14px;
      font-style: normal;
      font-weight: 400;
      line-height: 22px;
    }
  }

  .live-core-view {
    width: 100%;
    height: 100%;
    position: absolute;

    .stream-content {
      width: 100%;
      height: 100%;
      position: absolute;
      top: 0;
      left: 0;
      overflow: hidden;

      :deep(video) {
        // Solve the problem where the background color of the video tag is black and overflows under the bright color theme
        background: unset !important;
      }
    }

    .center-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
      // z-index must be between stream-content (auto) and PlayerControl (.pc-mode: 10)
      z-index: 5;

      // Allow child elements to receive pointer events
      > * {
        pointer-events: auto;
      }
    }

    .live-core-ui {
      width: 100%;
      height: 100%;
      z-index: 1;
      position: absolute;
      pointer-events: none;
      top: 0;
      left: 0;
    }
  }
  #svga-player-view {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 50vmin;
    height: 50vmin;
    transform: translate(-50%, -50%);
    pointer-events: none;
  }

  .entering-room-loading {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    z-index: 10;

    .entering-room-loading-icon {
      animation: live-loading-rotate 1.5s linear infinite;
      color: var(--text-color-secondary, rgba(255, 255, 255, 0.55));
    }
  }

  .voice-chat-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 32px;
    background: var(--uikit-color-gray-1);
    z-index: 10;

    .voice-chat-overlay-text {
      color: var(--text-color-primary);
      font-size: 16px;
      font-weight: 500;
      line-height: 24px;
    }
  }

  .anchor-away-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 32px;
    background: var(--uikit-color-gray-1);
    z-index: 10;

    .anchor-away-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }

    .anchor-away-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-color-primary);
    }

    .anchor-away-text {
      color: var(--text-color-secondary);
      text-align: center;
      font-size: 16px;
      font-weight: 500;
      line-height: 24px;
    }
  }

  .autoplay-prompt-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 11;
  }
}

@keyframes live-loading-rotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
