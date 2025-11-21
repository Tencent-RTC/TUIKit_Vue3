<template>
  <div ref="streamListContainerRef" class="float-layout-container">
    <div
      ref="streamListRef"
      class="float-layout"
      :style="streamListStyle"
    >
      <div class="main-view">
        <stream-region :user-info="mainUserInfo" :stream-type="mainStreamType">
          <template #streamViewUI="slotProps">
            <slot name="streamViewUI" v-bind="slotProps" />
          </template>
        </stream-region>
      </div>
      <div
        v-if="floatUserInfo"
        class="float-view"
        :style="getFloatStyle()"
      >
        <stream-region :user-info="floatUserInfo" :stream-type="TUIVideoStreamType.kCameraStream">
          <template #streamViewUI="slotProps">
            <slot name="streamViewUI" v-bind="slotProps" />
          </template>
        </stream-region>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Ref } from 'vue';
import { computed, watch, ref, onMounted, onBeforeUnmount } from 'vue';
import { TUIVideoStreamType } from '@tencentcloud/tuiroom-engine-js';
import useRoomEngine from '../../../hooks/useRoomEngine';
import { useLiveListState } from '../../../states/LiveListState';
import useUserState from '../../../states/UserState/index';
import { DeviceStatus, SeatStatus } from '../../../types';
import StreamRegion from '../common/StreamRegion';
import type { UserInfo } from '../../../types';

const { userList, localUser, userListWithVideo } = useUserState();
const { currentLive, localLiveStatus } = useLiveListState();
const roomEngine = useRoomEngine();

// 定义props
const props = withDefaults(defineProps<{
  config?: string;
  filterFn?: (userInfo: UserInfo, index: number) => boolean;
  sortFn?: (userInfoA: UserInfo, userInfoB: UserInfo) => number;
}>(), {
  config: () => (JSON.stringify({
    top: '20px',
    right: '20px',
    width: '160px',
    height: '160px',
  })),
  filterFn: () => true,
  sortFn: () => 0,
});

const streamListContainerRef = ref();
const streamListRef = ref();
const streamListStyle: Ref<Record<string, any>> = ref({
  width: '0',
  height: '0',
});

function stringToNumber(str: string) {
  return Number(str.replace('px', ''));
}

const encodeWidth = 1920;
const encodeHeight = 1080;

const toLayoutRadio = computed(() => stringToNumber(streamListStyle.value.width) / encodeWidth);

async function handleFloatContainerLayout() {
  if (!streamListContainerRef.value) {
    return;
  }
  const containerRect = streamListContainerRef.value.getBoundingClientRect();
  const containerWidth = Math.floor(containerRect.width);
  const containerHeight = Math.floor(containerRect.height);

  const widthRatio = 16;
  const heightRatio = 9;

  let width = containerWidth;
  let height = containerHeight;
  const scaleWidth = containerWidth / widthRatio;
  const scaleHeight = containerHeight / heightRatio;
  if (scaleWidth > scaleHeight) {
    width = (containerHeight / heightRatio) * widthRatio;
    height = containerHeight;
  }
  if (scaleWidth <= scaleHeight) {
    width = containerWidth;
    height = (containerWidth / widthRatio) * heightRatio;
  }
  streamListStyle.value.width = `${Math.floor(width)}px`;
  streamListStyle.value.height = `${Math.floor(height)}px`;
}

const resizeObserver = new ResizeObserver(() => {
  handleFloatContainerLayout();
});

onMounted(() => {
  streamListContainerRef.value && resizeObserver.observe(streamListContainerRef.value);
});

onBeforeUnmount(() => {
  streamListContainerRef.value && resizeObserver.unobserve(streamListContainerRef.value);
});

const filterAndSortUserList = computed(() => {
  const filteredUserList = userListWithVideo.value.filter(props.filterFn);
  if (props.sortFn) {
    return filteredUserList.sort(props.sortFn);
  }
  return filteredUserList;
});

