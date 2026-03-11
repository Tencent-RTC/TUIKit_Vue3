import RoomParticipantViewComp from './index.vue';

/**
 * @module RoomParticipantViewComponent
 * @description 房间参与者视图组件
 *
 * 用于展示房间参与者视频流及屏幕共享流，支持自定义视图展示。
 *
 *  * @props
 * @prop {RoomParticipant} participant - 房间参与者
 * @prop {VideoStreamType} streamType - 视频流类型
 * @prop {FillMode} fillMode - 填充模式
 *
 * @example
 * <template>
 *   <div class="room-participant-view-container">
 *     <RoomParticipantView
 *       :participant="participant"
 *       :stream-type="streamType"
 *     />
 *   </div>
 * </template>
 *
 * <script setup>
 * import { computed } from 'vue';
 * import { RoomParticipantView, useRoomParticipantState } from '@tuikit-atomicx-vue3/room';
 * const { getParticipantList, participantListWithVideo } = useRoomParticipantState();
 *
 * const participant = computed(() => participantListWithVideo.value[0]);
 * const streamType = VideoStreamType.Camera;
 *
 * onMounted(async () => {
 *   await getParticipantList({ cursor: '' });
 * });
 * </script>
 *
 * <style scoped>
 * .room-participant-list-container {
 *   width: 400px;
 *   height: 300px;
 * }
 * </style>
 */
const RoomParticipantView = RoomParticipantViewComp;

export { RoomParticipantView };
