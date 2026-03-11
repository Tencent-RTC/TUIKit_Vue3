<template>
  <div v-if="loginUserInfo" class="live-list-panel-h5">
    <div
      v-if="showLiveList.length > 0"
      ref="scrollContainerRef"
      class="live-list"
    >
      <PullToRefresh
        :text="{
          pull: t('LiveList.PullDownToRefresh'),
          release: t('LiveList.ReleaseToRefresh'),
          loading: t('LiveList.Loading'),
          success: t('LiveList.RefreshSuccess'),
          error: t('LiveList.RefreshFailed'),
        }"
        @refresh="handleRefresh"
        @load-more="fetchMoreLives"
      >
        <div class="live-list-items">
          <div v-for="item in showLiveList" :key="item.liveId" class="live-item" @click="liveRoomClick(item)">
            <div class="live-room-cover">
              <div class="header">
                <IconLiveCoverHeader :size="10" />
                <span class="viewer-count"> {{ item.currentViewerCount || 0 }} </span>
                <span> {{ t('LiveList.PeopleWatched') }} </span>
              </div>
              <img :src="item.coverUrl || DEFAULT_COVER" alt="" @error="handleCoverImageError" />
            </div>
            <span class="live-name">{{ item.liveName }} </span>
            <div class="owner-info">
              <Avatar
                :src="item.liveOwner.avatarUrl"
                :size="16"
                :style="{ border: '1px solid var(--uikit-color-white-7)' }"
              />
              <span class="owner-name">{{ item.liveOwner.userName || item.liveOwner.userId }} </span>
            </div>
          </div>
        </div>
        <div v-if="!hasMoreLive" class="bottom-text-no-more">
          <span>{{ t('LiveList.NoMore') }}</span>
        </div>
      </PullToRefresh>
    </div>
    <div v-else-if="!isLoadingMore" class="no-live">
      <IconNoLiveRoom :size="60" />
      <span>{{ t('LiveList.NoLive') }}</span>
    </div>
    <div v-if="liveList.length > 0 && isLoadingMore" class="bottom-text">
      <span v-if="isLoadingMore">{{ t('LiveList.Loading') }}</span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, computed } from 'vue';
import { useUIKit, IconLiveCoverHeader, IconNoLiveRoom } from '@tencentcloud/uikit-base-component-vue3';
import { useLiveListState } from '../../states/LiveListState';
import { useLoginState } from '../../states/LoginState';
import { Avatar } from '../Avatar';
import type { LiveInfo } from '../../types';
import PullToRefresh from './pullToRefresh.vue';

const { liveList, liveListCursor, fetchLiveList } = useLiveListState();
const { loginUserInfo } = useLoginState();
const { t } = useUIKit();
const showLiveList = ref<LiveInfo[]>([]);

// The default address supports ipv6 network access
const DEFAULT_COVER = 'https://web.sdk.qcloud.com/trtc/live/web/assets/defaultCoverLive.png';
const scrollContainerRef = ref<HTMLElement | null>(null);

const isLoadingMore = ref(false);
const hasMoreLive = computed(() => liveListCursor.value !== '');

const liveItemWidth = ref('168px');
const liveItemHeight = ref('262px');

const emit = defineEmits<{
  (e: 'live-room-click', liveInfo: LiveInfo): void;
}>();

watch(
  loginUserInfo,
  async user => {
    if (user && user.userId) {
      isLoadingMore.value = true;
      liveListCursor.value = '';
      liveList.value.length = 0;
      await fetchLiveList({});
      showLiveList.value = liveList.value.slice();
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

async function handleRefresh(completeRefresh: (success?: boolean) => void) {
  try {
    isLoadingMore.value = true;
    liveListCursor.value = '';
    liveList.value.length = 0;
    await fetchLiveList({});
    showLiveList.value = liveList.value.slice();
    isLoadingMore.value = false;
    completeRefresh(true);
  } catch (error) {
    completeRefresh(false);
  }
}

function liveRoomClick(liveInfo: LiveInfo) {
  console.log('liveRoomClick,liveInfo:', liveInfo);
  emit('live-room-click', liveInfo);
}

async function fetchMoreLives() {
  if (!hasMoreLive.value || isLoadingMore.value) {
    return;
  }
  try {
    isLoadingMore.value = true;
    await fetchLiveList({ cursor: liveListCursor.value });
    showLiveList.value = liveList.value.slice();
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
    @include text-size-14;
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
    @include text-size-14;

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
  text-align: center;
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
