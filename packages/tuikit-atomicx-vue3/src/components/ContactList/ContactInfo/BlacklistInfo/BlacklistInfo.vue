<template>
  <div class="contact-blacklist-info">
    <div class="contact-blacklist-info__header">
      <div class="contact-blacklist-info__main-info">
        <div class="contact-blacklist-info__name">
          {{ displayName }}
        </div>
        <div class="contact-blacklist-info__id">
          {{ t('TUIContact.ID') }}：{{ profile?.userID }}
        </div>
        <div class="contact-blacklist-info__intro">
          {{ t('TUIContact.Personal signature') }}：{{ profile?.selfSignature || '' }}
        </div>
      </div>
      <Avatar
        :src="profile?.avatar"
        :alt="displayName"
        size="xl"
      />
    </div>

    <div
      v-if="showActions"
      class="contact-blacklist-info__actions"
    >
      <TUIButton
        type="primary"
        size="big"
        @click="handleRemoveFromBlacklist"
      >
        {{ t('TUIContact.Remove from blacklist') }}
      </TUIButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useUIKit, TUIButton } from '@tencentcloud/uikit-base-component-vue3';
import { useContactListState } from '../../../../states/ContactListState';
import { Avatar } from '../../../Avatar';
import type { BlacklistInfoProps, UserProfile } from '../../../../types/contact';

const props = withDefaults(defineProps<BlacklistInfoProps>(), {
  showActions: true,
});

const emit = defineEmits<{
  removeFromBlacklist: [profile: UserProfile];
  close: [];
}>();

const { t } = useUIKit();
const { removeFromBlacklist } = useContactListState();

const displayName = computed(() => props.profile?.nick || props.profile?.userID);

const handleRemoveFromBlacklist = async () => {
  try {
    await removeFromBlacklist([props.profile?.userID]);
    emit('removeFromBlacklist', props.profile);
    emit('close');
  } catch (err) {
    console.error('[ContactInfo removeFromBlacklist] error', err);
  }
};
</script>

<style scoped lang="scss">
@use './BlacklistInfo.scss';
</style>
