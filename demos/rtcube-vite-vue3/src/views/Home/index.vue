<template>
  <div :class="classes">
    <Banner
      :title="t('home.bannerTitle')"
      :desc="t('home.bannerDesc')"
      type="renew"
    >
      <img
        src="https://cloudcache.tencent-cloud.com/qcloud/ui/static/static_source_business/97991446-f2ba-4ebd-925f-f9ccba214a0e.png"
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
      <Section :title="t('home.sceneExperience')" type="renew">
        <Row :gutter="[20, 20]">
          <Col :span="4" v-for="(item, index) in expericenceScene" @click="toContent(item.scene)" :key="index">
            <CardItem
              :url="item.url"
              :label="item.label"
              :title="item.title"
              :desc="item.desc"
              :alt="item.label"
              type="renew"
            >
            </CardItem>
          </Col>
        </Row>
      </Section>
      <div class="footer">
        <div class="footer-contaienr">
          <div class="footer-slogan-item">
            <div class="slogan-item-left-separator"></div>
            <div class="slogan-item-content">
              <div class="slogan-item-title">90%</div>
              <div class="slogan-item-desc">{{ t('stats.marketShare') }}</div>
            </div>
          </div>
          <div class="footer-slogan-item">
            <div class="slogan-item-left-separator"></div>
            <div class="slogan-item-content">
              <div class="slogan-item-title">{{ t('language.current') === '当前语言' ? '30 亿' : '3B' }}</div>
              <div class="slogan-item-desc">{{ t('stats.dailyMinutes') }}</div>
            </div>
          </div>
          <div class="footer-slogan-item">
            <div class="slogan-item-left-separator"></div>
            <div class="slogan-item-content">
              <div class="slogan-item-title">2800 +</div>
              <div class="slogan-item-desc">{{ t('stats.globalNodes') }}</div>
            </div>
          </div>
          <div class="footer-slogan-item">
            <div class="slogan-item-left-separator"></div>
            <div class="slogan-item-content">
              <div class="slogan-item-title">{{ t('language.current') === '当前语言' ? '10亿+' : '1B+' }}</div>
              <div class="slogan-item-desc">{{ t('stats.monthlyUsers') }}</div>
            </div>
          </div>

        </div> 
      </div>
    </section>
  </div>

  
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import { Row, Col } from "tdesign-vue-next";
import { useLoginState } from '@tencentcloud/chat-uikit-vue3';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import headerLogo from '@/assets/images/logo-icon.png';
import headerTitle from '@/assets/images/logo-title.png';
import headerTitleEn from "@/assets/images/logo-title-en.png";
import {useRouter} from "vue-router";
import { Banner, Section, CardItem } from '@/components';
import '@/components/pages/TiyanHomePage.scss';

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


const expericenceScene = computed(() => [
  {
    url: imageIndexChat,
    label: t('scenes.chat.label'),
    title: t('scenes.chat.title'),
    desc: t('scenes.chat.desc'),
    scene: "chatkit",
  }, 
  {
    url: imageIndexCall,
    label: t('scenes.call.label'),
    title: t('scenes.call.title'),
    desc: t('scenes.call.desc'),
    scene: "callkit",
  }, {
    url: imageIndexMeeting,
    label: t('scenes.meeting.label'),
    title: t('scenes.meeting.title'),
    desc: t('scenes.meeting.desc'),
    scene: "roomkit",
  },{
    url: imageIndexLive,
    label: t('scenes.live.label'),
    title: t('scenes.live.title'),
    desc: t('scenes.live.desc'),
    scene: "live",
}
]);

const { loginUserInfo } = useLoginState();

const toContent = (scene: string, active?: string) => {
  if (loginUserInfo.value?.userId) {
    router.push({ path: "/detail", query: { scene, active } });
  } else {
    router.push({ path: '/login', query: { scene, active } });
  }
}

</script>


<style lang="scss">
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