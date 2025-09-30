<template>
  <div class="recommend-host-list-container">
      <div class="recommend-host-list-title">
        <span class="recommend-host-list-title-text">{{ coHostStatus === CoHostStatus.Connected ? t('Invite more') : t('Recommend hosts') }}</span>
        <IconRefresh :class="['refresh-icon', refreshInviteesLoading ? 'loading' : '']" @click="handleRefreshInvitees"></IconRefresh>
      </div>
      <div class="recommend-host-list-content">
        <div class="recommend-host-list">
          <div
            v-for="user in [...invitees, ...candidates]"
            :key="`${user.userId}-${user.liveId}`"
            class="user-item"
          >
            <div class="user-item-left">
              <Avatar
                :src="user.avatarUrl"
                :size="40"
              />
            </div>
            <div class="user-item-right">
              <div class="user-info">
                <span class="user-name">{{ user.userName || user.userId }}</span>
              </div>
              <div class="user-actions">
                <slot name="host-item-actions" :user="user" />
              </div>
            </div>
          </div>
        </div>
        <!-- Load more indicator -->
        <div class="load-more-indicator" ref="loadMoreRef">
          <div v-if="loadMoreLoading" class="loading-content">
            <div class="loading-spinner"></div>
            <span>{{ t('Loading more users...') }}</span>
          </div>
          <div v-else-if="!hasMoreUsers && candidates.length > 0" class="no-more-content">
            <span>{{ t('No more users') }}</span>
          </div>
          <div v-else class="load-more-trigger-content">
            <!-- empty trigger content -->
          </div>
        </div>
      </div>
      <div
        v-if="candidates.length === 0"
        class="empty-state"
      >
        <span>{{ t('No hosts available to invite') }}</span>
      </div>
    </div>
</template>

<script setup lang="ts">
import { IconRefresh, useUIKit, TUIToast, TOAST_TYPE } from '@tencentcloud/uikit-base-component-vue3';
import { TUIErrorCode } from '@tencentcloud/tuiroom-engine-js';
import { ref, onMounted, onUnmounted } from 'vue';
import { useCoHostState } from '../../states/CoHostState';
import { useLiveState } from '../../states/LiveState';
import { Avatar } from '../Avatar';
import { CoHostStatus } from '../../types';

const { t } = useUIKit();
const { currentCursor, liveList, fetchLiveList } = useLiveState();
const { coHostStatus, invitees, candidates } = useCoHostState();

const loadMoreRef = ref<HTMLElement | null>(null);
let intersectionObserver: IntersectionObserver | null = null;

const refreshInviteesLoading = ref(false);
const loadMoreLoading = ref(false);
const hasMoreUsers = ref(true);
async function handleRefreshInvitees() {
  refreshInviteesLoading.value = true;
  Promise.all([
    new Promise((resolve) => setTimeout(resolve, 500)),
    fetchLiveList({
      cursor: '',
      count: 20,
    }),
  ])
  .catch(error => {
    if (error.code === TUIErrorCode.ERR_FREQ_LIMIT) {
      TUIToast({ type: TOAST_TYPE.ERROR, message: t('Request too frequent, please try again later') });
    } else {
      TUIToast({ type: TOAST_TYPE.ERROR, message: t('Refresh error, please try again later') });
    }
  })
  .finally(() => {
    refreshInviteesLoading.value = false;
  });
}

onMounted(() => {
  if (loadMoreRef.value) {
    intersectionObserver = new IntersectionObserver(async (changes) => {
      let item = changes[0];
      if (item.isIntersecting && !loadMoreLoading.value && hasMoreUsers.value) {
        loadMoreLoading.value = true;
        try {
          const previousLength = liveList.value.length;
          await fetchLiveList({
            cursor: currentCursor.value === '' ? liveList.value.length + '' : currentCursor.value,
            count: 20,
          });
          const newLength = liveList.value.length;
          if (newLength - previousLength < 20) {
            hasMoreUsers.value = false;
          }
        } catch (error) {
          console.error('Load more users failed:', error);
        } finally {
          loadMoreLoading.value = false;
        }
      }
    }, {
      root: null,
      rootMargin: '100px',
    });
    intersectionObserver.observe(loadMoreRef.value);
  }
});

onUnmounted(() => {
  if (loadMoreRef.value) {
    intersectionObserver?.unobserve(loadMoreRef.value);
  }
});
</script>
<style lang="scss" scoped>
@mixin scrollbar {
  &::-webkit-scrollbar {
    width: 6px;
    background: transparent;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    width: 6px !important;
    background: var(--uikit-color-gray-3) !important;
    border-radius: 3px;
    border: 2px solid transparent;
    background-clip: padding-box;
    &:hover {
      background: var(--uikit-color-gray-3) !important;
    }
  }
}
.recommend-host-list-container {
  display: flex;
  flex-direction: column;
  min-height: 0;

  .recommend-host-list-title {
    display: flex;
    align-items: center;
    color: var(--text-color-secondary);
    font-size: 14px;
    font-weight: 400;
    gap: 8px;
    margin: 12px 0 8px 0;
  }

  .refresh-icon {
    cursor: pointer;
    &.loading {
      animation: spin 1s linear infinite;
    }
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .recommend-host-list-content {
    flex: 1;
    overflow-y: auto;
    @include scrollbar;
  }

  .recommend-host-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .user-item {
    display: flex;
    align-items: center;
    gap: 12px;
    height: 50px !important;
    box-sizing: border-box;

    .user-item-left {
      height: 100%;
      display: flex;
      align-items: center;
    }

    .user-item-right {
      flex: 1;
      display: flex;
      height: 100%;
      align-items: center;
      border-bottom: 1px solid var(--stroke-color-secondary);
    }

    .user-info {
      flex-grow: 1;
      display: flex;
      align-items: center;
      gap: 8px;

      .user-name {
        font-size: 16px;
        font-weight: 500;
        color: var(--text-color-primary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 200px;
      }

      .user-level {
        background: #3b82f6;
        color: white;
        font-size: 12px;
        padding: 2px 6px;
        border-radius: 10px;
        min-width: 24px;
        text-align: center;
        font-weight: 500;
      }

      .is-me {
        color: var(--text-color-secondary);
        font-size: 14px;
      }
    }

    .user-status {
      color: var(--text-color-secondary);
      font-size: 14px;
      margin-right: 12px;
    }

    .user-actions {
      display: flex;
      gap: 6px;
    }
  }
}

.load-more-indicator {
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  color: var(--text-color-secondary);
  font-size: 14px;

  .loading-content {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .no-more-content {
    display: flex;
    align-items: center;
  }

  .load-more-trigger-content {
    height: 20px;
    width: 100%;
  }

  .loading-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid var(--stroke-color-secondary);
    border-top: 2px solid var(--uikit-color-theme-6);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
}


.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  align-self: center;
  flex: 1;
  color: var(--text-color-secondary);
  min-height: 60px;
}
</style>
