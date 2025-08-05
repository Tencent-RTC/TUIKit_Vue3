<template>
  <div
    ref="streamListContainerRef"
    :class="{
      'horizontal-infinity-layout': isHorizontalInfinityLayout,
      'vertical-infinity-layout': isVerticalInfinityLayout,
      'equal-points-layout': isEqualPointsLayout,
    }"
  >
    <div
      class="stream-list"
      ref="streamListRef"
      :style="streamListStyle"
      @wheel="handleWheel"
    >
      <stream-region
        v-for="streamInfo in validStreamInfoList"
        class="stream-list-item"
        :key="`${streamInfo.userInfo.userId}_${streamInfo.streamType}`"
        :user-info="streamInfo.userInfo"
        :stream-type="streamInfo.streamType"
        :streamInfo="streamInfo"
        :style="streamStyle"
        :streamPlayMode="streamPlayMode"
        :streamPlayQuality="streamPlayQuality"
        @stream-view-dblclick="handleStreamDblClick"
      >
        <template #streamViewUI="slotProps">
          <slot name="streamViewUI" v-bind="slotProps" />
        </template>
      </stream-region>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  defineProps,
  ref,
  watch,
  computed,
  onMounted,
  onBeforeUnmount,
  defineEmits,
  nextTick,
} from 'vue';
import type { Ref, ComputedRef } from 'vue';
import StreamRegion from '../StreamRegion';
import {
  StreamPlayMode,
  StreamPlayQuality,
} from '../../../../services/manager/mediaManager';
import { getContentSize } from '../../../../utils/domOperation';
import { isUndefined } from '../../../../utils/utils';
import { UserInfo, TUIVideoStreamType } from '../../../../types';

const emits = defineEmits(['stream-view-dblclick']);

interface VideoStreamInfo {
  userInfo: UserInfo;
  streamType: TUIVideoStreamType;
}

interface Props {
  streamInfoList: VideoStreamInfo[];
  config?: string;
  fillMode?: 'fill' | 'contain';
  aspectRatio?: string;
  streamPlayQuality?: StreamPlayQuality;
  streamPlayMode?: StreamPlayMode;
}

const props = withDefaults(defineProps<Props>(), {
  config: () => (JSON.stringify({
    maxRows: 3,
    maxColumns: 3,
    rowSpacing: 8,
    columnSpacing: 8,
  })),
});
const streamListContainerRef = ref();
const streamListRef = ref();

const streamListConfig = computed(() => {
  const parsedConfig = JSON.parse(props.config);
  return {
    maxRows: isUndefined(parsedConfig.maxRows) ? 3 : parsedConfig.maxRows,
    maxColumns: isUndefined(parsedConfig.maxColumns) ? 3 : parsedConfig.maxColumns,
    rowSpacing: isUndefined(parsedConfig.rowSpacing) ? 8 : parsedConfig.rowSpacing,
    columnSpacing: isUndefined(parsedConfig.columnSpacing) ? 8: parsedConfig.columnSpacing,
  }
});

const isEqualPointsLayout = computed(
  () => streamListConfig.value.maxColumns !== 0 && streamListConfig.value.maxRows !== 0
);
const isHorizontalInfinityLayout = computed(() => streamListConfig.value.maxColumns === 0);
const isVerticalInfinityLayout = computed(() => streamListConfig.value.maxRows === 0);

const validStreamInfoList = computed(() => {
  return props.streamInfoList?.filter(
    item => item && item.userInfo.userId && !isUndefined(item.streamType)
  );
});

function handleLayout() {
  if (isHorizontalInfinityLayout.value) {
    handleHorizontalInfinityLayout();
    return;
  }
  if (isVerticalInfinityLayout.value) {
    handleVerticalInfinityLayout();
    return;
  }
  if (isEqualPointsLayout.value) {
    handleEqualPointsLayout();
    return;
  }
}

// Single video stream window margin size
const streamListStyle: Ref<Record<string, any>> = ref({
  width: '0',
  height: '0',
});
const streamStyle: Ref<Record<string, any>> = ref({
  width: '0',
  height: '0',
});

const widthRatio: ComputedRef<number> = computed(() => {
  if (!props.aspectRatio || props.aspectRatio?.indexOf(':') < 0) {
    return 0;
  }
  return Number(props.aspectRatio?.split(':')[0]);
});
const heightRatio: ComputedRef<number> = computed(() => {
  if (!props.aspectRatio || props.aspectRatio.indexOf(':') < 0) {
    return 0;
  }
  return Number(props.aspectRatio.split(':')[1]);
});
/**
 * Handle nine-pattern layout
 **/
 const column = computed(() => {
  if (streamListConfig.value.maxColumns === Infinity) {
    return streamListConfig.value.maxColumns;
  }
  return Math.min(
    Math.ceil(Math.sqrt(props.streamInfoList.length)),
    streamListConfig.value.maxColumns
  );
});
const row = computed(() => {
  if (streamListConfig.value.maxRows === Infinity) {
    return streamListConfig.value.maxRows;
  }
  return Math.min(
    Math.ceil(props.streamInfoList.length / column.value),
    streamListConfig.value.maxRows
  );
});

