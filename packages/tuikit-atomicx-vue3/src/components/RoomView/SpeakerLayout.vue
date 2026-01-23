<template>
  <div id="streamContainer" :class="streamContainerClass">
    <div
      v-if="enlargeStreamInfo?.participant"
      ref="enlargedStreamContainerRef"
      class="enlarged-stream-container"
    >
      <RoomParticipantView
        class="participant-view"
        :style="enlargedStreamStyle"
        :participant="enlargeStreamInfo.participant"
        :stream-type="enlargeStreamInfo.streamType"
        :fill-mode="FillMode.Fit"
        :lazy-load="{ enable: false }"
      >
        <template #participantViewUI>
          <slot name="participantViewUI" v-bind="{ participant: enlargeStreamInfo.participant, streamType: enlargeStreamInfo.streamType }" />
        </template>
      </RoomParticipantView>
    </div>
    <div :class="['stream-list-container', `${showSideList ? '' : 'hide-list'}`]">
      <div class="stream-list-content">
        <RoomParticipantView
          v-for="streamInfo in gridStreamInfoList"
          :key="`${streamInfo.participant.userId}_${streamInfo.streamType}`"
          class="participant-view"
          :participant="streamInfo.participant"
          :stream-type="streamInfo.streamType"
          :fill-mode="FillMode.Fit"
          @dblclick="handleStreamViewDblclick(streamInfo)"
        >
          <template #participantViewUI>
            <slot name="participantViewUI" v-bind="{ participant: streamInfo.participant, streamType: streamInfo.streamType }" />
          </template>
        </RoomParticipantView>
      </div>
    </div>
    <arrow-stroke
      v-if="showToolbar || showSideList"
      :class="[`arrow-stroke-${arrowDirection}`]"
      :stroke-position="strokePosition"
      :arrow-direction="arrowDirection"
      :has-stroke="showSideList"
      @click-arrow="handleClickIcon"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, inject, onUnmounted } from 'vue';
import type { Ref } from 'vue';
import { useRoomParticipantState } from '../../states/RoomParticipantState';
import { VideoStreamType, FillMode, RoomLayoutTemplate, RoomParticipantEvent } from '../../types';
import { RoomParticipantView } from '../RoomParticipantView';
import ArrowStroke from './ArrowStroke.vue';
import { useRoomView } from './useRoomView';
import { useStreamItemDimensions } from './useStreamItemDimensions';
import type { RoomParticipant, RoomUser } from '../../types';

const { sortedParticipantCameraList } = useRoomView();
const { subscribeEvent, unsubscribeEvent } = useRoomParticipantState();

const {
  localParticipant,
  participantListWithVideo,
  participantWithScreen,
} = useRoomParticipantState();

interface Props {
  layoutTemplate: RoomLayoutTemplate;
}

const showToolbar = inject<Ref<boolean>>('showToolbar');

const props = defineProps<Props>();
const emits = defineEmits(['stream-double-click']);

const primaryStreamInfo = ref<{ participant: RoomParticipant; streamType: VideoStreamType } | null>(null);

const enlargeStreamInfo = computed(() => {
  if (primaryStreamInfo.value) {
    return primaryStreamInfo.value;
  }
  if (participantWithScreen.value) {
    return { participant: participantWithScreen.value, streamType: VideoStreamType.Screen };
  }
  if (participantListWithVideo.value.length > 0) {
    return {
      participant: participantListWithVideo.value[0],
      streamType: VideoStreamType.Camera,
    };
  }
  return { participant: localParticipant.value, streamType: VideoStreamType.Camera };
});

function isSameStream(stream1: { participant: RoomParticipant; streamType: VideoStreamType }, stream2: { participant: RoomParticipant; streamType: VideoStreamType }) {
  return stream1.participant.userId === stream2.participant.userId && stream1.streamType === stream2.streamType;
}

const gridStreamInfoList = computed(() => {
  const result = [];
  if (participantWithScreen.value) {
    if (enlargeStreamInfo.value && !isSameStream({ participant: participantWithScreen.value, streamType: VideoStreamType.Screen }, enlargeStreamInfo.value)) {
      result.push({ participant: participantWithScreen.value, streamType: VideoStreamType.Screen });
    } else if (!enlargeStreamInfo.value) {
      result.push({ participant: participantWithScreen.value, streamType: VideoStreamType.Screen });
    }
  }
  if (sortedParticipantCameraList.value.length > 0) {
    result.push(...sortedParticipantCameraList.value);
  }
  return result;
});

