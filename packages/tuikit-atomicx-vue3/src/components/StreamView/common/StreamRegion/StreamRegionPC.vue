<template>
  <div class="stream-region-container" ref="streamRegionContainerRef">
    <div
      class="stream-region"
      @dblclick="handleStreamDblClick"
      :style="streamStyle"
    >
      <!-- <LocalScreenView v-if="isLocalScreen" :userInfo="props.userInfo" /> -->
      <StreamPlay
        :user-info="props.userInfo"
        :stream-type="props.streamType"
        :stream-play-mode="props.streamPlayMode"
        :stream-play-quality="props.streamPlayQuality"
      />
      <slot name="stream-cover" :user-info="props.userInfo" :stream-type="props.streamType" />
      <StreamCover v-if="!$slots.streamCover" :userInfo="props.userInfo" :stream-type="props.streamType" />
      <slot name="streamViewUI" :user-info="props.userInfo" :stream-type="props.streamType" />
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  defineProps,
  computed,
  defineEmits,
  onMounted,
  onBeforeUnmount,
  watch,
} from 'vue';
import type { ComputedRef } from 'vue';
import { TUIVideoStreamType } from '@tencentcloud/tuiroom-engine-js';
import StreamPlay from '../StreamPlay/index.vue';
import StreamCover from '../StreamCover/index.vue';
// import LocalScreenView from '../LocalScreenView/index.vue';
// import vDblTouch from '../../../../directives/vDblTouch';
// import vTouchScale from '../../../../directives/vTouchScale';
import { StreamPlayMode, StreamPlayQuality } from '../../manager/mediaManager';
import { getContentSize } from '../../../../utils/domOperation';
import { UserInfo } from '../../../../types';

// 缺少 fill, fit 的信息
interface Props {
  userInfo: UserInfo;
  streamType: TUIVideoStreamType;
  streamPlayQuality?: StreamPlayQuality;
  streamPlayMode?: StreamPlayMode;
  aspectRatio?: string;
  supportTouchScale?: boolean;
}

const props = defineProps<Props>();
const emits = defineEmits(['stream-view-dblclick']);

const streamRegionContainerRef = ref();
const streamStyle = ref({ width: '', height: '' });

const widthRatio: ComputedRef<number> = computed(() => {
  if (!props.aspectRatio || props.aspectRatio.indexOf(':') < 0) {
    return 0;
  }
  return Number(props.aspectRatio.split(':')[0]);
});
const heightRatio: ComputedRef<number> = computed(() => {
  if (!props.aspectRatio || props.aspectRatio.indexOf(':') < 0) {
    return 0;
  }
  return Number(props.aspectRatio.split(':')[1]);
});

watch(() => props.aspectRatio, () => {
  handleStreamRegionSize();
});


function handleStreamRegionSize() {
  if (!streamRegionContainerRef.value) {
    return;
  }
  const containerWidth = getContentSize(streamRegionContainerRef.value).width;
  const containerHeight = getContentSize(streamRegionContainerRef.value).height;
  let width = containerWidth;
  let height = containerHeight;
  if (widthRatio.value && heightRatio.value) {
    const scaleWidth = containerWidth / widthRatio.value;
    const scaleHeight = containerHeight / heightRatio.value;
    if (scaleWidth > scaleHeight) {
      width = (containerHeight / heightRatio.value) * widthRatio.value;
      height = containerHeight;
    }
    if (scaleWidth <= scaleHeight) {
      width = containerWidth;
      height = (containerWidth / widthRatio.value) * heightRatio.value;
    }
  }
  streamStyle.value.width = `${width}px`;
  streamStyle.value.height = `${height}px`;
}

function handleStreamDblClick() {
  emits('stream-view-dblclick', { userInfo: props.userInfo, streamType: props.streamType });
}

const ro = new ResizeObserver(() => {
  handleStreamRegionSize();
});

onMounted(() => {
  ro.observe(streamRegionContainerRef.value as Element);
});

onBeforeUnmount(() => {
  ro.unobserve(streamRegionContainerRef.value as Element);
});
</script>

<style lang="scss" scoped>
.stream-region-container {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  overflow: hidden;

  .stream-region {
    position: relative;
    overflow: hidden;
    background-color: var(--uikit-color-black-1);
  }
}
</style>
