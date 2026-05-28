<template>
  <div class="contact-friend-application-info">
    <div class="contact-friend-application-info__header">
      <div class="contact-friend-application-info__main-info">
        <div class="contact-friend-application-info__name">
          {{ application?.nickname || application?.userID }}
        </div>
        <div class="contact-friend-application-info__id">
          {{ t('TUIContact.ID') }}: {{ application?.userID }}
        </div>
      </div>
      <div class="contact-friend-application-info__avatar-wrap">
        <Avatar
          :src="application.avatarURL"
          :alt="application?.nickname || application.userID"
          :size="48"
        />
      </div>
    </div>
    <div class="contact-friend-application-info__rows">
      <div class="contact-friend-application-info__row">
        <div class="contact-friend-application-info__row-label">
          {{ t('TUIContact.Verification info') }}
        </div>
        <div class="contact-friend-application-info__row-value">
          {{ application?.addWording || t('TUIContact.None') }}
        </div>
      </div>
    </div>
    <div
      v-if="shouldShowReceivedActions"
      class="contact-friend-application-info__actions"
    >
      <TUIButton
        class="contact-friend-application-info__button--primary"
        type="primary"
        size="big"
        radius="round"
        @click="handleAccept"
      >
        {{ t('TUIContact.Agree') }}
      </TUIButton>
      <TUIButton
        class="contact-friend-application-info__button--secondary"
        type="default"
        size="big"
        radius="round"
        color="red"
        @click="handleRefuse"
      >
        {{ t('TUIContact.Refuse') }}
      </TUIButton>
    </div>
    <div
      v-if="showActions && application.type === FriendApplicationType.Received && displayStatus !== 'pending'"
      class="contact-friend-application-info__rows"
    >
      <div class="contact-friend-application-info__row">
        <div class="contact-friend-application-info__row-label">
          {{ receivedApplicationText }}
        </div>
      </div>
    </div>
    <div
      v-if="showActions && application.type === FriendApplicationType.Sent"
      class="contact-friend-application-info__rows"
    >
      <div class="contact-friend-application-info__row">
        <div
          :class="[
            'contact-friend-application-info__row-label',
            displayStatus === 'rejected' && 'contact-friend-application-info__row-label--rejected',
          ]"
        >
          {{ sentApplicationText }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { FriendApplicationType } from '@atomicxcore/core';
import { ContactStore } from '../../../../chat-store';
import { useUIKit, TUIButton } from '@tencentcloud/uikit-base-component-vue3';
import { Avatar } from '../../../Avatar';
import type { FriendApplicationInfoProps } from '../../../../types/contact';
import type { FriendApplicationInfo } from '@atomicxcore/core';

type FriendApplicationDisplayStatus = 'pending' | 'accepted' | 'rejected' | 'handled';

const props = withDefaults(defineProps<FriendApplicationInfoProps>(), {
  showActions: true,
});

const emit = defineEmits<{
  accept: [application: FriendApplicationInfo];
  refuse: [application: FriendApplicationInfo];
  friendApplicationAction: [action: 'accept' | 'refuse', application: FriendApplicationInfo];
  close: [];
}>();

const { t } = useUIKit();
const {
  acceptFriendApplication,
  refuseFriendApplication,
  friendApplicationList,
  friendList,
} = ContactStore();

const displayStatus = computed<FriendApplicationDisplayStatus>(() => {
  const isFriend = friendList.value.some(friend => friend.userID === props.application.userID);
  const isApplicationPending = friendApplicationList.value.some(item => item.userID === props.application.userID);

  // Friend relation wins because a removed application can mean it was accepted.
  if (isFriend) {
    return 'accepted';
  }

  if (!isApplicationPending) {
    return props.application.type === FriendApplicationType.Sent ? 'rejected' : 'handled';
  }

  return 'pending';
});

const sentApplicationText = computed(() => {
  if (displayStatus.value === 'accepted') {
    return t('TUIContact.Friend application accepted');
  }
  if (displayStatus.value === 'rejected') {
    return t('TUIContact.Friend application rejected');
  }
  return t('TUIContact.Friend application sent, waiting for confirmation');
});

const receivedApplicationText = computed(() => {
  if (displayStatus.value === 'accepted') {
    return t('TUIContact.Friend application accepted');
  }
  if (displayStatus.value === 'handled') {
    return t('TUIContact.Friend application handled');
  }
  return '';
});

const shouldShowReceivedActions = computed(() =>
  props.showActions
  && props.application.type === FriendApplicationType.Received
  && displayStatus.value === 'pending',
);

const handleAccept = async () => {
  emit('accept', props.application);
  emit('friendApplicationAction', 'accept', props.application);
  try {
    await acceptFriendApplication(props.application);
  } catch (err) {
    console.error('[FriendApplicationInfo acceptFriendApplication] error', err);
  }
  emit('close');
};

const handleRefuse = async () => {
  emit('refuse', props.application);
  emit('friendApplicationAction', 'refuse', props.application);
  try {
    await refuseFriendApplication(props.application);
  } catch (err) {
    console.error('[FriendApplicationInfo refuseFriendApplication] error', err);
  }
  emit('close');
};
</script>

<style scoped lang="scss">
@use './FriendApplicationInfo.scss';
</style>
