<template>
  <div ref="liveContainerRef" class="live-monitor-container">
    <div :id="viewId" class="live-monitor-view"></div>
    <div
      v-for="region in regionList"
      class="live-tag-mask"
      :class="{ 'hide-tag': !isFullscreen }"
      :style="styleList[region.userInfo.userId]"
    >
      <div class="live-id live-tag">{{ `${t('RoomId')}: ${region.liveId}` }}</div>
      <div class="user-id live-tag">{{ `${t('UserId')}: ${region.userInfo.userId}` }}</div>
      <div class="force-close live-tag" @click="handleForceClose">
        <IconEndLive />
        <span>{{ t('Force Close') }}</span>
      </div>
      <div :class="['toggle-audio-state', ' live-tag', { 'is-unmuted': !isMuted }]" @click="toggleMuteAudio">
        <IconMute v-if="isMuted" />
        <IconSpeakerPhone v-else />
        <span>{{ isMuted ? t('Unmute Audio') : t('Mute Audio') }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, computed, ref, watch, onMounted, onUnmounted } from 'vue';
import { useUIKit, IconEndLive, IconMute, IconSpeakerPhone } from '@tencentcloud/uikit-base-component-vue3';
import { MonitorLiveInfo } from '../../types';
import { useLiveMonitorState } from '../../states/LiveMonitorState';
import { exitFullScreen } from '../../utils/utils';

const { monitorLiveInfoList, closeRoom, muteLiveAudio } = useLiveMonitorState();
const { t } = useUIKit();

interface Props {
  liveInfo: MonitorLiveInfo;
}
const isFullscreen = ref(false);
const isMuted = ref(true);
const styleList = ref<Record<string, any>>({});
const props = defineProps<Props>();
const liveContainerRef = ref<HTMLDivElement>();

const viewId = computed(() => {
  return `live_monitor_view_${props.liveInfo.liveId}`;
});

const regionList = computed(() => {
  return monitorLiveInfoList.value.find(liveInfo => liveInfo.liveId === props.liveInfo.liveId)?.regionList;
});

const toggleMuteAudio = () => {
  muteLiveAudio(props.liveInfo.liveId, !isMuted.value);
  isMuted.value = !isMuted.value;
};

const handleForceClose = () => {
  closeRoom(props.liveInfo.liveId);
  if (isFullscreen.value) {
    exitFullScreen();
  }
};

const handleFullscreenChange = () => {
  if (document.fullscreenElement) {
    isFullscreen.value = true;
  } else {
    isFullscreen.value = false;
    muteLiveAudio(props.liveInfo.liveId, true);
    isMuted.value = true;
  }
};

onMounted(() => {
  addEventListener('fullscreenchange', handleFullscreenChange);
});

onUnmounted(() => {
  removeEventListener('fullscreenchange', handleFullscreenChange);
});

watch(
  regionList,
  () => {
    if (!liveContainerRef.value) return;
    const containerWidth = liveContainerRef.value.clientWidth;
    const containerHeight = liveContainerRef.value.clientHeight;
    const isSingleStream = regionList.value?.length === 1;
    regionList.value?.forEach(region => {
      styleList.value[region.userInfo.userId] = {
        left: `${region.rect.x * containerWidth}px`,
        top: `${region.rect.y * containerHeight}px`,
        width: `${isSingleStream ? '100%' : region.rect.w * containerWidth + 'px'}`,
        height: `${isSingleStream ? '100%' : region.rect.h * containerHeight + 'px'}`,
      };
    });
  },
  { immediate: true }
);
</script>

<style lang="scss" scoped>
.live-monitor-container {
  position: relative;
  height: 100%;
  aspect-ratio: 9 / 16;

  .live-monitor-view {
    width: 100%;
    height: 100%;
  }

  .live-tag-mask {
    position: absolute;

    .live-tag {
      position: absolute;
      top: 10px;
      left: 10px;
      color: #ffece5;
      font-size: 12px;
      font-weight: 500;
      background-color: #e57849;
      padding: 4px;
      border-radius: 4px;
    }

    .user-id {
      top: 44px;
    }

    .force-close,
    .toggle-audio-state {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 150px;
      left: unset;
      top: unset;
      right: 10px;
      font-weight: 500;
      font-size: 14px;
      cursor: pointer;

      span {
        margin-left: 4px;
      }
    }

    .force-close {
      background-color: #e54545;
      color: #ffe7e5;
      bottom: 10px;
    }

    .toggle-audio-state {
      background-color: #e54545;
      color: #ffe7e5;
      bottom: 50px;
    }

    .is-unmuted {
      background-color: #0abf77;
      color: #e6ffe5;
    }
  }

  .hide-tag {
    display: none;
  }
}
</style>
