<template>
  <div
    class="sidebar"
    :class="{
      'is-hidden': sidebarIsHidden
    }"
  >
    <!-- Narrow screen collapse button start -->
    <button class="sidebar-trigger__hide" @click="hideSidebar"></button>
    <button class="sidebar-trigger__show" @click="showSidbar"></button>
    <!-- Narrow screen collapse button end -->
    <div class="sidebar-inner">
      <div
        v-show="isShowQrCodePopup || isShowPlayerQrCodePopup || isShowQcloudClassQrCodePopup"
        :class="getQrcodeOptions()?.popupclass"
      >
        <div class="qr-code-popup-cor"></div>
        <img id="qr-code" />
        <img v-if="showBlurQrCode" src="../../../assets/images/blurQrcode.png" class="blur-qrcode" alt="" />
        <div class="weChat-text">{{ getQrcodeOptions()?.card }}</div>
        <div class="h5-text">{{ getQrcodeOptions()?.message }}</div>
      </div>
      <p class="sidebar-title">{{ t('sidebar.experienceFlow') }}</p>
      <t-steps
        :key="activeScene"
        layout="vertical"
        :current="current"
        status="process"
        class="steps-demos-extra, sidebar-content"
        @mouseleave="closeQrCodePopup"
        readonly
      >
        <t-step-item
          :title="experienceList?.consoleFree.title"
          v-if="experienceList?.consoleFree?.isShow"
          class="step"
        >
          <div class="concole-claim">{{ experienceList?.consoleFree.subInfo }}</div>
          <div class="console-free" @click="toRescue(experienceList?.consoleFree.url)">{{ t('sidebar.goToConsoleActivate') }}</div>
        </t-step-item>
        <t-step-item class="step" :title="t('sidebar.viewDocGuide')">
          <div v-for="item in experienceList?.src" :key="(item as any).cmd" class="step02">
            <a :href="item.url" target="_blank">{{ (item as any).nameKey ? t((item as any).nameKey) : item.name }}</a>
          </div>
        </t-step-item>

        <t-step-item :title="t('sidebar.enterConsoleTest')" v-if="experienceList?.consolePanel?.isShow" class="step03">
          <a :href="experienceList?.consolePanel.url" target="_blank">{{ t('sidebar.enterProductConsole') }}</a>
        </t-step-item>

        <t-step-item :title="t('sidebar.miniProgramEntrance')" v-if="experienceList?.miniprogram?.isShow">
          <div class="miniprogram-img">
            <img :src="experienceList?.miniprogram.url" alt="" />
          </div>
        </t-step-item>
      </t-steps>
      <div v-if="experienceList?.choose?.isShow" class="sidebar-bottom">
        <img class="sidebar-img" src="../../../assets/images/Mask-group.png" />
        <div class="sidebar-footer">
          <h1 :class="{ sidetext: currentLanguage === 'en-US' }">{{ t('sidebar.latestActivity') }}</h1>
          <p :class="{ sidetext: currentLanguage === 'en-US' }">{{ changeText() }}</p>
          <p class="sidebar-footer-btn" @click="toRescue(experienceList?.choose.url)">{{ t('sidebar.buyNow') }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, toRef } from 'vue';
import { storeToRefs } from 'pinia';
import { useSidebarStore } from '../../../stores/sidebar';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';

const { t, language } = useUIKit();
const currentLanguage = computed(() => language.value);

const props = defineProps(['activeScene']);
const activeSceneRef = toRef(props, 'activeScene');

const current = ref(0);
const sidebar = useSidebarStore();
const { callkit, roomkit, live, chatkit } = storeToRefs(sidebar);

const sceneDataMap: Record<string, any> = {
  callkit,
  roomkit,
  live,
  chatkit,
};

const experienceList = computed(() => sceneDataMap[activeSceneRef.value]?.value);
const isShowQrCodePopup = ref<boolean>(false);
const isShowPlayerQrCodePopup = ref<boolean>(false);
const isShowQcloudClassQrCodePopup = ref<boolean>(false);
const showBlurQrCode = ref(false);

if (props.activeScene === 'qcloudclass') {
  showBlurQrCode.value = true;
}

const getQrcodeOptions: any = () => {
  switch (props.activeScene) {
    case 'callkit':
      return {
        miniclass: 'qr-code-mini-callkit',
        stepclass: 'qr-code-item step01-item',
        popupclass: 'qr-code-popup',
        title: t('sidebar.experienceH5Call'),
        card: t('sidebar.wechatScanExperience'),
        message: t('sidebar.h5Experience'),
        cardcontent: t('sidebar.callExperience'),
      };
  }
};

