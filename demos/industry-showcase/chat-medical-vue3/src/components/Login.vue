<script setup lang="ts">
import { ref } from 'vue';
import { useLoginState, useUIKit } from '@tencentcloud/chat-uikit-vue3';

const { login } = useLoginState();
const { t, language, setLanguage } = useUIKit();

const sdkAppId = ref('');
const userId = ref('');
const userSig = ref('');
const loading = ref(false);
const error = ref('');

const emit = defineEmits<{
  success: [];
  languageChange: [lng: string];
}>();

const toggleLanguage = () => {
  const next = language.value === 'zh-CN' ? 'en-US' : 'zh-CN';
  setLanguage(next);
  emit('languageChange', next);
};

const handleLogin = async () => {
  if (!sdkAppId.value || !userId.value || !userSig.value) {
    error.value = t('medical.login.error.emptyFields');
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    await login({
      sdkAppId: Number(sdkAppId.value),
      userId: userId.value,
      userSig: userSig.value,
      useUploadPlugin: true,
    });
    emit('success');
  } catch (err: any) {
    error.value = err?.message || t('medical.login.error.failed');
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <button class="lang-toggle" @click="toggleLanguage">
        {{ language === 'zh-CN' ? 'English' : '中文' }}
      </button>
      <div class="login-header">
        <h1 class="login-title">{{ t('medical.login.title') }}</h1>
        <p class="login-subtitle">{{ t('medical.login.subtitle') }}</p>
      </div>

      <div class="login-form">
        <div class="form-field">
          <label class="form-label">{{ t('medical.login.sdkAppId') }}</label>
          <input
            v-model="sdkAppId"
            class="form-input"
            type="text"
            :placeholder="t('medical.login.sdkAppIdPlaceholder')"
            @keyup.enter="handleLogin"
          />
        </div>

        <div class="form-field">
          <label class="form-label">{{ t('medical.login.userId') }}</label>
          <input
            v-model="userId"
            class="form-input"
            type="text"
            :placeholder="t('medical.login.userIdPlaceholder')"
            @keyup.enter="handleLogin"
          />
        </div>

        <div class="form-field">
          <label class="form-label">{{ t('medical.login.userSig') }}</label>
          <textarea
            v-model="userSig"
            class="form-input form-textarea"
            :placeholder="t('medical.login.userSigPlaceholder')"
            rows="3"
          />
        </div>

        <p v-if="error" class="form-error">{{ error }}</p>

        <button
          class="login-btn"
          :disabled="loading"
          @click="handleLogin"
        >
          {{ loading ? t('medical.login.loading') : t('medical.login.submit') }}
        </button>
      </div>

      <p class="login-hint">
        {{ t('medical.login.hint').split('<1>')[0] }}
        <a href="https://console.cloud.tencent.com/im" target="_blank">
          IM Console
        </a>
      </p>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #d1fae5 100%);
}

.login-card {
  width: 400px;
  padding: 40px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  position: relative;
}

.lang-toggle {
  position: absolute;
  top: 16px;
  right: 16px;
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  background: #f3f4f6;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.lang-toggle:hover {
  color: #0ABF77;
  background: rgba(10, 191, 119, 0.08);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-title {
  font-size: 24px;
  font-weight: 700;
  color: #0ABF77;
  margin: 0 0 8px;
}

.login-subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}

.form-input {
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
  font-family: inherit;
}

.form-input:focus {
  border-color: #0ABF77;
  box-shadow: 0 0 0 3px rgba(10, 191, 119, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 60px;
}

.form-error {
  color: #dc2626;
  font-size: 13px;
  margin: 0;
}

.login-btn {
  padding: 12px;
  background: #0ABF77;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.login-btn:hover:not(:disabled) {
  background: #09a868;
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-hint {
  text-align: center;
  font-size: 12px;
  color: #9ca3af;
  margin: 20px 0 0;
}

.login-hint a {
  color: #0ABF77;
  text-decoration: none;
}

.login-hint a:hover {
  text-decoration: underline;
}
</style>
