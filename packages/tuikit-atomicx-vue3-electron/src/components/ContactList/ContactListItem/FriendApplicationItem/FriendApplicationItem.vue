<template>
  <div
    :class="friendApplicationItemClasses"
    @click="handleClick"
    @keydown.enter="handleClick"
    @keydown.space="handleClick"
  >
    <div class="friendApplicationItem__avatar">
      <Avatar
        :src="application.avatar"
        :alt="application.nick || application.userID"
      />
    </div>
    <div class="friendApplicationItem__content">
      <div class="friendApplicationItem__name">
        {{ application.nick || application.userID }}
      </div>
      <div class="friendApplicationItem__text">
        {{ t('TUIContact.Request to add you as friend') }}
      </div>
    </div>
    <div class="friendApplicationItem__actions">
      <TUIButton
        type="primary"
        size="small"
        @click.stop="handleAccept"
      >
        {{ t('TUIContact.Agree') }}
      </TUIButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useUIKit, TUIButton } from '@tencentcloud/uikit-base-component-vue3';
import { useContactListState } from '../../../../states/ContactListState';
import { Avatar } from '../../../Avatar';
import type { FriendApplicationItemProps } from '../../../../types/contact';

const props = withDefaults(defineProps<FriendApplicationItemProps>(), {});

const emit = defineEmits<{
  click: [application: any];
  action: [action: 'accept' | 'refuse', application: any];
}>();

const { t } = useUIKit();
const { acceptFriendApplication } = useContactListState();

const friendApplicationItemClasses = computed(() => [
  'friendApplicationItem',
  {
    'friendApplicationItem--active': props.isActive,
  },
]);

const handleClick = () => {
  emit('click', props.application);
};

const handleAccept = () => {
  acceptFriendApplication(props.application);
  emit('action', 'accept', props.application);
};
</script>

<style scoped lang="scss">
@use './FriendApplicationItem.scss';
</style>