const changeText = () => {
  switch (props.activeScene) {
    case 'callkit':
      return t('sidebar.firstPurchaseDiscount');
    case 'pusher':
      return t('sidebar.livePlatformDiscount');
    case 'chatkit':
      return t('sidebar.firstPurchaseDiscount');
    case 'qcloudclass':
      return t('sidebar.firstPurchase5Discount');
    case 'liveability':
      return t('sidebar.livePlatformDiscount');
  }
};

function closeQrCodePopup() {
  isShowQrCodePopup.value = false;
  isShowPlayerQrCodePopup.value = false;
  isShowQcloudClassQrCodePopup.value = false;
}

const toRescue = (url: string) => {
  window.open(url, '_blank');
};

// 窄屏下展示收起 start
const sidebarIsHidden = ref(true);
const showSidbar = () => {
  sidebarIsHidden.value = false;
};
const hideSidebar = () => {
  sidebarIsHidden.value = true;
};
</script>

<style scoped lang="scss">
.mobile-step-wawa {
  display: flex;
  align-items: center;
  gap: 10px;

  .moble-box {
    display: flex;
    align-items: center;
    flex-direction: column;

    img {
      width: 80px;
    }
  }
}
</style>

<style lang="scss">
::-webkit-scrollbar {
  display: none;
  /* Chrome Safari */
}

#sideBarWindow {
  position: absolute;
  left: 326px;
  top: 200px;
  width: 415px;
  height: 333px;
  background-image: url(https://qcloudimg.tencent-cloud.cn/raw/9508466a7917ad0b11bea0e1b5bc1f17.png);
  background-size: cover;

  > img {
    width: 380px;
    height: 220px;
    margin: 10px 10px 0px 25px;
    background: #7d8ba4;
    border-radius: 4px 4px 0px 0px;
  }

  > div {
    width: 380px;
    height: 92px;
    margin: -3px 10px 10px 25px;
    background: linear-gradient(180deg, rgba(84, 151, 255, 0.08) -3.97%, rgba(84, 151, 255, 0) 100%);
  }

  .sidebar-window-title {
    padding: 16px;
    padding-bottom: 8px;
    margin: 0px;
    font-style: normal;
    font-weight: 500;
    font-size: 16px;
    line-height: 20px;
    display: flex;
    align-items: center;
    color: #000000;
  }

  .sidebar-window-content {
    font-weight: 400;
    font-size: 14px;
    line-height: 21px;
    display: flex;
    align-items: center;
    color: #4f4f4f;
    margin: 0px;
    padding-left: 16px;
  }
}

a {
  color: #146efa;
}

.t-steps--vertical.t-steps--positive .t-steps-item:not(:last-child)::before {
  border-color: #d3dbee !important;
}

.t-steps--vertical.t-steps--positive .t-steps-item {
  padding-bottom: 6px !important;
}

.t-steps--vertical.t-steps--default-anchor .t-steps-item__title {
  width: 240px;
  word-wrap: break-word;
}

.t-steps--vertical.t-steps--default-anchor .t-steps-item__title,
.t-steps .t-steps-item--process .t-steps-item__title {
  color: rgba(0, 0, 0, 1) !important;
  font-size: 14px;
  font-weight: 500;
  font-family: RobotoTRTC;
}

.sidebar .t-steps-item__icon--number {
  margin-right: 8px;
  width: 16px !important;
  height: 16px !important;
  font-size: 10px;
  position: relative;
  left: 15%;
  top: 3px;
}

.t-steps-item__icon--number,
.sidebar .t-steps-item__icon--number,
.t-steps .t-steps-item--process .t-steps-item__icon--number {
  background: rgba(28, 102, 229, 1) !important;
  border: none;
  color: #ffffff !important;
}

.t-steps .t-steps-item {
  overflow: visible !important;
}

.active {
  .tickIcon {
    width: 14px;
    height: 14px;
    margin: -14px 20px 0px 0px;
  }
}

.qr-code-item {
  border-radius: 4px;
  color: #bababa;
  padding-right: 12px;
  box-sizing: border-box;
  height: 36px !important;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  margin: 0px 0px -10px 0px !important;
}

