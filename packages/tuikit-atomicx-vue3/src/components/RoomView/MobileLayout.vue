<template>
  <div
    id="streamContainer"
    ref="streamListContainerRef"
    class="stream-container-mobile"
  >
    <TUISwiper
      :active-index="currentPageIndex"
      :autoplay="false"
      :loop="false"
      :navigation="{
        indicatorPosition: 'bottom',
        indicatorStyle: {
          margin: 116,
        },
      }"
      :height="'100%'"
      :current="currentPageIndex"
      @change="handlePageChange"
    >
      <TUISwiperItem v-if="enlargeStream" key="page-0">
        <div ref="firstPageContainerRef" class="swiper-page-content">
          <RoomParticipantView
            v-if="enlargeStream?.participant"
            v-touch-scale="enlargeStream.streamType === VideoStreamType.Screen"
            class="enlarge-stream"
            :participant="enlargeStream.participant"
            :stream-type="enlargeStream.streamType"
            :fill-mode="enlargeStream.streamType === VideoStreamType.Screen ? FillMode.Fit : FillMode.Fill"
            :lazyLoad="{ enable: getLazyLoadEnable(0), viewport: streamListContainerRef as HTMLDivElement }"
          >
            <template #participantViewUI>
              <slot name="participantViewUI" v-bind="enlargeStream" />
            </template>
          </RoomParticipantView>
          <RoomParticipantView
            v-if="floatStream?.participant"
            v-float-drag="floatDragOptions"
            class="float-stream"
            :participant="floatStream?.participant"
            :stream-type="floatStream?.streamType"
            :fill-mode="FillMode.Fill"
            :lazyLoad="{ enable: getLazyLoadEnable(0), viewport: streamListContainerRef as HTMLDivElement }"
          >
            <template #participantViewUI>
              <slot name="participantViewUI" v-bind="floatStream" />
            </template>
          </RoomParticipantView>
        </div>
      </TUISwiperItem>
      <TUISwiperItem
        v-for="(pageStreamList, pageIndex) in paginatedStreamList"
        :key="`page-${pageIndex + 1}`"
      >
        <div class="swiper-page-content next-page">
          <div
            :style="streamListContentStyle"
            class="stream-list-content"
          >
            <RoomParticipantView
              v-for="streamInfo in pageStreamList"
              :key="`${streamInfo.participant.userId}_${streamInfo.streamType}`"
              :style="streamItemStyle"
              class="participant-view"
              :participant="streamInfo.participant"
              :stream-type="streamInfo.streamType"
              :fill-mode="FillMode.Fill"
              :lazyLoad="{ enable: getLazyLoadEnable(enlargeStream ? pageIndex + 1 : pageIndex), viewport: streamListContainerRef as HTMLDivElement }"
            >
              <template #participantViewUI>
                <slot name="participantViewUI" v-bind="{ participant: streamInfo.participant, streamType: streamInfo.streamType }" />
              </template>
            </RoomParticipantView>
          </div>
        </div>
      </TUISwiperItem>
    </TUISwiper>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { TUISwiper, TUISwiperItem } from '@tencentcloud/uikit-base-component-vue3';
import vTouchScale from '../../directives/vTouchScale';
import { useRoomParticipantState } from '../../states/RoomParticipantState';
import { VideoStreamType, FillMode, DeviceStatus } from '../../types';
import { deepClone, throttle } from '../../utils/utils';
import { RoomParticipantView } from '../RoomParticipantView';
import { vFloatDrag } from './directives/floatDrag';
import { useRoomView } from './useRoomView';
import { useStreamItemDimensions } from './useStreamItemDimensions';

const { participantWithScreen, localParticipant, speakingUsers, participantList } = useRoomParticipantState();
const { sortedParticipantCameraList } = useRoomView();

const allParticipantStreamInfoList = computed(() => {
  const result = [];
  if (participantWithScreen.value) {
    result.push({ participant: participantWithScreen.value, streamType: VideoStreamType.Screen });
  }
  if (sortedParticipantCameraList.value.length > 0) {
    result.push(...sortedParticipantCameraList.value);
  }
  return result;
});

const speaker = ref<{ userId: string; volume: number } | null>(null);

function getSpeakerInfo(val: Map<string, number>) {
  const newSpeakingUsers = deepClone(val);
  if (localParticipant.value?.userId && speakingUsers.value.has(localParticipant.value.userId) && localParticipant.value.microphoneStatus === DeviceStatus.Off) {
    newSpeakingUsers.delete(localParticipant.value.userId);
  }
  const currentSpeakerVolume = speaker.value ? newSpeakingUsers.get(speaker.value.userId) : undefined;
  if (speaker.value && currentSpeakerVolume !== undefined && currentSpeakerVolume > 0) {
    speaker.value = { userId: speaker.value.userId, volume: currentSpeakerVolume };
  } else {
    const entries: [string, number][] = Array.from(newSpeakingUsers.entries());
    const sorted = entries.sort((a, b) => b[1] - a[1]);
    const loudestUser = sorted[0];
    if (loudestUser) {
      speaker.value = { userId: loudestUser[0], volume: loudestUser[1] };
    } else {
      speaker.value = null;
    }
  }
}

const getSpeakerInfoThrottled = throttle(getSpeakerInfo, 3000);

watch(speakingUsers, (newVal) => {
  getSpeakerInfoThrottled(newVal);
}, { deep: true });

