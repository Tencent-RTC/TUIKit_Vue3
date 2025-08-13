<template>
  <div class="live-stream-view-container" ref="liveStreamViewContainerRef">
    <div class="live-stream-view" :style="streamViewStyle">
      <div class="live-stream-placeholder" v-if="!$slots.localVideo && seatList.length === 0">
        <span class="placeholder-text">{{ t('No video') }}</span>
      </div>
      <div id="stream-content" class="stream-content"></div>
      <div class="live-stream-ui" v-if="needPlayStreamViewInfo.length > 0">
        <div v-for="(item, index) in needPlayStreamViewInfo" :key="`seat-${index}`" :style="item.region">
          <slot name="streamViewUI" v-bind="{ userInfo: item.userInfo }"></slot>
          <DefaultStreamViewUI :streamViewInfoList="needPlayStreamViewInfo" v-if="!$slots.streamViewUI" :userInfo="item.userInfo" />
        </div>
      </div>
      <slot
        name="localVideo"
        v-if="$slots.localVideo && isMounted"
        v-bind="{ style: localStreamViewInfo?.region }"
      ></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, ComputedRef, watch, onMounted, onBeforeUnmount, useSlots } from 'vue';
import DefaultStreamViewUI from './DefaultStreamViewUI.vue';
import { getContentSize } from '../../utils/domOperation';
import { useLiveSeatState } from '../../states/LiveSeatState';
import { useLoginState } from '../../states/LoginState';
import { useLiveState } from '../../states/LiveState';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { SeatUserInfo } from '../../types';

const { t } = useUIKit();
const { seatList, canvas, startPlayStream, stopPlayStream } = useLiveSeatState();
const { currentLive } = useLiveState();

const slots = useSlots();

const ignoreLocalVideoPlay = computed(() => slots.localVideo);

const { loginUserInfo } = useLoginState();
const isMounted = ref(false);

onMounted(() => {
  isMounted.value = true;
  startPlayStream({ view: 'stream-content' });
});

onBeforeUnmount(() => {
  isMounted.value = false;
  stopPlayStream();
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

const seatListWithRealSize = computed(() => {
  return seatList.value.map((item, index) => {
    const ratioLayout = ratioLayoutList.value[index];
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
  });
});

const localStreamViewInfo = computed(() => {
  return seatListWithRealSize.value.find(item => item?.userInfo?.userId === loginUserInfo.value?.userId);
});

const needPlayStreamViewInfo = computed(() => {
  if (ignoreLocalVideoPlay.value) {
    return seatListWithRealSize.value.filter(item => item.userInfo?.userId !== loginUserInfo.value?.userId);
  }
  return seatListWithRealSize.value;
});

// ----- 处理布局 -----
// 根据 streamView 的父亲元素 A 大小获取一个流布局的容器 B，容器 B 符合 aspectRatio 比例
// 根据传入的 props.config.layoutList，以流布局容器 B 为画布大小，计算出来所有可视区域 C 的大小和可视区域 C 的中心点坐标
// 根据可视区域的 C 大小和 A 大小比例，计算出容器 B 的 scale。根据 C 的中心点坐标和 B 的中心点坐标，计算出容器 B 的 transformX、transformY（要保证 C 的中心点在 streamView 父元素 B 的中心点）
// 根据容器 B 的 scale 和 transformX、transformY，计算出容器 B 的实际宽度、高度、transformX、transformY（这里不使用 scale 是为了不影响子元素中 text, img 的大小）
// 根据容器 B 的实际大小，计算每一个子元素的实际位置和大小
const liveStreamViewContainerRef = ref<HTMLDivElement>();
const originStreamViewStyle = ref({
  width: 0,
  height: 0,
  transformX: 0,
  transformY: 0,
  scale: 1,
});

const visualStreamSize = computed(() => {
  if (ratioLayoutList.value.length === 0) {
    return {
      width: 0,
      height: 0,
      centerX: 0,
      centerY: 0,
    };
  }
  const absoluteLayoutList = ratioLayoutList.value.map(item => {
    return {
      userId: item.userId,
      left: originStreamViewStyle.value.width * item.x,
      top: originStreamViewStyle.value.width * item.y,
      width: originStreamViewStyle.value.width * item.width,
      height: item.height === -1 ? originStreamViewStyle.value.height : originStreamViewStyle.value.width * item.height,
      zIndex: item.zOrder,
    };
  });
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
});

watch(visualStreamSize, () => {
  handleStreamListTransform();
});

function handleStreamListTransform() {
  if (!liveStreamViewContainerRef.value) {
    return;
  }
  const containerRect = liveStreamViewContainerRef.value.getBoundingClientRect();
  const containerWidth = Math.floor(containerRect.width);
  const containerHeight = Math.floor(containerRect.height);

  if (visualStreamSize.value.width && visualStreamSize.value.height) {
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

const streamViewSize = computed(() => {
  if (isPortraitContainer.value) {
    return {
      width: originStreamViewStyle.value.width,
      height: originStreamViewStyle.value.height,
    };
  }
  return {
    width: originStreamViewStyle.value.width * originStreamViewStyle.value.scale,
    height: originStreamViewStyle.value.height * originStreamViewStyle.value.scale,
  };
});

const streamViewStyle = computed(() => {
  if (isPortraitContainer.value) {
    return {
      width: `${Math.floor(originStreamViewStyle.value.width)}px`,
      height: `${Math.floor(originStreamViewStyle.value.height)}px`,
    };
  }
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

function handleStreamRegionSize() {
  if (!liveStreamViewContainerRef.value) {
    return;
  }
  const containerWidth = getContentSize(liveStreamViewContainerRef.value).width;
  const containerHeight = getContentSize(liveStreamViewContainerRef.value).height;
  let width = containerWidth;
  let height = containerHeight;
  if (widthRatio.value && heightRatio.value) {
    const scaleWidth = containerWidth / widthRatio.value;
    const scaleHeight = containerHeight / heightRatio.value;
    if (scaleWidth > scaleHeight) {
      width = (containerHeight / heightRatio.value) * widthRatio.value;
      height = containerHeight;
    }
    if (scaleWidth <= scaleHeight) {
      width = containerWidth;
      height = (containerWidth / widthRatio.value) * heightRatio.value;
    }
  }
  originStreamViewStyle.value.width = width;
  originStreamViewStyle.value.height = height;
}

watch(
  () => aspectRatio.value,
  () => {
    handleStreamRegionSize();
  }
);

const isPortraitContainer = ref(true);

const getContainerOrientation = () => {
  if (!liveStreamViewContainerRef.value) {
    return;
  }
  const containerRect = liveStreamViewContainerRef.value.getBoundingClientRect();
  isPortraitContainer.value = containerRect.width < containerRect.height;
};

const ro = new ResizeObserver(() => {
  getContainerOrientation();
  handleStreamRegionSize();
  handleStreamListTransform();
});

onMounted(() => {
  ro.observe(liveStreamViewContainerRef.value as Element);
  getContainerOrientation();
});

onBeforeUnmount(() => {
  ro.unobserve(liveStreamViewContainerRef.value as Element);
});
</script>

<style scoped lang="scss">
.live-stream-view-container {
  width: 100%;
  height: 100%;
  display: flex;
  overflow: hidden;
  align-items: center;
  justify-content: center;

  .live-stream-view {
    width: 100%;
    height: 100%;
    position: relative;

    .live-stream-placeholder {
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

    .stream-content {
      width: 100%;
      height: 100%;
      position: absolute;
      top: 0;
      left: 0;
    }

    .live-stream-ui {
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
