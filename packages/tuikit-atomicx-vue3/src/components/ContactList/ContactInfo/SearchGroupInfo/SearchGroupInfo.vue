<template>
  <div class="contact-search-group-info">
    <div class="contact-search-group-info__header">
      <div class="contact-search-group-info__main-info">
        <div class="contact-search-group-info__name">
          {{ displayName }}
        </div>
        <div class="contact-search-group-info__id">
          {{ t('TUIContact.Group ID') }}：{{ group.groupID }}
        </div>
      </div>
      <div class="contact-search-group-info__avatar-wrap">
        <Avatar
          :src="group.avatarURL"
          :alt="displayName"
          :size="48"
        />
      </div>
    </div>

    <div class="contact-search-group-info__rows">
      <div class="contact-search-group-info__row">
        <div class="contact-search-group-info__row-label">
          {{ t('TUIContact.Group type') }}
        </div>
        <div class="contact-search-group-info__row-value">
          {{ groupTypeName }}
        </div>
      </div>
    </div>

    <template v-if="status !== 'idle'">
      <div :class="statusClasses">
        {{ status === 'success'
          ? t('TUIContact.Group application sent, waiting for admin approval')
          : errorMessage }}
      </div>
    </template>
    <template v-else>
      <div class="contact-search-group-info__form">
        <label class="contact-search-group-info__form-label">
          {{ t('TUIContact.Application info') }}
        </label>
        <div class="contact-search-group-info__form-input-wrapper">
          <textarea
            v-model="note"
            class="contact-search-group-info__form-input"
            name="joinGroupNote"
            :placeholder="t('TUIContact.Please enter application info...')"
            :maxlength="TEXTAREA_LENGTH_LIMIT"
          />
          <div class="contact-search-group-info__form-counter">
            {{ note.length }}/{{ TEXTAREA_LENGTH_LIMIT }}
          </div>
        </div>
      </div>
    </template>

    <div
      v-if="showActions && status !== 'success'"
      class="contact-search-group-info__actions"
    >
      <TUIButton
        class="contact-search-group-info__button--primary"
        type="primary"
        size="big"
        radius="round"
        :loading="loading"
        @click="handleJoinGroup"
      >
        {{ t('TUIContact.Apply to join group') }}
      </TUIButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useUIKit, TUIButton } from '@tencentcloud/uikit-base-component-vue3';
import { useGroupStore } from '../../../../chat-store';
import { GroupType } from '@atomicxcore/core';
import { Avatar } from '../../../Avatar';
import { TEXTAREA_LENGTH_LIMIT } from '../../constants/const';
import type { GroupInfo } from '@atomicxcore/core';
import type { SearchGroupInfoProps } from '../../../../types/contact';

const props = withDefaults(defineProps<SearchGroupInfoProps>(), {
  showActions: true,
});

const emit = defineEmits<{
  joinGroup: [group: GroupInfo, note: string];
}>();

const { t } = useUIKit();
const { joinGroup } = useGroupStore();

const note = ref('');
const loading = ref(false);
const status = ref<'idle' | 'success' | 'error'>('idle');
const errorMessage = ref('');

const displayName = computed(() => props.group.groupName || props.group.groupID);

const statusClasses = computed(() => [
  'contact-search-group-info__status',
  `contact-search-group-info__status--${status.value}`,
]);

const groupTypeName = computed(() => {
  switch (props.group.groupType) {
    case GroupType.Work:
      return t('TUIContact.Work group');
    case GroupType.Public:
      return t('TUIContact.Public group');
    case GroupType.Meeting:
      return t('TUIContact.Meeting group');
    case GroupType.AVChatRoom:
      return t('TUIContact.Live group');
    case GroupType.Community:
      return t('TUIContact.Community');
    default:
      return t('TUIContact.Unknown');
  }
});

const handleJoinGroup = async () => {
  if (loading.value) {
    return;
  }

  loading.value = true;
  status.value = 'idle';
  errorMessage.value = '';

  const applyMessage = note.value.trim();
  emit('joinGroup', props.group, applyMessage);
  try {
    // New GroupStore.joinGroup signature: joinGroup(groupID, message?).
    await joinGroup(props.group.groupID, applyMessage);
    status.value = 'success';
  } catch (error: any) {
    status.value = 'error';
    errorMessage.value = error?.message || t('TUIContact.Apply to join group failed');
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped lang="scss">
@use './SearchGroupInfo.scss';
</style>