watch(
  () => [column.value, row.value],
  async () => {
    await nextTick();
    handleLayout();
  },
  { immediate: true }
);

 async function handleEqualPointsLayout() {
  if (!streamListContainerRef.value) {
    return;
  }

  const containerRect = streamListContainerRef.value.getBoundingClientRect();
  const containerWidth = Math.floor(containerRect.width);
  const containerHeight = Math.floor(containerRect.height);
  // Subtract the margin size of a single video stream to ensure that the ratio of width and height is 16:9
  const contentWidth =
    (containerWidth - (column.value - 1) * streamListConfig.value.columnSpacing) / column.value;
  const contentHeight =
    (containerHeight - (row.value - 1) * streamListConfig.value.rowSpacing) / row.value;

  let width = contentWidth;
  let height = contentHeight;
  if (widthRatio.value && heightRatio.value) {
    const scaleWidth = contentWidth / widthRatio.value;
    const scaleHeight = contentHeight / heightRatio.value;
    if (scaleWidth > scaleHeight) {
      width = Math.floor((contentHeight / heightRatio.value) * widthRatio.value);
      height = Math.floor(contentHeight);
    }
    if (scaleWidth <= scaleHeight) {
      width = Math.floor(contentWidth);
      height = Math.floor((contentWidth / widthRatio.value) * heightRatio.value);
    }
  }
  streamStyle.value.width = `${width}px`;
  streamStyle.value.height = `${height}px`;

  streamListStyle.value.width = `${Math.ceil(column.value * width + (column.value - 1) * streamListConfig.value.columnSpacing)}px`;
  streamListStyle.value.height = `${Math.ceil(row.value * height + (row.value - 1) * streamListConfig.value.rowSpacing)}px`;
}

// Handles an unlimited number of streams horizontally
function handleHorizontalInfinityLayout() {
  streamListStyle.value = {};

  const contentHeight = getContentSize(streamListContainerRef.value).height;
  const contentWidth = (contentHeight * widthRatio.value) / heightRatio.value;
  streamStyle.value.width = `${contentWidth}px`;
  streamStyle.value.height = `${contentHeight}px`;
}

// Handles an infinite number of streams in the vertical direction
function handleVerticalInfinityLayout() {
  streamListStyle.value = {};

  const contentWidth = getContentSize(streamListContainerRef.value).width;
  const contentHeight = (contentWidth * heightRatio.value) / widthRatio.value;
  streamStyle.value.width = `${contentWidth}px`;
  streamStyle.value.height = `${contentHeight}px`;
}

function handleStreamDblClick(streamInfo: VideoStreamInfo) {
  emits('stream-view-dblclick', streamInfo);
}

const resizeObserver = new ResizeObserver(() => {
  handleLayout();
});

onMounted(() => {
  handleLayout();
  resizeObserver.observe(streamListContainerRef.value);
});

onBeforeUnmount(() => {
  resizeObserver.unobserve(streamListContainerRef.value);
});

// Handle top layout horizontal sliding
function handleWheel(event: WheelEvent) {
  streamListContainerRef.value.scrollLeft += event.deltaY;
}
</script>

<style lang="scss" scoped>
.equal-points-layout {
  display: flex;
  place-content: center center;
  align-items: center;
  width: 100%;
  height: 100%;

  .stream-list {
    display: flex;
    flex-wrap: wrap;
    place-content: space-between space-between;

    .stream-list-item {
      margin: var(--stream-margin);
    }
  }
}

.horizontal-infinity-layout {
  display: flex;
  justify-content: center;
  width: 100%;
  height: 100%;

  .stream-list {
    display: flex;
    max-width: 100%;
    max-height: 100%;
    overflow-x: scroll;
    scrollbar-width: none;
    -ms-overflow-style: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  .stream-list-item {
    &:not(:first-child) {
      margin-left: 14px;
    }
  }
}

.vertical-infinity-layout {
  display: flex;
  align-items: center;
  width: 100%;
  height: 100%;

  .stream-list {
    max-width: 100%;
    max-height: 100%;
    padding: 10px 0;
    overflow-y: scroll;
    scrollbar-width: none;
    -ms-overflow-style: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  .stream-list-item {
    &:not(:first-child) {
      margin-top: 14px;
    }
  }
}
</style>
