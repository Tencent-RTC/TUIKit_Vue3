<template>
  <div class="rtcube-app-header">
    <div class="rtcube-app-header-left">
      <button
        class='rtcube-app-header-button'>
        <img :src="headerLogo" alt="" class="rtcube-app-header-logo" @click="goHome" />
        <img
          :src="currentLanguage === 'en-US' ? headerTitleEn : headerTitle"
          alt=""
          class="rtcube-app-header-title"
          @click="goHome"
        />
      </button>
      <p class="rtcube-app-header-word">{{ t('header.subtitle') }}</p>
    </div>
    <div class="rtcube-app-header-right">
      <div class="language-switcher-container" @click.stop>
        <div class="language-switcher" @click="toggleLanguageSwitcher">
          <img class="language-icon" :src="iconLanguage" />
          <span class="language-text">{{ currentLanguageName }}</span>
          <IconArrowStrokeSelectDown :class="['dropdown-icon', { active: showLanguageSwitcher }]" />
        </div>
        <div v-if="showLanguageSwitcher" class="language-dropdown" @click.stop>
          <div
            v-for="langItem in availableLanguages"
            :key="langItem.code"
            class="language-option"
            :class="{ active: langItem.code === currentLanguage }"
            @click="changeLanguage(langItem.code)"
          >
            {{ langItem.nativeName }}
          </div>
        </div>
      </div>
      <div class="user-info-container" @click.stop>
        <div class="user-info" @click="toggleUserMenu">
          <Avatar :src="loginUserInfo?.avatarUrl" />
          <div class="user-details">
            <div class="user-name">
              {{ loginUserInfo?.userName || loginUserInfo?.userId || 'Unknown User' }}
            </div>
          </div>
          <IconArrowStrokeSelectDown :class="{ 'dropdown-icon': true, active: showUserMenu }" />
        </div>

        <div
          v-if="showUserMenu"
          class="user-menu"
          @click.stop
        >
          <div class="user-menu-item logout" @click="logout()">
            <IconLogout />
            {{ t('logout') }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from "vue-router";
import { onMounted, onUnmounted, ref, computed } from "vue";
import headerLogo from "@/assets/images/logo-icon.png";
import headerTitle from "@/assets/images/logo-title.png";
import headerTitleEn from "@/assets/images/logo-title-en.png";
import iconLanguage from "@/assets/icons/svg/icon-language.svg";
import { useLoginState, Avatar } from '@tencentcloud/chat-uikit-vue3';
import {
  IconLogout,
  IconArrowStrokeSelectDown,
  useUIKit
 } from '@tencentcloud/uikit-base-component-vue3';

import "@/styles/web/header.scss";

const { loginUserInfo, logout: _logout, login } = useLoginState();

const router = useRouter();
const route = useRoute();
const showLanguageSwitcher = ref(false);
const availableLanguages = [
  { code: 'zh-CN', name: '中文', nativeName: '简体中文' },
  { code: 'en-US', name: 'English', nativeName: 'English' },
];
const { t, setLanguage, language } = useUIKit();

const currentLanguage = computed(() => language.value);
const currentLanguageName = computed(() => {
  const langItem = availableLanguages.find(l => l.code === currentLanguage.value);
  return langItem ? langItem.nativeName : '简体中文';
});

const toggleLanguageSwitcher = () => {
  showLanguageSwitcher.value = !showLanguageSwitcher.value;
};

const changeLanguage = (code: string) => {
  setLanguage(code);
  showLanguageSwitcher.value = false;
};

const goHome = () => {
  router.push("/home");
};


async function init() {
  try {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    if (userInfo.userID && !loginUserInfo.value?.userId) {
      const { SDKAppID, userID, userSig } = userInfo;
      await login({
        sdkAppId: SDKAppID,
        userId: userID,
        userSig,
        useUploadPlugin: true,
      });
    }
    if (!userInfo.userID && !loginUserInfo.value?.userId) {
      router.replace({ path: "/login", query: route.query });
      return;
    }
  } catch (error) {
    console.error('Login failed:', error);
    localStorage.removeItem('userInfo');
    router.replace({ path: "/login", query: route.query });
  }
}

function handleClickOutside() {
  if (showUserMenu.value) {
    showUserMenu.value = false;
  }
  if (showLanguageSwitcher.value) {
    showLanguageSwitcher.value = false;
  }
}


onMounted(() => {
  init();
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

const showUserMenu = ref(false);

function toggleUserMenu() {
  showUserMenu.value = !showUserMenu.value;
}

function closeUserMenu() {
  showUserMenu.value = false;
}

function logout() {
  closeUserMenu();
  _logout();
  localStorage.removeItem('userInfo');
  router.replace({ name: 'home' });
}

</script>
<style lang="scss" scoped>
.user-info-container {
  position: relative;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #f8fafc;
  }

  .user-details {
    display: flex;
    flex-direction: column;
    align-items: flex-start;

    .user-name {
      font-size: 14px;
      font-weight: 600;
      color: #1e293b;
      line-height: 1.2;
    }

    .user-id {
      font-size: 12px;
      color: #64748b;
      line-height: 1.2;
    }
  }

  .dropdown-icon {
    color: #64748b;
    transition: transform 0.2s ease;

    &.active {
      transform: rotate(180deg);
    }
  }
}

.user-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  min-width: 180px;
  z-index: 1000;
  overflow: hidden;

  .user-menu-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    cursor: pointer;
    transition: background-color 0.2s ease;
    font-size: 14px;
    color: #374151;

    &:hover {
      background: #f9fafb;
    }

    &.logout {
      color: #dc2626;

      &:hover {
        background: #fef2f2;
      }
    }

    svg {
      flex-shrink: 0;
    }
  }
}

.language-switcher-container {
  position: relative;
  margin-right: 16px;
}

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
</style>