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
        <div class="contact-friend-info__intro">
          {{ t('TUIContact.Personal signature') }}：{{ friend?.selfSignature || '' }}
        </div>
      </div>
      <Avatar
        :src="friend.avatar"
        :alt="displayName"
        size="xl"
      />
    </div>

    <div class="contact-friend-info__rows">
      <div class="contact-friend-info__row">
        <div class="contact-friend-info__row-label">
          {{ t('TUIContact.Remark name') }}
        </div>
        <div class="contact-friend-info__row-value">
          <template v-if="isEditing">
            <TUIInput
              v-model="remarkInput"
              :max-length="32"
              :disabled="remarkLoading"
              auto-focus
              @blur="handleRemarkSave"
              @keydown.enter="handleRemarkSave"
            />
            <TUIButton
              size="small"
              type="primary"
              :loading="remarkLoading"
              @click="handleRemarkSave"
            >
              {{ t('TUIContact.Save') }}
            </TUIButton>
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
        type="default"
        size="big"
        color="red"
        @click="visible = true;"
      >
        {{ t('TUIContact.Delete friend') }}
      </TUIButton>
      <TUIButton
        type="primary"
        size="big"
        @click="handleSendMessage"
      >
        {{ t('TUIContact.Send message') }}
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
import { computed, ref, watch } from 'vue';
import { useUIKit, TUIButton, TUIInput, TUISwitch, IconEditNameCard, TUIDialog } from '@tencentcloud/uikit-base-component-vue3';
import { useContactListState } from '../../../../states/ContactListState';
import { useConversationListState } from '../../../../states/ConversationListState';
import { Avatar } from '../../../Avatar';
import type { Friend, FriendInfoProps } from '../../../../types';

const props = withDefaults(defineProps<FriendInfoProps>(), {
  showActions: true,
});

const emit = defineEmits<{
  close: [];
  sendMessage: [friend: Friend];
  deleteFriend: [friend: Friend];
  addToBlacklist: [friend: Friend];
  updateFriendRemark: [friend: Friend, remark: string];
}>();

const { t } = useUIKit();
const {
  deleteFriend,
  addToBlacklist,
  removeFromBlacklist,
  setFriendRemark,
  blackList,
} = useContactListState();
const { setActiveConversation } = useConversationListState();

const isEditing = ref(false);
const currentUserID = ref('');
const remark = ref(props.friend.remark || '');
const remarkInput = ref(props.friend.remark || '');
const remarkLoading = ref(false);
const blackLoading = ref(false);
const visible = ref(false);

watch(() => props.friend.remark, (newRemark) => {
  remark.value = newRemark || '';
  remarkInput.value = newRemark || '';
});

watch(() => props.friend.userID, () => {
  if (props.friend.userID !== currentUserID.value) {
    isEditing.value = false;
  }
  currentUserID.value = props.friend.userID;
});

const displayName = computed(() => remark.value || props.friend?.nick || props.friend.userID);

const isBlacklisted = computed(() => blackList.value.some(item => item.userID === props.friend.userID));

const startEditRemark = () => {
  remarkInput.value = remark.value;
  isEditing.value = true;
};

const handleRemarkSave = async () => {
  if (remarkInput.value.trim() === remark.value) {
    isEditing.value = false;
    return;
  }

  remarkLoading.value = true;
  try {
    await setFriendRemark({ userID: props.friend.userID, remark: remarkInput.value.trim() });
    remark.value = remarkInput.value.trim();
    isEditing.value = false;
    emit('updateFriendRemark', { ...props.friend, remark: remarkInput.value.trim() }, remarkInput.value.trim());
  } catch (err) {
    console.error('[ContactInfo setFriendRemark] error', err);
  } finally {
    remarkLoading.value = false;
  }
};

const handleBlacklistChange = async (checked: string | number | boolean) => {
  blackLoading.value = true;
  try {
    if (checked) {
      await addToBlacklist([props.friend.userID]);
      emit('addToBlacklist', props.friend);
    } else {
      await removeFromBlacklist([props.friend.userID]);
    }
  } catch (err) {
    console.error(`[ContactInfo ${checked ? 'addToBlacklist' : 'removeFromBlacklist'}] error`, err);
  } finally {
    blackLoading.value = false;
  }
};

const handleDeleteFriend = async () => {
  try {
    await deleteFriend({ userIDList: [props.friend.userID] });
    emit('deleteFriend', props.friend);
  } catch (err) {
    console.error('[ContactInfo deleteFriend] error', err);
  }

  visible.value = false;
  emit('close');
};

const handleSendMessage = () => {
  emit('sendMessage', props.friend);
  setActiveConversation(`C2C${props.friend.userID}`);
  emit('close');
};
</script>

<style scoped lang="scss">
@import './FriendInfo.scss';
</style>