function handleStreamViewDblclick(streamInfo: { participant: RoomParticipant; streamType: VideoStreamType }) {
  primaryStreamInfo.value = streamInfo;
  emits('stream-double-click', streamInfo);
}

const streamContainerClass = ref('stream-container-flatten');
async function handleLayout() {
  switch (props.layoutTemplate) {
    case RoomLayoutTemplate.SidebarLayout:
      streamContainerClass.value = 'stream-container-right';
      break;
    case RoomLayoutTemplate.CinemaLayout:
      streamContainerClass.value = 'stream-container-top';
      break;
    default:
      break;
  }
}

watch(
  () => props.layoutTemplate,
  () => {
    handleLayout();
  },
  { immediate: true },
);

const showSideList = ref(true);
const arrowDirection = computed(() => {
  let arrowDirectionValue = 'right';
  if (props.layoutTemplate === RoomLayoutTemplate.CinemaLayout) {
    arrowDirectionValue = showSideList.value ? 'up' : 'down';
  }
  if (props.layoutTemplate === RoomLayoutTemplate.SidebarLayout) {
    arrowDirectionValue = showSideList.value ? 'right' : 'left';
  }
  return arrowDirectionValue;
});
const strokePosition = computed(() => {
  let strokePositionValue = '';
  if (props.layoutTemplate === RoomLayoutTemplate.CinemaLayout) {
    strokePositionValue = 'bottom';
  }
  if (props.layoutTemplate === RoomLayoutTemplate.SidebarLayout) {
    strokePositionValue = 'left';
  }
  return strokePositionValue;
});
function handleClickIcon() {
  showSideList.value = !showSideList.value;
}

const enlargedStreamContainerRef = ref<HTMLElement | null>(null);

const { itemStyle: enlargedStreamStyle } = useStreamItemDimensions({
  containerRef: enlargedStreamContainerRef,
  columns: 1,
  rows: 1,
  itemCount: computed(() => (enlargeStreamInfo.value?.participant ? 1 : 0)),
  gap: 0,
  aspectRatio: 16 / 9,
  watchDependencies: [
    () => props.layoutTemplate,
  ],
});

function handleParticipantLeft({ userInfo }: { userInfo: RoomUser }) {
  if (userInfo.userId === primaryStreamInfo.value?.participant?.userId) {
    primaryStreamInfo.value = null;
  }
}

watch(participantWithScreen, (val, oldVal) => {
  if (!primaryStreamInfo.value) {
    return;
  }
  const { streamType, participant } = primaryStreamInfo.value;
  if (!val && streamType === VideoStreamType.Screen && participant.userId === oldVal?.userId) {
    primaryStreamInfo.value = null;
  }
  if (val && streamType !== VideoStreamType.Screen) {
    primaryStreamInfo.value = null;
  }
}, { immediate: true });

subscribeEvent(RoomParticipantEvent.onParticipantLeft, handleParticipantLeft);
onUnmounted(() => {
  unsubscribeEvent(RoomParticipantEvent.onParticipantLeft, handleParticipantLeft);
});

</script>

<style lang="scss" scoped>
* {
  box-sizing: border-box;
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
    box-sizing: border-box;
    padding: 20px;
    overflow: hidden;

    .enlarged-stream-wrapper {
      position: relative;

      > * {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
      }
    }
  }

  .stream-list-container {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    height: 175px;
    padding: 20px 40px;

    .stream-list-content {
      display: flex;
      max-width: 100%;
      max-height: 100%;
      overflow-x: scroll;
      scrollbar-width: none;
      -ms-overflow-style: none;
      gap: 8px;

      &::-webkit-scrollbar {
        display: none;
      }
    }

    &::-webkit-scrollbar {
      height: 4px;
    }

    &::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.3);
      border-radius: 2px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

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
    overflow: hidden;

    .enlarged-stream-wrapper {
      position: relative;
      > * {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
      }
    }
  }

  .stream-list-container {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 280px;
    box-sizing: border-box;
    height: 100%;
    padding: 20px;
    overflow-x: hidden;
    overflow-y: auto;

    .stream-list-content {
      max-width: 100%;
      max-height: 100%;
      padding: 10px 0;
      overflow-y: scroll;
      scrollbar-width: none;
      -ms-overflow-style: none;
      display: flex;
      flex-wrap: wrap;
      place-content: flex-start flex-start;
      gap: 8px;
    }

    &::-webkit-scrollbar {
      width: 4px;
    }

    &::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.3);
      border-radius: 2px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

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

.participant-view {
  position: relative;
  flex-shrink: 0;
  width: 240px;
  height: 135px;
  border-radius: 12px;
  position: relative;
  overflow: hidden;
}
</style>
