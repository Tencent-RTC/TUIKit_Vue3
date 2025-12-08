<template>
  <div
    id="streamContainer"
    ref="streamListContainerRef"
    class="stream-container-grid"
  >
    <div
      :style="streamListContentStyle"
      class="stream-list-content"
    >
      <RoomParticipantView
        v-for="streamInfo in currentPageStreamInfoList"
        :key="`${streamInfo.participant.userId}_${streamInfo.streamType}`"
        :style="streamItemStyle"
        class="participant-view"
        :participant="streamInfo.participant"
        :stream-type="streamInfo.streamType"
        :fill-mode="FillMode.Fill"
        @dblclick="handleStreamViewDblclick(streamInfo)"
      >
        <template #participantViewUI>
          <slot name="participantViewUI" v-bind="{ participant: streamInfo.participant, streamType: streamInfo.streamType }" />
        </template>
      </RoomParticipantView>
    </div>
    <div v-if="showToolbar && showTurnPageControl" class="turn-page-container">
      <div
        v-show="showTurnPageLeftArrow"
        class="turn-page-arrow-container left-container"
        @click="handleTurnPageLeft"
      >
        <IconArrowStrokeTurnPage size="20" />
      </div>
      <div
        v-show="showTurnPageRightArrow"
        class="turn-page-arrow-container right-container"
        @click="handleTurnPageRight"
      >
        <IconArrowStrokeTurnPage class="turn-page-right" size="20" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject, watch } from 'vue';
import type { Ref } from 'vue';
import { IconArrowStrokeTurnPage } from '@tencentcloud/uikit-base-component-vue3';
import { useRoomParticipantState } from '../../states/RoomParticipantState';
import { VideoStreamType, FillMode } from '../../types';
import { RoomParticipantView } from '../RoomParticipantView';
import { useRoomView } from './useRoomView';
import { useStreamItemDimensions } from './useStreamItemDimensions';
import type { RoomParticipant } from '../../types';

const emit = defineEmits(['stream-double-click']);

const showToolbar = inject<Ref<boolean>>('showToolbar');

const { participantWithScreen } = useRoomParticipantState();
const { participantCameraList } = useRoomView();

const maxColumn = 3;
const maxRow = 3;
const currentPageIndex = ref(0);
const maxCountEveryPage = computed(() => maxColumn * maxRow);

function handleStreamViewDblclick(streamInfo: { participant: RoomParticipant; streamType: VideoStreamType }) {
  emit('stream-double-click', streamInfo);
}

const gridStreamInfoList = computed(() => {
  const result = [];
  if (participantWithScreen.value) {
    result.push({ participant: participantWithScreen.value, streamType: VideoStreamType.Screen });
  }
  if (participantCameraList.value.length > 0) {
    result.push(...participantCameraList.value);
  }
  return result;
});

const totalPageNumber = computed(() =>
  Math.ceil(gridStreamInfoList.value.length / maxCountEveryPage.value),
);

const currentPageStreamInfoList = computed(() => gridStreamInfoList.value.slice(currentPageIndex.value * maxCountEveryPage.value, (currentPageIndex.value + 1) * maxCountEveryPage.value));

const gridColumns = computed(() => {
  const count = gridStreamInfoList.value.length;
  return Math.min(Math.ceil(Math.sqrt(count)), maxColumn);
});

const gridRows = computed(() => {
  const count = gridStreamInfoList.value.length;
  return Math.min(Math.ceil(count / gridColumns.value), maxRow);
});

const streamListContainerRef = ref<HTMLElement | null>(null);
const { itemStyle: streamItemStyle } = useStreamItemDimensions({
  containerRef: streamListContainerRef,
  columns: gridColumns,
  rows: gridRows,
  itemCount: computed(() => currentPageStreamInfoList.value.length),
  gap: 8,
  aspectRatio: 16 / 9,
  watchDependencies: [
    () => gridColumns.value,
    () => gridRows.value,
    () => currentPageStreamInfoList.value.length,
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

watch(
  () => gridStreamInfoList.value.length,
  (val) => {
    if (
      currentPageIndex.value > 0
      && currentPageIndex.value > Math.ceil(val / maxCountEveryPage.value) - 1
    ) {
      currentPageIndex.value = Math.ceil(val / maxCountEveryPage.value) - 1;
    }
  },
);

const showTurnPageControl = computed(
  () => totalPageNumber.value > 1,
);
const showTurnPageLeftArrow = computed(
  () => currentPageIndex.value > 0,
);
const showTurnPageRightArrow = computed(
  () => currentPageIndex.value < totalPageNumber.value - 1,
);

function handleTurnPageLeft() {
  currentPageIndex.value -= 1;
}

function handleTurnPageRight() {
  currentPageIndex.value += 1;
}
</script>

<style lang="scss" scoped>
* {
  box-sizing: border-box;
}

.stream-container-grid {
  display: flex;
  place-content: center center;
  align-items: center;
  width: 100%;
  height: 100%;
  overflow: hidden;
  padding: 25px 20px;

  .stream-list-content {
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
}

.participant-view {
  width: 100%;
  height: 100%;
  border-radius: 12px;
  position: relative;
  overflow: hidden;
}

.turn-page-container {
  position: absolute;
  top: 50%;
  left: 0;
  display: flex;
  justify-content: space-between;
  width: 100%;
  height: 60px;
  transform: translateY(-50%);

  .turn-page-arrow-container {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 60px;
    color: var(--uikit-color-white-1);
    cursor: pointer;
    border-radius: 32px;
    background-color: var(--bg-color-element-mask, rgba(0, 0, 0, 0.25));

    &:hover {
      background-color: var(--bg-color-mask, rgba(0, 0, 0, 0.55));
    }
  }

  .left-container {
    position: absolute;
    left: 34px;
  }

  .right-container {
    position: absolute;
    right: 34px;
  }

  .turn-page-right {
    transform: rotateY(180deg);
  }
}
</style>
