<template>
  <div
    ref="liveCoreViewContainerRef"
    class="live-core-view-container"
    :class="{ 'align-center': isAlignCenter }"
  >
    <div
      v-if="!$slots.localVideo && !isPlayedVideo"
      class="live-core-placeholder"
    >
      <span class="placeholder-text">{{ t('No video') }}</span>
    </div>
    <div
      class="live-core-view"
      :style="streamViewStyle"
    >
      <div
        id="atomicx-live-stream-content"
        class="stream-content"
      />
      <div
        v-if="needPlayStreamViewInfo.length > 0"
        class="live-core-ui"
      >
        <div
          v-for="(item, index) in needPlayStreamViewInfo"
          :key="`seat-${index}`"
          :style="item.region"
        >
          <slot
            name="streamViewUI"
            v-bind="{ userInfo: item.userInfo }"
          />
          <DefaultStreamViewUI
            v-if="!$slots.streamViewUI"
            :streamViewInfoList="needPlayStreamViewInfo"
            :userInfo="item.userInfo"
          />
        </div>
      </div>
      <slot
        v-if="$slots.localVideo && isMounted"
        name="localVideo"
        v-bind="{ style: localStreamViewInfo?.region }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, useSlots } from 'vue';
import type { ComputedRef } from 'vue';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useLiveSeatState } from '../../states/LiveSeatState';
import { useLiveState } from '../../states/LiveState';
import { useLoginState } from '../../states/LoginState';
import { getContentSize } from '../../utils/domOperation';
import DefaultStreamViewUI from './DefaultStreamViewUI.vue';
import type { SeatInfo, SeatUserInfo } from '../../types';

const { t } = useUIKit();
const { seatList, canvas, startPlayStream, stopPlayStream } = useLiveSeatState();
const { currentLive } = useLiveState();

const slots = useSlots();

const isInStreamMixerComp = computed(() => slots.localVideo);

const { loginUserInfo } = useLoginState();
const isPlayedVideo = ref(false);
const isMounted = ref(false);
const isAlignCenter = computed(() => {
  if (!isInStreamMixerComp.value && isPortraitContainer.value && widthRatio.value < heightRatio.value) {
    return false;
  }
  return true;
});

onMounted(async () => {
  isMounted.value = true;
  await startPlayStream({ view: 'atomicx-live-stream-content' });
  isPlayedVideo.value = true;
});

onBeforeUnmount(async () => {
  isMounted.value = false;
  await stopPlayStream();
  isPlayedVideo.value = false;
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
  return layoutList.map((item: any) => ({
    userId: item.userId,
    x: item.x / layoutCanvas.width,
    y: item.y / layoutCanvas.width,
    width: item.w / layoutCanvas.width,
    height: item.h === layoutCanvas.height ? -1 : item.h / layoutCanvas.width,
    zOrder: item.zOrder,
  }));
});

const streamViewSize = computed(() => {
  return {
    width: originStreamViewStyle.value.width * originStreamViewStyle.value.scale,
    height: originStreamViewStyle.value.height * originStreamViewStyle.value.scale,
  };
});

const seatListWithRealSize = computed(() => seatList.value.map((item: SeatInfo, index: number) => {
  const ratioLayout = ratioLayoutList.value[index];
  const isPortraitAndFill = isPortraitContainer.value && fillMode.value === StreamFillMode.Fill;
  const isSampleWithCanvas = seatList.value.length === 1 || (item.region?.w === canvas.value.width && item.region?.h === canvas.value.height);
  if (!isInStreamMixerComp.value && isPortraitAndFill && isSampleWithCanvas) {
    return {
      userInfo: item.userInfo as SeatUserInfo,
      region: {
        position: 'absolute' as const,
        left: '50%',
        top: '50%',
        width: `${liveCoreViewContainerSize.value.width}px`,
        height: `${liveCoreViewContainerSize.value.height}px`,
        transform: `translate(-50%, -50%)`,
        zIndex: Number(ratioLayout.zOrder) || 0,
      },
    }
  }
  return {
    userInfo: item.userInfo as SeatUserInfo,
    region: {
      position: 'absolute' as const,
      left: `${streamViewSize.value.width * ratioLayout.x}px`,
      top: `${streamViewSize.value.width * ratioLayout.y}px`,
      width: `${streamViewSize.value.width * ratioLayout.width}px`,
      height:
          ratioLayout.height === -1
            ? `${streamViewSize.value.height}px`
            : `${streamViewSize.value.width * ratioLayout.height}px`,
      zIndex: Number(ratioLayout.zOrder) || 0,
    },
  };
}));

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
  return {
    width: `${Math.floor(originStreamViewStyle.value.width) * originStreamViewStyle.value.scale}px`,
    height: `${Math.floor(originStreamViewStyle.value.height) * originStreamViewStyle.value.scale}px`,
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
});

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
      if (scaleWidth > scaleHeight) {
        width = containerWidth;
        height = (containerWidth / widthRatio.value) * heightRatio.value;
      }
      if (scaleWidth <= scaleHeight) {
        width = (containerHeight / heightRatio.value) * widthRatio.value;
        height = containerHeight;
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

const ro = new ResizeObserver(() => {
  getContainerOrientation();
  handleStreamRegionSize();
  handleStreamListTransform();
});

onMounted(() => {
  ro.observe(liveCoreViewContainerRef.value as Element);
  getContainerOrientation();
});

onBeforeUnmount(() => {
  ro.unobserve(liveCoreViewContainerRef.value as Element);
});
</script>

<style scoped lang="scss">
.live-core-view-container {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  overflow: hidden;
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
    }

    .live-core-ui {
      width: 100%;
      height: 100%;
      position: absolute;
      pointer-events: none;
      top: 0;
      left: 0;
    }
  }
}
</style>
