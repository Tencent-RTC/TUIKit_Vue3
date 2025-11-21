<template>
  <component
    :is="baseAvatar"
    v-if="!isShowOnlineStatus && !unreadCount"
  />
  <!-- Avatar with badges -->
  <component
    :is="avatarWithBadges"
    v-else
  />
</template>

<script lang="ts" setup>
import { computed, ref, useSlots, h, CSSProperties } from 'vue';
import { Badge } from '@tencentcloud/uikit-base-component-vue3';
import cs from 'classnames';
import { AvatarBadge as AvatarOnlineBadge } from './AvatarBadge';

// Default avatar image
const DEFAULT_AVATAR_URL = 'https://web.sdk.qcloud.com/component/TUIKit/assets/avatar_21.png';

// Avatar size type
type AvatarSize = 'xxl' | 'xl' | 'lg' | 'md' | 'sm' | 'xs' | number;

// Avatar shape type
type AvatarShape = 'circular' | 'square' | 'rounded';

// Base avatar component props interface
interface BaseAvatarProps {
  /** Avatar image URL */
  src?: string;
  /**
   * Avatar size
   * @default 'md'
   */
  size?: AvatarSize;

  /**
   * Avatar shape: circular, square, rounded
   * @default 'circular'
   */
  shape?: AvatarShape;
  /** Alternative text for the image, also used to generate text avatar */
  alt?: string;

  /** Custom class name */
  className?: string;

  /** Custom style */
  style?: CSSProperties;

  /** Click event handler */
  onClick?: () => void;
}

// Complete avatar component props interface (including online status)
interface AvatarProps extends BaseAvatarProps {
  /**
   * Whether to show online status indicator
   * @default false
   */
  isShowOnlineStatus?: boolean;

  /** Whether the user is online */
  isOnline?: boolean;

  /**
   * Unread message count
   * If true, displays a small red dot
   * If number, displays the specific count
   */
  unreadCount?: number;

  /**
   * Max unread message count
   * If number, displays the specific count
   */
  maxUnreadCount?: number;

  /**
   * Whether to display a small red dot
   * @default false
   */
  isDotUnreadCount?: boolean;
}

const props = withDefaults(defineProps<AvatarProps>(), {
  size: 'md',
  shape: 'circular',
  isShowOnlineStatus: false,
  isOnline: false,
  unreadCount: 0,
  maxUnreadCount: 99,
  isDotUnreadCount: false,
});

const slots = useSlots();

// State management
const imageError = ref(false);
const isLoading = ref(!!props.src);

// Reactive properties
const children = computed(() => slots.default);

// Methods
const setIsLoading = (loading: boolean) => {
  isLoading.value = loading;
};

const handleImageLoad = () => {
  isLoading.value = false;
};

const handleImageError = () => {
  imageError.value = true;
  isLoading.value = false;
};

const handleClick = () => {
  if (props.onClick) {
    props.onClick();
  }
};

const getAltText = () => {
  if (!props.alt) {
    return '';
  }
  // Get the first character (supports non-ASCII characters like Chinese)
  return props.alt.trim().charAt(0);
};

// Calculate avatar size style
const fontSizeStyle = computed(() => {
  let _size = 40;
  if (typeof props.size === 'number') {
    // eslint-disable-next-line no-nested-ternary
    const shapeStyle = props.shape === 'circular' ? '50%' : props.shape === 'square' ? '0%' : `${props.size / 6}px`;
    return {
      width: `${props.size}px`,
      height: `${props.size}px`,
      fontSize: `${Math.floor(props.size / 2)}px`,
      borderRadius: shapeStyle,
    };
  }
  if (typeof props.size === 'string') {
    switch (props.size) {
      case 'xxl':
        _size = 96;
        break;
      case 'xl':
        _size = 64;
        break;
      case 'lg':
        _size = 48;
        break;
      case 'md':
        _size = 40;
        break;
      case 'sm':
        _size = 32;
        break;
      case 'xs':
        _size = 24;
        break;
      default:
        _size = 40;
        break;
    }
  }
  return {
    fontSize: `${Math.floor(_size / 2)}px`,
  };
});

