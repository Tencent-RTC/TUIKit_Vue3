import RoomViewComponent from './index.vue';

/**
 * @module RoomViewComponent
 * @description 房间视图组件
 *
 * 用于展示房间参与者视频流及屏幕共享流，支持自定义视图展示，支持自定义布局模板。
 *
 * @props
 * @prop {RoomLayoutTemplate} layoutTemplate - 布局模板，默认 'RoomLayoutTemplate.GridLayout'
 *
 * @slots
 * @slot participantViewUI - 视频流区域视图，参数为 { participant: RoomParticipant; streamType: VideoStreamType }
 *
 * @emits
 * @emit {void} stream-double-click - 有视频流区域被双击时触发，参数为 { participant: RoomParticipant; streamType: VideoStreamType }
 *
 * @example
 * <template>
 *   <div class="room-view-container">
 *     <RoomView />
 *   </div>
 * </template>
 *
 * <script setup>
 * import { RoomView } from '@tuikit-atomicx-vue3/room';
 * import { RoomLayoutTemplate } from '@tuikit-atomicx-vue3/room';
 *
 * </script>
 *
 * <style scoped>
 * .room-view-container {
 *   width: 100vw;
 *   height: 100vh;
 * }
 * </style>
 */
const RoomView = RoomViewComponent;

export { RoomView };
