import { addI18n } from '../../i18n';
import DefaultStreamViewUIComp from './DefaultStreamViewUI.vue';
import { enUSResource, zhCNResource } from './i18n';
import LiveViewComponent from './index.vue';

addI18n('en-US', { translation: enUSResource });
addI18n('zh-CN', { translation: zhCNResource });

/**
 * @module LiveViewComponent
 * @description 直播视图组件，用于展示直播视频流，支持自定义流视图 UI、中心覆盖层，内置播放器控制栏（含播放/暂停、音量、全屏、画中画、分辨率切换等），自适应横竖屏布局。
 *
 * @slots
 * @slot streamViewUI - 自定义流视图 UI，参数为 { userInfo: SeatUserInfo }
 * @slot center-overlay - 中心覆盖层插槽，用于自定义中心区域内容（如暂停蒙层、刷新加载等）
 * @slot localVideo - 本地视频流插槽，参数为 { style: object }，用于混流场景下展示本地画面
 *
 * @emits
 * @emit {number} empty-seat-click - 点击空麦位时触发，参数为麦位索引 seatIndex
 *
 * @example
 * <template>
 *   <div class="live-view-container">
 *     <LiveView />
 *   </div>
 * </template>
 *
 * <script setup>
 * import { LiveView } from 'tuikit-atomicx-vue3';
 * </script>
 *
 * <style scoped>
 * .live-view-container {
 *   width: 100vw;
 *   height: 100vh;
 * }
 * </style>
 */
const LiveCoreView = LiveViewComponent;
const LiveView = LiveViewComponent;
const DefaultStreamViewUI = DefaultStreamViewUIComp;

const LIVE_STREAM_CONTENT_VIEW = 'atomicx-live-stream-content';

export { LiveCoreView, LiveView, DefaultStreamViewUI, LIVE_STREAM_CONTENT_VIEW };
