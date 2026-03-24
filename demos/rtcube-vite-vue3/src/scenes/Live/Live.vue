<template>
  <div class="live-scene">
    <!-- Live List View -->
    <div v-if="currentPage === 'list'" class="live-list-container">
      <LiveHeader
        :show-start-button="true"
        @start-live="goToPusher"
        @go-home="goToList"
      />
      <LiveListView @live-room-click="handleLiveRoomClick" />
    </div>

    <!-- Live Pusher View -->
    <div v-else-if="currentPage === 'pusher'" class="live-pusher-container">
      <LiveHeader
        :show-start-button="false"
        @go-home="goToList"
      />
      <LivePusherView @leave-live="goToList" />
    </div>

    <!-- Live Player View -->
    <div v-else-if="currentPage === 'player'" class="live-player-container">
      <LiveHeader
        v-show="!isMobile"
        :show-start-button="false"
        :show-login-button="false"
        @go-home="goToList"
      />
      <LivePlayerView
        v-if="loginUserInfo"
        :live-id="currentLiveId"
        @leave-live="goToList"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import TUIRoomEngine from '@tencentcloud/tuiroom-engine-js';
import { TUIMessageBox, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import {
  useLoginState,
  useLiveListState,
  useDeviceState,
} from 'tuikit-atomicx-vue3';
import type { LiveInfo } from 'tuikit-atomicx-vue3';
import {
  LiveListView,
  LivePlayerView,
  LivePusherView,
  isMobile,
} from './TUILiveKit';
import LiveHeader from './components/LiveHeader.vue';

type PageType = 'list' | 'pusher' | 'player';

const { t } = useUIKit();
const { loginUserInfo } = useLoginState();
const { currentLive, joinLive } = useLiveListState();
const { openLocalMicrophone } = useDeviceState();

const currentPage = ref<PageType>('list');
const currentLiveId = ref<string>('');

// Enable multi-playback quality when ready
TUIRoomEngine.once('ready', () => {
  TUIRoomEngine.callExperimentalAPI(JSON.stringify({
    api: 'enableMultiPlaybackQuality',
    params: {
      enable: true,
    },
  }));
});

// Watch for live ID changes and store in session
watch(() => currentLive.value?.liveId, (newVal, oldVal) => {
  if (newVal) {
    sessionStorage.setItem('livekit-live-id', currentLive.value?.liveId || '');
  }
  if (oldVal && !newVal) {
    sessionStorage.removeItem('livekit-live-id');
  }
});

// Navigation methods
function goToList() {
  currentPage.value = 'list';
  currentLiveId.value = '';
}

function goToPusher() {
  currentPage.value = 'pusher';
}

function goToPlayer(liveId: string) {
  currentLiveId.value = liveId;
  currentPage.value = 'player';
}

// Handle live room click from list
function handleLiveRoomClick(liveInfo: LiveInfo) {
  if (loginUserInfo.value?.userId === liveInfo.liveOwner?.userId) {
    TUIMessageBox.alert({
      title: t('Warning'),
      content: t('Unable to view own live'),
    });
    return;
  }

  if (liveInfo?.liveId) {
    goToPlayer(liveInfo.liveId);
  }
}

// Restore live session on login
async function restoreLive() {
  const liveId = sessionStorage.getItem('livekit-live-id');
  if (liveId) {
    await TUIMessageBox.confirm({
      title: t('It is detected that you have an unfinished live broadcast session last time. Do you want to resume it?'),
      callback: async (action) => {
        if (action === 'confirm') {
          try {
            await joinLive({ liveId });
            openLocalMicrophone();
            goToPusher();
          } catch (error) {
            alert(t('Failed to join live broadcast session'));
            sessionStorage.removeItem('livekit-live-id');
            console.error(error);
          }
        } else {
          sessionStorage.removeItem('livekit-live-id');
        }
      },
    });
  }
}

// Watch for login state changes
watch(loginUserInfo, (newVal) => {
  if (newVal && newVal.userId) {
    restoreLive();
  }
});
</script>

<style lang="scss" scoped>
.live-scene {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.live-list-container,
.live-pusher-container,
.live-player-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: auto;
  box-sizing: border-box;
}

.live-list-container {
  padding: 16px;
}

.live-pusher-container {
  padding: 16px;
}

.live-player-container {
  padding: 16px;

  &:has(.live-player-header) {
    padding-top: 16px;
  }
}

.live-player-header {
  flex-shrink: 0;
  padding-bottom: 0;
}
</style>
