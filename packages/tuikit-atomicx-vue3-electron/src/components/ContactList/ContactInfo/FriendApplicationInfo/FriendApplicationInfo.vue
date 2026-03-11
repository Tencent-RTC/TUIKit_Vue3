<template>
  <div class="contact-friend-application-info">
    <div class="contact-friend-application-info__header">
      <div class="contact-friend-application-info__main-info">
        <div class="contact-friend-application-info__name">
          {{ application?.nick || application?.userID }}
        </div>
        <div class="contact-friend-application-info__id">
          {{ t('TUIContact.ID') }}：{{ application?.userID }}
        </div>
      </div>
      <Avatar
        :src="application.avatar"
        :alt="application?.nick || application.userID"
        size="xl"
      />
    </div>
    <div class="contact-friend-application-info__rows">
      <div class="contact-friend-application-info__row">
        <div class="contact-friend-application-info__row-label">
          {{ t('TUIContact.Verification info') }}：
        </div>
        <div class="contact-friend-application-info__row-value">
          {{ application?.wording || t('TUIContact.None') }}
        </div>
      </div>
    </div>
    <div
      v-if="showActions"
      class="contact-friend-application-info__actions"
    >
      <TUIButton
        type="default"
        size="big"
        color="red"
        @click="handleRefuse"
      >
        {{ t('TUIContact.Refuse') }}
      </TUIButton>
      <TUIButton
        type="primary"
        size="big"
        @click="handleAccept"
      >
        {{ t('TUIContact.Agree') }}
      </TUIButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUIKit, TUIButton } from '@tencentcloud/uikit-base-component-vue3';
import { useContactListState } from '../../../../states/ContactListState';
import { Avatar } from '../../../Avatar';
import type { FriendApplication, FriendApplicationInfoProps } from '../../../../types/contact';

const props = withDefaults(defineProps<FriendApplicationInfoProps>(), {
  showActions: true,
});

const emit = defineEmits<{
  accept: [application: FriendApplication];
  refuse: [application: FriendApplication];
  friendApplicationAction: [action: 'accept' | 'refuse', application: FriendApplication];
  close: [];
}>();

const { t } = useUIKit();
const { acceptFriendApplication, refuseFriendApplication } = useContactListState();

const handleAccept = () => {
  emit('accept', props.application);
  emit('friendApplicationAction', 'accept', props.application);
  acceptFriendApplication(props.application);
  emit('close');
};

const handleRefuse = () => {
  emit('refuse', props.application);
  emit('friendApplicationAction', 'refuse', props.application);
  refuseFriendApplication(props.application.userID);
  emit('close');
};
</script>

<style scoped lang="scss">
@use './FriendApplicationInfo.scss';
</style>
