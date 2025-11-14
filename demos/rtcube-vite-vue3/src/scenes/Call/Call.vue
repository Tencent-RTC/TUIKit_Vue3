<template>
  <div class="call-page">
    <div v-if="!isCalling" class="call-lobby">
      <div class="lobby-header">
        <h2>📞 {{ t('call.title') }}</h2>
        <p>{{ t('call.subtitle') }}</p>
      </div>

      <div class="call-setup">
        <div class="setup-card">
          <h3>🔧 {{ t('call.settings') }}</h3>

          <div class="form-group">
            <label>{{ t('call.callMode') }}</label>
            <div class="radio-group">
              <label class="radio-item">
                <input
                  v-model="callMode"
                  type="radio"
                  value="single"
                >
                <span>{{ t('call.singleCall') }}</span>
              </label>
              <label class="radio-item">
                <input
                  v-model="callMode"
                  type="radio"
                  value="group"
                >
                <span>{{ t('call.groupCall') }}</span>
              </label>
            </div>
          </div>

          <div v-if="callMode === 'single'" class="form-group">
            <label>{{ t('call.calleeUserId') }}</label>
            <div class="user-input-container">
              <div class="input-row">
                <input
                  v-model="calleeUserID"
                  type="text"
                  :placeholder="t('call.calleeUserIdPlaceholder')"
                  class="user-id-input"
                >
              </div>
              <div v-if="inputError && callMode === 'single'" class="input-error">
                {{ inputError }}
              </div>
            </div>
          </div>

          <div v-if="callMode === 'group'" class="form-group">
            <label>{{ t('call.addUserId') }} ({{ selectedFriends.length }}/{{ maxGroupCallMembers }} {{ t('call.people') }}):</label>

            <div class="user-input-container">
              <div class="input-row">
                <input
                  v-model="userIdInput"
                  type="text"
                  :placeholder="t('call.userIdPlaceholder')"
                  class="user-id-input"
                  @keyup.enter="addUserId"
                  @input="clearInputError"
                >
                <button
                  class="add-user-btn"
                  :disabled="!userIdInput.trim() || selectedFriends.length >= maxGroupCallMembers"
                  @click="addUserId"
                >
                  {{ t('add') }}
                </button>
              </div>
              <div v-if="inputError && callMode === 'group'" class="input-error">
                {{ inputError }}
              </div>
            </div>

            <div v-if="selectedFriends.length > 0" class="selected-users-section">
              <div class="selected-users-header">
                {{ t('call.selectedUsers') }}
              </div>
              <div class="user-tags-container">
                <div
                  v-for="userId in selectedFriends"
                  :key="userId"
                  class="user-tag"
                >
                  <span class="user-tag-text">{{ userId }}</span>
                  <button class="remove-user-btn" @click="removeUserId(userId)">
                    ×
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label>{{ t('call.callType') }}</label>
            <div class="radio-group">
              <label class="radio-item">
                <input
                  v-model="callType"
                  type="radio"
                  :value="TUICallType.AUDIO_CALL"
                >
                <span>{{ t('call.audioCall') }}</span>
              </label>
              <label class="radio-item">
                <input
                  v-model="callType"
                  type="radio"
                  :value="TUICallType.VIDEO_CALL"
                >
                <span>{{ t('call.videoCall') }}</span>
              </label>
            </div>
          </div>
          <button
            class="call-btn"
            :disabled="!canMakeCall || isInitializing"
            @click="makeCall"
          >
            {{ isInitializing ? t('call.initializing') : getCallButtonText() }}
          </button>
        </div>
      </div>
    </div>
    <div v-show="isCalling" class="callkit-container">
      <TUICallKit
        :beforeCalling="handleBeforeCalling"
        :afterCalling="handleAfterCalling"
      />
    </div>
    <TUIDialog
      :visible="showExitConfirm"
      appendTo="body"
      :title="t('call.confirmExit')"
      :content="t('call.exitConfirmMessage')"
      @confirm="confirmExit"
      @cancel="cancelExit"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { TUICallKit, TUICallKitServer, TUICallType } from '@tencentcloud/call-uikit-vue';
