<template>
  <div ref="roomViewContainerRef" class="room-view-container">
    <GridLayout
      v-if="isStandardRoom && layoutTemplate === RoomLayoutTemplate.GridLayout"
      @stream-double-click="handleStreamDoubleClick"
    >
      <template #participantViewUI="{ participant, streamType }">
        <slot name="participantViewUI" v-bind="{ participant, streamType }" />
      </template>
    </GridLayout>
    <SpeakerLayout
      v-if="isStandardRoom && (layoutTemplate === RoomLayoutTemplate.SidebarLayout || layoutTemplate === RoomLayoutTemplate.CinemaLayout)"
      :layout-template="layoutTemplate"
      @stream-double-click="handleStreamDoubleClick"
    >
      <template #participantViewUI="{ participant, streamType }">
        <slot name="participantViewUI" v-bind="{ participant, streamType }" />
      </template>
    </SpeakerLayout>
    <MobileLayout
      v-if="isStandardRoom && layoutTemplate === RoomLayoutTemplate.MobileLayout"
      :layout-template="layoutTemplate"
      @stream-double-click="handleStreamDoubleClick"
    >
      <template #participantViewUI="{ participant, streamType }">
        <slot name="participantViewUI" v-bind="{ participant, streamType }" />
      </template>
    </MobileLayout>
    <FloatMixLayout v-if="isWebinarHost">
      <template #participantViewUI="{ participant, streamType }">
        <slot name="participantViewUI" v-bind="{ participant, streamType }" />
      </template>
    </FloatMixLayout>
    <LiveAudienceLayout v-if="isWebinarNonHost">
      <template #participantViewUI="{ participant, streamType }">
        <slot name="participantViewUI" v-bind="{ participant, streamType }" />
      </template>
    </LiveAudienceLayout>
  </div>
</template>

<script setup lang="ts">
import { ref, provide, computed } from 'vue';
import { useLoginState } from '../../states/LoginState';
import { useRoomState } from '../../states/RoomState';
import { RoomLayoutTemplate, RoomType } from '../../types';
import FloatMixLayout from './FloatMixLayout.vue';
import GridLayout from './GridLayout.vue';
import LiveAudienceLayout from './LiveAudienceLayout.vue';
import MobileLayout from './MobileLayout.vue';
import SpeakerLayout from './SpeakerLayout.vue';
import { useRoomToolbar } from './useRoomToolbar';
import type { RoomParticipant, VideoStreamType } from '../../types';

interface Props {
  layoutTemplate?: RoomLayoutTemplate;
}

withDefaults(defineProps<Props>(), {
  layoutTemplate: RoomLayoutTemplate.GridLayout,
});

const { currentRoom } = useRoomState();
const { loginUserInfo } = useLoginState();
const roomViewContainerRef = ref<HTMLDivElement | null>(null);

const { showToolbar } = useRoomToolbar(roomViewContainerRef);
provide('showToolbar', showToolbar);

const emits = defineEmits(['stream-double-click']);

function handleStreamDoubleClick(streamInfo: { participant: RoomParticipant; streamType: VideoStreamType }) {
  emits('stream-double-click', streamInfo);
}

const isStandardRoom = computed(() => currentRoom.value?.roomType === RoomType.Standard);
const isWebinarHost = computed(() => currentRoom.value?.roomType === RoomType.Webinar && currentRoom.value?.roomOwner.userId === loginUserInfo.value?.userId);
const isWebinarNonHost = computed(() => currentRoom.value?.roomType === RoomType.Webinar && currentRoom.value?.roomOwner.userId !== loginUserInfo.value?.userId);

</script>

<style lang="scss" scoped>
.room-view-container {
  position: relative;
  width: 100%;
  height: 100%;
}
</style>
