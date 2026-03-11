<template>
  <div v-if="loginUserInfo" class="live-list-panel">
    <div
      v-if="liveList.length > 0"
      ref="scrollContainerRef"
      class="live-list"
      @wheel="handleWheel"
    >
      <div ref="liveListItemsRef" class="live-list-items">
        <div
          v-for="item in liveList"
          :key="item.liveId"
          class="live-item"
          @click="liveRoomClick(item)"
        >
          <div class="live-room-cover">
            <div class="header">
              <div class="left">
                <IconLiveCoverHeader :size="10" />
                <span> {{ t('LiveList.LIVE') }} </span>
              </div>
              <div class="right">
                <span> {{ item.currentViewerCount || 0 }} </span>
                <span> {{ t('LiveList.PeopleWatched') }} </span>
              </div>
            </div>
            <div class="gradient" />
            <img
              :src="item.coverUrl || DEFAULT_COVER"
              alt=""
              @error="handleCoverImageError"
            >
          </div>
          <span class="live-name">{{ item.liveName }} </span>
          <div class="owner-info">
            <Avatar
              :src="item.liveOwner.avatarUrl"
              :size="20"
              :style="{ border: '1px solid var(--uikit-color-white-7)' }"
            />
            <span class="owner-name">{{ item.liveOwner.userName || item.liveOwner.userId }} </span>
          </div>
        </div>
      </div>
    </div>
    <div v-else-if="!isLoadingMore" class="no-live">
      <IconNoLiveRoom :size="60" />
      <span>{{ t('LiveList.NoLive') }}</span>
    </div>
    <div v-if="liveList.length > 0 && (isShowMoreVisible || isLoadingMore)" class="bottom-text">
      <span v-if="isShowMoreVisible" class="load-more-lives">{{ t('LiveList.LoadMore') }}</span>
      <span v-if="isLoadingMore" class="loading">{{ t('LiveList.Loading') }}</span>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue';
import { useUIKit, IconLiveCoverHeader, IconNoLiveRoom } from '@tencentcloud/uikit-base-component-vue3';
import { useLiveListState } from '../../states/LiveListState';
import { useLoginState } from '../../states/LoginState';
import { Avatar } from '../Avatar';
import type { LiveInfo } from '../../types';
const { liveList, liveListCursor, fetchLiveList } = useLiveListState();
const { loginUserInfo } = useLoginState();
const { t } = useUIKit();
const props = defineProps({
  columnCount: {
    type: Number,
    default: 5,
  },
});
const SMALL_CONTAINER_WIDTH = 1000;
const SMALL_CONTAINER_GAP = 12;
const LARGE_CONTAINER_GAP = 20;
const MIN_LIVE_ITEM_WIDTH = 200;
const LIVE_INFO_HEIGHT = 52;

const DEFAULT_COVER = 'https://web.sdk.qcloud.com/trtc/live/web/assets/defaultCoverLive.png';
const scrollContainerRef = ref<HTMLElement | null>(null);
const liveListItemsRef = ref<HTMLElement | null>(null);

const isLoadingMore = ref(false);
const hasMoreLive = computed(() => liveListCursor.value !== '');
const liveItemWidth = ref('356px');
const liveItemHeight = ref('270px');
const coverWidth = ref('356px');
const coverHeight = ref('210px');
const itemGap = ref('20px');
const shouldFetchMoreLiveList = computed(() => hasMoreLive.value && !isLoadingMore.value);
const isShowMoreVisible = computed(() => shouldFetchMoreLiveList.value && !scrollContainerRef.value);

let resizeObserver: ResizeObserver | null = null;

function resizeLiveListItems() {
  if (liveListItemsRef.value) {
    const { width } = liveListItemsRef.value.getBoundingClientRect();
    const itemGapWidth = width <= SMALL_CONTAINER_WIDTH ? SMALL_CONTAINER_GAP : LARGE_CONTAINER_GAP;

    itemGap.value = `${itemGapWidth}px`;
    const gapWidth = itemGapWidth * (props.columnCount - 1);
    const newItemWidth = Math.max(Math.floor((width - gapWidth) / props.columnCount), MIN_LIVE_ITEM_WIDTH);
    coverWidth.value = `${newItemWidth}px`;
    coverHeight.value = `${newItemWidth * 0.6}px`;
    liveItemWidth.value = `${newItemWidth}px`;
    liveItemHeight.value = `${coverHeight.value + LIVE_INFO_HEIGHT}px`;
  }
}

