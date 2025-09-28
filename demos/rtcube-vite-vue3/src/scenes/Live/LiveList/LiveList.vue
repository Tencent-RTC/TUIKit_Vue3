<template>
  <div class="live-list-container">
    <div class="live-list-header">
      <button class="back-btn" @click="backToMain">
        {{ t('live.back') }}
      </button>
      <h2>{{ t('live.liveList') }}</h2>
    </div>
    <div class="live-list-content">
      <LiveList @live-room-click="handleLiveItemClick" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { LiveList, useLiveState } from 'tuikit-atomicx-vue3';
import { useRouter } from 'vue-router';
import type { LiveInfo } from 'tuikit-atomicx-vue3';

const { t } = useUIKit();

const router = useRouter();
const { joinLive } = useLiveState();

const backToMain = () => {
  router.back();
};

const handleLiveItemClick = async (liveInfo: LiveInfo) => {
  await joinLive({ liveId: liveInfo.liveId });
  router.push({ name: 'Stages', params: { sceneId: 'live-player' }, query: { liveId: liveInfo.liveId } });
};

</script>

<style scoped lang="scss">
.live-list-container {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.live-list-header {
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

.live-list-content {
  flex: 1;
  min-height: 0;
  padding: 20px 0;
  display: flex;
}
</style>