.qr-code-mini-callkit,
.qr-code-mini-player {
  width: 24px;
  height: 24px;
  background-image: url('../../../assets/images/qrcode-sample.png');
  background-size: cover;
}

.qr-code-mini-player {
  background-image: url('../../../assets/images/qrcode-player.png');
}

.qr-code-popup,
.qr-code-popup-player {
  position: absolute;
  width: 156px;
  height: 200px;
  left: 320px;
  top: 180px;

  background: #ffffff;
  border-radius: 8px;
  filter: drop-shadow(0px 4px 12px #dce9ff);

  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 2000;
}

.qr-code-popup-player {
  top: 400px;
}

.qr-code-popup-cor {
  width: 0;
  height: 0;
  border-top: 14px solid white;
  border-right: 12px solid transparent;
  border-left: 10px solid transparent;
  position: absolute;
  left: -16px;
  top: 40px;
  transform: rotate(90deg);
  border-radius: 8px;
}

.test {
  width: 10px;
  height: 10px;
  border: 10px solid;
  border-color: #ff3300 #0000ff #339966 #00ff00;
}

.qr-code-close {
  position: absolute;
  right: 14px;
  top: 14px;
  width: 12px;
  height: 12px;
  background-image: url('../../../assets/images/close.png');
  background-size: cover;
  cursor: pointer;
}

#qr-code,
.blur-qrcode {
  width: 132px;
  height: 132px;
  // 默认有 4px padding，规避一下
  margin: -4px;
  margin-top: 10px;
}

.blur-qrcode {
  position: absolute;
}

.qcloud-popup {
  position: relative;
}

.qcloud-qrcode {
  width: 132px;
  height: 132px;
  box-sizing: border-box;
  display: block;
  position: absolute;
  top: 0;
  left: 0;
  margin: -4px;
  margin-left: 4px;
  margin-top: 10px;
}

#qr-code-popup {
  width: 132px;
  height: 132px;
  // 默认有 4px padding，规避一下
  margin: 4px;
  margin-top: 10px;
}

#qr-code-qcloud {
  width: 132px;
  height: 132px;
  // 默认有 4px padding，规避一下
  margin: 4px;
  margin-top: 10px;
}

#qr-code-players {
  width: 132px;
  height: 132px;
  // 默认有 4px padding，规避一下
  margin: 4px;
  margin-top: 10px;
}

.weChat-text {
  font-family: RobotoTRTC;
  font-style: normal;
  font-weight: 400;
  font-size: 12px;
  line-height: 17px;
  /* identical to box height */

  margin-top: 12px;
  text-align: center;
  color: #888888;
}

.h5-text {
  font-family: RobotoTRTC;
  font-style: normal;
  font-size: 12px;
  line-height: 17px;
  /* identical to box height */
  width: 130px;
  text-align: center;
  margin-top: 4px;
  margin-bottom: 10px;

  color: #000000;
}

