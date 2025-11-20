<template>
  <div class="contact-group-application-info">
    <div class="contact-group-application-info__header">
      <div class="contact-group-application-info__main-info">
        <div class="contact-group-application-info__name">
          {{ displayName }}
        </div>
        <div class="contact-group-application-info__id">
          {{ t('TUIContact.ID') }}：{{ application.applicant }}
        </div>
        <div class="contact-group-application-info__intro">
          {{ applicationText }}
        </div>
      </div>
      <Avatar
        :alt="displayName"
        size="xl"
      />
    </div>
    <div class="contact-group-application-info__rows">
      <div class="contact-group-application-info__row">
        <div class="contact-group-application-info__row-label">
          {{ t('TUIContact.Application note') }}：
        </div>
        <div class="contact-group-application-info__row-value">
          {{ application.note || t('TUIContact.None') }}
        </div>
      </div>
    </div>
    <div
      v-if="showActions"
      class="contact-group-application-info__actions"
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
import { computed } from 'vue';
import { useUIKit, TUIButton } from '@tencentcloud/uikit-base-component-vue3';
import { useContactListState } from '../../../../states/ContactListState';
import { Avatar } from '../../../Avatar';
import type { GroupApplication, GroupApplicationInfoProps } from '../../../../types/contact';

const props = withDefaults(defineProps<GroupApplicationInfoProps>(), {
  showActions: true,
});

const emit = defineEmits<{
  accept: [application: GroupApplication];
  refuse: [application: GroupApplication];
  groupApplicationAction: [action: 'accept' | 'refuse', application: GroupApplication];
  close: [];
}>();

const { t } = useUIKit();
const { acceptGroupApplication, refuseGroupApplication } = useContactListState();

const displayName = computed(() => props.application.applicantNick || props.application.applicant);
const groupName = computed(() => props.application.groupName || props.application.groupID);
const applicationText = computed(() =>
  props.application.applicationType === 0
    ? `${t('TUIContact.Apply to join group')}"${groupName.value}"`
    : `${t('TUIContact.Invite you to join group')}"${groupName.value}"`,
);

const handleAccept = () => {
  emit('accept', props.application);
  emit('groupApplicationAction', 'accept', props.application);
  acceptGroupApplication({ application: props.application });
  emit('close');
};

const handleRefuse = () => {
  emit('refuse', props.application);
  emit('groupApplicationAction', 'refuse', props.application);
  refuseGroupApplication({ application: props.application });
  emit('close');
};
</script>

<style scoped lang="scss">
@use './GroupApplicationInfo.scss';
</style>
