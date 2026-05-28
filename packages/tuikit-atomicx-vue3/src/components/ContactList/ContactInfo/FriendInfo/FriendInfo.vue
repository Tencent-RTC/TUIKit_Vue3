<template>
  <div class="contact-friend-info">
    <div class="contact-friend-info__header">
      <div class="contact-friend-info__main-info">
        <div class="contact-friend-info__name">
          {{ displayName }}
        </div>
        <div class="contact-friend-info__id">
          {{ t('TUIContact.ID') }}：{{ friend.userID }}
        </div>
      </div>
      <div class="contact-friend-info__avatar-wrap">
        <Avatar
          :src="friend.avatarURL"
          :alt="displayName"
          :size="48"
        />
      </div>
    </div>

    <div class="contact-friend-info__rows">
      <div class="contact-friend-info__row">
        <div class="contact-friend-info__row-label">
          {{ t('TUIContact.Remark name') }}
        </div>
        <div class="contact-friend-info__row-value">
          <template v-if="isEditing">
            <div class="contact-friend-info__remark-editor">
              <TUIInput
                ref="remarkInputRef"
                v-model="remarkInput"
                :max-length="32"
                :disabled="remarkLoading"
                @blur="handleRemarkSave"
                @keydown.enter="handleRemarkSave"
              />
              <TUIButton
                size="small"
                type="primary"
                radius="round"
                :loading="remarkLoading"
                @click="handleRemarkSave"
              >
                {{ t('TUIContact.Save') }}
              </TUIButton>
            </div>
          </template>
          <template v-else>
            <span class="remark-edit">
              {{ remark || t('TUIContact.None') }}
            </span>
            <IconEditNameCard
              class="remark-edit-icon"
              @click="startEditRemark"
            />
          </template>
        </div>
      </div>

      <div class="contact-friend-info__row">
        <div class="contact-friend-info__row-label">
          {{ t('TUIContact.Personal signature') }}
        </div>
        <div class="contact-friend-info__row-value">
          <span class="contact-friend-info__signature">
            {{ friend?.aboutMe || t('TUIContact.None') }}
          </span>
        </div>
      </div>

      <div class="contact-friend-info__row contact-friend-info__row--center">
        <div class="contact-friend-info__row-label">
          {{ t('TUIContact.Add to blacklist') }}
        </div>
        <div class="contact-friend-info__row-value">
          <TUISwitch
            v-model="isBlacklisted"
            :disabled="blackLoading"
            @change="handleBlacklistChange"
          />
        </div>
      </div>
    </div>

    <div
      v-if="showActions"
      class="contact-friend-info__actions"
    >
      <TUIButton
        class="contact-friend-info__button--primary"
        type="primary"
        size="big"
        radius="round"
        @click="handleSendMessage"
      >
        {{ t('TUIContact.Send message') }}
      </TUIButton>
      <TUIButton
        class="contact-friend-info__button--secondary"
        type="default"
        size="big"
        radius="round"
        color="red"
        @click="visible = true;"
      >
        {{ t('TUIContact.Delete friend') }}
      </TUIButton>
      <TUIDialog
        :visible="visible"
        :title="t('TUIContact.Confirm delete friend')"
        :confirm-text="t('TUIContact.Submit')"
        :cancel-text="t('TUIContact.Cancel')"
        @confirm="handleDeleteFriend"
        @cancel="visible = false;"
        @close="visible = false;"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue';
import {
  useUIKit,
  TUIButton,
  TUIInput,
  TUISwitch,
  IconEditNameCard,
  TUIDialog,
} from '@tencentcloud/uikit-base-component-vue3';
import { useChatContext, useContactStore } from '../../../../chat-store';
import { Avatar } from '../../../Avatar';
import type { ContactInfo } from '@atomicxcore/core';
import type { FriendInfoProps } from '../../../../types/contact';

const props = withDefaults(defineProps<FriendInfoProps>(), {
  showActions: true,
});

const emit = defineEmits<{
  close: [];
  sendMessage: [friend: ContactInfo];
  deleteFriend: [friend: ContactInfo];
  addToBlacklist: [friend: ContactInfo];
  updateFriendRemark: [friend: ContactInfo, remark: string];
}>();

const { t } = useUIKit();
const {
  blackList,
  deleteFriend,
  addToBlacklist,
  removeFromBlacklist,
  setFriendRemark,
} = useContactStore();

const { setActiveConversation } = useChatContext(props.channel);

const isEditing = ref(false);
const currentUserID = ref('');
const remark = ref(props.friend.friendRemark || '');
const remarkInput = ref(props.friend.friendRemark || '');
const remarkInputRef = ref<any>(null);
const remarkLoading = ref(false);
const blackLoading = ref(false);
const visible = ref(false);

watch(() => props.friend.friendRemark, (newRemark) => {
  remark.value = newRemark || '';
  remarkInput.value = newRemark || '';
});

watch(() => props.friend.userID, () => {
  if (props.friend.userID !== currentUserID.value) {
    isEditing.value = false;
  }
  currentUserID.value = props.friend.userID;
});

const displayName = computed(() => remark.value || props.friend?.nickname || props.friend.userID);

const isBlacklisted = computed(() =>
  blackList.value.some(item => item.userID === props.friend.userID),
);

const startEditRemark = () => {
  remarkInput.value = remark.value;
  isEditing.value = true;
  nextTick(() => {
    const el = remarkInputRef.value?.$el?.querySelector('input') as HTMLInputElement | null;
    el?.focus();
  });
};

const handleRemarkSave = async () => {
  const trimmed = remarkInput.value.trim();
  if (trimmed === remark.value) {
    isEditing.value = false;
    return;
  }

  remarkLoading.value = true;
  try {
    await setFriendRemark(props.friend.userID, trimmed);
    remark.value = trimmed;
    isEditing.value = false;
    emit('updateFriendRemark', { ...props.friend, friendRemark: trimmed }, trimmed);
  } catch (err) {
    console.error('[FriendInfo setFriendRemark] error', err);
  } finally {
    remarkLoading.value = false;
  }
};

const handleBlacklistChange = async (checked: string | number | boolean) => {
  blackLoading.value = true;
  try {
    if (checked) {
      await addToBlacklist(props.friend.userID);
      emit('addToBlacklist', props.friend);
    } else {
      await removeFromBlacklist(props.friend.userID);
    }
  } catch (err) {
    console.error(`[FriendInfo ${checked ? 'addToBlacklist' : 'removeFromBlacklist'}] error`, err);
  } finally {
    blackLoading.value = false;
  }
};

const handleDeleteFriend = async () => {
  try {
    await deleteFriend(props.friend.userID);
    emit('deleteFriend', props.friend);
  } catch (err) {
    console.error('[FriendInfo deleteFriend] error', err);
  }

  visible.value = false;
  emit('close');
};

const handleSendMessage = async () => {
  emit('sendMessage', props.friend);
  const conversationID = `C2C${props.friend.userID}`;
  setActiveConversation(conversationID);
  emit('close');
};
</script>

<style scoped lang="scss">
@use './FriendInfo.scss';
</style>
