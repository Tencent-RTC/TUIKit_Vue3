<template>
  <div class="live-list-panel-h5" v-if="loginUserInfo">
    <div
      v-if="liveList.length > 0"
      class="live-list"
      @scroll="handleScroll"
      @wheel="handleWheel"
      ref="scrollContainerRef"
    >
      <div class="live-list-items">
        <div class="live-item" v-for="item in liveList" :key="item.liveId" @click="liveRoomClick(item)">
          <div class="live-room-cover">
            <div class="header">
              <IconLiveCoverHeader :size="10" />
              <span class="viewer-count"> {{ item.currentViewerCount || 0 }} </span>
              <span> {{ t('people have watched the live') }} </span>
            </div>
            <img :src="item.coverUrl || DEFAULT_COVER" alt="" @error="handleCoverImageError" />
          </div>
          <span class="live-name">{{ item.liveName }} </span>
          <div class="owner-info">
            <Avatar :src="item.liveOwner.avatarUrl" :size="16" />
            <span class="owner-name">{{ item.liveOwner.userName || item.liveOwner.userId }} </span>
          </div>
        </div>
      </div>
      <div class="bottom-text-no-more" v-if="!hasMoreLive">
        <span>{{ t('No More') }}</span>
      </div>
    </div>
    <div v-else-if="!isLoadingMore" class="no-live">
      <IconNoLiveRoom :size="60" />
      <span>{{ t('No Live') }}</span>
    </div>
    <div class="bottom-text" v-if="liveList.length > 0 && (isShowMoreVisible || isLoadingMore)">
      <span v-if="isShowMoreVisible">{{ t('Load More') }}</span>
      <span v-if="isLoadingMore">{{ t('Loading...') }}</span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, computed, defineEmits, onMounted, onUnmounted } from 'vue';
import { useUIKit, IconLiveCoverHeader, IconNoLiveRoom } from '@tencentcloud/uikit-base-component-vue3';
import { useLiveState } from '../../states/LiveState';
import { LiveInfo } from '../../types';
import { useLoginState } from '../../states/LoginState';
import { Avatar } from '../Avatar';

const { liveList, currentCursor, fetchLiveList } = useLiveState();
const { loginUserInfo } = useLoginState();
const { t } = useUIKit();

const DEFAULT_COVER = 'https://liteav-test-1252463788.cos.ap-guangzhou.myqcloud.com/voice_room/voice_room_cover1.png';
const scrollContainerRef = ref<HTMLElement | null>(null);

const isLoadingMore = ref(false);
const hasMoreLive = computed(() => currentCursor.value !== '');

const liveItemWidth = ref('168px');
const liveItemHeight = ref('262px');

const shouldFetchMoreLiveList = computed(() => {
  return hasMoreLive.value && !isLoadingMore.value;
});

const isShowMoreVisible = computed(() => {
  return shouldFetchMoreLiveList.value && !scrollContainerRef.value;
});

const emit = defineEmits<{
  (e: 'live-room-click', liveInfo: LiveInfo): void;
}>();

watch(
  loginUserInfo,
  async user => {
    if (user && user.userId) {
      isLoadingMore.value = true;
      await fetchLiveList({});
      isLoadingMore.value = false;
    }
  },
  { immediate: true }
);

watch(scrollContainerRef, () => {
  if (scrollContainerRef.value && screen.width < screen.height) {
    const { width } = scrollContainerRef.value.getBoundingClientRect();
    const marginWidth = 10 * 2 + 5;
    const newItemWidth = (width - marginWidth) / 2;
    const newItemHeight = newItemWidth * 1.6;

    liveItemWidth.value = `${newItemWidth}px`;
    liveItemHeight.value = `${newItemHeight}px`;
  }
});

function liveRoomClick(liveInfo: LiveInfo) {
  console.log('liveRoomClick,liveInfo:', liveInfo);
  emit('live-room-click', liveInfo);
}

function isScrollAtBottom(threshold = 50) {
  if (!scrollContainerRef.value) {
    return false;
  }
  return (
    scrollContainerRef.value.scrollTop + scrollContainerRef.value.clientHeight >=
    scrollContainerRef.value.scrollHeight - threshold
  );
}

