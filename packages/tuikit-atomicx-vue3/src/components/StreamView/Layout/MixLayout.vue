<template>
  <div class="mix-layout-container">
    <StreamRegion v-if="innerUserStore.mixUserInfo" :user-info="innerUserStore.mixUserInfo" :stream-type="TUIVideoStreamType.kCameraStream"
      :aspect-ratio="aspectRatio">
      <template #stream-cover>
        <div class="mix-stream-cover" ref="streamCoverRef">
          <div class="mix-stream-cover-item" v-for="item in layoutList" :key="`${item.userId}-${item.streamType}`" :style="getStreamCoverStyle(item)">
            <StreamCover :user-info="innerUserStore.getUserInfo({ userId: item.userId }) as UserInfo" :stream-type="item.streamType" />
          </div>
        </div>
      </template>
      <template #streamViewUI="slotProps">
        <slot name="streamViewUI" v-bind="slotProps" />
      </template>
    </StreamRegion>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount, reactive, watch } from 'vue';
import { UserInfo } from '../../../types';
import { TUIVideoStreamType } from '@tencentcloud/tuiroom-engine-js';
import useLiveState from '../../../states/LiveState';
import StreamRegion from '../common/StreamRegion';
import StreamCover from '../common/StreamCover/index.vue';
import { innerUserStore } from '../../../states/UserState/store';

interface Props {
  config?: string;
  filterFn?: (userInfo: UserInfo, index: number) => boolean;
  sortFn?: (userInfoA: UserInfo, userInfoB: UserInfo) => number;
}

interface LayoutItem {
  userId: string;
  streamType: number;
  x: number;
  y: number;
  width: number;
  height: number;
  zOrder: number;
  backgroundColor: string;
}

const { currentLive } = useLiveState();
defineProps<Props>();

const streamCoverRef = ref<HTMLDivElement>();

const aspectRatio = computed(() => {
  if (currentLive.value && currentLive.value.layoutTemplateParams.canvas) {
    return `${currentLive.value.layoutTemplateParams.canvas.width}:${currentLive.value.layoutTemplateParams.canvas.height}`;
  }
  return '16:9';
});

const layoutList = computed<LayoutItem[]>(() => {
  if (currentLive.value && currentLive.value.layoutTemplateParams.layoutList) {
    return currentLive.value.layoutTemplateParams.layoutList;
  }
  return [];
});

// 保存每个item的样式
const itemStyles = reactive<Record<string, Record<string, string | number>>>({});

watch(() => layoutList.value.length, () => {
  updateAllItemStyles();
}, { deep: true });

const resizeObserver = new ResizeObserver(() => {
  if (!streamCoverRef.value) {
    return;
  }
  // 在尺寸变化时更新所有item的样式
  updateAllItemStyles();
});

onMounted(() => {
  streamCoverRef.value && resizeObserver.observe(streamCoverRef.value);
});

onBeforeUnmount(() => {
  streamCoverRef.value && resizeObserver.unobserve(streamCoverRef.value);
});

// 更新所有item的样式
function updateAllItemStyles() {
  layoutList.value.forEach(item => {
    updateItemStyle(item);
  });
}

// 更新单个item的样式
function updateItemStyle(item: LayoutItem) {
  const key = `${item.userId}-${item.streamType}`;
  if (!streamCoverRef.value) {
    itemStyles[key] = {};
    return;
  }

  const streamCoverWidth = streamCoverRef.value?.clientWidth;
  const streamCoverHeight = streamCoverRef.value?.clientHeight;

  itemStyles[key] = {
    left: streamCoverWidth * item.x + 'px',
    top: streamCoverWidth * item.y + 'px',
    width: streamCoverWidth * item.width + 'px',
    height: item.height === -1 ? streamCoverHeight + 'px' : streamCoverWidth * item.height + 'px',
    zIndex: item.zOrder,
    backgroundColor: item.backgroundColor,
  };
}

// 获取item的样式
function getStreamCoverStyle(item: LayoutItem) {
  const key = `${item.userId}-${item.streamType}`;
  // 确保样式对象已经创建
  if (!itemStyles[key]) {
    updateItemStyle(item);
  }
  return itemStyles[key];
}

</script>

<style lang="scss" scoped>
.mix-layout-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.mix-stream-cover {
  width: 100%;
  height: 100%;
  position: relative;

  .mix-stream-cover-item {
    position: absolute;
  }
}
</style>
../../../states/LiveState
