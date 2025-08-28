<template>
  <div
    :class="blacklistItemClasses"
    @click="handleClick"
    @keydown.enter="handleClick"
    @keydown.space="handleClick"
  >
    <div class="blacklist-item__avatar">
      <Avatar
        :src="profile.avatar"
        :alt="profile.nick || profile.userID"
      />
    </div>
    <div class="blacklist-item__content">
      <div class="blacklist-item__name">
        {{ profile.nick || profile.userID }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Avatar } from '../../../Avatar';
import type { BlacklistItemProps } from '../../../../types/contact';

const props = withDefaults(defineProps<BlacklistItemProps>(), {});

const emit = defineEmits<{
  click: [profile: any];
}>();

const blacklistItemClasses = computed(() => [
  'blacklist-item',
  {
    'blacklist-item--active': props.isActive,
  },
]);

const handleClick = () => {
  emit('click', props.profile);
};
</script>

<style scoped lang="scss">
@import './BlacklistItem.scss';
</style>