import { TUIDialog, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { onBeforeRouteLeave } from 'vue-router';

const { t } = useUIKit();

const isCalling = ref(false);
const isInitializing = ref(false);
const calleeUserID = ref('');
const callType = ref(TUICallType.VIDEO_CALL);
const callMode = ref('single'); // 'single' | 'group'
const selectedFriends = ref<string[]>([]);
const maxGroupCallMembers = ref(8);
const userIdInput = ref('');
const inputError = ref('');

const showExitConfirm = ref(false);
const pendingNavigation = ref<(() => void) | null>(null);

const canMakeCall = computed(() => {
  if (callMode.value === 'single') {
    return calleeUserID.value.trim() !== '';
  }
  return selectedFriends.value.length > 0 && selectedFriends.value.length <= maxGroupCallMembers.value;
});

const clearInputError = () => {
  inputError.value = '';
};

watch(callMode, () => {
  calleeUserID.value = '';
  selectedFriends.value = [];
  clearInputError();
});

onBeforeRouteLeave((to, from, next) => {
  if (isCalling.value && to.name !== from.name) {
    showExitConfirm.value = true;
    pendingNavigation.value = () => next();
    return;
  }
  next();
});

const confirmExit = () => {
  showExitConfirm.value = false;
  if (isCalling.value) {
    TUICallKitServer.hangup();
    isCalling.value = false;
  }
  if (pendingNavigation.value) {
    pendingNavigation.value();
    pendingNavigation.value = null;
  }
};

// 取消退出
const cancelExit = () => {
  showExitConfirm.value = false;
  pendingNavigation.value = null;
};

const makeCall = async () => {
  try {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const currentUserID = userInfo.userID;
    let userIDList: string[] = [];

    if (callMode.value === 'single') {
      userIDList = [calleeUserID.value];
    } else {
      userIDList = selectedFriends.value;
    }

    if (userIDList.includes(currentUserID)) {
      inputError.value = t('call.cannotCallSelf');
      return;
    }

    await TUICallKitServer.calls({
      userIDList,
      type: callType.value,
    });
  } catch (error) {
    console.error(t('call.callFailed'), error);
  }
};

const handleBeforeCalling = () => {
  console.warn('handleBeforeCalling', 123);
  isCalling.value = true;
};

const handleAfterCalling = () => {
  isCalling.value = false;
};

const addUserId = () => {
  const userId = userIdInput.value.trim();

  if (!userId) {
    inputError.value = t('call.pleaseEnterUserId');
    return;
  }

  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const currentUserID = userInfo.userID;

  if (userId === currentUserID) {
    inputError.value = t('call.cannotAddSelf');
    return;
  }

  if (selectedFriends.value.includes(userId)) {
    inputError.value = t('call.userAlreadyAdded');
    return;
  }

  if (selectedFriends.value.length >= maxGroupCallMembers.value) {
    inputError.value = t('call.maxUsersReached', { count: maxGroupCallMembers.value });
    return;
  }

  selectedFriends.value.push(userId);
  userIdInput.value = '';
  inputError.value = '';
};

const removeUserId = (userId: string) => {
  const index = selectedFriends.value.indexOf(userId);
  if (index > -1) {
    selectedFriends.value.splice(index, 1);
  }
};

const getCallButtonText = () => {
  if (callMode.value === 'single') {
    return t('call.makeCall');
  }
  if (selectedFriends.value.length === 0) {
    return t('call.pleaseAddUsers');
  }
  return `${t('call.makeGroupCall')} (${selectedFriends.value.length}${t('call.people')})`;
};

</script>

<style scoped lang="scss">
.call-page {
  flex: 1;
  display: flex;
}

.callkit-container {
  flex: 1;
  padding: 10% 15%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.call-lobby {
  flex: 1;
  padding: 40px;
  max-width: 1200px;
  margin: 0 auto;
  overflow-y: auto;
}

.lobby-header {
  text-align: center;
  margin-bottom: 40px;

  h2 {
    font-size: 32px;
    margin-bottom: 10px;
    color: #333;
  }

  p {
    font-size: 18px;
    color: #666;
    margin: 0 0 20px 0;
  }
}

.call-setup {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 30px;
  margin-bottom: 50px;
}

.setup-card {
  background: white;
  padding: 30px;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);

  h3 {
    font-size: 20px;
    margin-bottom: 20px;
    color: #333;
  }
}

.form-group {
  margin-bottom: 20px;

  label {
    display: block;
    margin-bottom: 8px;
    font-weight: 600;
    color: #333;
  }
}

.input-field {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.3s ease;

  &:focus {
    outline: none;
    border-color: #667eea;
  }

  &::placeholder {
    color: #a0aec0;
  }
}

.radio-group {
  display: flex;
  gap: 20px;
}

.radio-item {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;

  input[type="radio"] {
    margin: 0;
  }

  span {
    font-size: 16px;
    color: #333;
  }
}

.user-input-container {
  margin-bottom: 20px;
}

.input-row {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 8px;
}

.user-id-input {
  flex: 1;
  padding: 10px 12px;
  border: 2px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s ease;

  &:focus {
    outline: none;
    border-color: #667eea;
  }

  &::placeholder {
    color: #a0aec0;
  }
}

.add-user-btn {
  padding: 10px 16px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;

  &:hover:not(:disabled) {
    background: #5a67d8;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.input-error {
  color: #e53e3e;
  font-size: 12px;
  margin-top: 4px;
}

.selected-users-section {
  margin-top: 16px;
}

.selected-users-header {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.user-tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.user-tag {
  display: inline-flex;
  align-items: center;
  background: #e3f2fd;
  border: 1px solid #2196f3;
  border-radius: 20px;
  padding: 6px 12px;
  font-size: 14px;
  color: #1976d2;
  gap: 6px;
}

.user-tag-text {
  font-weight: 500;
}

.remove-user-btn {
  background: none;
  border: none;
  color: #1976d2;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  padding: 0;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background: #1976d2;
    color: white;
  }
}

.call-btn {
  width: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 14px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}
</style>
