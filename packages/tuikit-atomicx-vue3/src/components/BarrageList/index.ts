import BarrageListPC from './BarrageList.vue';
import BarrageListH5 from './BarrageListH5.vue';
import { addI18n } from '../../i18n';
import { enResource, zhResource } from './i18n';
import { isMobile } from '../../utils/environment';

/**
 * @module BarrageListComponent
 * @description 弹幕列表组件，用于展示直播间弹幕消息流，支持自动滚动、自定义消息渲染、礼物消息展示、用户操作菜单（主播可禁言），自动适配 PC 和移动端。
 *
 * @props
 * @prop {Component} Message - 自定义消息渲染组件，替代默认消息样式
 * @prop {CSSProperties} containerStyle - 消息列表容器自定义样式
 * @prop {CSSProperties} itemStyle - 单条消息项自定义样式
 * @prop {string} height - 列表高度
 * @prop {CSSProperties} style - 列表外层容器自定义样式
 *
 * @slots
 * @slot message-item - 自定义整个消息项渲染（使用时替代默认消息组件），作用域参数：message（弹幕消息对象）、sender（发送者信息）
 * @slot user-badge - 自定义用户徽章/标识（如主播标签、粉丝等级），作用域参数：message（弹幕消息对象）
 *
 * @example
 * <template>
 *   <BarrageList height="300px" />
 * </template>
 *
 * <script setup>
 * import { BarrageList } from 'tuikit-atomicx-vue3';
 * </script>
 */
const BarrageList = isMobile ? BarrageListH5 : BarrageListPC;
addI18n('en-US', { translation: enResource });
addI18n('zh-CN', { translation: zhResource });

export { BarrageList };
