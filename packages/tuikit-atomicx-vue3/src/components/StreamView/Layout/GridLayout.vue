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
      <StreamRegion
        v-for="renderUserInfo in renderUserInfoList"
        class="stream-list-item"
        :key="`${renderUserInfo.userInfo.userId}_${renderUserInfo.streamType}`"
        :userInfo="renderUserInfo.userInfo"
        :stream-type="renderUserInfo.streamType"
        :style="streamStyle"
        @stream-view-dblclick="handleStreamDblClick"
      >
        <template #streamViewUI="slotProps">
          <slot name="streamViewUI" v-bind="slotProps" />
        </template>
      </StreamRegion>
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
import StreamRegion from '../common/StreamRegion';
import { getContentSize } from '../../../utils/domOperation';
import { UserInfo, LocalRoomStatus } from '../../../types';
import useUserState from '../../../states/UserState/index';
import { TUIVideoStreamType } from '@tencentcloud/tuiroom-engine-js';
import { safelyParse } from '../../../utils/utils';
import { useRoomState } from '../../../states/RoomState';
import { useDeviceState } from '../../../states/DeviceState';
import useLoginState from '../../../states/LoginState';
import { getNewUserInfo } from '../../../states/UserState/store';

const { userList, userListOnSeat, userWithScreenOn } = useUserState();
const { microphoneStatus, cameraStatus } = useDeviceState();
const { currentRoom, localRoomStatus } = useRoomState();
const { loginUserInfo } = useLoginState();


const emits = defineEmits(['stream-view-dblclick']);

interface Props {
  config?: string;
  filterFn?: (userInfo: UserInfo, index: number) => boolean;
  sortFn?: (userInfoA: UserInfo, userInfoB: UserInfo) => number;
}

const props = withDefaults(defineProps<Props>(), {
  config: () => (JSON.stringify({
    maxRows: 3,
    maxColumns: 3,
    rowSpacing: 8,
    columnSpacing: 8,
  })),
  filterFn: () => true,
  sortFn: () => 0
});

const gridConfig = computed(() => {
  return safelyParse(props.config) || {
    maxRows: 3,
    maxColumns: 3,
    rowSpacing: 8,
    columnSpacing: 8,
  };
});

const localFakeUser = computed(() => {
  const localUser = getNewUserInfo(loginUserInfo.value?.userId || 'local_fake_user');
  localUser.cameraStatus = cameraStatus.value;
  localUser.microphoneStatus = microphoneStatus.value;
  return localUser;
})

const totalUserList = computed(() => {
  if (!currentRoom.value && localRoomStatus.value === LocalRoomStatus.IDLE) {
    return [localFakeUser.value]
  }
  return currentRoom.value?.isSeatEnabled ? userListOnSeat.value : userList.value;
});

const renderUserInfoList: ComputedRef<({ userInfo: UserInfo, streamType: TUIVideoStreamType })[]> = computed(() => {
  const videoUserList = totalUserList.value.filter(props.filterFn).map(item => {
    return {
      userInfo: item,
      streamType: TUIVideoStreamType.kCameraStream
    }
  });
  if (userWithScreenOn.value && [userWithScreenOn.value].filter(props.filterFn).length > 0) {
    videoUserList.unshift({
      userInfo: userWithScreenOn.value,
      streamType: TUIVideoStreamType.kScreenStream
    });
  }
  return videoUserList;
});

const column = computed(() => {
  if (gridConfig.value.maxColumns === Infinity) {
    return gridConfig.value.maxColumns;
  }
  return Math.min(
    Math.ceil(Math.sqrt(renderUserInfoList.value.length)),
    gridConfig.value.maxColumns
  );
});
const row = computed(() => {
  if (gridConfig.value.maxRows === Infinity) {
    return gridConfig.value.maxRows;
  }
  return Math.min(
    Math.ceil(renderUserInfoList.value.length / column.value),
    gridConfig.value.maxRows
  );
});

const streamListContainerRef = ref();
const streamListRef = ref();

const isEqualPointsLayout = computed(
  () => gridConfig.value.maxRows !== Infinity && gridConfig.value.maxColumns !== Infinity
);
const isHorizontalInfinityLayout = computed(() => gridConfig.value.maxColumns === Infinity);
const isVerticalInfinityLayout = computed(() => gridConfig.value.maxRows === Infinity);

watch(
  () => [column.value, row.value],
  async () => {
    await nextTick();
    handleLayout();
  },
  { immediate: true }
);

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

const aspectRatio = '16:9';

const widthRatio: ComputedRef<number> = computed(() => {
  if (!aspectRatio || aspectRatio?.indexOf(':') < 0) {
    return 0;
  }
  return Number(aspectRatio?.split(':')[0]);
});
const heightRatio: ComputedRef<number> = computed(() => {
  if (!aspectRatio || aspectRatio.indexOf(':') < 0) {
    return 0;
  }
  return Number(aspectRatio.split(':')[1]);
});
/**
 * Handle nine-pattern layout
 **/
async function handleEqualPointsLayout() {
  if (!streamListContainerRef.value) {
    return;
  }
  const containerRect = streamListContainerRef.value.getBoundingClientRect();
  const containerWidth = Math.floor(containerRect.width);
  const containerHeight = Math.floor(containerRect.height);
  // Subtract the margin size of a single video stream to ensure that the ratio of width and height is 16:9
  const contentWidth =
    (containerWidth - (column.value - 1) * gridConfig.value.columnSpacing) / column.value;
  const contentHeight =
    (containerHeight - (row.value - 1) * gridConfig.value.rowSpacing) / row.value;

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

  streamListStyle.value.width = `${Math.ceil(column.value * width + (column.value - 1) * gridConfig.value.columnSpacing)}px`;
  streamListStyle.value.height = `${Math.ceil(row.value * height + (row.value - 1) * gridConfig.value.rowSpacing)}px`;
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

function handleStreamDblClick(userInfo: UserInfo, streamType: TUIVideoStreamType) {
  emits('stream-view-dblclick', userInfo, streamType);
}

const resizeObserver = new ResizeObserver(() => {
  handleLayout();
});

onMounted(() => {
  resizeObserver.observe(streamListContainerRef.value);
});

onBeforeUnmount(() => {
  resizeObserver.unobserve(streamListContainerRef.value);
});

// Handle top layout horizontal sliding
function handleWheel(event: WheelEvent) {
  streamListContainerRef.value.scrollLeft += event.deltaY;
}

// todo: 处理混流逻辑
// function handleMixStream() {
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
../../../states/DeviceState
../../../states/LoginState
../../../states/RoomState
