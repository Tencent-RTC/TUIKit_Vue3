<template>
  <div class="live-page">
    <div class="main-content">
      <div class="live-content">
        <h2 class="live-title">
          {{ t('live.title') }}
        </h2>

        <div class="authenticated-content">
          <p class="welcome-text">
            {{ t('live.welcome') }}
          </p>

          <div class="action-grid">
            <div class="action-card">
              <h3>{{ t('live.startLive') }}</h3>
              <p>{{ t('live.startLiveDesc') }}</p>
              <button class="action-btn action-btn--live" @click="startLive">
                {{ t('live.startLiveBtn') }}
              </button>
            </div>

            <div class="action-card">
              <h3>{{ t('live.watchLive') }}</h3>
              <p>{{ t('live.watchLiveDesc') }}</p>
              <button class="action-btn action-btn--watch" @click="watchLive">
                {{ t('live.watchLiveBtn') }}
              </button>
            </div>
          </div>

          <div class="live-list">
            <h3>{{ t('live.hotLive') }}</h3>
            <LiveList @live-room-click="handleLiveItemClick" />
          </div>
        </div>
      </div>
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

const startLive = () => {
  router.push({ name: 'live-pusher' });
};

const watchLive = () => {
  router.push({ name: 'live-list' });
};

const handleLiveItemClick = async (liveInfo: LiveInfo) => {
  await joinLive({ liveId: liveInfo.liveId });
  router.push({ name: 'live-player' });
};

</script>

<style scoped lang="scss">
.live-page {
  flex: 1;
  padding: 20px;
  display: flex;
  justify-content: center;
}

.main-content {
  flex: 1;
  display: flex;
}

.live-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.live-title {
  margin-bottom: 20px;
  color: #333;
}

.authenticated-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  .welcome-text {
    color: #666;
    margin-bottom: 20px;
  }
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.action-card {
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;

  h3 {
    margin-bottom: 15px;
    color: #333;
  }

  p {
    color: #666;
    margin-bottom: 15px;
  }
}

.action-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;

  &--live {
    background: #dc3545;
    color: white;

    &:hover {
      background: #c82333;
    }
  }

  &--watch {
    background: #007bff;
    color: white;

    &:hover {
      background: #0056b3;
    }
  }
}

.live-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  h3 {
    margin-bottom: 20px;
    color: #333;
  }
}
</style>
