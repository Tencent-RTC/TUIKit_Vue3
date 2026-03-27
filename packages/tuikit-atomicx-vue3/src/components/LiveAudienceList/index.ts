import LiveAudienceListPC from './LiveAudienceList.vue';
import LiveAudienceListH5 from './LiveAudienceListH5.vue';
import { addI18n } from '../../i18n';
import { enResource, zhResource } from './i18n';
import { isMobile } from '../../utils/environment';

/**
 * @module LiveAudienceListComponent
 * @description 直播观众列表组件，用于展示直播间在线观众，支持排名展示、滚动加载、主播操作菜单（禁言/踢出连麦/踢出房间），支持自定义观众项渲染，自动适配 PC 和移动端。
 *
 * @props
 * @prop {string} height - 列表容器高度
 * @prop {CSSProperties} style - 列表容器自定义样式对象
 *
 * @slots
 * @slot audience-item - 自定义观众列表项，替换整个默认渲染（使用时 audience-mark 插槽不生效），作用域参数：index（序号）、audience（观众信息）
 * @slot audience-mark - 在默认观众项中插入自定义标记内容（如粉丝勋章），作用域参数：audience（观众信息）
 *
 * @example
 * <template>
 *   <LiveAudienceList height="400px">
 *     <template #audience-mark="{ audience }">
 *       <span class="fan-badge">{{ audience.level }}</span>
 *     </template>
 *   </LiveAudienceList>
 * </template>
 *
 * <script setup>
 * import { LiveAudienceList } from 'tuikit-atomicx-vue3';
 * </script>
 */
const MAX_AUDIENCE_COUNT = 200;
const LiveAudienceList = isMobile ? LiveAudienceListH5 : LiveAudienceListPC;

addI18n('en-US', { translation: enResource });
addI18n('zh-CN', { translation: zhResource });

export { LiveAudienceList, MAX_AUDIENCE_COUNT };
