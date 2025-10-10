<script setup lang="ts">
import { computed, onMounted, ref, onUnmounted } from 'vue';
import {
  IconLogout,
  IconArrowLeftNew,
  IconArrowRight,
  IconArrowStrokeSelectDown,
  IconLanguage,
  useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useLoginState, Avatar } from 'tuikit-atomicx-vue3';
import { useRoute, useRouter } from 'vue-router';
import Logo from '@/assets/RTCubeLogo.png';
import { getEnabledScenes, getDefaultScene } from '@/config';

const { login, logout: _logout, loginUserInfo } = useLoginState();
const { t, setLanguage, language } = useUIKit();

const route = useRoute();
const router = useRouter();

const scenes = getEnabledScenes();

const currentKey = computed<string>(() => (route.name as string) || getDefaultScene().key);

const isCollapsed = ref(false);
const showUserMenu = ref(false);
const isSceneReady = ref(false);
const showSDKSwitcher = ref(false);
const showLanguageSwitcher = ref(false);
const availableLanguages = [
  { code: 'zh-CN', name: '中文', nativeName: '中文' },
  { code: 'en-US', name: 'English', nativeName: 'English' },
];

function toggleSidebar() {
  isCollapsed.value = !isCollapsed.value;
}

function toggleUserMenu() {
  showUserMenu.value = !showUserMenu.value;
}

function closeUserMenu() {
  showUserMenu.value = false;
}

function switchScene(key: string) {
  if (key === currentKey.value) {
    return;
  }
  router.replace({ name: key });
}

function handleClickOutside() {
  if (showUserMenu.value) {
    showUserMenu.value = false;
  }
  if (showLanguageSwitcher.value) {
    showLanguageSwitcher.value = false;
  }
}

function getCurrentLanguageName() {
  const lang = availableLanguages.find(l => l.code === language.value);
  return lang ? lang.nativeName : 'Unknown';
}

function logout(isToggleSDKAppID?: boolean) {
  closeUserMenu();
  _logout();
  isSceneReady.value = false;
  localStorage.removeItem('userInfo');
  if (isToggleSDKAppID) {
    showSDKSwitcher.value = false;
    router.replace({ name: 'Login', params: { sceneId: currentKey.value } });
  } else {
    router.replace({ name: 'Home' });
  }
}

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
      throw new Error('No user info found');
    }
    isSceneReady.value = true;
  } catch (error) {
    console.error('Login failed:', error);
    logout();
  }
}

onMounted(() => {
  init();
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<template>
  <div class="stage-page">
    <header class="stage-header">
      <div class="stage-header__left">
        <img
          :src="Logo"
          alt="RTCube Logo"
          class="stage-header__logo"
          @click="router.replace('/')"
        >
        <span class="brand-text">All in one</span>
      </div>
      <div class="stage-header__right">
        <div class="language-switcher" @click.stop>
          <button class="language-btn" @click="showLanguageSwitcher = !showLanguageSwitcher">
            <IconLanguage />
            <span>{{ getCurrentLanguageName() }}</span>
            <IconArrowStrokeSelectDown :class="{ 'dropdown-icon': true, active: showLanguageSwitcher }" />
          </button>

          <div
            v-if="showLanguageSwitcher"
            class="language-menu"
            @click.stop
          >
            <div class="language-menu-header">
              {{ t('language.switch') }}
            </div>
            <div
              v-for="lang in availableLanguages"
              :key="lang.code"
              class="language-menu-item"
              :class="{ active: lang.code === language }"
              @click="setLanguage(lang.code)"
            >
              <span class="language-name">{{ lang.nativeName }}</span>
              <span v-if="lang.code === language" class="current-indicator">{{ t('language.current') }}</span>
            </div>
          </div>
        </div>

        <div class="user-info-container" @click.stop>
          <div class="user-info" @click="toggleUserMenu">
            <Avatar
              :src="loginUserInfo?.avatarUrl"
              :alt="loginUserInfo?.userName || loginUserInfo?.userId"
            />
            <div class="user-details">
              <div class="user-name">
                {{ loginUserInfo?.userName || loginUserInfo?.userId || 'Unknown User' }}
              </div>
              <div class="user-id">
                userID: {{ loginUserInfo?.userId || 'N/A' }}
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
    </header>

    <div class="stage-main">
      <aside class="stage-sidebar" :class="{ collapsed: isCollapsed }">
        <div class="sidebar-header">
          <div v-if="!isCollapsed" class="sidebar-title">
            {{ t('stages.sceneSelection') }}
          </div>
          <button class="collapse-btn" @click="toggleSidebar">
            <IconArrowLeftNew v-if="!isCollapsed" />
            <IconArrowRight v-else />
          </button>
        </div>
        <nav class="scene-nav">
          <button
            v-for="scene in scenes"
            :key="scene.key"
            class="scene-tab"
            :class="{
              active: scene.key === currentKey ||
                (scene.children && scene.children.some(child => child.key === currentKey))
            }"
            :title="isCollapsed ? scene.title : ''"
            @click="switchScene(scene.key)"
          >
            <div class="scene-tab__icon" :style="{ backgroundColor: scene.accent || '#64748b' }">
              <span v-if="!scene.icon" class="scene-tab__initial">{{ scene.title.charAt(0) }}</span>
              <span
                v-else
                class="scene-tab__initial"
                v-html="scene.icon"
              />
            </div>
            <div v-if="!isCollapsed" class="scene-tab__content">
              <div class="scene-tab__title">
                {{ scene.title }}
              </div>
              <div class="scene-tab__desc">
                {{ scene.description }}
              </div>
            </div>
          </button>
        </nav>
      </aside>

      <main class="stage-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.stage-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
}

