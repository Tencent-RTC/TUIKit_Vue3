<template>
  <div
    class="sidebar-wrapper"
    :class="{
      'is-hidden': sidebarIsHidden
    }"
  >
    <!-- Narrow screen collapse button (outside sidebar to avoid clip-path) -->
    <button class="sidebar-trigger__hide" @click="hideSidebar"></button>
    <button class="sidebar-trigger__show" @click="showSidbar"></button>

    <div class="sidebar">
      <div class="sidebar-inner">

      <!-- Related Documents Section -->
      <div class="sidebar-section">
        <p class="sidebar-section__title">{{ t('sidebar.experienceFlow') }}</p>
        <div class="sidebar-doc-list">
          <a
            v-for="item in experienceList?.src"
            :key="(item as any).nameKey || item.name"
            :href="item.url"
            target="_blank"
            class="sidebar-doc-item"
            @click="onDocLinkClick(item.url, (item as any).nameKey || item.name)"
          >
            <component :is="getDocIcon((item as any).nameKey)" :size="16" class="sidebar-doc-item__icon" />
            <span class="sidebar-doc-item__text">{{ (item as any).nameKey ? t((item as any).nameKey) : item.name }}</span>
          </a>
          <a
            v-if="experienceList?.consolePanel?.isShow"
            :href="experienceList.consolePanel.url"
            target="_blank"
            class="sidebar-doc-item"
            @click="onConsolePanelClick(experienceList.consolePanel.url)"
          >
            <ExternalLink :size="16" class="sidebar-doc-item__icon" />
            <span class="sidebar-doc-item__text">{{ t('sidebar.enterProductConsole') }}</span>
          </a>
        </div>
      </div>

      <!-- Extended Capabilities Section -->
      <div v-if="experienceList?.extendedCapabilities?.isShow" class="sidebar-section">
        <p class="sidebar-section__title">{{ t('sidebar.extendedCapabilities') }}</p>
        <div class="sidebar-capability-list">
          <div
            v-for="item in experienceList?.extendedCapabilities.items"
            :key="item.id"
            class="sidebar-capability-item"
          >
            <div class="sidebar-capability-item__header">
              <component :is="getCapabilityIcon(item.id)" class="sidebar-capability-item__icon" />
              <span class="sidebar-capability-item__name">{{ (item as any).nameKey ? t((item as any).nameKey) : item.name }}</span>
            </div>
            <div class="sidebar-capability-item__platforms">
              <button
                v-for="(url, platform) in item.platformDocs"
                :key="platform"
                class="sidebar-capability-item__platform-btn"
                @click="onPlatformBtnClick(item.id, String(platform), String(url))"
              >
                {{ t(`sidebar.platform.${platform}`) }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Mobile Experience Section -->
      <div v-if="experienceList?.mobileExperience?.isShow" class="sidebar-section">
        <button
          class="sidebar-section__title sidebar-section__title--toggle"
          :class="{ 'sidebar-section__title--expanded': mobileExpanded }"
          @click="mobileExpanded = !mobileExpanded"
        >
          <span>{{ t('sidebar.mobileExperience') }}</span>
          <ChevronUp :size="16" :class="['sidebar-section__arrow', { 'sidebar-section__arrow--collapsed': !mobileExpanded }]" />
        </button>
        <div v-show="mobileExpanded" class="sidebar-mobile-content">
          <div class="sidebar-mobile-cards">
            <div
              v-for="item in experienceList?.mobileExperience.items"
              :key="item.id"
              class="sidebar-mobile-card"
              @mouseenter="onMobileExperienceView(item.id, (item as any).nameKey ? t((item as any).nameKey) : item.name)"
            >
              <div class="sidebar-mobile-card__qrcode">
                <img :src="item.qrcodeUrl" :alt="item.name" />
              </div>
              <div class="sidebar-mobile-card__info">
                <component :is="getPlatformIcon(item.id)" class="sidebar-mobile-card__platform-icon" />
                <span class="sidebar-mobile-card__name">{{ (item as any).nameKey ? t((item as any).nameKey) : item.name }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Latest Activity Section -->
      <div v-if="experienceList?.choose?.isShow" class="sidebar-section">
        <div class="sidebar-promo" @click="toRescue(experienceList?.choose.url)">
          <img class="sidebar-promo__bg" src="../../../assets/images/Mask-group.png" alt="" />
          <div class="sidebar-promo__content">
            <h4 class="sidebar-promo__title">{{ t('sidebar.latestActivity') }}</h4>
            <p class="sidebar-promo__desc">{{ changeText() }}</p>
            <span class="sidebar-promo__link">{{ t('sidebar.buyNow') }} ›</span>
          </div>
        </div>
      </div>

    </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, toRef } from 'vue';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import {
  BookOpen,
  Code,
  Zap,
  HelpCircle,
  FileText,
  ExternalLink,
  ChevronUp,
} from 'lucide-vue-next';
import {
  CALLKIT_SIDEBAR_CONFIG,
  ROOMKIT_SIDEBAR_CONFIG,
  LIVE_SIDEBAR_CONFIG,
  CHATKIT_SIDEBAR_CONFIG,
} from '@/constants';
import { IconAndroid, IconApple, IconMiniProgram, IconCall, IconChat, IconAudio, IconSignal } from '@/components/Icon';
// Aegis data reporting (remove for GitHub demo)
import { reportLinkClick, reportQrcodeView } from '@/utils/aegis';
import { SCENE_ID_TO_AEGIS_SCENE, AEGIS_LINK_TYPES, AEGIS_SIDEBARS, AEGIS_PAGES } from '@/constants/aegis';

const { t } = useUIKit();

const props = defineProps(['activeScene']);
const activeSceneRef = toRef(props, 'activeScene');

const mobileExpanded = ref(false);

const sceneDataMap: Record<string, any> = {
  callkit: CALLKIT_SIDEBAR_CONFIG,
  roomkit: ROOMKIT_SIDEBAR_CONFIG,
  live: LIVE_SIDEBAR_CONFIG,
  chatkit: CHATKIT_SIDEBAR_CONFIG,
};

const experienceList = computed(() => sceneDataMap[activeSceneRef.value]);

// Doc icon mapping by nameKey
const getDocIcon = (nameKey: string) => {
  const iconMap: Record<string, any> = {
    'sidebar.docs.productIntro': BookOpen,
    'sidebar.docs.quickStart': Zap,
    'sidebar.docs.apiReference': Code,
    'sidebar.docs.apiOverview': Code,
    'sidebar.docs.faq': HelpCircle,
  };
  return iconMap[nameKey] || FileText;
};

// Capability icon mapping by id (same icons as Bar tab icons)
const getCapabilityIcon = (id: string) => {
  const iconMap: Record<string, any> = {
    call: IconCall,
    room: IconAudio,
    live: IconSignal,
    chat: IconChat,
  };
  return iconMap[id] || FileText;
};

// Mobile platform icon mapping
const getPlatformIcon = (platform: string) => {
  const iconMap: Record<string, any> = {
    android: IconAndroid,
    ios: IconApple,
    miniprogram: IconMiniProgram,
  };
  return iconMap[platform] || IconAndroid;
};

const toRescue = (url: string) => {
  const aegisScene = SCENE_ID_TO_AEGIS_SCENE[props.activeScene] || props.activeScene;
  reportLinkClick(AEGIS_SIDEBARS.SIDEBAR, aegisScene, AEGIS_LINK_TYPES.EXTERNAL_LINK, url);
  window.open(url, '_blank');
};

const changeText = () => {
  switch (props.activeScene) {
    case 'callkit':
    case 'chatkit':
      return t('sidebar.firstPurchaseDiscount');
    case 'pusher':
    case 'liveability':
      return t('sidebar.livePlatformDiscount');
    case 'qcloudclass':
      return t('sidebar.firstPurchase5Discount');
    default:
      return t('sidebar.firstPurchaseDiscount');
  }
};

const onDocLinkClick = (url: string, _name: string) => {
  const aegisScene = SCENE_ID_TO_AEGIS_SCENE[props.activeScene] || props.activeScene;
  reportLinkClick(AEGIS_SIDEBARS.SIDEBAR, aegisScene, AEGIS_LINK_TYPES.DOC, url);
};

const onConsolePanelClick = (url: string) => {
  const aegisScene = SCENE_ID_TO_AEGIS_SCENE[props.activeScene] || props.activeScene;
  reportLinkClick(AEGIS_SIDEBARS.SIDEBAR, aegisScene, AEGIS_LINK_TYPES.CONSOLE, url);
};

const onCapabilityPlatformClick = (capabilityId: string, platform: string, url: string) => {
  const aegisScene = SCENE_ID_TO_AEGIS_SCENE[props.activeScene] || props.activeScene;
  reportLinkClick(AEGIS_SIDEBARS.SIDEBAR, aegisScene, capabilityId, platform, url);
};

const onPlatformBtnClick = (capabilityId: string, platform: string, url: string) => {
  onCapabilityPlatformClick(capabilityId, platform, url);
  window.open(url, '_blank');
};

const onMobileExperienceView = (platformId: string, _platformName: string) => {
  const aegisScene = SCENE_ID_TO_AEGIS_SCENE[props.activeScene] || props.activeScene;
  reportQrcodeView(AEGIS_PAGES.DETAIL, aegisScene, platformId);
};

// Narrow screen toggle
const sidebarIsHidden = ref(true);
const showSidbar = () => { sidebarIsHidden.value = false; };
const hideSidebar = () => { sidebarIsHidden.value = true; };
</script>

<style scoped lang="scss">
.sidebar-wrapper {
  position: relative;
}

.sidebar {
  height: 100%;
  background-color: #ffffff;

  &-inner {
    box-sizing: border-box;
    width: 240px;
    height: 100%;
    padding: 0 10px 0 20px;
    overflow-x: hidden;
    overflow-y: auto;
    position: relative;
    z-index: 1;
    background: #fff;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }
}

/* ============ Section ============ */
.sidebar-section {
  padding-bottom: 16px;
  margin-bottom: 16px;
  border-bottom: 1px solid #eaf0fa;

  &:last-child {
    border-bottom: none;
    margin-bottom: 0;
  }
}

.sidebar-section__title {
  color: #000;
  font-size: 14px;
  font-weight: 600;
  line-height: 24px;
  margin: 0 0 12px;
  padding: 0;
}

.sidebar-section__title--toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  background: none;
  border: none;
  cursor: pointer;
  font-family: inherit;
  text-align: left;
  margin-bottom: 0;

  &.sidebar-section__title--expanded {
    margin-bottom: 12px;
  }
}

.sidebar-section__arrow {
  color: #999;
  transition: transform 0.25s ease;

  &--collapsed {
    transform: rotate(180deg);
  }
}

/* ============ Doc List ============ */
.sidebar-doc-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.sidebar-doc-item {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: var(--uikit-color-theme-6, #1c66e5);
  font-size: 14px;

  &__icon {
    flex-shrink: 0;
    color: #999;
  }

  &:hover &__icon {
    color: #1c66e5;
  }

  &__text {
    line-height: 1.4;
  }
}

/* ============ Capability List ============ */
.sidebar-capability-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.sidebar-capability-item {
  &__header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
  }

  &__icon {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
    color: #555;
  }

  &__name {
    font-size: 14px;
    font-weight: 500;
    color: #333;
  }

  &__platforms {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  &__platform-btn {
    padding: 2px 8px;
    font-size: 12px;
    border: none;
    color: var(--uikit-color-theme-6, #1c66e5);
    background: #e8f3ff;
    border-radius: 20px;
    text-decoration: none;
    transition: all .2s ease;
    cursor: pointer;
    line-height: 20px;

    &:hover {
      background: var(--uikit-color-theme-6, #1c66e5);
      color: #fff;
    }
  }
}

/* ============ Mobile Experience ============ */
.sidebar-mobile-content {
  &__tip {
    font-size: 12px;
    color: #999;
    margin: 0 0 12px;
  }
}

.sidebar-mobile-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.sidebar-mobile-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 8px;
  background: #fff;
  border: 1px solid #eaf0fa;
  border-radius: 8px;
  transition: all 0.2s;

  &:hover {
    border-color: #1c66e5;
    box-shadow: 0 2px 8px rgba(28, 102, 229, 0.1);
  }

  &__qrcode {
    width: 72px;
    height: 72px;
    margin-bottom: 8px;

    img {
      width: 100%;
      height: 100%;
      border-radius: 4px;
    }
  }

  &__info {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  &__platform-icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }

  &__name {
    font-size: 13px;
    font-weight: 500;
    color: #333;
  }
}

/* ============ Promo Card ============ */
.sidebar-promo {
  position: relative;
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;

  &__bg {
    width: 100%;
    display: block;
  }

  &__content {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 14px;
    box-sizing: border-box;
  }

  &__title {
    font-size: 14px;
    font-weight: 600;
    color: #000;
    margin: 0 0 4px;
  }

  &__desc {
    font-size: 12px;
    color: rgba(0, 0, 0, 0.6);
    margin: 0 0 4px;
  }

  &__link {
    font-size: 12px;
    color: #1c66e5;
    font-weight: 400;
  }
}

/* ============ Narrow Screen Toggle ============ */
.sidebar-trigger__hide,
.sidebar-trigger__show {
  display: none;
  position: absolute;
  left: 100%;
  top: 12px;
  border-width: 0;
  border-top-right-radius: 6px;
  border-bottom-right-radius: 6px;
  background: #fff;
  filter: drop-shadow(3px 3px 6px rgba(0, 0, 0, 0.05));
  box-sizing: border-box;
  padding: 12px;
  width: 40px;
  color: #000;
  font-size: 14px;
  font-weight: 500;
  line-height: 16px;
  text-align: center;
  cursor: pointer;

  &:before {
    content: '';
    display: block;
    margin: 0 auto 4px;
    width: 16px;
    height: 16px;
    background: url('../../../assets/images/sidebar/trigger-show.svg') no-repeat;
  }

  &:hover {
    color: #1c66e5;

    &:before {
      background-image: url('../../../assets/images/sidebar/trigger-show-hover.svg');
    }
  }
}

.sidebar-trigger__hide {
  font-size: 0;
  line-height: 0;
  padding: 12px 8px;
  width: auto;

  &:before {
    margin-bottom: 0;
    background: url('../../../assets/images/sidebar/trigger-hide.svg') no-repeat;
  }

  &:hover {
    &:before {
      background-image: url('../../../assets/images/sidebar/trigger-hide-hover.svg');
    }
  }
}

@media screen and (max-width: 1680px) {
  .sidebar-trigger__hide {
    position: absolute;
    z-index: 100;
    display: block;
    transition: opacity 0.3s ease-in-out;
  }

  .sidebar-trigger__show {
    position: absolute;
    z-index: 100;
    display: block;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s ease-in-out;
  }

  .sidebar {
    box-shadow: 0px 8px 8px 0px #e9f0fb;
    overflow: hidden;
    transition: width 0.3s ease-in-out;
    width: 240px;
  }

  .sidebar .sidebar-inner {
    transition: transform 0.3s ease-in-out;
  }

  .is-hidden {
    .sidebar {
      width: 0;
    }

    .sidebar-inner {
      box-shadow: none;
      transform: translateX(-240px);
    }

    .sidebar-trigger__hide {
      opacity: 0;
      pointer-events: none;
    }

    .sidebar-trigger__show {
      opacity: 1;
      pointer-events: auto;
    }
  }
}
</style>
