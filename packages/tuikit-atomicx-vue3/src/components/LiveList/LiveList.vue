<template>
  <div
    v-if="loginUserInfo"
    class="live-list-panel"
  >
    <div
      v-if="liveList.length > 0"
      ref="scrollContainerRef"
      class="live-list"
      @wheel="handleWheel"
    >
      <div
        ref="liveListItemsRef"
        class="live-list-items"
      >
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
                <span> {{ t('LIVE') }} </span>
              </div>
              <div class="right">
                <span> {{ item.currentViewerCount || 0 }} </span>
                <span> {{ t('people have watched the live') }} </span>
              </div>
            </div>
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
              :size="24"
              :style="{ border: '1px solid var(--uikit-color-white-7)' }"
            />
            <span class="owner-name">{{ item.liveOwner.userName || item.liveOwner.userId }} </span>
          </div>
        </div>
      </div>
      <div
        v-if="!hasMoreLive"
        class="bottom-text-no-more"
      >
        <span>{{ t('No More') }}</span>
      </div>
    </div>
    <div
      v-else-if="!isLoadingMore"
      class="no-live"
    >
      <IconNoLiveRoom :size="60" />
      <span>{{ t('No Live') }}</span>
    </div>
    <div
      v-if="liveList.length > 0 && (isShowMoreVisible || isLoadingMore)"
      class="bottom-text"
    >
      <span
        v-if="isShowMoreVisible"
        class="load-more-lives"
      >{{ t('Load More') }}</span>
      <span
        v-if="isLoadingMore"
        class="loading"
      >{{ t('Loading...') }}</span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, defineEmits, watch } from 'vue';
import { useUIKit, IconLiveCoverHeader, IconNoLiveRoom } from '@tencentcloud/uikit-base-component-vue3';
import { useLiveState } from '../../states/LiveState';
import { useLoginState } from '../../states/LoginState';
import { Avatar } from '../Avatar';
import type { LiveInfo } from '../../types';

const { liveList, currentCursor, fetchLiveList } = useLiveState();
const { loginUserInfo } = useLoginState();
const { t } = useUIKit();

const DEFAULT_COVER = 'https://liteav-test-1252463788.cos.ap-guangzhou.myqcloud.com/voice_room/voice_room_cover1.png';
const scrollContainerRef = ref<HTMLElement | null>(null);
const liveListItemsRef = ref<HTMLElement | null>(null);

const isLoadingMore = ref(false);
const hasMoreLive = computed(() => currentCursor.value !== '');

const liveItemWidth = ref('356px');
const liveItemHeight = ref('270px');
const coverWidth = ref('356px');
const coverHeight = ref('210px');
const columnCount = 5;

const shouldFetchMoreLiveList = computed(() => hasMoreLive.value && !isLoadingMore.value);

const isShowMoreVisible = computed(() => shouldFetchMoreLiveList.value && !scrollContainerRef.value);

watch(
  loginUserInfo,
  async (user) => {
    if (user && user.userId) {
      isLoadingMore.value = true;
      currentCursor.value = '';
      liveList.value.length = 0;
      await fetchLiveList({});
      isLoadingMore.value = false;
    }
  },
  { immediate: true },
);

watch(liveListItemsRef, () => {
  if (liveListItemsRef.value && screen.width > screen.height) {
    const { width } = liveListItemsRef.value.getBoundingClientRect();
    const gapWidth = 20 * (columnCount - 1);
    const newItemWidth = (width - gapWidth) / columnCount;
    const newItemHeight = newItemWidth * 0.75;

    liveItemWidth.value = `${newItemWidth}px`;
    liveItemHeight.value = `${newItemHeight}px`;

    coverWidth.value = `${newItemWidth}px`;
    coverHeight.value = `${newItemHeight - 52}px`;
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
  @include scrollbar;
}

.live-list-items {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(auto-fill, v-bind(liveItemWidth));
  flex-wrap: wrap;
  justify-content: center;
  gap: 20px;
}

.live-item {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  width: v-bind(liveItemWidth);
  height: v-bind(liveItemHeight);
  white-space: nowrap;
  text-overflow: ellipsis;
  gap: 5px;
  border-radius: 10px;

  :hover {
    cursor: pointer;
  }

  .live-room-cover {
    position: relative;
    width: v-bind(coverWidth);
    height: v-bind(coverHeight);
    overflow: hidden;

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
      color: $text-color1;
      @include text-size-12;
      align-items: center;

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
    margin: 5px 0px;
    height: 18px;
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    color: $text-color1;
    @include text-size-14;
  }

  .owner-info {
    height: 24px;
    display: flex;
    align-items: center;
    gap: 10px;
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
</style>
