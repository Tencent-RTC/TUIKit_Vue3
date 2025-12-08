<template>
  <div id="streamContainer" :class="streamContainerClass">
    <StreamRegion
      v-if="enlargeStream"
      class="enlarged-stream-container"
      :user-info="enlargeStream.userInfo"
      :stream-type="enlargeStream.streamType"
      :support-touch-scale="true"
      :stream-play-quality="StreamPlayQuality.HIGH"
      aspect-ratio="16:9"
      @stream-view-dblclick="$emit('stream-view-dblclick')"
    >
      <template #streamViewUI="slotProps">
        <slot name="streamViewUI" v-bind="slotProps" />
      </template>
    </StreamRegion>
    <div :class="['stream-list-container', `${showSideList ? '' : 'hide-list'}`]">
      <stream-list
        :streamInfoList="gridLayoutStreamList"
        :config="streamListConfig"
        :streamPlayMode="StreamPlayMode.PLAY_IN_VISIBLE"
        :streamPlayQuality="StreamPlayQuality.Default"
        aspect-ratio="16:9"
        @stream-view-dblclick="handleStreamViewDblclick"
      />
    </div>
    <arrow-stroke
      v-if="isSideListLayout && (showControlBar || showSideList)"
      :class="[`arrow-stroke-${arrowDirection}`]"
      :stroke-position="strokePosition"
      :arrow-direction="arrowDirection"
      :has-stroke="showSideList"
      @click-arrow="handleClickIcon"
    />
  </div>
</template>

<script setup lang="ts">
import type { Ref, ComputedRef } from 'vue';
import { ref, watch, computed } from 'vue';
import { TUIVideoStreamType } from '@tencentcloud/tuiroom-engine-js';
import { useRoomState } from '../../../states/RoomState';
import useUserState from '../../../states/UserState/index';
import { StreamPlayMode, StreamPlayQuality, DeviceStatus } from '../../../types';
import ArrowStroke from '../common/ArrowStroke.vue';
import StreamList from '../common/StreamList/index.vue';
import StreamRegion from '../common/StreamRegion';
import type { UserInfo } from '../../../types';

interface VideoStreamInfo {
  userInfo: UserInfo;
  streamType: TUIVideoStreamType;
}

enum LAYOUT {
  NINE_EQUAL_POINTS = 'nine_equal_points',
  RIGHT_SIDE_LIST = 'right_side_list',
  TOP_SIDE_LIST = 'top_side_list',
}

const { currentRoom } = useRoomState();
const { userList, userListOnSeat, userWithScreenOn, localUser, userListWithCameraOn } = useUserState();

const localCameraStreamInfo: ComputedRef<VideoStreamInfo | null> = computed(() => {
  if (localUser.value?.cameraStatus === DeviceStatus.On) {
    return {
      userInfo: localUser.value,
      streamType: TUIVideoStreamType.kCameraStream,
    };
  }
  return null;
});

const screenStreamInfo: ComputedRef<VideoStreamInfo | null> = computed(() => {
  if (userWithScreenOn.value) {
    return {
      userInfo: userWithScreenOn.value,
      streamType: TUIVideoStreamType.kScreenStream,
    };
  }
  return null;
});

const allStreamInfoList: ComputedRef<VideoStreamInfo[]> = computed(() => {
  let cameraStreamList = [];
  if (currentRoom.value?.isSeatEnabled) {
    cameraStreamList = userListOnSeat.value.map(user => ({
      userInfo: user,
      streamType: TUIVideoStreamType.kCameraStream,
    }));
  } else {
    cameraStreamList = userList.value.map(user => ({
      userInfo: user,
      streamType: TUIVideoStreamType.kCameraStream,
    }));
  }
  if (screenStreamInfo.value) {
    return [screenStreamInfo.value, ...cameraStreamList];
  }
  return cameraStreamList;
});

const renderStreamInfoList: ComputedRef<VideoStreamInfo[]> = computed(() => {
  if (props.filterFn) {
    return allStreamInfoList.value.filter(props.filterFn);
  }
  return allStreamInfoList.value;
});

