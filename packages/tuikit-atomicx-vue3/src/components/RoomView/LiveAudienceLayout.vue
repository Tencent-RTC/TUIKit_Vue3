<template>
  <div ref="liveAudienceLayoutContainerRef" class="live-audience-layout-container">
    <div :style="streamItemStyle" class="live-audience-layout-content">
      <div
        id="live-audience-stream"
        class="live-audience-stream-content"
      />
      <slot
        name="participantViewUI"
        v-bind="{ participant: currentVideoParticipant, streamType: VideoStreamType.Camera }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import { useRoomParticipantState } from '../../states/RoomParticipantState';
import { VideoStreamType } from '../../types';
import { usePlayStream } from './usePlayStream';
import { useStreamItemDimensions } from './useStreamItemDimensions';

const { participantList } = useRoomParticipantState();

const liveAudienceLayoutContainerRef = ref<HTMLElement | null>(null);
const { seatList, startPlayStream, stopPlayStream } = usePlayStream();

const currentVideoParticipant = computed(() => {
  const firstSeat = seatList.value[0];
  if (!firstSeat) {
    return undefined;
  }
  return participantList.value.find(participant => participant.userId === firstSeat.userInfo.userId);
});

const { itemStyle: streamItemStyle } = useStreamItemDimensions({
  containerRef: liveAudienceLayoutContainerRef,
  columns: 1,
  rows: 1,
  itemCount: 1,
  gap: 8,
  aspectRatio: 16 / 9,
});

onMounted(() => {
  const liveAudienceStream = document.getElementById('live-audience-stream');
  if (!liveAudienceStream) {
    return;
  }
  startPlayStream({ view: 'live-audience-stream' });
});

onBeforeUnmount(async () => {
  await stopPlayStream();
});
</script>

<style scoped lang="scss">
.live-audience-layout-container {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  padding: 25px 20px;
  box-sizing: border-box;
}

.live-audience-layout-content {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;
  background-color: #000;
  border-radius: 12px;
  overflow: hidden;
}

.live-audience-stream-content {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}
</style>
