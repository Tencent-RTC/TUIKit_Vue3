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
        <div class="contact-search-group-info__intro">
          {{ t('TUIContact.Group type') }}：{{ getGroupTypeName(group.type) }}
        </div>
        <div class="contact-search-group-info__intro">
          {{ t('TUIContact.Group introduction') }}：{{ group.introduction || t('TUIContact.No introduction') }}
        </div>
      </div>
      <Avatar
        :src="group.avatar"
        :alt="displayName"
        size="xl"
      />
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
        type="primary"
        size="big"
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
import ChatEngine from '@tencentcloud/chat-uikit-engine';
import { useUIKit, TUIButton } from '@tencentcloud/uikit-base-component-vue3';
import { useContactListState } from '../../../../states/ContactListState';
import { Avatar } from '../../../Avatar';
import { TEXTAREA_LENGTH_LIMIT } from '../../constants/const';
import type { SearchGroupInfoProps } from '../../../../types/contact';
import type { GroupModel } from '../../../../types/engine';
import type { IGroupModel } from '@tencentcloud/chat-uikit-engine';

const props = withDefaults(defineProps<SearchGroupInfoProps>(), {
  showActions: true,
});

const emit = defineEmits<{
  joinGroup: [group: GroupModel, note: string];
}>();

const { t } = useUIKit();
const { joinGroup } = useContactListState();

const note = ref('');
const loading = ref(false);
const status = ref<'idle' | 'success' | 'error'>('idle');
const errorMessage = ref('');

const displayName = computed(() => props.group.name || props.group.groupID);

const statusClasses = computed(() => [
  'contact-search-group-info__status',
  `contact-search-group-info__status--${status.value}`,
]);

const getGroupTypeName = (type: IGroupModel['type']) => {
  switch (type) {
    case ChatEngine.TYPES.GRP_WORK:
      return t('TUIContact.Work group');
    case ChatEngine.TYPES.GRP_PUBLIC:
      return t('TUIContact.Public group');
    case ChatEngine.TYPES.GRP_MEETING:
      return t('TUIContact.Meeting group');
    case ChatEngine.TYPES.GRP_AVCHATROOM:
      return t('TUIContact.Live group');
    case ChatEngine.TYPES.GRP_COMMUNITY:
      return t('TUIContact.Community');
    default:
      return t('TUIContact.Unknown');
  }
};

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
    await joinGroup({
      groupID: props.group.groupID,
      applyMessage,
    });
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