const mainUserInfo = computed(() => {
  const hasScreenUserInfo = filterAndSortUserList.value.find(userInfo => userInfo.screenStatus === DeviceStatus.On);
  if (hasScreenUserInfo) {
    return hasScreenUserInfo;
  }
  return filterAndSortUserList.value[0];
});

const mainStreamType = computed(() => mainUserInfo.value.screenStatus === DeviceStatus.On ? TUIVideoStreamType.kScreenStream : TUIVideoStreamType.kCameraStream);

const floatUserInfo = computed(() => {
  if (mainStreamType.value === TUIVideoStreamType.kScreenStream) {
    return filterAndSortUserList.value.find(userInfo => userInfo.cameraStatus === DeviceStatus.On);
  }
  return filterAndSortUserList.value.find(userInfo => userInfo.cameraStatus === DeviceStatus.On && userInfo.userId !== mainUserInfo.value?.userId);
});

if (localUser.value?.userId === currentLive.value?.liveOwner.userId) {
  const floatLayoutConfig = computed(() => {
    if (!floatUserInfo.value || floatUserInfo.value.cameraStatus !== DeviceStatus.On) {
      return null;
    }
    return {
      LocationX: 1540, // 以画面左上角为原点的 x 坐标
      LocationY: 20, // 以画面左上角为原点的 y 坐标
      ImageWidth: 360, // 调整后的画面宽度
      ImageHeight: 202, // 调整后的画面高度
      ZOrder: 1, // 画面层级
      StreamType: TUIVideoStreamType.kCameraStream, // 0 摄像头, 1 屏幕共享, 2 白板, 3 自定义
      Member_Account: floatUserInfo.value?.userId, // 该路流的用户ID
      BackgroundImageUrl: '',
      RoomId: currentLive.value?.liveId,
      BackgroundColor: '0x1F212C',
    };
  });

  const layoutConfig = computed(() =>
    // const userOnSeatListConfig = userListOnSeat.value.map(user => {
    //   return {
    //     "LocationX": 0,                   // 以画面左上角为原点的 x 坐标
    //     "LocationY": 0,                  // 以画面左上角为原点的 y 坐标
    //     "ImageWidth": 0,               // 调整后的画面宽度
    //     "ImageHeight": 0,               // 调整后的画面高度
    //     "ZOrder": 0,                      // 画面层级
    //     "StreamType": TUIVideoStreamType.kCameraStream,                  // 0 摄像头, 1 屏幕共享, 2 白板, 3 自定义
    //     "Member_Account": user.userId,     // 该路流的用户ID
    //     "RoomId": user.roomId,
    //   }
    // });
    ({
      // 设置画布大小
      VideoEncode: {
        Width: encodeWidth,
        Height: encodeHeight,
      },
      LayoutMode: 1000, // 0~9 内置布局模板， 1000自定义布局， 只有1000时候才能修改LayoutInfo,目前只支持 0 和 1000
      // 设置画面布局
      LayoutInfo: {
        LayoutList: floatLayoutConfig.value ? [floatLayoutConfig.value] : [],
        MaxUserLayout: {
          ZOrder: 0, // 层级
          StreamType: mainStreamType.value, // 0为摄像头， 1为屏幕共享
          Member_Account: mainUserInfo.value.userId,
          BackgroundImageUrl: '', // 可以设置看看，可能在最大画面时候没作用
          RoomId: currentLive.value?.liveId,
          BackgroundColor: '0x1F212C',
          LocationX: 0, // 以画面左上角为原点的 x 坐标
          LocationY: 0, // 以画面左上角为原点的 y 坐标
          ImageWidth: encodeWidth, // 调整后的画面宽度
          ImageHeight: encodeHeight,
          RenderMode: mainStreamType.value === TUIVideoStreamType.kScreenStream ? 2 : 0,
        },
      },
    }),
  );

  // watch(() => layoutConfig.value, async (newVal, oldVal) => {
  //   console.error('lixin-debug mix watch layoutConfig change 111', JSON.stringify(newVal), JSON.stringify(oldVal));
  //   if (localLiveStatus.value !== LiveStatus.Live || JSON.stringify(newVal) === JSON.stringify(oldVal)) {
  //     return;
  //   }
  //   const liveLayoutManager = roomEngine.instance?.getLiveLayoutManager();
  //   console.error('lixin-debug mix setLiveStreamLayoutInfo 111', newVal);
  //   await liveLayoutManager?.setLiveStreamLayoutInfo(currentLive.value?.liveId as string, JSON.stringify(newVal));
  // }, { immediate: true, deep: true });

  // watch(() => [localLiveStatus.value, localUser.value?.seatStatus], async ([newlocalLiveStatus, newSeatStatus], [oldlocalLiveStatus, oldSeatStatus]) => {
  //   console.error('lixin-debug mix localLiveStatus 222', newlocalLiveStatus, oldlocalLiveStatus, newSeatStatus, oldSeatStatus);
  //   if (newlocalLiveStatus === oldlocalLiveStatus && newSeatStatus === oldSeatStatus) {
  //     return;
  //   }
  //   if (newlocalLiveStatus === LiveStatus.Live && newSeatStatus === SeatStatus.On && localUser.value.userId === currentLive.value?.liveOwner.userId) {
  //     setTimeout( async () => {
  //       const liveLayoutManager = roomEngine.instance?.getLiveLayoutManager();
  //       console.error('lixin-debug mix setLiveStreamLayoutInfo 222', layoutConfig.value);
  //       await liveLayoutManager?.setLiveStreamLayoutInfo(currentLive.value?.liveId as string, JSON.stringify(layoutConfig.value));
  //     }, 1000)
  //   }
  // })

  // todo1: 摄像头和屏幕分享同时关闭的时候，应该如何处理
  // todo2: 观众上麦之后需要混观众的音频流
}

