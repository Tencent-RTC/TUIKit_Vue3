<template>
  <div
    class="viewers-panel"
    :style="{ height: props.height, ...props.style }"
  >
    <div
      ref="viewersListRef"
      class="viewers-list"
    >
      <div
        v-for="(viewer, index) in audienceList"
        :key="viewer.userId"
        class="viewer-item"
        @click="handleViewerClick(viewer, $event)"
      >
        <!-- Custom audience-item slot replaces entire item (audience-mark will not render) -->
        <slot
          v-if="$slots['audience-item']"
          name="audience-item"
          :index="index"
          :audience="viewer"
        />
        <!-- Default rendering with audience-mark slot support -->
        <template v-else>
          <Avatar :src="viewer.avatarUrl" :size="26" />
          <slot
            name="audience-mark"
            :audience="viewer"
          />
          <div class="viewer-info">
            <span class="viewer-name">{{ viewer.userName || viewer.userId }}</span>
          </div>
        </template>
      </div>

      <div
        v-if="isLoading"
        class="loading-indicator"
      >
        {{ t('Loading...') }}
      </div>

      <div
        v-if="audienceCount >= MAX_AUDIENCE_COUNT"
        class="viewer-bottom-line"
      >
        {{ t('Only show 200 viewers') }}
      </div>

      <div
        v-if="audienceList.length === 0 && !isLoading"
        class="empty-state"
      >
        <p>{{ t('No audience yet') }}</p>
      </div>
    </div>
    <UserActionMenu
      v-if="showActionMenu"
      :user-id="selectedViewer?.userId || ''"
      :user-name="selectedViewer?.userName || selectedViewer?.userId || ''"
      :avatar-url="selectedViewer?.avatarUrl"
      :style="actionMenuStyle"
      :click-target="currentViewerTarget"
      @close="handleCloseActionMenu"
    />
  </div>
</template>

<script setup lang="ts">
import type { CSSProperties } from 'vue';
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useLiveAudienceState } from '../../states/LiveAudienceState';
import { useLiveListState } from '../../states/LiveListState';
import { useLoginState } from '../../states/LoginState';
import { Avatar } from '../Avatar';
import UserActionMenu from './UserActionMenu.vue';
import type { AudienceInfo } from '../../types';
import { MAX_AUDIENCE_COUNT } from './index';

const { t } = useUIKit();
const currentViewerTarget = ref<HTMLElement | null>(null);
const viewersListRef = ref<HTMLElement | null>(null);
const isLoading = ref(false);
const props = defineProps<{
  height?: string;
  style?: CSSProperties;
}>();
const { loginUserInfo } = useLoginState();
const { audienceList, audienceCount, fetchAudienceList } = useLiveAudienceState();
const { currentLive } = useLiveListState();

const showActionMenu = ref(false);
const selectedViewer = ref<AudienceInfo | null>(null);
const actionMenuStyle = ref({});
const isOwner = computed(() => loginUserInfo.value?.userId === currentLive.value?.liveOwner.userId);

const handleViewerClick = (viewer: AudienceInfo, event: MouseEvent) => {
  if (!isOwner.value) {
    return;
  }
  selectedViewer.value = viewer;
  showActionMenu.value = true;
  const target = event.currentTarget as HTMLElement;
  currentViewerTarget.value = target;
  const rect = target.getBoundingClientRect();
  actionMenuStyle.value = {
    position: 'fixed',
    left: `${rect.left}px`,
    top: `${rect.bottom + 8}px`,
    zIndex: 1001,
  };
};

const handleCloseActionMenu = () => {
  showActionMenu.value = false;
  selectedViewer.value = null;
};

const handleScroll = async () => {
  if (!viewersListRef.value || isLoading.value) {
    return;
  }

  const { scrollTop, clientHeight, scrollHeight } = viewersListRef.value;
  if (scrollTop + clientHeight >= scrollHeight - 50) {
    isLoading.value = true;
    try {
      await fetchAudienceList();
    } finally {
      isLoading.value = false;
    }
  }
};

onMounted(() => {
  if (viewersListRef.value) {
    viewersListRef.value.addEventListener('scroll', handleScroll);
  }
});

onUnmounted(() => {
  if (viewersListRef.value) {
    viewersListRef.value.removeEventListener('scroll', handleScroll);
  }
});
</script>

<style lang="scss" scoped>
$text-color1: var(--text-color-primary);
$text-color2: var(--text-color-secondary);

@mixin text-size-16 {
  font-size: 16px;
  font-weight: 600;
}

@mixin text-size-12 {
  font-size: 12px;
  font-weight: 400;
}

.viewers-panel {
  box-sizing: border-box;
  border-radius: 8px;
  height: 500px;
  display: flex;
  flex-direction: column;
  color: $text-color1;
  transition: max-height 0.3s ease;
  background-color: var(--bg-color-operate);
  gap: 8px;
  margin-top: 2px;

  &:hover {
    .viewers-list {
      height: auto;
      flex-shrink: 1;
    }
  }

  .viewers-list {
    flex-grow: 1;
    overflow-y: auto;
    overflow-x: hidden;
    display: flex;
    flex-direction: column;
    padding-right: 0;
    width: 100%;

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

  .viewer-bottom-line {
    text-align: center;
    color: $text-color2;
    font-size: 12px;
  }

  .viewer-item {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 36px;
    transition: background-color 0.2s ease;
    width: 100%;
    padding: 2px 0 2px 6px;
    border-radius: 8px;
    cursor: pointer;

    &:hover {
      background-color: var(--uikit-color-gray-3);
    }

    .viewer-info {
      display: flex;
      align-items: center;
      flex: 1;
      min-width: 0;
      gap: 8px;
    }

    .viewer-name {
      font-size: 14px;
      color: var(--text-color-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex-shrink: 1;
      min-width: 0;
    }
  }

  .empty-state {
    text-align: center;
    color: $text-color2;
    font-size: 14px;
    font-weight: 400;
    margin: auto;
  }

  .load-more-indicator,
  .loading-indicator {
    text-align: center;
    color: $text-color2;
    font-size: 12px;
    font-weight: 400;
    padding: 8px 0;
    margin: 4px 0;
  }

}

.popover-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: transparent;
  z-index: 1000;
}
</style>