watch(
  loginUserInfo,
  async (user) => {
    if (user && user.userId) {
      isLoadingMore.value = true;
      liveListCursor.value = '';
      liveList.value.length = 0;
      await fetchLiveList({});
      isLoadingMore.value = false;
    }
  },
  { immediate: true },
);

watch([liveListItemsRef, props.columnCount], () => {
  resizeLiveListItems();
  if (liveListItemsRef.value && !resizeObserver) {
    resizeObserver = new ResizeObserver(() => {
      resizeLiveListItems();
    });
    resizeObserver.observe(liveListItemsRef.value);
  }
});

onBeforeUnmount(() => {
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
});

const emit = defineEmits<{
  (e: 'live-room-click', liveInfo: LiveInfo): void;
}>();
function liveRoomClick(liveInfo: LiveInfo) {
  console.log('liveRoomClick,liveInfo:', liveInfo);
  emit('live-room-click', liveInfo);
}
function isScrollAtBottom(threshold = 50) {
  if (!scrollContainerRef.value) {
    return false;
  }
  return (
    scrollContainerRef.value.scrollTop + scrollContainerRef.value.clientHeight
    >= scrollContainerRef.value.scrollHeight - threshold
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
async function fetchMoreLives() {
  if (!hasMoreLive.value || isLoadingMore.value) {
    return;
  }
  try {
    isLoadingMore.value = true;
    await fetchLiveList({ cursor: liveListCursor.value });
  } finally {
    isLoadingMore.value = false;
  }
}
function handleCoverImageError(event: Event) {
  const image = event.target as HTMLImageElement;
  if (image && image.src !== DEFAULT_COVER) {
    image.src = DEFAULT_COVER;
    // Delete the error callback to avoid recursion
    image.onerror = null;
  }
}
</script>
<style lang="scss" scoped>
$text-color1: var(--text-color-primary);
$text-color2: var(--text-color-secondary);
$text-color3: var(--text-color-tertiary);
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
    width: 6px;
    background: transparent;
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
.live-list-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  align-items: center;
  margin: 0px 16px;
  width: calc(100% - 32px);
  height: 100%;
}
.live-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
  overflow: auto;
  align-items: center;
  &::-webkit-scrollbar {
    width: 0;
    background: transparent;
  }
}
.live-list-items {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(auto-fill, v-bind(liveItemWidth));
  flex-wrap: wrap;
  justify-content: center;
  gap: v-bind(itemGap);
}

.live-item {
  display: flex;
  flex-direction: column;
  width: v-bind(liveItemWidth);
  height: v-bind(liveItemHeight);
  white-space: nowrap;
  text-overflow: ellipsis;
  border-radius: 10px;

  :hover {
    cursor: pointer;
  }
  .live-room-cover {
    position: relative;
    width: v-bind(coverWidth);
    height: v-bind(coverHeight);
    overflow: hidden;
    box-shadow: 0px 2px 6px 0px rgba(0, 0, 0, 0.06), 0px 8px 18px 0px rgba(0, 0, 0, 0.06);
    border-radius: 10px;

    .gradient {
      position: absolute;
      width: 100%;
      height: 25%;
      object-fit: cover;
      border-radius: 10px;
      background: linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0));
      z-index: 1;
    }

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 10px;
    }
    .header {
      position: absolute;
      display: flex;
      top: 5px;
      width: 100%;
      height: 20px;
      justify-content: space-between;
      color: var(--uikit-color-white-1);
      @include text-size-12;
      align-items: center;
      z-index: 10;

      .left {
        display: flex;
        margin-left: 10px;
        align-items: center;
        gap: 5px;
      }
      .right {
        display: flex;
        align-items: center;
        float: right;
        margin-right: 10px;
        gap: 2px;
      }
    }
  }

  .live-name {
    margin-top: 4px;
    height: 24px;
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    color: $text-color1;
    @include text-size-14;
  }

  .owner-info {
    height: 20px;
    display: flex;
    align-items: center;
    gap: 4px;
    color: $text-color2;
    @include text-size-14;

    .owner-name {
      max-width: 200px;
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
    color: $text-color3;
    @include text-size-14;
  }
}
.bottom-text {
  padding: 8px;
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
@media screen and (max-width: 1000px) {
  .live-list-panel {
    margin: 0px 8px;
    width: calc(100% - 16px);
  }
}
</style>
