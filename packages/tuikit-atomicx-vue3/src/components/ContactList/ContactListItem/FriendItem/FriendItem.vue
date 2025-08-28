<template>
  <div
    :class="friendItemClasses"
    @click="handleClick"
    @keydown.enter="handleClick"
    @keydown.space="handleClick"
  >
    <div class="friend-item__avatar">
      <Avatar
        :src="friend.avatar"
        :alt="friend.remark || friend?.nick || friend.userID"
      />
    </div>
    <div class="friend-item__content">
      <div class="friend-item__name">
        {{ friend.remark || friend?.nick || friend.userID }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Avatar } from '../../../Avatar';
import type { FriendItemProps } from '../../../../types/contact';

const props = withDefaults(defineProps<FriendItemProps>(), {});

const emit = defineEmits<{
  click: [friend: any];
}>();

const friendItemClasses = computed(() => [
  'friend-item',
  {
    'friend-item--active': props.isActive,
  },
]);

const handleClick = () => {
  emit('click', props.friend);
};
</script>

<style scoped lang="scss">
@import './FriendItem.scss';
</style>
