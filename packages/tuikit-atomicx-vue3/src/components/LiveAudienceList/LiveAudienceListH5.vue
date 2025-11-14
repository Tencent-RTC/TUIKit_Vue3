<template>
  <div class="viewers-panel" :style="{ height: props.height, ...props.style }">
    <div class="viewers-list">
      <div
        v-for="viewer in audienceList"
        :key="viewer.userId"
        class="viewer-item"
        @click="handleViewerClick(viewer, $event)"
      >
        <Avatar :src="viewer.avatarUrl" :size="40" />
        <slot name="audience-mark" :audience="viewer"></slot>
        <div class="viewer-info">
          <span class="viewer-name">{{ viewer.userName || viewer.userId }}</span>
        </div>
      </div>
      <div class="viewer-bottom-line" v-if="audienceCount >= 200">{{ t('Only show 200 viewers') }}</div>

      <div v-if="audienceList.length === 0" class="empty-state">
        <p>{{ t('No audience yet') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CSSProperties, computed, defineProps, ref } from 'vue';
import { useLoginState } from '../../states/LoginState';
import { useLiveListState } from '../../states/LiveListState';
import { useLiveAudienceState } from '../../states/LiveAudienceState';
import { type AudienceInfo } from '../../types';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { Avatar } from '../Avatar';
const { t } = useUIKit();
const currentViewerTarget = ref<HTMLElement | null>(null);
const props = defineProps<{
  height?: string;
  style?: CSSProperties;
}>();
const { loginUserInfo } = useLoginState();
const { audienceList, audienceCount } = useLiveAudienceState();
const { currentLive } = useLiveListState();

const showActionMenu = ref(false);
const selectedViewer = ref<AudienceInfo | null>(null);
const actionMenuStyle = ref({});
const isOwner = computed(() => loginUserInfo.value?.userId === currentLive.value?.liveOwner.userId);

const handleViewerClick = (viewer: AudienceInfo, event: MouseEvent) => {
  if (!isOwner.value) return;
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
  height: 100%;
  display: flex;
  flex-direction: column;
  color: $text-color1;
  transition: max-height 0.3s ease;
  gap: 8px;

  &:hover {
    .current-user-item {
      opacity: 1;
      display: flex;
    }

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
    border-radius: 0;
    min-height: 50px;
    transition: background-color 0.2s ease;
    width: 100%;
    padding: 4px 0;
    border-radius: 4px;
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
      height: 100%;
      border-bottom: 1px solid var(--uikit-color-gray-3);
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

  .current-user-item {
    opacity: 0;
    display: none;
    z-index: 2;
  }
}
</style>
