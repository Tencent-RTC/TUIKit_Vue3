<template>
  <div class="live-pusher-container">
    <div class="live-pusher-header">
      <button class="back-btn" @click="backToMain">
        {{ t('live.back') }}
      </button>
      <h2>{{ t('live.livePusher') }}</h2>
    </div>
    <LivePusherView />
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue';
import { LivePusherView } from '@tencentcloud/livekit-web-vue3';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import {
  useLiveState,
  useLoginState,
} from 'tuikit-atomicx-vue3';
import { useRouter } from 'vue-router';

const { t } = useUIKit();

const { currentLive, joinLive } = useLiveState();
const { loginUserInfo } = useLoginState();

const router = useRouter();

const backToMain = () => {
  router.back();
};

watch(() => currentLive.value, (liveInfo) => {
  if (liveInfo?.liveOwner.userId === loginUserInfo.value?.userId) {
    localStorage.setItem('liveId', liveInfo?.liveId || '');
  } else {
    localStorage.removeItem('liveId');
  }
});

onMounted(() => {
  const liveId = localStorage.getItem('liveId');
  if (liveId) {
    joinLive({ liveId });
  }
});

</script>

<style scoped lang="scss">
.live-pusher-container {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.live-pusher-header {
  display: flex;
  align-items: center;
  padding: 20px;
  background: white;
  border-bottom: 1px solid #e9ecef;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  h2 {
    margin: 0 0 0 20px;
    color: #333;
  }
}

.back-btn {
  padding: 8px 16px;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  color: #495057;
  transition: all 0.3s ease;

  &:hover {
    background: #e9ecef;
    border-color: #adb5bd;
  }
}
</style>
