<template>
  <div class="contact-search-user-info">
    <div class="contact-search-user-info__header">
      <div class="contact-search-user-info__main-info">
        <div class="contact-search-user-info__name">
          {{ displayName }}
        </div>
        <div class="contact-search-user-info__id">
          {{ t('TUIContact.ID') }}：{{ user.userID }}
        </div>
      </div>
      <div class="contact-search-user-info__avatar-wrap">
        <Avatar
          :src="user.avatar"
          :alt="displayName"
          :size="48"
        />
      </div>
    </div>

    <div class="contact-search-user-info__rows">
      <div class="contact-search-user-info__row">
        <div class="contact-search-user-info__row-label">
          {{ t('TUIContact.Personal signature') }}
        </div>
        <div class="contact-search-user-info__row-value">
          <span class="contact-search-user-info__intro">
            {{ user.selfSignature || t('TUIContact.None') }}
          </span>
        </div>
      </div>
    </div>

    <div
      v-if="status !== 'idle'"
      :class="[
        'contact-search-user-info__status',
        `contact-search-user-info__status--${status}`
      ]"
    >
      {{ status === 'success'
        ? t('TUIContact.Friend request sent, waiting for confirmation')
        : errorMessage }}
    </div>

    <div
      v-else
      class="contact-search-user-info__form"
    >
      <label class="contact-search-user-info__form-label">
        {{ t('TUIContact.Application info') }}
      </label>
      <div class="contact-search-user-info__form-input-wrapper">
        <textarea
          v-model="wording"
          class="contact-search-user-info__form-input"
          name="addFriendWording"
          :placeholder="t('TUIContact.Please enter application info...')"
          :maxlength="TEXTAREA_LENGTH_LIMIT"
        />
        <div class="contact-search-user-info__form-counter">
          {{ wording.length }}/{{ TEXTAREA_LENGTH_LIMIT }}
        </div>
      </div>
    </div>

    <div
      v-if="showActions && status !== 'success'"
      class="contact-search-user-info__actions"
    >
      <TUIButton
        class="contact-search-user-info__button--primary"
        type="primary"
        size="big"
        radius="round"
        :loading="loading"
        @click="handleAddFriend"
      >
        {{ t('TUIContact.Apply to add friend') }}
      </TUIButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useUIKit, TUIButton } from '@tencentcloud/uikit-base-component-vue3';
import { useContactListState } from '../../../../states/ContactListState';
import { Avatar } from '../../../Avatar';
import { TEXTAREA_LENGTH_LIMIT } from '../../constants/const';
import type { SearchUserInfoProps, UserProfile } from '../../../../types/contact';

const props = withDefaults(defineProps<SearchUserInfoProps>(), {
  showActions: true,
});

const emit = defineEmits<{
  addFriend: [user: UserProfile, wording: string];
  close: [];
}>();

const { t } = useUIKit();
const { addFriend } = useContactListState();

const wording = ref('');
const loading = ref(false);
const status = ref<'idle' | 'success' | 'error'>('idle');
const errorMessage = ref('');

const displayName = computed(() => props.user.nick || props.user.userID);

const handleAddFriend = async () => {
  if (loading.value) {
    return;
  }

  loading.value = true;
  status.value = 'idle';
  errorMessage.value = '';

  const addWording = wording.value.trim();
  emit('addFriend', props.user, addWording);
  try {
    await addFriend({
      userID: props.user.userID,
      addSource: 'AddSource_Type_Web',
      wording: addWording,
    });

    status.value = 'success';
  } catch (error: any) {
    status.value = 'error';
    errorMessage.value = error?.message || t('TUIContact.Add friend failed');
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped lang="scss">
@use './SearchUserInfo.scss';
</style>
