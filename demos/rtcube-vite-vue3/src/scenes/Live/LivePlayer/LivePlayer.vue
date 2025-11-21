<template>
  <div class="container">
    <section class="live">
      <header class="header">
        <IconArrowStrokeBack
          class="back-btn"
          size="20"
          @click="handleBack"
        />
        <Avatar
          :src="currentLive?.liveOwner.avatarUrl"
          :size="32"
          class="avatar"
        />
        <span class="user-name">{{ currentLive?.liveOwner.userName || currentLive?.liveOwner.userId }}</span>
      </header>
      <LiveCoreView class="player" />
    </section>

    <div class="sidebar">
      <section class="audience">
        <header class="section-header">
          <h3>{{ t('live.onlineAudience') }} <span>({{ audienceList.length }})</span></h3>
        </header>
        <LiveAudienceList class="list" />
      </section>

      <section class="barrage">
        <header class="section-header">
          <h3>{{ t('live.messageList') }}</h3>
        </header>
        <BarrageList class="list" />
        <BarrageInput class="input" height="48px" />
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { IconArrowStrokeBack, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import {
  LiveAudienceList,
  BarrageList,
  BarrageInput,
  useLiveAudienceState,
  LiveCoreView,
  useLiveListState,
  Avatar,
} from 'tuikit-atomicx-vue3';
import { useRouter } from 'vue-router';

const { t } = useUIKit();

const router = useRouter();
const { audienceList } = useLiveAudienceState();
const { currentLive, leaveLive } = useLiveListState();

onMounted(() => {
  if (!currentLive.value?.liveId) {
    router.replace({ name: 'live' });
  }
});

onUnmounted(() => {
  leaveLive();
});

function handleBack() {
  leaveLive();
  router.back();
}

</script>

<style>

.container {
  width: 100%;
  display: grid;
  grid-template-columns: 70% 30%;
  gap: 16px;
  padding: 16px;
  background: var(--bg-color-default);
  box-sizing: border-box;
  overflow: hidden;
}

.live {
  display: flex;
  flex-direction: column;
  background: var(--bg-color-operate);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px var(--shadow-color);
}

.header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px solid var(--stroke-color-primary);
  }

.back-btn {
  cursor: pointer;
  color: var(--text-color-tertiary);
  transition: color 0.2s;
}

.back-btn:hover {
  color: var(--text-color-link-hover);
}

.avatar {
  border: 1px solid var(--uikit-color-white-7);
}

.user-name {
  color: var(--text-color-primary);
  font-weight: 500;
}

.player {
  flex: 1;
  background: var(--uikit-color-black-1);
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  overflow: hidden;
}

.audience {
  display: flex;
  flex-direction: column;
  background: var(--bg-color-operate);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px var(--shadow-color);
  flex: 1;
  min-height: 0;
}

.barrage {
  display: flex;
  flex-direction: column;
  background: var(--bg-color-operate);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px var(--shadow-color);
  flex: 1;
  min-height: 0;
}

.section-header {
  padding: 16px;
  border-bottom: 1px solid var(--stroke-color-primary);
  background: var(--bg-color-operate);
}

.section-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color-primary);
}

.section-header span {
  font-weight: 400;
  color: var(--text-color-secondary);
  font-size: 14px;
}

.list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  }

.input {
  border-top: 1px solid var(--stroke-color-primary);
  flex-shrink: 0;
  height: 48px;
}

@media (max-width:1200px) {
  .container {
    grid-template-columns: 1fr;
    grid-template-rows: 60% 20% 20%;
    gap: 12px;
  }

  .sidebar {
    gap: 12px;
  }

  .audience,.barrage {
    min-height: 200px;
  }
}

@media (max-width:768px) {
  .container {
    padding: 8px;
    gap: 8px;
    grid-template-rows: 50% 25% 25%;
  }

  .header,.section-header {
    padding: 12px;
  }

  .sidebar {
    gap: 8px;
  }
}
</style>