const gridLayoutStreamList: ComputedRef<VideoStreamInfo[]> = computed(() => {
  if (currentLayout.value === LAYOUT.NINE_EQUAL_POINTS) {
    return renderStreamInfoList.value;
  }
  if (enlargeStream.value?.streamType === TUIVideoStreamType.kScreenStream || !userWithScreen.value) {
    return renderStreamInfoList.value.filter(stream => stream.streamType !== TUIVideoStreamType.kScreenStream);
  } if (screenStreamInfo.value) {
    return renderStreamInfoList.value;
  }

  return [];
});

interface Props {
  config?: string;
  filterFn?: (streamInfo: VideoStreamInfo, index: number) => boolean;
  sortFn?: (streamInfo: VideoStreamInfo, userInfoB: UserInfo) => number;
}

const props = withDefaults(defineProps<Props>(), {
  config: () => (JSON.stringify({
    showControlBar: true,
    preferLayout: LAYOUT.NINE_EQUAL_POINTS,
    gridLayout: {
      maxColumns: 3,
      maxRows: 3,
      rowSpacing: 8,
      columnSpacing: 8,
    },
    rightLayout: {
      maxColumns: 1,
      maxRows: 0,
    },
    topLayout: {
      maxColumns: 0,
      maxRows: 1,
    },
  })),
  filterFn: (streamInfo: VideoStreamInfo, index: number, list: UserInfo[]) => true,
  sortFn: (streamInfo: VideoStreamInfo, index: number, list: UserInfo[]) => 0,
});

const streamListConfig = computed(() => {
  if (currentLayout.value === LAYOUT.NINE_EQUAL_POINTS) {
    return JSON.stringify(JSON.parse(props.config).gridLayout);
  }
  if (currentLayout.value === LAYOUT.RIGHT_SIDE_LIST) {
    return JSON.stringify(JSON.parse(props.config).rightLayout);
  }
  if (currentLayout.value === LAYOUT.TOP_SIDE_LIST) {
    return JSON.stringify(JSON.parse(props.config).topLayout);
  }
  return JSON.stringify(JSON.parse(props.config).gridLayout);
});

const showControlBar = computed(() => JSON.parse(props.config)?.showControlBar);
const preferLayout = computed(() => JSON.parse(props.config)?.preferLayout);

const currentLayout = ref(preferLayout.value);

watch(preferLayout, (val) => {
  currentLayout.value = val;
});

const isSameStream = (
  stream1: VideoStreamInfo | null | undefined,
  stream2: VideoStreamInfo | null | undefined,
) => getStreamKey(stream1) === getStreamKey(stream2);

const getStreamKey = (stream: VideoStreamInfo | null | undefined) =>
  `${stream?.userInfo.userId}_${stream?.streamType}`;

// const streamInfoList = computed(() => {
//   if (enlargeStream.value?.streamType === TUIVideoStreamType.kScreenStream) {
//     return userListOnSeat.value;
//   }
//   return [userWithScreen.value, ...userListOnSeat.value];
// })

const isSideListLayout = computed(
  () =>
    [LAYOUT.RIGHT_SIDE_LIST, LAYOUT.TOP_SIDE_LIST].indexOf(currentLayout.value) >= 0,
);

const fixedStream: Ref<VideoStreamInfo | null> = ref(null);
const enlargeStream = computed(() => {
  if (!isSideListLayout.value) {
    return null;
  }
  if (fixedStream.value) {
    return fixedStream.value;
  }
  if (screenStreamInfo.value) {
    return screenStreamInfo.value;
  }
  if (userListWithCameraOn.value.length > 0) {
    return {
      userInfo: userListWithCameraOn.value[0],
      streamType: TUIVideoStreamType.kCameraStream,
    };
  }
  return localCameraStreamInfo.value;
});

watch(
  () => allStreamInfoList.value.length,
  (val) => {
    if (val === 1 && isSideListLayout.value) {
      currentLayout.value = LAYOUT.NINE_EQUAL_POINTS;
    }
  },
);

watch(
  () => screenStreamInfo.value?.userInfo.screenStatus === DeviceStatus.On,
  (val, oldVal) => {
    if (val && !oldVal) {
      fixedStream.value = null;
      if (!isSideListLayout.value) {
        currentLayout.value = LAYOUT.RIGHT_SIDE_LIST;
      }
    }
  },
);

watch(
  () => renderStreamInfoList.value.map((stream: VideoStreamInfo) => getStreamKey(stream)),
  (val, oldVal) => {
    if (fixedStream.value) {
      const fixedStreamKey = getStreamKey(fixedStream.value);
      if (!val.includes(fixedStreamKey) && oldVal.includes(fixedStreamKey)) {
        fixedStream.value = null;
      }
    }
  },
);

