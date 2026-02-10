<template>
  <div ref="roomViewContainerRef" class="room-view-container">
    <GridLayout
      v-if="layoutTemplate === RoomLayoutTemplate.GridLayout"
      @stream-double-click="handleStreamDoubleClick"
    >
      <template #participantViewUI="{ participant, streamType }">
        <slot name="participantViewUI" v-bind="{ participant, streamType }" />
      </template>
    </GridLayout>
    <SpeakerLayout
      v-if="layoutTemplate === RoomLayoutTemplate.SidebarLayout || layoutTemplate === RoomLayoutTemplate.CinemaLayout"
      :layout-template="layoutTemplate"
      @stream-double-click="handleStreamDoubleClick"
    >
      <template #participantViewUI="{ participant, streamType }">
        <slot name="participantViewUI" v-bind="{ participant, streamType }" />
      </template>
    </SpeakerLayout>
    <MobileLayout
      v-if="layoutTemplate === RoomLayoutTemplate.MobileLayout"
      :layout-template="layoutTemplate"
      @stream-double-click="handleStreamDoubleClick"
    >
      <template #participantViewUI="{ participant, streamType }">
        <slot name="participantViewUI" v-bind="{ participant, streamType }" />
      </template>
    </MobileLayout>
    <FloatMixLayout v-if="layoutTemplate === RoomLayoutTemplate.FloatMixLayout">
      <template #participantViewUI="{ participant, streamType }">
        <slot name="participantViewUI" v-bind="{ participant, streamType }" />
      </template>
    </FloatMixLayout>
    <LiveAudienceLayout v-if="layoutTemplate === RoomLayoutTemplate.LiveAudienceLayout">
      <template #participantViewUI="{ participant, streamType }">
        <slot name="participantViewUI" v-bind="{ participant, streamType }" />
      </template>
    </LiveAudienceLayout>
  </div>
</template>

<script setup lang="ts">
import { ref, provide } from 'vue';
import { RoomLayoutTemplate } from '../../types';
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

const roomViewContainerRef = ref<HTMLDivElement | null>(null);

const { showToolbar } = useRoomToolbar(roomViewContainerRef);
provide('showToolbar', showToolbar);

const emits = defineEmits(['stream-double-click']);

function handleStreamDoubleClick(streamInfo: { participant: RoomParticipant; streamType: VideoStreamType }) {
  emits('stream-double-click', streamInfo);
}

</script>

<style lang="scss" scoped>
.room-view-container {
  position: relative;
  width: 100%;
  height: 100%;
}
</style>
