<template>
  <!--
    Hover profile card — shown when the user hovers the topbar user
    chip. Displays avatar, userId (with copy button), and inline-edit
    fields for userName and avatarUrl. Save calls setSelfInfo.
  -->
  <Transition name="user-card">
    <div v-if="visible" class="topbar__user-card">
      <div class="topbar__user-card-body">
        <img
          v-if="editAvatar || avatarUrl"
          :src="editAvatar || avatarUrl"
          class="topbar__user-card-avatar"
          alt=""
        />
        <span v-else class="topbar__user-card-avatar topbar__user-card-avatar--placeholder">
          {{ userInitial }}
        </span>
        <div class="topbar__user-card-fields">
          <div class="topbar__user-card-idrow">
            <code class="topbar__user-card-id">{{ userId }}</code>
            <button
              type="button"
              class="topbar__user-card-copy"
              :title="t('Common.Copy')"
              @click="copyUserId"
            >{{ userIdCopied ? t('Common.Copied') : t('Common.Copy') }}</button>
          </div>
          <label class="topbar__user-card-field">
            <span class="topbar__user-card-label">{{ t('Topbar.UserName') }}</span>
            <input
              v-model="editName"
              type="text"
              class="topbar__user-card-input"
              :placeholder="displayName"
            />
          </label>
          <label class="topbar__user-card-field">
            <span class="topbar__user-card-label">{{ t('Topbar.AvatarUrl') }}</span>
            <input
              v-model="editAvatar"
              type="text"
              class="topbar__user-card-input"
              :placeholder="avatarUrl || t('Topbar.AvatarPlaceholder')"
            />
          </label>
        </div>
      </div>
      <button
        type="button"
        class="topbar__user-card-save"
        :disabled="saving"
        @click="onSave"
      >{{ saving ? t('Common.Saving') : t('Common.Save') }}</button>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';

const props = defineProps<{
  visible: boolean;
  userId: string;
  userName: string;
  avatarUrl: string;
  userInitial: string;
  displayName: string;
  /** Saving state is controlled by the parent (async save). */
  saving: boolean;
}>();

const emit = defineEmits<{
  save: [payload: { userName: string; avatarUrl: string }];
}>();

const { t } = useUIKit();

const editName = ref('');
const editAvatar = ref('');
const userIdCopied = ref(false);

// Sync edit fields from props when the card becomes visible.
// Assumption: the user opens the card, edits, then saves/closes —
// we don't re-sync if loginUserInfo changes while the card is open.
watch(() => props.visible, (visible) => {
  if (visible) {
    editName.value = props.userName;
    editAvatar.value = props.avatarUrl;
  }
});

async function copyUserId(): Promise<void> {
  try {
    await navigator.clipboard.writeText(props.userId);
    userIdCopied.value = true;
    setTimeout(() => (userIdCopied.value = false), 1500);
  } catch {
    /* clipboard may be unavailable — silently no-op */
  }
}

function onSave(): void {
  emit('save', {
    userName: editName.value.trim() || props.displayName,
    avatarUrl: editAvatar.value.trim() || props.avatarUrl,
  });
}
</script>
