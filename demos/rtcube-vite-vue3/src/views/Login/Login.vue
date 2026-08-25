<template>
  <div class="login-page">
    <!-- Header Navigation -->
    <header class="login-header">
      <div class="header-left" @click="router.replace({ path: '/home', query: getFromQuery() })">
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
          alt="Banner图片"
          loading="lazy"
        />
      </div>

      <!-- Right Login Form Area -->
      <div class="login-form-area">
        <div class="login-card">
          <h1 class="login-title">{{ t('header.subtitle') }}</h1>
          <div class="login-suspense">
            <Suspense>
              <template #default>
                <Login
                  :SDKAppID="currentSDKAppID"
                  @login-callback="handleLoginCallback"
                />
              </template>
              <template #fallback>
                <div class="login-loading">
                  <t-loading size="large" />
                </div>
              </template>
          </Suspense>
          </div>
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
import { ref, computed, onMounted, onUnmounted, defineAsyncComponent } from 'vue';
import { useUIKit, IconArrowStrokeSelectDown } from '@tencentcloud/uikit-base-component-vue3';
import { useRoute, useRouter } from 'vue-router';

// Async load Login component to avoid blocking render
// The uikit-base-widget-vue3 package will be loaded in background
const Login = defineAsyncComponent(() =>
  import('@tencentcloud/uikit-base-widget-vue3').then((m) => m.Login) 
);
import headerLogo from '@/assets/images/logo-icon.png';
import headerTitle from '@/assets/images/logo-title.png';
import headerTitleEn from "@/assets/images/logo-title-en.png";
import bannerImage from '@/assets/images/main.png';
import iconLanguage from '@/assets/icons/svg/icon-language.svg';
import TUIChatEngine from '@tencentcloud/chat-uikit-engine-lite';
import { setSessionLoggedIn } from '@/utils';
import { getFromQuery } from '@/utils/from';

// Preloaded tuikit-atomicx-vue3 module reference
// The module is preloaded in background after login page renders
let atomicxModule: typeof import('tuikit-atomicx-vue3') | null = null;
let atomicxLoadPromise: Promise<typeof import('tuikit-atomicx-vue3')> | null = null;

/**
 * Preload tuikit-atomicx-vue3 module in the background.
 * This function starts loading immediately after login page renders,
 * so the module is ready when user clicks login button.
 */
const preloadAtomicxModule = () => {
  if (atomicxLoadPromise) return atomicxLoadPromise;
  
  atomicxLoadPromise = import('tuikit-atomicx-vue3').then((module) => {
    atomicxModule = module;
    return module;
  });
  
  return atomicxLoadPromise;
};

const { t, setLanguage, language } = useUIKit();
const route = useRoute();
const router = useRouter();

const SDK_APP_ID_MAP: Record<string, number> = {
  im: 1400187352,
  trtc: 1400704311,
};

const currentSDKAppID = ref(SDK_APP_ID_MAP[route.query.from as string] ?? SDK_APP_ID_MAP.im);
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
  
  // Preload tuikit-atomicx-vue3 in background after login page renders
  // This ensures the module is ready when user clicks login button
  preloadAtomicxModule();
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

interface LoginUserInfo {
  SDKAppID: number;
  userID: string;
  userSig: string;
}

const handleLoginCallback = async (userInfo: LoginUserInfo) => {
  const { SDKAppID, userID, userSig } = userInfo;
  
  try {
    // Use preloaded module if available, otherwise wait for it to load
    // The module should already be loaded since we started preloading on mount
    const module = atomicxModule || await preloadAtomicxModule();
    const { login } = module.useLoginState();
    
    await login({
      sdkAppId: SDKAppID,
      userId: userID,
      userSig,
    });
    
    // Mark session as logged in (independent of tuikit-atomicx-vue3)
    // This allows the home page to check login state without importing the SDK
    setSessionLoggedIn(true);
    localStorage.setItem('userInfo', JSON.stringify(userInfo));
    router.push({ path: '/detail', query: { ...route.query, ...getFromQuery() } });
  } catch (error) {
    console.error('Login failed:', error);
  }
};
</script>

<style lang="scss">
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
  min-width: 500px;
}

// Main Content Styles
.login-main {
  box-sizing: border-box;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 0 80px;
  gap: 80px;
}

.login-suspense {
  min-height: 300px;
  display: flex;
  flex-direction: column;
  .login-container {
    margin: 0;
  }
}

