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
      </div>
      <div class="contact-blacklist-info__avatar-wrap">
        <Avatar
          :src="profile?.avatar"
          :alt="displayName"
          :size="48"
        />
      </div>
    </div>

    <div class="contact-blacklist-info__rows">
      <div class="contact-blacklist-info__row">
        <div class="contact-blacklist-info__row-label">
          {{ t('TUIContact.Personal signature') }}
        </div>
        <div class="contact-blacklist-info__row-value">
          <span class="contact-blacklist-info__intro">
            {{ profile?.selfSignature || t('TUIContact.None') }}
          </span>
        </div>
      </div>
    </div>

    <div
      v-if="showActions"
      class="contact-blacklist-info__actions"
    >
      <TUIButton
        class="contact-blacklist-info__button--primary"
        type="primary"
        size="big"
        radius="round"
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
import { ContactItemType } from '../../../../types/contact';
import { Avatar } from '../../../Avatar';
import { useContactList } from '../../hooks';
import type { BlacklistInfoProps, UserProfile } from '../../../../types/contact';

const props = withDefaults(defineProps<BlacklistInfoProps>(), {
  showActions: true,
});

const emit = defineEmits<{
  removeFromBlacklist: [profile: UserProfile];
  close: [];
}>();

const { t } = useUIKit();
const { friendList, removeFromBlacklist } = useContactListState();
const { setActiveContact } = useContactList();

const displayName = computed(() => props.profile?.nick || props.profile?.userID);

const handleRemoveFromBlacklist = async () => {
  try {
    await removeFromBlacklist([props.profile?.userID]);
    const friend = friendList.value.find(item => item.userID === props.profile?.userID);

    if (friend) {
      setActiveContact({
        type: ContactItemType.FRIEND,
        data: friend,
      });
    } else {
      setActiveContact(undefined);
      emit('close');
    }

    emit('removeFromBlacklist', props.profile);
  } catch (err) {
    console.error('[ContactInfo removeFromBlacklist] error', err);
  }
};
</script>

<style scoped lang="scss">
@use './BlacklistInfo.scss';
</style>
