<template>
  <div class="avatar-badge">
    <slot />

    <div
      :class="[
        'avatar-badge__indicator',
        'avatar-badge__indicator--bottom-right',
        `avatar-badge__indicator--${size}`,
      ]"
    >
      <div
        v-if="onlineStatus"
        :class="[
          'avatar-badge__online-status',
          `avatar-badge__online-status--${onlineStatus}`,
          `avatar-badge__online-status--${size}`,
        ]"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
// Avatar size type - align with Avatar.vue
type AvatarBadgeSize = 'xxl' | 'xl' | 'lg' | 'md' | 'sm' | 'xs';
type BadgeOnlineStatus = 'online' | 'offline';

interface AvatarBadgeProps {
  /**
   * Badge size - must align with Avatar size
   * @default 'md'
   */
  size?: AvatarBadgeSize;

  /**
   * Online status
   * @default 'online'
   */
  onlineStatus?: BadgeOnlineStatus;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const props = withDefaults(defineProps<AvatarBadgeProps>(), {
  size: 'md',
  onlineStatus: 'online',
});

defineOptions({
  name: 'AvatarBadge',
});
</script>

<style lang="scss" scoped>
.avatar-badge {
  position: relative;
  display: flex;

  &__indicator {
    position: absolute;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;

    // Fixed position: bottom-right only
    &--bottom-right {
      bottom: 0;
      right: 0;
    }

    // Different offsets for different avatar sizes
    &--xs {
      transform: translate(20%, 20%); // 24px avatar
    }

    &--sm {
      transform: translate(25%, 25%); // 32px avatar
    }

    &--md {
      transform: translate(25%, 25%); // 40px avatar
    }

    &--lg {
      transform: translate(20%, 20%); // 48px avatar
    }

    &--xl {
      transform: translate(15%, 15%); // 64px avatar
    }

    &--xxl {
      transform: translate(0%, 0%); // 96px avatar
    }
  }

  // Online status indicator styles
  &__online-status {
    border-radius: 50%;
    box-sizing: content-box;

    &--online {
      background-color: var(--text-color-success);
      border: 2px solid var(--bg-color-topbar);
    }

    &--offline {
      background-color: var(--uikit-color-gray-7);
      border: 2px solid var(--bg-color-topbar);
    }

    // Size variants to match avatar sizes
    &--xs {
      width: 8px;
      height: 8px;
      border-width: 1px;
    }

    &--sm {
      width: 8px;
      height: 8px;
      border-width: 1.5px;
    }

    &--md {
      width: 10px;
      height: 10px;
      border-width: 2px;
    }

    &--lg {
      width: 12px;
      height: 12px;
      border-width: 2px;
    }

    &--xl {
      width: 14px;
      height: 14px;
      border-width: 2px;
    }

    &--xxl {
      width: 16px;
      height: 16px;
      border-width: 3px;
    }
  }
}
</style>
