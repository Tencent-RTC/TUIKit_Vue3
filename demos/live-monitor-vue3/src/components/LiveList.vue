<template>
  <div class="live-list-container">
    <div class="live-list-item" v-for="item in monitorLiveInfoList" :key="item.liveId">
      <div class="live-view-mask" :id="item.liveId">
        <div
          class="live-view-background"
          :style="{ backgroundImage: `url(${item.backgroundUrl || item.coverUrl || defaultCoverUrl})` }"
        ></div>
        <LiveMonitorView class="live-monitor-view" :live-info="item" />
        <div class="live-id">{{ `${t('RoomId')} ${item.liveId}` }}</div>
        <div v-if="!isFullscreen" class="display-details" @click="handleClickDetails(item.liveId)">
          {{ 'Display details' }}
        </div>
        <IconClose v-else class="close-fullscreen" :size="32" @click="handleCloseFullscreen" />
      </div>
      <div class="live-info">
        <div class="live-name">{{ item.liveName }}</div>
        <div class="live-owner">
          <Avatar :size="20" :src="item.coverUrl" />
          <span class="live-owner-name">{{ item.liveOwner }}</span>
        </div>
      </div>
      <div class="operate-button">
        <div :class="['warn-button', 'button']">
          <IconClock />
          <span class="button-text">{{ t('Warning') }}</span>
          <IconArrowStrokeSelectDown />
        </div>
        <div :class="['close-button', 'button']" @click="handleCloseLive(item.liveId)">
          <IconEndLive />
          <span class="button-text">{{ t('Force Close') }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { LiveMonitorView, useLiveMonitorState, Avatar } from 'tuikit-atomicx-vue3';
import {
  IconArrowStrokeSelectDown,
  IconClock,
  IconClose,
  IconEndLive,
  useUIKit,
} from '@tencentcloud/uikit-base-component-vue3';
import { defaultCoverUrl } from '../config';
import { setFullScreen, exitFullScreen } from '../utils';

const { monitorLiveInfoList, closeRoom, stopPlay } = useLiveMonitorState();
const { t } = useUIKit();
const isFullscreen = ref(false);

const handleCloseLive = async (liveId: string) => {
  await stopPlay(liveId);
  await closeRoom(liveId);
};

const handleClickDetails = (liveId: string) => {
  const element = document.getElementById(liveId);
  if (element) {
    setFullScreen(element);
    isFullscreen.value = true;
  }
};

const handleCloseFullscreen = () => {
  if (document.fullscreenElement) {
    exitFullScreen();
  }
};

const handleFullscreenChange = () => {
  if (document.fullscreenElement) {
    isFullscreen.value = true;
  } else {
    isFullscreen.value = false;
  }
};

onMounted(() => {
  addEventListener('fullscreenchange', handleFullscreenChange);
});

onUnmounted(() => {
  removeEventListener('fullscreenchange', handleFullscreenChange);
});
</script>

<style scoped lang="scss">
.live-list-container {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  width: 100%;
  padding: 20px 40px;
  overflow: hidden;
  position: relative;

  .live-list-item {
    display: flex;
    flex-direction: column;
    border-radius: 16px;
    padding: 8px;
    overflow: hidden;

    .live-view-mask {
      position: relative;
      display: flex;
      justify-content: center;
      width: 100%;
      height: 270px;
      border-radius: 12px;
      overflow: hidden;

      .display-details,
      .close-fullscreen {
        position: absolute;
        color: var(--text-color-secondary);
        font-size: 14px;
        cursor: pointer;
      }

      .display-details {
        display: none;
        text-align: center;
        line-height: 40px;
        width: 120px;
        height: 40px;
        background-color: var(--text-color-secondary);
        color: var(--stroke-color-module);
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        border-radius: 12px;
      }

      .close-fullscreen {
        top: 32px;
        right: 32px;
      }

      .live-view-background {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-repeat: repeat;
        background-size: cover;
        filter: blur(10px);
      }

      .live-id {
        position: absolute;
        left: 20px;
        bottom: 8px;
        font-size: 12px;
        color: var(--text-color-button);
      }
    }

    .live-view-mask:hover {
      .display-details {
        display: block;
      }
    }

    .live-info {
      display: flex;
      flex-direction: column;
      justify-content: space-evenly;
      width: 100%;
      height: 60px;
      border-bottom: 1px solid var(--stroke-color-transparent);

      .live-name {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-weight: 500;
        font-size: 16px;
        color: var(--text-color-primary);
      }

      .live-owner {
        display: flex;
        align-items: center;
        color: var(--text-color-secondary);
        font-size: 14px;

        .live-owner-name {
          margin-left: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }
    }

    .operate-button {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      height: 40px;
      font-weight: 500;
      font-size: 14px;
      cursor: pointer;
      opacity: 0;

      .button {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 50%;
        height: 24px;
        cursor: pointer;

        .button-text {
          text-wrap: nowrap;
          margin: 0 4px;
        }
      }

      .warn-button {
        color: var(--text-color-warning);
        border-right: 1px solid var(--stroke-color-secondary);
        cursor: not-allowed;
      }

      .close-button {
        color: var(--text-color-error);
      }
    }
  }

  .live-list-item:hover {
    background-color: var(--bg-color-operate);

    .operate-button {
      opacity: 1;
    }

    .live-info {
      border-bottom: 1px solid var(--stroke-color-secondary);
    }
  }
}
</style>
