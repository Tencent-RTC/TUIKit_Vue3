<template>
  <div class="login-page">
    <!-- Header Navigation -->
    <header class="login-header">
      <div class="header-left" @click="router.replace('/')">
        <img :src="headerLogo" alt="logo" class="header-logo" />
        <img :src="language === 'en-US' ? headerTitleEn : headerTitle" alt="title" class="header-title" />
        <span class="header-divider">|</span>
        <span class="header-subtitle">{{ t('header.subtitle') }}</span>
      </div>
      <div class="header-right">
        <div class="language-switcher" @click.stop="toggleLanguageMenu">
          <img class="language-icon" :src="iconLanguage" />
          <span class="language-text">{{ currentLanguageName }}</span>
          <IconArrowStrokeSelectDown :class="['dropdown-icon', { active: showLanguageMenu }]" />
        </div>
        <div v-if="showLanguageMenu" class="language-dropdown" @click.stop>
          <div
            v-for="lang in availableLanguages"
            :key="lang.code"
            class="language-option"
            :class="{ active: lang.code === currentLanguage }"
            @click="changeLanguage(lang.code)"
          >
            {{ lang.nativeName }}
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="login-main">
      <!-- Left Illustration Area -->
      <div class="illustration-area">
        <img
          :src="bannerImage"
          alt="Banner"
          loading="lazy"
        />
      </div>

      <!-- Right Login Form Area -->
      <div class="login-form-area">
        <div class="login-card">
          <h1 class="login-title">{{ t('header.subtitle') }}</h1>
            <form class="login-form" @submit.prevent="submitForm">
              <div class="form-group">
                <div class="form-row">
                  <label for="sdkappid">{{ t('login.sdkAppIdLabel') }}</label>
                  <div class="input-container">
                    <input 
                      type="text" 
                      id="sdkappid"
                      v-model="ruleForm.SDKAppID" 
                      class="input-field"
                      :class="{ 'input-error': error.SDKAppID }"
                      :placeholder="t('login.sdkAppIdPlaceholder')"
                      autocomplete="off"
                    />
                    <span class="error-text" v-if="error.SDKAppID">{{ error.SDKAppID }}</span>
                  </div>
                </div>
                <div class="form-row">
                  <label for="secretkey">{{ t('login.secretKeyLabel') }}</label>
                  <div class="input-container">
                    <input 
                      type="text" 
                      id="secretkey"
                      v-model="ruleForm.secretKey" 
                      class="input-field"
                      :class="{ 'input-error': error.secretKey }"
                      :placeholder="t('login.secretKeyPlaceholder')"
                      autocomplete="off"
                    />
                    <span class="error-text" v-if="error.secretKey">{{ error.secretKey }}</span>
                  </div>
                </div>
                <div class="form-row">
                  <label for="userid">{{ t('login.userIdLabel') }}</label>
                  <div class="input-container">
                    <input 
                      type="text" 
                      id="userid"
                      v-model="ruleForm.userID" 
                      class="input-field"
                      :class="{ 'input-error': error.userID }"
                      :placeholder="t('login.userIdPlaceholder')"
                      autocomplete="off"
                    />
                    <span class="error-text" v-if="error.userID">{{ error.userID }}</span>
                  </div>
                </div>
              </div>

              <TUIButton type="primary" class="submit-button">
                {{ t('login.submit') }}
              </TUIButton>
            </form>
        </div>
      </div>
    </main>

    <!-- Footer Disclaimer -->
    <footer class="login-footer">
      <div class="footer-disclaimer">{{ t('login.copyright') }}</div>
    </footer>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useLoginState } from '@tencentcloud/chat-uikit-vue3';
import { useUIKit, IconArrowStrokeSelectDown, TUIButton } from '@tencentcloud/uikit-base-component-vue3';
import { genTestUserSig } from '../../debug';
import { useRoute, useRouter } from 'vue-router';
import headerLogo from '@/assets/images/logo-icon.png';
import headerTitle from '@/assets/images/logo-title.png';
import headerTitleEn from "@/assets/images/logo-title-en.png";
import bannerImage from '@/assets/images/main.png';
import iconLanguage from '@/assets/icons/svg/icon-language.svg';
import TUIChatEngine from '@tencentcloud/chat-uikit-engine-lite';

const { login } = useLoginState();
const { t, setLanguage, language } = useUIKit();
const route = useRoute();
const router = useRouter();
const ruleForm = ref({
  SDKAppID: 0,
  userID: '',
  secretKey: '',
});
const error = ref({
  SDKAppID: '',
  userID: '',
  secretKey: '',
});

const showLanguageMenu = ref(false);

const availableLanguages = [
  { code: 'zh-CN', name: '中文', nativeName: '简体中文' },
  { code: 'en-US', name: 'English', nativeName: 'English' },
];

const currentLanguage = computed(() => language.value);
const currentLanguageName = computed(() => {
  const lang = availableLanguages.find(l => l.code === currentLanguage.value);
  return lang ? lang.nativeName : '简体中文';
});

const toggleLanguageMenu = () => {
  showLanguageMenu.value = !showLanguageMenu.value;
};

