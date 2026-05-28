<template>
  <div
    :class="friendItemClasses"
    role="button"
    tabindex="0"
    @click="handleClick"
    @keydown.enter="handleClick"
    @keydown.space="handleClick"
  >
    <div class="friend-item__avatar">
      <Avatar
        :src="friend.avatarURL"
        :alt="displayName"
      />
    </div>
    <div class="friend-item__content">
      <div class="friend-item__name">
        {{ displayName }}
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

// Display priority: friend remark > nickname > userID.
const displayName = computed(
  () => props.friend.friendRemark || props.friend.nickname || props.friend.userID,
);

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
@use './FriendItem.scss';
</style>