.stage-header {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  &__left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__logo {
    height: 32px;
    cursor: pointer;
  }

  .brand-text {
    font-size: 20px;
    font-weight: 700;
    color: #1e293b;
    letter-spacing: 1px;
  }

  &__right {
    display: flex;
    align-items: center;
    position: relative;
  }
}

.stage-main {
  flex: 1;
  display: flex;
  min-height: 0;
}

.stage-sidebar {
  width: 320px;
  background: #ffffff;
  border-right: 1px solid #e2e8f0;
  padding: 24px 0;
  overflow-y: auto;
  transition: width 0.3s ease;

  &.collapsed {
    width: 80px;
  }

  .sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px 16px;

    .sidebar-title {
      font-size: 14px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .collapse-btn {
      background: none;
      border: none;
      color: #64748b;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      transition: all 0.2s ease;

      &:hover {
        background: #f1f5f9;
        color: #334155;
      }
    }
  }

  &.collapsed .sidebar-header {
    padding: 0 16px 16px;
    justify-content: center;
  }
}

.scene-nav {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0 16px;

  .stage-sidebar.collapsed & {
    padding: 0 8px;
  }
}

.scene-tab {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border: none;
  border-radius: 12px;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;

  &:hover {
    background: #f1f5f9;
    transform: translateX(4px);
  }

  &.active {
    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
    border: 1px solid #0ea5e9;
    box-shadow: 0 4px 12px rgba(14, 165, 233, 0.15);
  }

  &__initial {
    display: inline-block;
    width: 100%;
  }

  .stage-sidebar.collapsed & {
    padding: 12px;
    justify-content: center;
    gap: 0;

    &:hover {
      transform: none;
    }
  }

  &__icon {
    width: 48px;
    height: 48px;
    padding: 10px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 700;
    font-size: 18px;
    flex-shrink: 0;
  }

  &__content {
    flex: 1;
    min-width: 0;
  }

  &__title {
    font-size: 16px;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 4px;
  }

  &__desc {
    font-size: 13px;
    color: #64748b;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}

.stage-content {
  flex: 1;
  display: flex;
  background: #ffffff;
  min-height: 0;
  position: relative;

  .scene {
    flex: 1;
  }
}

.pill {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 36px;
  padding: 0 16px;
  border-radius: 12px;
  color: rgba(0,0,0,0.75);
  background:
    radial-gradient(120% 120% at 0% 0%, rgba(111,161,255,0.18), transparent 60%),
    linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(245,247,255,0.8) 100%);
  cursor: pointer;
  transition: transform .15s ease, box-shadow .2s ease, background .2s ease;
}
.pill:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 24px rgba(40,81,163,0.18), inset 0 1px 0 rgba(255,255,255,0.9);
}
.pill:active {
  transform: translateY(0);
  border: 2px solid rgba(0,0,0,0.8);
}
.pill.active {
  color: #0b121f;
  border: 2px solid #4172ea;
  box-shadow: 0 10px 24px rgba(64,160,120,0.25), inset 0 1px 0 rgba(255,255,255,0.85);
}

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

.language-switcher {
  position: relative;
  margin-right: 16px;

  .language-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 13px;
    color: #374151;

    &:hover {
      background: #f1f5f9;
      border-color: #cbd5e1;
    }

    .language-icon {
      font-size: 16px;
      line-height: 1;
    }

    .dropdown-icon {
      color: #64748b;
      transition: transform 0.2s ease;
      font-size: 12px;

      &.active {
        transform: rotate(180deg);
      }
    }
  }

  .language-menu {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 8px;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    min-width: 160px;
    z-index: 1000;
    overflow: hidden;

    .language-menu-header {
      padding: 12px 16px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      font-size: 12px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .language-menu-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      cursor: pointer;
      transition: background-color 0.2s ease;
      font-size: 14px;
      color: #374151;

      &:hover {
        background: #f9fafb;
      }

      &.active {
        background: #f0f9ff;
        color: #0369a1;

        .current-indicator {
          background: #0ea5e9;
          color: white;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
        }
      }

      .language-name {
        font-weight: 500;
      }

      .current-indicator {
        font-size: 11px;
        color: #64748b;
      }
    }
  }
}
</style>
