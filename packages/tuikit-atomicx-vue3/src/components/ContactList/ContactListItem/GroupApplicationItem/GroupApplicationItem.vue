<template>
  <div
    :class="groupApplicationItemClasses"
    @click="handleClick"
    @keydown.enter="handleClick"
    @keydown.space="handleClick"
  >
    <div class="groupApplicationItem__avatar">
      <Avatar
        :src="application.fromUserAvatarURL"
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
import { useGroupStore } from '../../../../chat-store';
import { Avatar } from '../../../Avatar';
import type { GroupApplicationInfo } from '@atomicxcore/core';
import type { GroupApplicationItemProps } from '../../../../types/contact';

const props = withDefaults(defineProps<GroupApplicationItemProps>(), {});

const emit = defineEmits<{
  click: [application: GroupApplicationInfo];
  action: [action: 'accept' | 'refuse', application: GroupApplicationInfo];
}>();

const { t } = useUIKit();
const { acceptApplication } = useGroupStore();

const displayName = computed(
  () => props.application.fromUserNickname || props.application.fromUser || '',
);
const groupName = computed(() => props.application.groupID);
const applicationText = computed(() =>
  // 'joinApprovedByAdmin' means the user requested to join; other types are invitations.
  props.application.type === 'joinApprovedByAdmin'
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

const handleAccept = async (event: Event) => {
  event.stopPropagation();
  try {
    await acceptApplication(props.application);
    emit('action', 'accept', props.application);
  } catch (err) {
    console.error('[GroupApplicationItem acceptApplication] error', err);
  }
};
</script>

<style scoped lang="scss">
@use './GroupApplicationItem.scss';
</style>
