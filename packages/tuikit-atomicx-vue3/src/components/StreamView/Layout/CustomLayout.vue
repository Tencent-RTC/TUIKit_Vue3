<template>
  <div class="custom-layout-container" ref="streamListContainerRef">
    <div class="stream-list" ref="streamListRef" :style="streamListStyle">
      <StreamRegion
        v-for="(renderUserInfo, index) in renderUserInfoList"
        class="stream-list-item"
        :key="`${renderUserInfo.userInfo.userId}_${renderUserInfo.streamType}`"
        :userInfo="renderUserInfo.userInfo"
        :stream-type="renderUserInfo.streamType"
        :style="getStreamStyle(index)"
        aspect-ratio="auto"
        @stream-view-dblclick="handleStreamDblClick"
      >
        <template #streamViewUI="slotProps">
          <slot name="streamViewUI" v-bind="slotProps"></slot>
        </template>
      </StreamRegion>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, ref, computed, onMounted, onBeforeUnmount, defineEmits, watch, withDefaults } from 'vue';
import type { Ref, ComputedRef } from 'vue';
import StreamRegion from '../common/StreamRegion';
import { UserInfo } from '../../../types';
import useUserState from '../../../states/UserState/index';
import { TUIVideoStreamType } from '@tencentcloud/tuiroom-engine-js';
import { useRoomState } from '../../../states/RoomState';
import useLoginState from '../../../states/LoginState';
import useLiveState from '../../../states/LiveState';

const { userList, localUser, userListOnSeat } = useUserState();
const { currentRoom } = useRoomState();
const { currentLive } = useLiveState();
const { loginUserInfo } = useLoginState();

const emits = defineEmits(['stream-view-dblclick']);

interface Props {
  config?: string;
  filterFn?: (userInfo: UserInfo, index: number) => boolean;
  sortFn?: (userInfoA: UserInfo, userInfoB: UserInfo) => number;
}

const props = withDefaults(defineProps<Props>(), {
  config: () =>
    JSON.stringify({
      layoutList: [],
    }),
  filterFn: () => true,
  sortFn: () => 0,
});

// const localFakeUser = computed(() => {
//   const localUser = getNewUserInfo(loginUserInfo.value?.userId || 'local_fake_user');
//   localUser.cameraStatus = cameraStatus.value;
//   localUser.microphoneStatus = microphoneStatus.value;
//   return localUser;
// })

// todo: 这里可能存在主播创建房间后，短暂时间里主播不在麦上的问题
const totalUserList = computed(() => {
  // if (!currentRoom.value && localRoomStatus.value === LocalRoomStatus.IDLE) {
  //   return [localFakeUser.value]
  // }
  if (currentRoom.value) {
    return currentRoom.value?.isSeatEnabled ? userListOnSeat.value : userList.value;
  }
  if (currentLive.value) {
    if (currentLive.value.isSeatEnabled) {
      if (userListOnSeat.value.length > 0) {
        return userListOnSeat.value;
      }
      if (currentLive.value.liveOwner.userId === loginUserInfo.value?.userId) {
        return [localUser.value];
      }
    } else {
      return userList.value;
    }
    return [];
  }
  return userList.value;
});

const renderUserInfoList: ComputedRef<{ userInfo: UserInfo; streamType: TUIVideoStreamType }[]> = computed(() => {
  // const videoUserList = userList.value.filter(props.filterFn).map(item => {
  //   return {
  //     userInfo: item,
  //     streamType: TUIVideoStreamType.kCameraStream
  //   }
  // });
  // if (userWithScreen.value && [userWithScreen.value].filter(props.filterFn).length > 0) {
  //   videoUserList.unshift({
  //     userInfo: userWithScreen.value,
  //     streamType: TUIVideoStreamType.kScreenStream
  //   });
  // }
  // return videoUserList;

  if (!totalUserList.value || totalUserList.value.length === 0) return [];

  return totalUserList.value
    ?.filter(props.filterFn)
    .sort(props.sortFn)
    .map(item => {
      return {
        userInfo: item,
        streamType: TUIVideoStreamType.kCameraStream,
      };
    });
});

