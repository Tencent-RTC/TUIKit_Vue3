<template>
  <div
    ref="liveContainerRef"
    v-show="props.liveInfo.orientation"
    class="live-monitor-container"
    :class="{ landscape: isLandscape }"
  >
    <div :id="viewId" class="live-monitor-view"></div>
    <div
      v-for="region in regionList"
      :key="region.userInfo.userId"
      class="live-tag-mask"
      :class="{ 'hide-tag': !isFullscreen }"
      :style="styleList[region.userInfo.userId]"
    >
      <div class="live-id live-tag">{{ `${t('RoomId')}: ${region.liveId}` }}</div>
      <div class="user-id live-tag">{{ `${t('UserId')}: ${region.userInfo.userId}` }}</div>
      <div v-show="isCrossRoomConnection" class="destroy-button live-tag" @click="handleForceClose">
        <IconEndLive />
        <span>{{ t('Force Close') }}</span>
      </div>
    </div>
    <div
      v-show="!isCrossRoomConnection && isFullscreen"
      class="non-cross-room-destroy-button destroy-button live-tag"
      @click="handleForceClose"
    >
      <IconEndLive />
      <span>{{ t('Force Close') }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, computed, ref, watch, onMounted, onUnmounted } from 'vue';
import { useUIKit, IconEndLive } from '@tencentcloud/uikit-base-component-vue3';
import { MonitorLiveInfo } from '../../types';
import { useLiveMonitorState } from '../../states/LiveMonitorState';
import { exitFullScreen } from '../../utils/utils';

interface Props {
  liveInfo: MonitorLiveInfo;
}

interface StyleList {
  [userId: string]: {
    left: string;
    top: string;
    width: string;
    height: string;
  };
}

const props = defineProps<Props>();
const { monitorLiveInfoList, closeRoom } = useLiveMonitorState();
const { t } = useUIKit();

const isFullscreen = ref(false);
const isCrossRoomConnection = ref(false);
const styleList = ref<StyleList>({});
const liveContainerRef = ref<HTMLDivElement>();

const viewId = computed(() => `live_monitor_view_${props.liveInfo.liveId}`);

const currentLiveInfo = computed(() =>
  monitorLiveInfoList.value.find(liveInfo => liveInfo.liveId === props.liveInfo.liveId)
);

const regionList = computed(() => currentLiveInfo.value?.regionList);

const isLandscape = computed(() => currentLiveInfo.value?.orientation === 'landscape');

const isSingleStream = computed(() => (regionList.value?.length ?? 0) === 1);

const handleForceClose = () => {
  closeRoom(props.liveInfo.liveId);
  if (isFullscreen.value) {
    exitFullScreen();
  }
};

const onFullscreenChange = () => {
  if (document.fullscreenElement) {
    isFullscreen.value = true;
  } else {
    isFullscreen.value = false;
  }
};

const updateStyleList = () => {
  if (!liveContainerRef.value || !regionList.value) return;

  const containerWidth = liveContainerRef.value.clientWidth;
  const containerHeight = liveContainerRef.value.clientHeight;

  const newStyleList: StyleList = {};

  regionList.value.forEach(region => {
    if (region.liveId !== props.liveInfo.liveId) {
      isCrossRoomConnection.value = true;
    }

    newStyleList[region.userInfo.userId] = {
      left: `${region.rect.x * containerWidth}px`,
      top: `${region.rect.y * containerHeight}px`,
      width: isSingleStream.value ? '100%' : `${region.rect.w * containerWidth}px`,
      height: isSingleStream.value ? '100%' : `${region.rect.h * containerHeight}px`,
    };
  });

  styleList.value = newStyleList;
};

onMounted(() => {
  addEventListener('fullscreenchange', onFullscreenChange);
});

onUnmounted(() => {
  removeEventListener('fullscreenchange', onFullscreenChange);
});

watch(regionList, updateStyleList, { immediate: true });
</script>

<style lang="scss" scoped>
.live-monitor-container {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  aspect-ratio: 9 / 16;
  width: auto;
  height: 100%;

  .live-monitor-view {
    width: 100%;
    height: 100%;
  }

  .live-tag-mask {
    position: absolute;

    .user-id {
      top: 44px;
    }
  }

  .non-cross-room-destroy-button {
    position: absolute;
    bottom: 10px;
    right: 10px;
  }

  .hide-tag {
    display: none;
  }

  .live-tag {
    position: absolute;
    top: 10px;
    left: 10px;
    color: #ffece5;
    font-size: 12px;
    font-weight: 500;
    background-color: #e57849;
    padding: 4px;
    border-radius: 4px;
  }

  .destroy-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 150px;
    left: unset;
    top: unset;
    right: 10px;
    font-weight: 500;
    font-size: 14px;
    cursor: pointer;
    color: #ffe7e5;
    background-color: #e54545;
    bottom: 10px;

    span {
      margin-left: 4px;
    }
  }
}

.landscape {
  aspect-ratio: 16 / 9;
  width: 100%;
  height: auto;
}
</style>
