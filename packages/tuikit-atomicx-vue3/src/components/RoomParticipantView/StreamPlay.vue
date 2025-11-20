<template>
  <div
    :id="playRegionDomId"
    ref="playRegionDomRef"
    class="stream-play-container"
  />
</template>

<script setup lang="ts">
import {
  ref,
  defineProps,
  computed,
  watch,
  onBeforeUnmount,
  withDefaults,
  nextTick,
  onMounted,
} from 'vue';
import { FillMode } from '../../types';
import { getNanoId } from '../../utils/utils';
import { StreamPlayManager } from './StreamPlayManager';
import type { RoomParticipant, VideoStreamType } from '../../types';

const streamPlayManager = new StreamPlayManager();

interface Props {
  participant: RoomParticipant;
  streamType: VideoStreamType;
  fillMode?: FillMode;
  lazyLoad?: {
    enable: boolean;
    viewport?: string | HTMLDivElement;
  };
  enableTouchScale?: boolean; // 默认值为 false
  onStreamLoading?: () => void;
  onStreamPlaying?: () => void;
  onStreamError?: (error: Error) => void;
}

const props = withDefaults(defineProps<Props>(), {
  fillMode: FillMode.Fill,
  enableTouchScale: false,
  draggable: false,
  lazyLoad: () => ({
    enable: true,
    viewport: 'body',
  }),
  onStreamLoading: () => {},
  onStreamPlaying: () => {},
  onStreamError: () => {},
});

const playRegionDomRef = ref();
const nanoId = getNanoId(5);
const playRegionDomId = computed(
  () => `${props.participant.userId}_${props.streamType}_${nanoId}`,
);
async function bindView() {
  if (!playRegionDomRef.value) {
    return;
  }
  await streamPlayManager.bindView({
    userId: props.participant.userId,
    streamType: props.streamType,
    view: playRegionDomRef.value,
    lazyLoad: props.lazyLoad,
  });
}

/**
 * 从流管理器解绑视图
 */
async function unbindView() {
  if (!playRegionDomRef.value) {
    return;
  }
  await streamPlayManager.unbindView({
    userId: props.participant.userId,
    streamType: props.streamType,
    view: playRegionDomRef.value,
  });
}

/**
 * 监听参与者或流类型变化，自动重新绑定
 */
watch(
  () => [props.participant.userId, props.streamType],
  async (val, oldVal) => {
    const [oldUserId, oldStreamType] = oldVal || [];
    const [newUserId, newStreamType] = val;

    if (oldUserId && oldStreamType && (oldUserId !== newUserId || oldStreamType !== newStreamType)) {
      await nextTick();
      await streamPlayManager.unbindView({
        userId: oldUserId as string,
        streamType: oldStreamType as VideoStreamType,
        view: playRegionDomRef.value,
      });
      await streamPlayManager.bindView({
        userId: newUserId as string,
        streamType: newStreamType as VideoStreamType,
        view: playRegionDomRef.value,
        lazyLoad: props.lazyLoad,
      });
    }
  },
);

watch(() => props.fillMode, async () => {
  streamPlayManager.setStreamConfig({
    userId: props.participant.userId,
    streamType: props.streamType,
    renderParams: {
      fillMode: props.fillMode,
    },
  });
});

onMounted(async () => {
  await bindView();
});

onBeforeUnmount(async () => {
  await unbindView();
});
</script>

<style lang="scss" scoped>
.stream-play-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