const avatarClasses = computed(() => cs(
  'avatar',
  `avatar--shape-${props.shape}`,
  typeof props.size !== 'number' && `size-${props.size}`,
  props.className,
));

// Create base avatar component
const baseAvatar = computed(() => h(
  'div',
  {
    'class': avatarClasses.value,
    'style': [fontSizeStyle.value, props.style, { cursor: props.onClick ? 'pointer' : 'default' }],
    'onClick': handleClick,
    'role': props.onClick ? 'button' : undefined,
    'tabindex': props.onClick ? 0 : undefined,
    'aria-label': props.alt || 'avatar',
  },
  [
    // Render avatar content
    (() => {
      if (children.value) {
        return h('div', { class: 'avatar__fallback' }, children.value);
      }
      if (props.src && !imageError.value) {
        return h('img', {
          class: cs('avatar__image'),
          src: props.src,
          alt: props.alt || 'avatar',
          onLoad: handleImageLoad,
          onError: handleImageError,
        });
      }
      if (props.alt) {
        return h('div', { class: 'avatar__fallback' }, getAltText());
      }
      return h('img', {
        class: 'avatar__image',
        src: DEFAULT_AVATAR_URL,
        alt: 'default avatar',
        onLoad: () => setIsLoading(false),
        onError: () => setIsLoading(false),
      });
    })(),

    // Loading skeleton
    isLoading.value && h('div', { class: 'avatar__skeleton' }),
  ],
));

// Create avatar with badges component
const avatarWithBadges = computed(() => {
  let result = baseAvatar.value;

  // If unread messages exist, add the unread message badge
  if (props.unreadCount !== undefined) {
    result = h(Badge, {
      hidden: props.unreadCount === 0,
      value: typeof props.unreadCount === 'number' ? props.unreadCount : '',
      max: props.maxUnreadCount,
      isDot: props.isDotUnreadCount,
      type: 'danger',
    }, [result]);
  }

  // If online status should be shown, add the online status badge
  if (props.isShowOnlineStatus) {
    result = h(AvatarOnlineBadge, {
      show: true,
      onlineStatus: props.isOnline ? 'online' : 'offline',
      size: typeof props.size === 'number' ? 'md' : props.size,
    }, [result]);
  }

  return result;
});

defineOptions({
  name: 'Avatar',
});

// Export types
export type { AvatarSize, AvatarShape, BaseAvatarProps, AvatarProps };
</script>

<style lang="scss" scoped>
.avatar {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
  user-select: none;

  &--shape-circular {
    border-radius: 50%;
  }

  &--shape-square {
    border-radius: 0;
  }

  &.size-xs {
    width: 24px;
    height: 24px;
  }
  &.size-sm {
    width: 32px;
    height: 32px;
  }
  &.size-md {
    width: 40px;
    height: 40px;
  }
  &.size-lg {
    width: 48px;
    height: 48px;
  }
  &.size-xl {
    width: 64px;
    height: 64px;
  }
  &.size-xxl {
    width: 96px;
    height: 96px;
  }

  &--shape-rounded {
    border-radius: 4px;

    &.size-xs {
      border-radius: 4px;
    }
    &.size-sm {
      border-radius: 4px;
    }
    &.size-md {
      border-radius: 8px;
    }
    &.size-lg {
      border-radius: 8px;
    }
    &.size-xl {
      border-radius: 8px;
    }
    &.size-xxl {
      border-radius: 12px;
    }
  }

  &__image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: flex;
  }

  &__fallback {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 500;
    text-transform: uppercase;
    background-color: var(--uikit-color-theme-6);
    color: #fff;
  }

  &__skeleton {
    width: 100%;
    height: 100%;
    background-color: #e6e6e6;
    position: absolute;
    top: 0;
    left: 0;
    z-index: 1;

    &::after {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background:
        linear-gradient(
          90deg,
          rgba(255, 255, 255, 0%),
          rgba(255, 255, 255, 40%),
          rgba(255, 255, 255, 0%)
        );
      animation: shimmer 1.2s ease-in-out infinite;
    }
  }
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }

  100% {
    transform: translateX(100%);
  }
}
</style>
