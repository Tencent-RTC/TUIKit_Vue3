<template>
  <div class="local-mixer-container">
    <div ref="videoPreviewer" class="local-mixer-content" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue';
import TUIRoomEngine, {
  TRTCVideoResolution,
  TRTCVideoResolutionMode,
} from '@tencentcloud/tuiroom-engine-electron';
import { TRTCStreamLayoutMode } from 'trtc-electron-sdk';
import { useRoomEngine } from '../../hooks/useRoomEngine';
import { useLiveListState } from '../../states/LiveListState';
import { useVideoMixerState } from '../../states/VideoMixerState';
import { LiveOrientation, TUIVideoQuality } from '../../types';
import logger from '../../utils/logger';
import streamLayoutService from './StreamLayoutService';
import type { TUISeatLayoutTemplate, TUICoHostLayoutTemplate, TUIUserOnSeatInfo } from './type';
import type { TRTCStreamLayout } from 'trtc-electron-sdk';

const logPrefix = '[WinLocalMixer]';

type Props = {
  windowId: number | Uint8Array | null;
};

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'onUserOnSeatInfoChanged', userOnSeatInfos: Array<TUIUserOnSeatInfo>): void;
  (e: 'onStreamLayoutChanged', streamLayout: TRTCStreamLayout): void;
  (e: 'onStreamLayoutAreaChanged', layoutArea: { left: number; top: number; right: number; bottom: number; width: number; height: number }): void;
}>();

const videoPreviewer = ref<HTMLElement | null>(null);

const {
  enableLocalVideoMixer,
  clearMediaSource,
  publishVideoQuality,
} = useVideoMixerState();

const { currentLive } = useLiveListState();

const roomEngine = useRoomEngine();

const bindPreviewElement = async () => {
  const mediaSourceManager = roomEngine.instance?.getTRTCCloud().getMediaMixingManager();
  if (!videoPreviewer.value) {
    logger.warn(`${logPrefix}videoPreviewer is not available, cannot bind preview element`);
    return;
  }

  if (!mediaSourceManager) {
    logger.warn(`${logPrefix}MediaSourceManager is not available, cannot bind preview element`);
    return;
  }

  if (props.windowId !== null) {
    await mediaSourceManager.bindPreviewArea(props.windowId, videoPreviewer.value as HTMLElement);
  } else {
    await mediaSourceManager.bindPreviewArea(0, videoPreviewer.value as HTMLElement);
  }
  await mediaSourceManager.setStreamLayout({
    layoutMode: TRTCStreamLayoutMode.None,
  });
};

const videoQualityToResolutionMap: Record<number, TRTCVideoResolution> = {
  [TUIVideoQuality.kVideoQuality_1080p]: TRTCVideoResolution.TRTCVideoResolution_1920_1080,
  [TUIVideoQuality.kVideoQuality_720p]: TRTCVideoResolution.TRTCVideoResolution_1280_720,
  [TUIVideoQuality.kVideoQuality_540p]: TRTCVideoResolution.TRTCVideoResolution_960_540,
  [TUIVideoQuality.kVideoQuality_360p]: TRTCVideoResolution.TRTCVideoResolution_640_360,
};

const currentLiveOrientation = computed(() => {
  if (
    currentLive.value
    && currentLive.value.layoutTemplate >= 200
    && currentLive.value.layoutTemplate <= 599
  ) {
    return LiveOrientation.Landscape;
  }
  return LiveOrientation.Portrait;
});

const currentResolution = computed(() =>
  videoQualityToResolutionMap[publishVideoQuality.value] ?? TRTCVideoResolution.TRTCVideoResolution_1920_1080,
);

const currentResolutionMode = computed(() =>
  currentLiveOrientation.value === LiveOrientation.Landscape
    ? TRTCVideoResolutionMode.TRTCVideoResolutionModeLandscape
    : TRTCVideoResolutionMode.TRTCVideoResolutionModePortrait,
);

// Room ID and owner change
watch(
  () => [currentLive.value?.liveId, currentLive.value?.liveOwner?.userId],
  ([newRoomId, newOwner]) => {
    if (newRoomId && newOwner) {
      streamLayoutService.setRoomInfo({
        roomId: newRoomId as string,
        roomOwner: newOwner as string,
      });
    } else {
      streamLayoutService.setRoomInfo({
        roomId: '',
        roomOwner: '',
      });
    }
  },
);

// Resolution change
watch(currentResolution, (newVal) => {
  logger.debug(`${logPrefix}currentResolution:`, newVal);
  streamLayoutService.setResolution(newVal);
}, { immediate: true });

// Resolution mode (landscape / portrait) change
watch(currentResolutionMode, (newVal) => {
  logger.debug(`${logPrefix}currentResolutionMode:`, newVal);
  streamLayoutService.setResolutionMode(newVal);
}, { immediate: true });

// Layout template change
watch(
  () => currentLive.value?.layoutTemplate,
  (newVal) => {
    logger.debug(`${logPrefix}layoutTemplate:`, newVal);
    if (newVal !== null && newVal !== undefined) {
      streamLayoutService.setLayoutTemplate(newVal as TUISeatLayoutTemplate | TUICoHostLayoutTemplate);
    }
  },
  { immediate: true },
);

// Forward streamLayoutService events to parent component
const onUserOnSeatInfoChanged = (userOnSeatInfos: Array<TUIUserOnSeatInfo>) => {
  emit('onUserOnSeatInfoChanged', userOnSeatInfos);
};

const onStreamLayoutChanged = (streamLayout: TRTCStreamLayout) => {
  emit('onStreamLayoutChanged', streamLayout);
};

const onStreamLayoutAreaChanged = (layoutArea: { left: number; top: number; right: number; bottom: number; width: number; height: number }) => {
  emit('onStreamLayoutAreaChanged', layoutArea);
};

onMounted(() => {
  watch(() => props.windowId, async (newVal, oldVal) => {
    if (newVal !== oldVal) {
      TUIRoomEngine.once('ready', async () => {
        try {
          await bindPreviewElement();
          await enableLocalVideoMixer();
        } catch (error) {
          logger.error(`${logPrefix}Failed to initialize video mixer:`, error);
        }
      });
    }
  }, { immediate: true });

  if (videoPreviewer.value) {
    streamLayoutService.setContainer(videoPreviewer.value);
  }

  streamLayoutService.on('onUserOnSeatInfoChanged', onUserOnSeatInfoChanged);
  streamLayoutService.on('onStreamLayoutChanged', onStreamLayoutChanged);
  streamLayoutService.on('onStreamLayoutAreaChanged', onStreamLayoutAreaChanged);
});

onBeforeUnmount(async () => {
  streamLayoutService.off('onUserOnSeatInfoChanged', onUserOnSeatInfoChanged);
  streamLayoutService.off('onStreamLayoutChanged', onStreamLayoutChanged);
  streamLayoutService.off('onStreamLayoutAreaChanged', onStreamLayoutAreaChanged);

  clearMediaSource();

  const mediaSourceManager = roomEngine.instance?.getTRTCCloud().getMediaMixingManager();
  if (mediaSourceManager) {
    mediaSourceManager.bindPreviewArea(0, null as unknown as HTMLElement);
    mediaSourceManager.stopMediaMixingServer();
  }
  streamLayoutService.reset();
});
</script>

<style scoped lang="scss">
.local-mixer-container {
  width: 100%;
  height: 100%;
  position: relative;

  .local-mixer-content {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }
}
</style>
