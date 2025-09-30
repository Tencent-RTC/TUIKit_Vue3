<template>
  <div class="user-list">
    <div
      v-for="user in props.userList"
      :key="`${user.userId}-${user.liveId}`"
      class="user-item"
    >
      <div class="user-item-left">
        <Avatar
          :src="user.avatarUrl"
          :size="40"
        />
      </div>
      <div class="user-item-right">
        <div class="user-info">
          <span class="user-name">{{ user.userName || user.userId }}</span>
        </div>
        <slot name="user-actions" :user="user" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Avatar } from '../Avatar';
import type { SeatUserInfo } from '../../types';

const props = defineProps<{
  userList: SeatUserInfo[];
}>();
</script>

<style lang="scss" scoped>
.user-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}
.user-item {
    display: flex;
    align-items: center;
    gap: 12px;
    height: 50px;
    box-sizing: border-box;

    .user-item-left {
      height: 100%;
      display: flex;
      align-items: center;
    }

    .user-item-right {
      flex: 1;
      display: flex;
      height: 100%;
      align-items: center;
      border-bottom: 1px solid var(--stroke-color-secondary);
    }

    .user-info {
      flex-grow: 1;
      display: flex;
      align-items: center;
      gap: 8px;

      .user-name {
        font-size: 16px;
        font-weight: 500;
        color: var(--text-color-primary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 200px;
      }

      .user-level {
        background: #3b82f6;
        color: white;
        font-size: 12px;
        padding: 2px 6px;
        border-radius: 10px;
        min-width: 24px;
        text-align: center;
        font-weight: 500;
      }

      .is-me {
        color: var(--text-color-secondary);
        font-size: 14px;
      }
    }
}
</style>
