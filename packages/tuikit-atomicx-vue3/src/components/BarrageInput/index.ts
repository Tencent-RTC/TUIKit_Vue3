import BarrageInputPC from './BarrageInput.vue';
import BarrageInputH5 from './BarrageInputH5.vue';
import { addI18n } from '../../i18n';
import { enResource, zhResource } from './i18n';
import { isMobile } from '../../utils/environment';

/**
 * @module BarrageInputComponent
 * @description 弹幕输入组件，用于直播间发送弹幕消息，内置表情选择器，支持自定义样式、输入限制、禁言状态，自动适配 PC 和移动端。
 *
 * @props
 * @prop {string} containerClass - 输入框容器自定义 CSS 类名
 * @prop {Record<string, any>} containerStyle - 输入框容器自定义样式对象
 * @prop {string} width - 输入框宽度
 * @prop {string} height - 输入框高度
 * @prop {string} minHeight - 输入框最小高度，默认 '40px'
 * @prop {string} maxHeight - 输入框最大高度，默认 '140px'
 * @prop {string} placeholder - 输入框占位文本
 * @prop {boolean} disabled - 是否禁用输入框，默认 false
 * @prop {boolean} autoFocus - 是否自动聚焦，默认 true
 * @prop {number} maxLength - 最大输入长度，默认 80
 * @prop {OnWillSendBarrage} onWillSendBarrage - 弹幕发送前回调，返回 false 可拦截发送
 * @prop {OnDidSendBarrage} onDidSendBarrage - 弹幕发送成功后回调
 *
 * @emits
 * @emit {void} focus - 输入框获得焦点时触发
 * @emit {void} blur - 输入框失去焦点时触发
 *
 * @example
 * <template>
 *   <BarrageInput
 *     placeholder="说点什么..."
 *     :maxLength="100"
 *     @focus="handleFocus"
 *     @blur="handleBlur"
 *   />
 * </template>
 *
 * <script setup>
 * import { BarrageInput } from 'tuikit-atomicx-vue3';
 *
 * function handleFocus() {
 *   console.log('Input focused');
 * }
 * function handleBlur() {
 *   console.log('Input blurred');
 * }
 * </script>
 */
addI18n('en-US', { translation: enResource });
addI18n('zh-CN', { translation: zhResource });

const BarrageInput = isMobile ? BarrageInputH5 : BarrageInputPC;
export { BarrageInput, BarrageInputH5 };
