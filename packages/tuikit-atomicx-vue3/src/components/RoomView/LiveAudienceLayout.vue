<template>
  <div ref="liveAudienceLayoutContainerRef" class="live-audience-layout-container">
    <div :style="streamItemStyle" class="live-audience-layout-content">
      <div
        id="live-audience-stream"
        :style="streamItemStyle"
        class="local-video-mixer-content"
      />
      <slot
        v-if="roomOwnerParticipant"
        name="participantViewUI"
        v-bind="{ participant: roomOwnerParticipant, streamType: VideoStreamType.Camera }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import { useRoomParticipantState } from '../../states/RoomParticipantState';
import { useRoomState } from '../../states/RoomState';
import { VideoStreamType } from '../../types';
import { usePlayStream } from './usePlayStream';
import { useStreamItemDimensions } from './useStreamItemDimensions';

const { currentRoom } = useRoomState();
const { participantList } = useRoomParticipantState();
const roomOwnerParticipant = computed(() => participantList.value.find(participant => participant.userId === currentRoom.value?.roomOwner.userId));

const liveAudienceLayoutContainerRef = ref<HTMLElement | null>(null);
const { startPlayStream, stopPlayStream } = usePlayStream();

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
}

.local-video-mixer-content {
  width: 100%;
  height: 100%;
}
</style>
