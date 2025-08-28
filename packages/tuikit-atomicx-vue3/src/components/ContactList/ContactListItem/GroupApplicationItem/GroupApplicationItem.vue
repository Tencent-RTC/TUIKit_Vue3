<template>
  <div
    :class="groupApplicationItemClasses"
    @click="handleClick"
    @keydown.enter="handleClick"
    @keydown.space="handleClick"
  >
    <div class="groupApplicationItem__avatar">
      <Avatar
        :alt="displayName"
      />
    </div>
    <div class="groupApplicationItem__content">
      <div class="groupApplicationItem__name">
        {{ displayName }}
      </div>
      <div class="groupApplicationItem__text">
        {{ applicationText }}
      </div>
    </div>
    <div class="groupApplicationItem__actions">
      <TUIButton
        type="primary"
        size="small"
        @click.stop="handleAction('accept', $event)"
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
import type { GroupApplicationItemProps } from '../../../../types/contact';

const props = withDefaults(defineProps<GroupApplicationItemProps>(), {});

const emit = defineEmits<{
  click: [application: any];
  action: [action: 'accept' | 'refuse', application: any];
}>();

const { t } = useUIKit();
const { acceptGroupApplication } = useContactListState();

const displayName = computed(() => props.application.applicantNick || props.application.applicant);
const groupName = computed(() => props.application.groupName || props.application.groupID);
const applicationText = computed(() =>
  props.application.applicationType === 0
    ? `${t('TUIContact.Apply to join group')}"${groupName.value}"`
    : `${t('TUIContact.Invite you to join group')}"${groupName.value}"`,
);

const groupApplicationItemClasses = computed(() => [
  'groupApplicationItem',
  {
    'groupApplicationItem--active': props.isActive,
  },
]);

const handleClick = () => {
  emit('click', props.application);
};

const handleAction = (action: 'accept' | 'refuse', event: Event) => {
  event.stopPropagation();
  acceptGroupApplication({ application: props.application });
  emit('action', action, props.application);
};
</script>

<style scoped lang="scss">
@import './GroupApplicationItem.scss';
</style>
