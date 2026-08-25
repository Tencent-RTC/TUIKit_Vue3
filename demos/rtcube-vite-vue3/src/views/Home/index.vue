<template>
  <div :class="classes">
    <Banner
      :title="t('home.bannerTitle')"
      :desc="t('home.bannerDesc')"
      type="renew"
    >
      <img
        :src="bannerImage"
        alt="Banner图片"
        loading="lazy"
      />
      <template #logo>
        <div class="home-header-left">
          <img :src="headerLogo" alt="logo" class="home-header-logo" />
          <img :src="language === 'en-US' ? headerTitleEn : headerTitle" alt="title" class="home-header-title" />
          <span class="home-header-divider">|</span>
          <span class="home-header-subtitle">{{ t('header.subtitle') }}</span>
        </div>
      </template>
    </Banner>
    <section class="pg-tiyan-home__content">
      <!-- Scene Experience Section -->
      <Section :title="t('home.sceneExperience')" type="renew">
        <Row :gutter="[20, 20]">
          <Col class="scene-item" :span="Math.max(4, 12 / experienceScene.length)" v-for="(item, index) in experienceScene" :key="index">
            <CardItem
              :url="item.url"
              :label="item.label"
              :title="item.title"
              :desc="item.desc"
              :alt="item.label"
              :sub-scenes="item.subScenes"
              type="renew"
              @click="toContent(item.scene)"
              @sub-scene-click="(subId: string) => toContent(item.scene, subId)"
            >
            </CardItem>
          </Col>
        </Row>
      </Section>

            <!-- Quick Access Section -->
      <Section :title="t('quickAccess.sectionTitle')" type="renew">
        <QuickAccess />
      </Section>

      <!-- Platform Experience Section -->
      <Section :title="t('platform.sectionTitle')" type="renew">
        <PlatformExperience />
      </Section>

      <!-- Footer Disclaimer -->
      <div class="footer">
        <div class="footer-disclaimer">{{ t('login.copyright') }}</div>
      </div>
    </section>
  </div>

  
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import { Row, Col } from "tdesign-vue-next";
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import headerLogo from '@/assets/images/logo-icon.png';
import headerTitle from '@/assets/images/logo-title.png';
import headerTitleEn from "@/assets/images/logo-title-en.png";
import bannerImage from '@/assets/images/main.png';
import {useRouter} from "vue-router";
import { Banner, Section, CardItem, PlatformExperience, QuickAccess } from '@/components';
import '@/components/pages/TiyanHomePage.scss';
// Aegis data reporting (remove for GitHub demo)
import { reportSceneSelect } from '@/utils/aegis';
import { SCENE_ID_TO_AEGIS_SCENE, AEGIS_PAGES } from '@/constants/aegis';
// Unified scene configuration
import { getEnabledScenes, type SceneConfig } from '@/constants';
// Use session login state to check if user has logged in during current session
// This avoids importing tuikit-atomicx-vue3 on the home page, reducing initial bundle size
import { isUserSessionLoggedIn } from '@/utils';
import { getFromQuery } from '@/utils/from';

import imageIndexCall from '../../assets/images/image-index-call.png';
import imageIndexMeeting from '../../assets/images/image-index-meeting.png';
import imageIndexChat from '../../assets/images/image-index-chat.png';
import imageIndexLive from '../../assets/images/image-index-live.png';

const router = useRouter();
const { t, language } = useUIKit();
const contentSwitchType = ref<'default' | 'all'>('default');


onMounted(() => {
  window.onscroll = () => {
    if (window.scrollY >= 300) {
      contentSwitchType.value = 'all';
    } else {
      contentSwitchType.value = 'default';
    }
  };
});


const prefixCls = "pg-tiyan-home";
const classes = computed(() => [prefixCls]);

// Scene image mapping
const sceneImageMap: Record<string, string> = {
  chatkit: imageIndexChat,
  callkit: imageIndexCall,
  roomkit: imageIndexMeeting,
  live: imageIndexLive,
};

// Get enabled scenes from unified configuration
const experienceScene = computed(() => 
  getEnabledScenes().map((config: SceneConfig) => ({
    url: sceneImageMap[config.scene] || '',
    label: t(config.labelKey),
    title: t(config.titleKey),
    desc: t(config.descKey),
    scene: config.scene,
    subScenes: config.subScenes?.map(sub => ({
      id: sub.id,
      label: t(sub.labelKey),
      desc: t(sub.descKey),
      isDefault: sub.isDefault,
    })),
  }))
);

const toContent = (scene: string, subScene?: string) => {
  // Report scene selection event (remove for GitHub demo)
  // ext1 format: "home | scene | subScene" (e.g., "home | chat | medical")
  const aegisScene = SCENE_ID_TO_AEGIS_SCENE[scene] || scene;
  reportSceneSelect(AEGIS_PAGES.HOME, aegisScene, subScene);

  const query: Record<string, string> = { scene, ...getFromQuery() };
  if (subScene) {
    query.subScene = subScene;
  }
  if (isUserSessionLoggedIn()) {
    router.push({ path: '/detail', query });
  } else {
    router.push({ path: '/login', query });
  }
}

</script>


<style lang="scss">
.pg-tiyan-home__content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.scene-item {
  display: flex;
  justify-content: center;
}

.trial-p-line {
  display: flex;
  span {
    display: inline-block;
    margin-right: 3px;
  }
}
.home-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;

  .home-header-logo {
    height: 36px;
    width: auto !important;
    flex-shrink: 0;
  }

  .home-header-title {
    height: 36px;
    width: auto !important;
    flex-shrink: 0;
  }

  .home-header-divider {
    color: #C1C9DC;
    font-size: 20px;
    margin: 0 8px;
    flex-shrink: 0;
  }

  .home-header-subtitle {
    font-size: 20px;
    color: #000;
    font-weight: 500;
    letter-spacing: 1px;
    white-space: nowrap;
    flex-shrink: 0;
  }
}
</style>