const changeLanguage = (code: string) => {
  setLanguage(code);
  showLanguageMenu.value = false;
};

const handleClickOutside = () => {
  showLanguageMenu.value = false;
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  TUIChatEngine.setLogLevel(1);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

const submitForm = async () => {
  const { SDKAppID, userID, secretKey } = ruleForm.value;
  if (!SDKAppID) {
    error.value.SDKAppID = t('login.sdkAppIdRequired');
    return;
  } else if (!secretKey) {
    error.value.secretKey = t('login.secretKeyRequired');
    return;
  } else if (!userID) {
    error.value.userID = t('login.userIdRequired');
    return;
  }
  const { userSig } = genTestUserSig({
    SDKAppID: Number(SDKAppID),
    userID,
    secretKey,
  });
  login({
    sdkAppId: Number(SDKAppID),
    userId: userID,
    userSig,
  }).then(() => {
    localStorage.setItem('userInfo', JSON.stringify({
      SDKAppID: Number(SDKAppID),
      userID,
      userSig,
    }));
    router.push({ path: '/detail', query: route.query });
  }).catch((error: Error) => {
    console.error('Login failed:', error);
  });
};
</script>

<style scoped lang="scss">
.login-page {
  min-height: 100vh;
  // background: linear-gradient(180deg, #e8f4ff 0%, #f5f9ff 50%, #ffffff 100%);
  background: linear-gradient(180deg, #e8effc, #dae5fa);
  display: flex;
  flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

// Header Styles
.login-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 40px;
  background: transparent;
  box-sizing: 0 -1 0 0 #FFFFFF99;
  position: relative;
  z-index: 100;

  .header-left {
    display: flex;
    align-items: center;
    gap: 8px;

    .header-logo {
      height: 36px;
      width: auto;
    }

    .header-title {
      height: 36px;
      width: auto;
    }

    .header-divider {
      color: #C1C9DC;
      font-size: 20px;
      margin: 0 8px;
    }

    .header-subtitle {
      font-size: 20px;
      color: #000;
      font-weight: 500;
      letter-spacing: 1px;
    }
  }

  .header-right {
    position: relative;

    .language-switcher {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      cursor: pointer;
      border-radius: 8px;
      transition: background-color 0.2s;

      &:hover {
        background: rgba(0, 0, 0, 0.04);
      }

      .language-icon {
        color: #475467;
      }

      .language-text {
        font-size: 16px;
        color: #000;
      }

      .dropdown-icon {
        color: #475467;
        transition: transform 0.2s;

        &.active {
          transform: rotate(180deg);
        }
      }
    }

    .language-dropdown {
      position: absolute;
      top: 100%;
      right: 0;
      margin-top: 4px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
      overflow: hidden;
      min-width: 120px;
      z-index: 1000;

      .language-option {
        padding: 10px 16px;
        font-size: 14px;
        color: #475467;
        cursor: pointer;
        transition: background-color 0.2s;

        &:hover {
          background: #f5f9ff;
        }

        &.active {
          background: #e8f4ff;
          color: #1677ff;
          font-weight: 500;
        }
      }
    }
  }
}

.login-form-area {
  min-width: 400px;
}

// Main Content Styles
.login-main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 80px;
  gap: 80px;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

// Illustration Area Styles
.illustration-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  min-height: 500px;
}

.login-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  padding: 40px;
  width: 100%;

  .login-title {
    font-size: 28px;
    font-weight: 600;
    color: #1677ff;
    text-align: center;
    margin: 0 0 32px 0;
    letter-spacing: 2px;
  }
}


.login-form {
  padding: 10px 0;
  display: flex;
  flex-direction: column;
  gap: 20px
}

.form-row {
  display: flex;
  align-items: center;
  padding: 5px 0;
}

label {
  width: 80px;
  font-weight: 500;
  color: var(--text-color-primary);
  font-size: 14px;
  text-align: right;
  padding-right: 15px;
  flex-shrink: 0;
}

.input-container {
  flex: 1;
}

.input-field {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid var(--stroke-color-primary);
  border-radius: 8px;
  font-size: 16px;
  box-sizing: border-box;
  height: 46px;
  transition: all 0.3s ease;
  color: var(--text-color-primary);
  background-color: var(--bg-color-input);
  line-height: 22px;
}

.input-field:focus {
  outline: none;
  border-color: var(--button-color-primary-default);
  background-color: var(--bg-color-input);
  box-shadow: 0 0 0 2px var(--uikit-color-theme-1);
}

.input-field::placeholder {
  color: var(--text-color-tertiary);
  font-size: 14px;
}

.input-error {
  border-color: var(--text-color-error);

  &:focus {
    box-shadow: 0 0 0 2px var(--uikit-color-red-1);
  }
}

.error-text {
  display: block;
  color: var(--text-color-error);
  font-size: 12px;
  margin-top: 6px;
}

// Footer Disclaimer Styles
.login-footer {
  padding: 24px 40px;
  text-align: center;

  .footer-disclaimer {
    font-size: 14px;
    color: #667085;
  }
}
</style>
