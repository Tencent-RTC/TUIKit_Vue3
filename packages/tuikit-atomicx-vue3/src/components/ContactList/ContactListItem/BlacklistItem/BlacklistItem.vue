<template>
  <div
    :class="blacklistItemClasses"
    @click="handleClick"
    @keydown.enter="handleClick"
    @keydown.space="handleClick"
  >
    <div class="blacklist-item__avatar">
      <Avatar
        :src="profile.avatarURL"
        :alt="displayName"
      />
    </div>
    <div class="blacklist-item__content">
      <div class="blacklist-item__name">
        {{ displayName }}
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

const displayName = computed(() => props.profile.nickname || props.profile.userID);

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
@use './BlacklistItem.scss';
</style>