const getFloatStyle = () => {
  const { top, right, bottom, left, width, height } = JSON.parse(props.config);

  return {
    width: `${stringToNumber(width) * toLayoutRadio.value}px`,
    height: `${stringToNumber(height) * toLayoutRadio.value}px`,
    ...(top !== undefined ? { top: `${stringToNumber(top) * toLayoutRadio.value}px` } : {}),
    ...(right !== undefined ? { right: `${stringToNumber(right) * toLayoutRadio.value}px` } : {}),
    ...(bottom !== undefined ? { bottom: `${stringToNumber(bottom) * toLayoutRadio.value}px` } : {}),
    ...(left !== undefined ? { left: `${stringToNumber(left) * toLayoutRadio.value}px` } : {}),
  };
};

</script>

<style scoped lang="scss">
.float-layout-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  .float-layout {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    .main-view {
      width: 100%;
      height: 100%;
      border-radius: 8px;
      overflow: hidden;
    }
    .float-view {
      position: absolute;
      border-radius: 8px;
      overflow: hidden;
      z-index: 10;
      transition: all 0.3s ease;
    }
  }
}

.float-view:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  transform: scale(1.02);
}

.stream-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: #e0e0e0;
}

.empty-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #e0e0e0;
  color: #666;
  font-size: 16px;
}

.user-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background-color: #2196f3;
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 24px;
  margin-bottom: 12px;
}

.stream-info {
  text-align: center;
}

.user-name {
  font-weight: bold;
  margin-bottom: 4px;
  display: block;
}

.stream-status {
  font-size: 12px;
  color: #666;
  background-color: rgba(255, 255, 255, 0.7);
  padding: 2px 6px;
  border-radius: 4px;
}

/* 小窗口中的样式 */
.stream-info-mini {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  padding: 4px;
  text-align: center;
}

.user-name-mini {
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
../../../states/LiveListState