.sidebar {
  background-color: #ffffff;
  width: 316px;
  height: max-content;
  height: 82vh;
  position: relative;

  &-inner {
    box-sizing: border-box;
    height: 100%;
    padding: 20px 20px 20px 20px;
    overflow-x: hidden;
    overflow-y: scroll;
    position: relative;
    z-index: 2;
    background: #fff;
  }

  iframe {
    border: 0;
    display: block;
    min-width: 254px;
    width: 100%;
    height: 800px;
  }

  .addUser {
    float: right;
    margin: 22px 20px 0px 0px;
    background: #147aff;
    border: none;
    color: white;
    padding: 2px 4px;
    text-align: center;
    text-decoration: none;
    display: inline-block;
    font-size: 16px;
    cursor: pointer;
  }

  .t-steps-item__title {
    width: 260px;
    color: #000000;
  }

  .t-steps-item__description {
    max-width: 242px;
  }

  .sidebar-title {
    color: rgba(0, 0, 0, 1);
    font-size: 16px;
    font-weight: 500;
    font-family: RobotoTRTC;
    width: 260px;
    line-height: 24px;
    color: #000000;
    border-bottom: 1px solid #eaf0fa;
    margin-top: 0;
    padding-bottom: 16px;
  }

  .sidebar-resources {
    margin-top: 16px;
    position: relative;
    width: 242px;
    height: 97px;
    cursor: pointer;

    .sidebar-resources-img {
      width: 100%;
      height: 100%;
    }

    h1 {
      position: absolute;
      top: 10px;
      left: 17px;
      opacity: 1;
      color: rgba(0, 0, 0, 1);
      font-size: 10.5px;
      font-weight: normal;
      font-family: RobotoTRTC;
      text-align: left;
      letter-spacing: 0.2px;
    }

    h2 {
      position: absolute;
      top: 28px;
      left: 17px;
      opacity: 1;
      width: 156px;
      line-height: 15px;
      color: rgba(254, 77, 33, 1);
      font-size: 10.5px;
      font-weight: 500;
      font-family: RobotoTRTC;
      text-align: left;
      letter-spacing: 0.2px;
    }

    .sidebar-resources-text1 {
      position: absolute;
      top: 2px;
      font-size: 4px;
    }

    .sidebar-resources-free {
      position: absolute;
      left: 16px;
      bottom: 37px;
      font-family: RobotoTRTC;
      font-style: normal;
      font-weight: 400;
      font-size: 10px;
      line-height: 18px;
      /* identical to box height, or 180% */
      display: flex;
      align-items: center;
      letter-spacing: 0.2px;
      color: #414d66;
    }

    .sidebar-resources-text2 {
      position: absolute;
      top: 34px;
      font-size: 4px;
    }

    .sidebar-resources-btn {
      padding: 3px 8px;
      position: absolute;
      height: 22px;
      bottom: 15px;
      left: 17px;
      min-width: 56px;
      border: rgba(28, 102, 229, 1);
      opacity: 1;
      background: rgba(28, 102, 229, 1);
      font-size: 10px;
      font-weight: normal;
      font-family: RobotoTRTC;
      text-align: left;
    }
  }

  .concole-claim {
    position: absolute;
    top: 30px;
    width: 128px;
    height: 19px;
    background: #ff7200;
    font-family: RobotoTRTC;
    font-style: normal;
    font-weight: 400;
    font-size: 12px;
    line-height: 17px;
    text-align: center;
    color: #ffffff;
    border-radius: 0 5px 0 5px;
    margin-left: 82px;
  }

  .console-free {
    width: 210px;
    height: 32px;
    border-radius: 4px;
    border: 0 solid #ffffff;
    background: linear-gradient(135deg, #0052d9ff 0%, #0676ffff 100%);
    text-align: center;
    opacity: 1;
    color: #ffffff;
    font-family: RobotoTRTC;
    font-style: normal;
    font-weight: 400;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    margin-top: 20px;
    cursor: pointer;
  }

  .sidebar-content {
    .step01 .step01-item,
    .step02-item {
      display: flex;
      flex-direction: row;
      align-items: center;
      width: 242px;
      position: relative;
      font-family: RobotoTRTC;
      font-style: normal;
      font-weight: 400;
      font-size: 14px;
      line-height: 20px;
      color: #666666;
      cursor: pointer;
      margin: 16px 0;

      &:hover {
        color: #147aff;
      }

      &.is-unclickable {
        cursor: default;

        &:hover {
          color: #666666;
        }
      }

      span,
      img {
        position: absolute;
        right: 2%;
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
        padding: 1px 6px;
        height: 19px;
        border-radius: 2px;
        color: #999999;
        letter-spacing: 0.5px;
        font-family: RobotoTRTC;
        font-style: normal;
        font-weight: 400;
        font-size: 12px;
      }
    }

    .step02-item {
      align-items: stretch;
    }

    .step02 a {
      font-weight: normal;
    }

    .finish {
      color: #bababa !important;
    }

    .step01-div {
      padding: 6px;
      width: 204px !important;
      height: 32px;
      background: #efefef;
      border-radius: 4px;
      letter-spacing: 0.5px;

      img {
        background: #efefef !important;
      }
    }

    .step02 {
      color: rgba(0, 0, 0, 1);
      font-size: 14px;
      font-family: RobotoTRTC;

      p,
      a {
        display: block;
        margin-top: 13px;
        letter-spacing: 0.2px;
        color: #146efa;
      }

      a[href]:hover {
        text-decoration: underline;
      }
    }

    .step03 {
      a[href]:hover {
        text-decoration: underline;
      }
    }

    .step05 {
      .mobile-login {
        display: flex;
        margin-top: 12px;

        .mobile-login-device {
          cursor: pointer;
          width: 30px;
          height: 30px;
          margin-right: 6px;

          &:hover {
            background-color: #e3eeff;
          }
        }
      }
    }

    .mobile-qrcode,
    .mobile-qrcode-en {
      width: 152px;
      height: 172px;
      background: #ffffff;
      border: 1px solid rgba(211, 219, 238, 0.4);
      box-shadow: 0px 4px 12px #e1e8f3;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      position: absolute;
      left: 10px;
      bottom: 40px;

      .mobile-qrcode-img {
        width: 112px;
        height: 112px;
        margin: 20px 20px 0 20px;
      }

      .mobile-qrcode-text {
        font-family: RobotoTRTC;
        font-style: normal;
        font-weight: 400;
        font-size: 12px;
        line-height: 20px;
        text-align: center;
        color: #000000;
        margin-top: 8px;
      }
    }

    .miniprogram-img {
      margin-top: 10px;
      width: 100px;
      height: 100px;

      img {
        width: 100%;
        height: 100%;
      }
    }
  }

  .sidebar-bottom {
    position: relative;
    margin-top: 17px;
    width: 100%;
    // height: 87px;
    transform: translate(10px);
  }

  .sidebar-img {
    width: 100%;
    height: 100%;
  }

  .sidebar-footer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border-radius: 8px;
    margin: auto 0;
    padding: 0 14px;
    display: flex;
    flex-direction: column;
    justify-content: center;

    h1 {
      width: 57px;
      color: rgba(0, 0, 0, 1);
      font-size: 14px;
      font-weight: 500;
      font-family: RobotoTRTC;
      text-align: left;
      letter-spacing: 0.2px;
    }

    p {
      width: 242px;
      opacity: 0.6000000238418579;
      color: rgba(0, 0, 0, 1);
      font-size: 12px;
      font-weight: 400;
      font-family: RobotoTRTC;
      text-align: left;
      margin-top: 4px;
      margin-bottom: 4px;
    }

    .sidebar-footer-btn {
      cursor: pointer;
      opacity: 1;
      color: rgba(28, 102, 229, 1);
      font-size: 11px;
      font-weight: 400;
      font-family: RobotoTRTC;
      text-align: left;
      line-height: 18px;
      margin-top: 4px;

      &:after {
        content: '';
        display: inline-block;
        vertical-align: middle;
        position: relative;
        top: -1px;
        margin-left: 2px;
        width: 5px;
        height: 5px;
        border-top: 1px solid #146efa;
        border-right: 1px solid #146efa;
        transform: rotate(45deg);
        transition: transform 0.3s ease-in-out;
      }

      &:hover:after {
        transform: translateX(2px) rotate(45deg);
      }
    }

    .btn-arrow {
      position: absolute;
      left: 64px;
      top: 51.5px;
      width: 5px;
      height: 5px;
      border-top: 1px solid #146efa;
      border-right: 1px solid #146efa;
      transform: rotate(45deg);
    }

    .sidetext {
      font-size: 14px;
      width: 220px;
      line-height: 14px;
    }
  }
}

