<template>
  <div class="detail">
    <HeaderWrapper />
    <Bar :active-scene="activeScene" @change-scene="changeActiveScene" />
    <div class="detail-box">
      <SideBar class="detail-slider" :active-scene="activeScene" @change-scene="changeActiveScene" />
      <div class="detail-content">
        <div class="detail-content-main" :class="activeScene">
          <WindowContent
            :key="activeScene"
            class="WindowContent"
            :class="activeScene"
            :active-scene="activeScene"
            :is-international="false"
          ></WindowContent>
        </div>
      </div>
    </div>
    <t-dialog
      v-model:visible="showCallingDialog"
      class="calling-dialog"
      :header="t('detail.hangUpTitle')"
      :body="t('detail.hangUpMessage')"
      :confirm-on-enter="true"
      :on-cancel="onCloseBtnClick"
      :on-close-btn-click="onCloseBtnClick"
      :on-confirm="onConfirmAnother"
    ></t-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import HeaderWrapper from '../../components/Header/index.vue';
import Bar from './Bar/index.vue';
import SideBar from './SideBar/index.vue';
import WindowContent from './Content/index.vue';
import emitter from '../../utils/emitter';
import { CALLKIT_CMD } from '../../utils/constants';

const { t } = useUIKit();

const route = useRoute();
const router = useRouter();
const activeScene = ref<string | any>(route.query.scene || 'callkit');

const showCallingDialog = ref(false);
const callingChangeScene = ref('');
let callingStatus = false;

emitter.on('calling-dialog', val => {
  callingStatus = val as boolean;
});

const changeActiveScene = (scene: string) => {
  emitter.emit(CALLKIT_CMD.CLOSE_QRCODE_POPUP);
  emitter.off('player-qrcode');
  if (activeScene.value !== 'callkit' || callingStatus === false) {
    activeScene.value = scene;
    router.push({ path: '/detail', query: { scene } });
  } else {
    showCallingDialog.value = true;
    callingChangeScene.value = scene;
  }
};

const onConfirmAnother = () => {
  showCallingDialog.value = false;
  activeScene.value = callingChangeScene.value;
  router.push({ path: '/detail', query: { scene: activeScene.value } });
};

const onCloseBtnClick = () => {
  showCallingDialog.value = false;
  callingChangeScene.value = '';
};

onMounted(() => {
  // Page mounted
});
</script>

<style lang="scss">
.detail {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: #f8f8f8;
  position: relative;
  background-size: cover;

  /* Scrollbar styles */
  ::-webkit-scrollbar {
    display: block;
    width: 14px;
    height: 14px;
  }

  ::-webkit-scrollbar-thumb {
    display: block;
    border-radius: 7px;
    border: 4px solid rgba(0, 0, 0, 0);
    background-color: rgba(143, 154, 178, 0);
    background-clip: padding-box;
  }

  .t-dialog--lock {
    overflow: auto !important;
  }

  .calling-dialog {
    .t-dialog {
      width: 480px;
      border-radius: 16px;
      overflow: hidden;

      .t-dialog__header {
        height: 64px;
        padding-left: 20px;
        border-bottom: 1px solid #fff;
        box-shadow: 0 2px 10px #e6ecf5;
      }

      .t-dialog__body {
        padding: 20px;
      }

      .t-dialog__footer {
        padding: 20px;
        width: initial;

        .t-button {
          width: 88px;
          border-radius: 24px;
          margin-left: 20px;
        }
      }
    }
  }

  .detail-box {
    display: flex;
    flex: 1;
    height: 1px;
    position: relative;

    .detail-slider {
      margin: 0;
      height: 100%;
      box-sizing: border-box;
      flex-shrink: 0;

      .sidebar-inner {
        overflow-x: hidden;
        overflow-y: auto;

        &:hover::-webkit-scrollbar-thumb {
          background-color: rgba(143, 154, 178, 0.4);
        }
      }
    }

    .detail-content {
      flex: 1;
      overflow: auto;
      position: relative;

      &:hover::-webkit-scrollbar-thumb {
        background-color: rgba(143, 154, 178, 0.4);
      }

      &-main {
        height: calc(100% - 85px);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0;
        box-sizing: border-box;
        margin: 40px;

        &.callkit {
          min-width: 720px;
          min-height: 650px;
        }
      }
    }
  }
}
</style>
