/**
 * @module AvatarComponent
 * @description 头像组件
 *
 * 用于展示用户或群组头像，支持图片、文字、在线状态和未读消息徽章等功能。
 */

import Avatar from './Avatar.vue';
import {
  DEFAULT_USER_AVATAR,
  DEFAULT_GROUP_AVATAR_WORK,
  DEFAULT_GROUP_AVATAR_PUBLIC,
  DEFAULT_GROUP_AVATAR_MEETING,
  DEFAULT_GROUP_AVATAR_AVCHATROOM,
  DEFAULT_GROUP_AVATAR_COMMON,
} from './constants/avatar';

/**
 * 头像组件
 * @component Avatar
 * @description 头像组件，用于展示用户或群组头像，支持图片、文字、在线状态和未读消息徽章等功能。
 *
 * @props
 * @prop {string} src - 头像图片 URL
 * @prop {'xxl' | 'xl' | 'lg' | 'md' | 'sm' | 'xs' | number} size - 头像尺寸，支持预设尺寸或自定义数值，默认 'md'
 * @prop {'circular' | 'square' | 'rounded'} shape - 头像形状，圆形/方形/圆角，默认 'circular'
 * @prop {string} alt - 图片替代文本，也用于生成文字头像
 * @prop {string} className - 自定义类名
 * @prop {CSSProperties} style - 自定义样式
 * @prop {boolean} isShowOnlineStatus - 是否显示在线状态指示器，默认 false
 * @prop {boolean} isOnline - 用户是否在线
 * @prop {number} unreadCount - 未读消息数量，为 true 时显示小红点，为数字时显示具体数量
 * @prop {number} maxUnreadCount - 最大未读消息数量，超过时显示 max+，默认 99
 * @prop {boolean} isDotUnreadCount - 是否以小红点形式显示未读消息，默认 false
 *
 * @emits
 * @emit {void} click - 点击头像时触发（通过 onClick prop 传入）
 *
 * @example
 * <template>
 *   <Avatar
 *     :src="userAvatar"
 *     size="lg"
 *     shape="circular"
 *     :is-show-online-status="true"
 *     :is-online="true"
 *     :unread-count="5"
 *     @click="handleClick"
 *   />
 * </template>
 *
 * <script setup>
 * import { Avatar } from 'tuikit-atomicx-vue3';
 *
 * const userAvatar = 'https://example.com/avatar.png';
 *
 * function handleClick() {
 *   console.log('Avatar clicked');
 * }
 * </script>
 */

export {
  Avatar,
  DEFAULT_USER_AVATAR,
  DEFAULT_GROUP_AVATAR_WORK,
  DEFAULT_GROUP_AVATAR_PUBLIC,
  DEFAULT_GROUP_AVATAR_MEETING,
  DEFAULT_GROUP_AVATAR_AVCHATROOM,
  DEFAULT_GROUP_AVATAR_COMMON,
};
export type { AvatarSize, AvatarShape, AvatarProps } from './Avatar.vue';