const streamListContainerRef = ref();
const streamListRef = ref();

// ------------ 处理 layout 布局 START ------------

const aspectRatio = computed(() => {
  return '16:9';
});

// Single video stream window margin size
// 根据 streamView 的父亲元素 A 大小获取一个流布局的容器 B，容器 B 符合 aspectRatio 比例
// 根据传入的 props.config.layoutList，以流布局容器 B 为画布大小，计算出来所有可视区域 C 的大小和可视区域 C 的中心点坐标
// 根据可视区域的 C 大小和 A 大小比例，计算出容器 B 的 scale。根据 C 的中心点坐标和 B 的中心点坐标，计算出容器 B 的 transformX、transformY（要保证 C 的中心点在 streamView 父元素 B 的中心点）
// 根据容器 B 的 scale 和 transformX、transformY，计算出容器 B 的实际宽度、高度、transformX、transformY（这里不使用 scale 是为了不影响子元素中 text, img 的大小）
// 根据容器 B 的实际大小，计算每一个子元素的实际位置和大小

const originStreamListStyle: Ref<Record<string, any>> = ref({
  width: 0,
  height: 0,
  transformX: 0,
  transformY: 0,
  scale: 1,
});

const streamListStyle = computed(() => {
  return {
    width: `${originStreamListStyle.value.width * originStreamListStyle.value.scale}px`,
    height: `${originStreamListStyle.value.height * originStreamListStyle.value.scale}px`,
    transform: `translate(${originStreamListStyle.value.transformX * originStreamListStyle.value.scale}px, ${
      originStreamListStyle.value.transformY * originStreamListStyle.value.scale
    }px)`,
  };
});

const customConfig = computed(() => {
  const { layoutList } = JSON.parse(props.config);
  if (!layoutList) return [];
  const absoluteLayoutList = layoutList.map(item => {
    if (item.width > 1 || item.height > 1) {
      return {
        left: stringToNumber(originStreamListStyle.value.width) * (item.x / 720),
        top: stringToNumber(originStreamListStyle.value.width) * (item.y / 720),
        width: stringToNumber(originStreamListStyle.value.width) * (item.width / 720),
        height: stringToNumber(originStreamListStyle.value.height) * (item.height / 1280),
        zIndex: item.zOrder,
        backgroundColor: item.backgroundColor,
      };
    }
    return {
      left: stringToNumber(originStreamListStyle.value.width) * item.x,
      top: stringToNumber(originStreamListStyle.value.width) * item.y,
      width: stringToNumber(originStreamListStyle.value.width) * item.width,
      height:
        item.height === -1
          ? stringToNumber(originStreamListStyle.value.height)
          : stringToNumber(originStreamListStyle.value.width) * item.height,
      zIndex: item.zOrder,
      backgroundColor: item.backgroundColor,
    };
  });
  return absoluteLayoutList;
});

const streamContainerSize = computed(() => {
  const minX = Math.min(...customConfig.value.map(item => item.left));
  const minY = Math.min(...customConfig.value.map(item => item.top));
  const maxX = Math.max(...customConfig.value.map(item => item.left + item.width));
  const maxY = Math.max(...customConfig.value.map(item => item.top + item.height));
  return {
    width: maxX - minX,
    height: maxY - minY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
  };
});

watch(streamContainerSize, () => {
  handleStreamListTransform();
});

function handleStreamListTransform() {
  const containerRect = streamListContainerRef.value.getBoundingClientRect();
  const containerWidth = Math.floor(containerRect.width);
  const containerHeight = Math.floor(containerRect.height);

  const scaleWidth = containerWidth / streamContainerSize.value.width;
  const scaleHeight = containerHeight / streamContainerSize.value.height;
  originStreamListStyle.value.scale = Math.min(scaleWidth, scaleHeight);

  originStreamListStyle.value.transformX =
    stringToNumber(originStreamListStyle.value.width) / 2 - streamContainerSize.value.centerX;
  originStreamListStyle.value.transformY =
    stringToNumber(originStreamListStyle.value.height) / 2 - streamContainerSize.value.centerY;
}

