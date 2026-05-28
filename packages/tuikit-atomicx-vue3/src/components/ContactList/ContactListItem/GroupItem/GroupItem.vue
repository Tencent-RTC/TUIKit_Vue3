<template>
  <div
    :class="groupItemClasses"
    @click="handleClick"
    @keydown.enter="handleClick"
    @keydown.space="handleClick"
  >
    <div class="group-item__avatar">
      <Avatar
        :src="group.avatarURL"
        :alt="displayName"
      />
    </div>
    <div class="group-item__content">
      <div class="group-item__name">
        {{ displayName }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Avatar } from '../../../Avatar';
import type { GroupItemProps } from '../../../../types/contact';

const props = withDefaults(defineProps<GroupItemProps>(), {});

const emit = defineEmits<{
  click: [group: any];
}>();

const displayName = computed(() => props.group.groupName || props.group.groupID);

const groupItemClasses = computed(() => [
  'group-item',
  {
    'group-item--active': props.isActive,
  },
]);

const handleClick = () => {
  emit('click', props.group);
};
</script>

<style scoped lang="scss">
@use './GroupItem.scss';
</style>