#sideBarWindow-popup {
  > img {
    width: 380px;
    height: 220px;
    background: #7d8ba4;
    border-radius: 4px 4px 0px 0px;
  }

  > div {
    width: 380px;
    height: 92px;
    background: linear-gradient(180deg, rgba(84, 151, 255, 0.08) -3.97%, rgba(84, 151, 255, 0) 100%);
  }

  .sidebar-window-title {
    padding: 16px;
    padding-bottom: 8px;
    margin: 0px;
    font-style: normal;
    font-weight: 500;
    font-size: 16px;
    line-height: 20px;
    display: flex;
    align-items: center;
    color: #000000;
  }

  .sidebar-window-content {
    font-weight: 400;
    font-size: 14px;
    line-height: 21px;
    display: flex;
    align-items: center;
    color: #4f4f4f;
    margin: 0px;
    padding-left: 16px;
  }
}

// 窄屏下展示收起按钮 start
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
  /* 118.75% */
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

@media screen and (max-width: 1460px) {
  .sidebar-trigger__hide {
    display: block;
    transition: opacity 0.3s ease-in-out;
  }

  .sidebar-trigger__show {
    display: block;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s ease-in-out;
  }

  .sidebar {
    position: absolute;
    left: 0;
    top: 0;
    z-index: 300;
    box-shadow: 0px 8px 8px 0px #e9f0fb;
    transition: all 0.3s ease-in-out;
  }

  .sidebar.is-hidden {
    box-shadow: none;
    transform: translateX(-100%);

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