function handleWheel(event: WheelEvent) {
  if (!scrollContainerRef.value) {
    return;
  }

  if (event.deltaY > 0 && isScrollAtBottom() && shouldFetchMoreLiveList.value) {
    fetchMoreLives();
  }
}

function handleScroll() {
  if (!scrollContainerRef.value) {
    return;
  }

  if (isScrollAtBottom() && shouldFetchMoreLiveList.value) {
    fetchMoreLives();
  }
}

async function fetchMoreLives() {
  if (!hasMoreLive.value || isLoadingMore.value) return;
  try {
    isLoadingMore.value = true;
    await fetchLiveList({ cursor: currentCursor.value });
  } finally {
    isLoadingMore.value = false;
  }
}

function handleCoverImageError(event: Event) {
  const image = event.target as HTMLImageElement;
  if (image) {
    image.src = DEFAULT_COVER;
  }
}

onMounted(() => {
  if (scrollContainerRef.value) {
    scrollContainerRef.value.addEventListener('scroll', handleScroll);
  }
});

onUnmounted(() => {
  if (scrollContainerRef.value) {
    scrollContainerRef.value.removeEventListener('scroll', handleScroll);
  }
});
</script>

<style lang="scss" scoped>
$text-color1: var(--text-color-primary);
$text-color2: var(--text-color-secondary);

@mixin text-size-12 {
  font-size: 12px;
  font-weight: 400;
}

@mixin text-size-14 {
  font-size: 14px;
  font-weight: 400;
}

@mixin scrollbar {
  &::-webkit-scrollbar {
    width: 0px;
    display: none;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--uikit-color-gray-3);
    border-radius: 3px;
    border: 2px solid transparent;
    background-clip: padding-box;

    &:hover {
      background: var(--uikit-color-gray-3);
    }
  }
}

.live-list-panel-h5 {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  align-items: center;
  width: 100%;
  height: 100%;
}

.live-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
  overflow: auto;
  align-items: center;
  @include scrollbar;
  scrollbar-width: none;
}

.live-list-items {
  flex: 1;
  width: 100%;
  display: grid;
  grid-template-columns: repeat(auto-fill, v-bind(liveItemWidth));
  flex-wrap: wrap;
  justify-content: center;
  gap: 5px;
}

.live-item {
  position: relative;
  display: flex;
  overflow: hidden;
  flex-direction: column;
  white-space: nowrap;
  text-overflow: ellipsis;
  width: v-bind(liveItemWidth);
  height: v-bind(liveItemHeight);
  gap: 5px;
  border-radius: 10px;

  :hover {
    cursor: pointer;
  }

  .live-room-cover {
    position: absolute;
    width: 100%;
    height: 100%;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 10px;
    }
  }

  .header {
    position: absolute;
    display: flex;
    top: 5px;
    height: 20px;
    margin-left: 10px;
    gap: 2px;
    color: $text-color1;
    @include text-size-12;
    align-items: center;
  }

  .live-name {
    position: absolute;
    bottom: 35px;
    height: 20px;
    max-width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
    align-items: center;
    margin-left: 10px;
    color: $text-color1;
    @include text-size-12;
  }

  .owner-info {
    position: absolute;
    bottom: 10px;
    height: 20px;
    display: flex;
    align-items: center;
    text-overflow: ellipsis;
    margin-left: 10px;
    gap: 4px;
    color: $text-color2;
    @include text-size-12;

    .owner-name {
      max-width: 80px;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
}

.bottom-text-no-more {
  flex: 1;
  min-height: 30px;
  position: relative;

  span {
    width: 200px;
    position: absolute;
    bottom: 5px;
    text-align: center;
    transform: translate(-50%, 0);
    color: $text-color1;
    @include text-size-14;
  }
}

.bottom-text {
  margin: 8px;
  color: $text-color1;
  @include text-size-14;
}

.load-more-lives:hover {
  cursor: pointer;
}

.no-live {
  display: flex;
  flex-direction: column;
  flex: 1;
  align-items: center;
  justify-content: center;

  span {
    color: $text-color1;
    @include text-size-12;
  }
}
</style>