const widthRatio: ComputedRef<number> = computed(() => {
  if (!aspectRatio.value || aspectRatio.value?.indexOf(':') < 0) {
    return 0;
  }
  return Number(aspectRatio.value?.split(':')[0]);
});
const heightRatio: ComputedRef<number> = computed(() => {
  if (!aspectRatio.value || aspectRatio.value.indexOf(':') < 0) {
    return 0;
  }
  return Number(aspectRatio.value.split(':')[1]);
});

async function handleLayout() {
  if (!streamListContainerRef.value) {
    return;
  }
  const containerRect = streamListContainerRef.value.getBoundingClientRect();
  const containerWidth = Math.floor(containerRect.width);
  const containerHeight = Math.floor(containerRect.height);

  let width = containerWidth;
  let height = containerHeight;
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
  originStreamListStyle.value.width = Math.floor(width);
  originStreamListStyle.value.height = Math.floor(height);
}

function stringToNumber(str: string) {
  if (typeof str !== 'string') {
    return str;
  }
  return Number(str.replace('px', ''));
}

function getStreamStyle(index: number) {
  const streamLayoutConfig = JSON.parse(props.config).layoutList[index];
  if (!streamLayoutConfig) return;
  // Todo: 暂时兼容绝对值和百分比，后续需要统一
  if (streamLayoutConfig?.width > 1) {
    return {
      left: `${stringToNumber(streamListStyle.value.width) * (streamLayoutConfig.x / 720)}px`,
      top: `${stringToNumber(streamListStyle.value.width) * (streamLayoutConfig.y / 720)}px`,
      width: `${stringToNumber(streamListStyle.value.width) * (streamLayoutConfig.width / 720)}px`,
      height: `${stringToNumber(streamListStyle.value.height) * (streamLayoutConfig.height / 1280)}px`,
      zIndex: streamLayoutConfig.zOrder,
      backgroundColor: streamLayoutConfig.backgroundColor,
    };
  }
  return {
    left: `${stringToNumber(streamListStyle.value.width) * streamLayoutConfig.x}px`,
    top: `${stringToNumber(streamListStyle.value.width) * streamLayoutConfig.y}px`,
    width: `${stringToNumber(streamListStyle.value.width) * streamLayoutConfig.width}px`,
    height:
      streamLayoutConfig.height === -1
        ? `${stringToNumber(streamListStyle.value.height)}px`
        : `${stringToNumber(streamListStyle.value.width) * streamLayoutConfig.height}px`,
    zIndex: streamLayoutConfig.zOrder,
    backgroundColor: streamLayoutConfig.backgroundColor,
  };
}

watch(
  () => currentLive.value?.layoutTemplate,
  () => {
    handleLayout();
  }
);

const resizeObserver = new ResizeObserver(() => {
  handleLayout();
  handleStreamListTransform();
});

onMounted(() => {
  resizeObserver.observe(streamListContainerRef.value);
});

onBeforeUnmount(() => {
  resizeObserver.unobserve(streamListContainerRef.value);
});

// ------------ 处理 layout 布局 FINISH ------------

function handleStreamDblClick(userInfo: UserInfo, streamType: TUIVideoStreamType) {
  emits('stream-view-dblclick', userInfo, streamType);
}

// todo: 处理混流逻辑
// function handleMixStream() {
</script>

<style lang="scss" scoped>
.custom-layout-container {
  display: flex;
  place-content: center center;
  align-items: center;
  width: 100%;
  height: 100%;

  .stream-list {
    position: relative;
    display: flex;
    flex-wrap: wrap;
    place-content: space-between space-between;

    .stream-list-item {
      position: absolute;
    }
  }
}
</style>