const enlargeStream = computed(() => {
  if (participantWithScreen.value) {
    return { participant: participantWithScreen.value, streamType: VideoStreamType.Screen };
  }
  if (sortedParticipantCameraList.value.length === 1) {
    return sortedParticipantCameraList.value[0];
  }
  if (sortedParticipantCameraList.value.length <= 2) {
    const remoteParticipant = sortedParticipantCameraList.value.find(item => item.participant.userId !== localParticipant.value?.userId);
    return remoteParticipant;
  }
  return null;
});

const floatStream = computed(() => {
  if (enlargeStream.value?.streamType === VideoStreamType.Screen) {
    if (speaker.value?.userId) {
      return allParticipantStreamInfoList.value.find(item => item.participant.userId === speaker.value?.userId && item.streamType === VideoStreamType.Camera);
    }
    return { participant: localParticipant.value, streamType: VideoStreamType.Camera };
  }
  if (allParticipantStreamInfoList.value.length === 1) {
    return null;
  }
  if (allParticipantStreamInfoList.value.length === 2) {
    return allParticipantStreamInfoList.value.find(item => item.participant.userId !== enlargeStream.value?.participant.userId);
  }
  return null;
});

const firstPageContainerRef = ref<HTMLElement | null>(null);

const floatDragOptions = computed(() => ({
  container: firstPageContainerRef.value || undefined,
  initialPosition: {
    top: 20,
    right: 0,
  },
  enableEdgeSnap: true,
  snapAnimationDuration: 300,
}));

const maxColumn = 2;
const maxRow = 3;
const currentPageIndex = ref(0);
const maxCountEveryPage = computed(() => maxColumn * maxRow);

const totalPageNumber = computed(() =>
  Math.ceil(sortedParticipantCameraList.value.length / maxCountEveryPage.value),
);

function getLazyLoadEnable(pageIndex: number) {
  return !(Math.abs(pageIndex - currentPageIndex.value) <= 1);
}

const paginatedStreamList = computed(() => {
  if (allParticipantStreamInfoList.value.length <= 2) {
    return [];
  }
  const pages = [];
  for (let i = 0; i < totalPageNumber.value; i += 1) {
    const startIndex = i * maxCountEveryPage.value;
    const endIndex = Math.min(startIndex + maxCountEveryPage.value, sortedParticipantCameraList.value.length);
    pages.push(sortedParticipantCameraList.value.slice(startIndex, endIndex));
  }
  return pages;
});

const gridColumns = computed(() => {
  const count = participantList.value.length;
  return Math.min(count, maxColumn);
});

const gridRows = computed(() => {
  const count = participantList.value.length;
  if (count === 0) {
    return 0;
  }
  return Math.min(Math.ceil(count / gridColumns.value), maxRow);
});

const streamListContainerRef = ref<HTMLElement | null>(null);
const { itemStyle: streamItemStyle } = useStreamItemDimensions({
  containerRef: streamListContainerRef,
  columns: gridColumns,
  rows: gridRows,
  itemCount: computed(() => participantList.value?.length),
  gap: 8,
  aspectRatio: 1 / 1,
  padding: {
    left: 16,
    right: 16,
    top: 12,
    bottom: 12,
  },
  watchDependencies: [
    () => gridColumns.value,
    () => gridRows.value,
    () => participantList.value?.length,
  ],
});

const streamListContentStyle = ref({});
watch(() => streamItemStyle.value, (val) => {
  if (!val.width || !val.height) {
    return;
  }
  streamListContentStyle.value = {
    width: `${Math.ceil((parseInt(val.width, 10) * gridColumns.value) + (gridColumns.value - 1) * 8)}px`,
    height: `${Math.ceil((parseInt(val.height, 10) * gridRows.value) + (gridRows.value - 1) * 8)}px`,
  };
}, { immediate: true });

function handlePageChange(newIndex: number) {
  currentPageIndex.value = newIndex;
}

watch(
  () => allParticipantStreamInfoList.value.length,
  (val) => {
    let maxPageIndex = Math.ceil(val / maxCountEveryPage.value);
    if (!participantWithScreen.value) {
      maxPageIndex -= 1;
    }
    if (currentPageIndex.value > maxPageIndex && maxPageIndex >= 0) {
      currentPageIndex.value = maxPageIndex;
    }
  },
);
</script>

<style lang="scss" scoped>
* {
  box-sizing: border-box;
}

.stream-container-mobile {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.swiper-page-content {
  display: flex;
  place-content: center center;
  align-items: center;
  width: 100%;
  height: 100%;
  transform: translateZ(0);
  backface-visibility: hidden;
  &.next-page {
    padding: 16px 12px;
  }
}

.stream-list-content {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  place-content: flex-start flex-start;
  gap: 8px;

  > * {
    box-sizing: border-box;
    flex: 0 0 auto;
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.enlarge-stream {
  width: 100%;
  height: 100%;
  border-radius: 8px;

}

.float-stream {
  width: 96px;
  height: 170px;
  border-radius: 8px;
  z-index: 10;
  // Ensure touch events don't propagate to parent Swiper
  touch-action: none;
  pointer-events: auto;

  &.show-room-tool {
    top: 64px;
  }
}

.participant-view {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  position: relative;
  overflow: hidden;
  transform: translateZ(0);
  backface-visibility: hidden;
}
</style>
