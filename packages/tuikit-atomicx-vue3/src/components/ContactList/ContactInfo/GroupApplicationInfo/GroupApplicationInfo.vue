<template>
  <div class="contact-group-application-info">
    <div class="contact-group-application-info__header">
      <div class="contact-group-application-info__main-info">
        <div class="contact-group-application-info__name">
          {{ displayName }}
        </div>
        <div class="contact-group-application-info__id">
          {{ t('TUIContact.ID') }}：{{ application.fromUser }}
        </div>
        <div class="contact-group-application-info__intro">
          {{ applicationText }}
        </div>
      </div>
      <div class="contact-group-application-info__avatar-wrap">
        <Avatar
          :src="application.fromUserAvatarURL"
          :alt="displayName"
          :size="48"
        />
      </div>
    </div>
    <div class="contact-group-application-info__rows">
      <div class="contact-group-application-info__row">
        <div class="contact-group-application-info__row-label">
          {{ t('TUIContact.Application note') }}
        </div>
        <div class="contact-group-application-info__row-value">
          {{ application.requestMsg || t('TUIContact.None') }}
        </div>
      </div>
    </div>
    <div
      v-if="showActions"
      class="contact-group-application-info__actions"
    >
      <TUIButton
        class="contact-group-application-info__button--primary"
        type="primary"
        size="big"
        radius="round"
        @click="handleAccept"
      >
        {{ t('TUIContact.Agree') }}
      </TUIButton>
      <TUIButton
        class="contact-group-application-info__button--secondary"
        type="default"
        size="big"
        radius="round"
        color="red"
        @click="handleRefuse"
      >
        {{ t('TUIContact.Refuse') }}
      </TUIButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useUIKit, TUIButton } from '@tencentcloud/uikit-base-component-vue3';
import { useGroupStore } from '../../../../chat-store';
import { Avatar } from '../../../Avatar';
import type { GroupApplicationInfo } from '@atomicxcore/core';
import type { GroupApplicationInfoProps } from '../../../../types/contact';

const props = withDefaults(defineProps<GroupApplicationInfoProps>(), {
  showActions: true,
});

const emit = defineEmits<{
  accept: [application: GroupApplicationInfo];
  refuse: [application: GroupApplicationInfo];
  groupApplicationAction: [action: 'accept' | 'refuse', application: GroupApplicationInfo];
  close: [];
}>();

const { t } = useUIKit();
const { acceptApplication, refuseApplication } = useGroupStore();

const displayName = computed(
  () => props.application.fromUserNickname || props.application.fromUser || '',
);
const groupDisplay = computed(() => props.application.groupID);
// 'joinApprovedByAdmin' is a user's request to join; other values indicate invitations.
const applicationText = computed(() =>
  props.application.type === 'joinApprovedByAdmin'
    ? `${t('TUIContact.Apply to join group')}"${groupDisplay.value}"`
    : `${t('TUIContact.Invite you to join group')}"${groupDisplay.value}"`,
);

const handleAccept = async () => {
  emit('accept', props.application);
  emit('groupApplicationAction', 'accept', props.application);
  try {
    await acceptApplication(props.application);
  } catch (err) {
    console.error('[GroupApplicationInfo acceptApplication] error', err);
  }
  emit('close');
};

const handleRefuse = async () => {
  emit('refuse', props.application);
  emit('groupApplicationAction', 'refuse', props.application);
  try {
    await refuseApplication(props.application);
  } catch (err) {
    console.error('[GroupApplicationInfo refuseApplication] error', err);
  }
  emit('close');
};
</script>

<style scoped lang="scss">
@use './GroupApplicationInfo.scss';
</style>
