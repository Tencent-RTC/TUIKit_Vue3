<template>
  <div
    :class="friendApplicationItemClasses"
    @click="handleClick"
    @keydown.enter="handleClick"
    @keydown.space="handleClick"
  >
    <div class="friendApplicationItem__avatar">
      <Avatar
        :src="application.avatarURL"
        :alt="displayName"
      />
    </div>
    <div class="friendApplicationItem__content">
      <div class="friendApplicationItem__name">
        {{ displayName }}
      </div>
      <div class="friendApplicationItem__text">
        {{
          application.type === FriendApplicationType.Received
            ? t('TUIContact.Request to add you as friend')
            : t('TUIContact.Friend application sent, waiting for confirmation')
        }}
      </div>
    </div>
    <div
      v-if="application.type === FriendApplicationType.Received"
      class="friendApplicationItem__actions"
    >
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
import { FriendApplicationType } from '@atomicxcore/core';
import { ContactStore } from '../../../../chat-store';
import { useUIKit, TUIButton } from '@tencentcloud/uikit-base-component-vue3';
import { Avatar } from '../../../Avatar';
import type { FriendApplicationItemProps } from '../../../../types/contact';
import type { FriendApplicationInfo } from '@atomicxcore/core';

const props = withDefaults(defineProps<FriendApplicationItemProps>(), {});

const emit = defineEmits<{
  click: [application: FriendApplicationInfo];
  action: [action: 'accept' | 'refuse', application: FriendApplicationInfo];
}>();

const { t } = useUIKit();
const { acceptFriendApplication } = ContactStore();

const displayName = computed(
  () => props.application.nickname || props.application.userID,
);

const friendApplicationItemClasses = computed(() => [
  'friendApplicationItem',
  {
    'friendApplicationItem--active': props.isActive,
  },
]);

const handleClick = () => {
  emit('click', props.application);
};

const handleAccept = async () => {
  try {
    await acceptFriendApplication(props.application);
    emit('action', 'accept', props.application);
  } catch (err) {
    console.error('[FriendApplicationItem acceptFriendApplication] error', err);
  }
};
</script>

<style scoped lang="scss">
@use './FriendApplicationItem.scss';
</style>