.login-loading {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

// Illustration Area Styles
.illustration-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  min-height: 500px;
  max-width: 1024px;

  img {
    flex: 1;
    width: 100%;
  }
}


// Floating elements
.floating-element {
  position: absolute;
  transition: all 0.3s ease;

  &.tablet {
    top: 10%;
    left: 5%;
    width: 80px;
    height: 100px;
    background: linear-gradient(135deg, #e6f0ff 0%, #c4d8ff 100%);
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(100, 150, 255, 0.25);
    transform: rotate(-15deg);

    .tablet-screen {
      position: absolute;
      top: 10%;
      left: 10%;
      width: 80%;
      height: 70%;
      background: linear-gradient(135deg, #4da6ff 0%, #66b3ff 100%);
      border-radius: 4px;
    }
  }

  &.phone {
    top: 5%;
    left: 25%;
    width: 50px;
    height: 80px;
    background: linear-gradient(135deg, #cce4ff 0%, #99caff 100%);
    border-radius: 10px;
    box-shadow: 0 6px 20px rgba(100, 150, 255, 0.2);
    transform: rotate(10deg);

    .phone-screen {
      position: absolute;
      top: 12%;
      left: 10%;
      width: 80%;
      height: 70%;
      background: linear-gradient(180deg, #66b3ff 0%, #3399ff 100%);
      border-radius: 4px;
    }
  }

  &.play-button {
    top: 15%;
    left: 0;
    width: 60px;
    height: 60px;
    background: linear-gradient(135deg, #4da6ff 0%, #1a8cff 100%);
    border-radius: 16px;
    box-shadow: 0 8px 24px rgba(26, 140, 255, 0.3);

    &::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 55%;
      transform: translate(-50%, -50%);
      width: 0;
      height: 0;
      border-left: 16px solid white;
      border-top: 10px solid transparent;
      border-bottom: 10px solid transparent;
    }
  }

  &.mic {
    bottom: 20%;
    left: 5%;
    width: 50px;
    height: 80px;
    background: linear-gradient(180deg, #66b3ff 0%, #3399ff 100%);
    border-radius: 25px 25px 10px 10px;
    box-shadow: 0 8px 24px rgba(51, 153, 255, 0.3);

    &::before {
      content: '';
      position: absolute;
      bottom: -20px;
      left: 50%;
      transform: translateX(-50%);
      width: 8px;
      height: 30px;
      background: #3399ff;
      border-radius: 4px;
    }

    &::after {
      content: '';
      position: absolute;
      bottom: -25px;
      left: 50%;
      transform: translateX(-50%);
      width: 30px;
      height: 8px;
      background: #3399ff;
      border-radius: 4px;
    }
  }

  &.music-note {
    top: 25%;
    right: 20%;
    width: 20px;
    height: 20px;
    background: #475467;
    border-radius: 50%;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

    &::before {
      content: '';
      position: absolute;
      top: -30px;
      right: 0;
      width: 3px;
      height: 30px;
      background: #475467;
    }

    &::after {
      content: '';
      position: absolute;
      top: -30px;
      right: 0;
      width: 15px;
      height: 8px;
      background: #475467;
      border-radius: 0 4px 4px 0;
    }
  }

  &.small-cube {
    bottom: 30%;
    right: 15%;
    width: 50px;
    height: 50px;
    background: linear-gradient(135deg, #4da6ff 0%, #1a8cff 100%);
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(26, 140, 255, 0.3);
    transform: rotate(15deg);
  }

  &.connection-box {
    bottom: 35%;
    right: 5%;
    width: 70px;
    height: 50px;
    background: linear-gradient(135deg, #66b3ff 0%, #4da6ff 100%);
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(77, 166, 255, 0.3);

    &::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 15%;
      transform: translateY(-50%);
      width: 25%;
      height: 60%;
      background: rgba(255, 255, 255, 0.6);
      border-radius: 4px;
    }

    &::after {
      content: '';
      position: absolute;
      top: 50%;
      right: 15%;
      transform: translateY(-50%);
      width: 25%;
      height: 60%;
      background: rgba(255, 255, 255, 0.6);
      border-radius: 4px;
    }
  }
}

.login-card {
  box-sizing: border-box;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  padding: 40px 20px 0;
  width: 100%;

  .login-title {
    font-size: 28px;
    font-weight: 600;
    color: #1677ff;
    text-align: center;
    letter-spacing: 2px;
  }
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