/**
 * Double-click to switch the stream to the zoom in section
 **/
function handleStreamViewDblclick(videoStreamInfo: VideoStreamInfo) {
  console.log('handleStreamViewDblclick', videoStreamInfo, isSideListLayout.value, renderStreamInfoList.value.length);
  if (!isSideListLayout.value && renderStreamInfoList.value.length > 1) {
    currentLayout.value = LAYOUT.RIGHT_SIDE_LIST;
  }
  fixedStream.value = videoStreamInfo;
}

/**
 * ----- The following processing stream layout ---------
 **/
const streamContainerClass = ref('stream-container-flatten');
async function handleLayout() {
  console.log('currentLayout', currentLayout.value);
  switch (currentLayout.value as any) {
    case LAYOUT.NINE_EQUAL_POINTS:
      streamContainerClass.value = 'stream-container-flatten';
      break;
    case LAYOUT.RIGHT_SIDE_LIST:
      streamContainerClass.value = 'stream-container-right';
      break;
    case LAYOUT.TOP_SIDE_LIST:
      streamContainerClass.value = 'stream-container-top';
      break;
    default:
      break;
  }
}

watch(
  currentLayout,
  () => {
    handleLayout();
  },
  { immediate: true },
);

const showSideList = ref(true);
const arrowDirection = computed(() => {
  let arrowDirection = 'right';
  if (currentLayout.value === LAYOUT.TOP_SIDE_LIST) {
    arrowDirection = showSideList.value ? 'up' : 'down';
  }
  if (currentLayout.value === LAYOUT.RIGHT_SIDE_LIST) {
    arrowDirection = showSideList.value ? 'right' : 'left';
  }
  return arrowDirection;
});
const strokePosition = computed(() => {
  let strokePosition = '';
  if (currentLayout.value === LAYOUT.TOP_SIDE_LIST) {
    strokePosition = 'bottom';
  }
  if (currentLayout.value === LAYOUT.RIGHT_SIDE_LIST) {
    strokePosition = 'left';
  }
  return strokePosition;
});
function handleClickIcon() {
  showSideList.value = !showSideList.value;
}
</script>

<style lang="scss" scoped>
.stream-container-flatten {
  width: 100%;
  height: 100%;
  padding: 25px 20px;
  overflow: hidden;

  .stream-list-container {
    width: 100%;
    height: 100%;
  }
}

.arrow-stroke-right {
  position: absolute;
  top: 0;
  right: 280px;
}

.arrow-stroke-left {
  position: absolute;
  top: 0;
  right: 12px;
}

.arrow-stroke-up {
  position: absolute;
  top: 175px;
  left: 0;
}

.arrow-stroke-down {
  position: absolute;
  top: 76px;
  left: 0;
}

.stream-container-top .single-stream:not(:first-child) {
  margin-left: 14px;
}

.stream-container-right .single-stream:not(:first-child) {
  margin-top: 14px;
}

.stream-container-top {
  position: relative;
  display: flex;
  flex-direction: column-reverse;
  width: 100%;
  height: 100%;
  overflow: hidden;

  .enlarged-stream-container {
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: center;
    min-width: 0;
    min-height: 0;
    padding: 25px 20px;
  }

  .stream-list-container {
    position: relative;
    width: 100%;
    height: 175px;
    padding: 20px 40px;

    &.hide-list {
      position: absolute;
      top: 0;
      left: 0;
      transform: translateY(-166px);
    }
  }
}

.stream-container-right {
  position: relative;
  display: flex;
  flex-wrap: nowrap;
  place-content: center space-between;
  width: 100%;
  height: 100%;
  overflow: hidden;

  .enlarged-stream-container {
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: center;
    width: calc(100% - 280px);
    height: calc(100%);
    padding: 25px 20px;
  }

  .stream-list-container {
    position: relative;
    width: 280px;
    height: 100%;
    padding: 20px;

    &.hide-list {
      position: absolute;
      top: 0;
      right: 0;
      width: 280px;
      transform: translateX(270px);
    }

    &::before {
      position: absolute;
      top: 10px;
      left: 0;
      width: 100%;
      height: 40px;
      content: '';
      opacity: 0.1;
    }
  }
}
</style>
