<script lang="ts" setup>
import { ref, watch, onUnmounted } from 'vue';
import { useMessageActionStore } from '../../../chat-store';
// import { TUIStore, TUIChatService } from '@tencentcloud/chat-uikit-engine-lite';
import { useUIKit, IconLoading, IconClose } from '@tencentcloud/uikit-base-component-vue3';
import { Modal } from '../../../baseComp/Modal';
import { View } from '../../../baseComp/View';
import { Avatar } from '../../Avatar';
import type { MessageInfo } from '@atomicxcore/core';

// Props
interface ReadReceiptInfoProps {
  /** Message */
  message: MessageInfo;
  /** Whether the forward modal is open */
  open: boolean;
  /** Read count */
  readCount?: number;
  /** Unread count */
  unreadCount?: number;
  /** Additional class names for styling */
  className?: string | undefined;
  /** Custom style */
  style?: Record<string, any> | undefined;
}

const props = withDefaults(defineProps<ReadReceiptInfoProps>(), {
  message: () => ({}) as MessageInfo,
  open: false,
  readCount: 0,
  unreadCount: 0,
  className: undefined,
  style: undefined,
});

const emits = defineEmits<{
  onClose: [e?: unknown, reason?: 'backdropClick' | 'escapeKeyDown'];
}>();

const { t } = useUIKit();
const {
  readMemberList,
  unreadMemberList,
  hasMoreReadMembers,
  hasMoreUnreadMembers,
  loadReadMembers,
  loadUnreadMembers,
  loadMoreMembers,
} = useMessageActionStore(props.message);

// State
const activeTab = ref<'read' | 'unread'>('read');

// Read users state
const readLoading = ref(false);
const readListVisible = ref(false);

// Unread users state
const unreadLoading = ref(false);
const unreadListVisible = ref(false);

// Separate loading flag for load-more pagination to prevent concurrent requests
const loadMoreLoading = ref(false);

// Debounce timer for scroll handler
let scrollDebounceTimer: ReturnType<typeof setTimeout> | null = null;

onUnmounted(() => {
  if (scrollDebounceTimer !== null) {
    clearTimeout(scrollDebounceTimer);
  }
});

// Methods
const loadReadUsers = async () => {
  readLoading.value = true;
  try {
    await loadReadMembers(100);
  } catch (error) {
    console.error('Failed to load read users:', error);
  } finally {
    readLoading.value = false;
  }
};

const loadUnreadUsers = async () => {
  unreadLoading.value = true;
  try {
    await loadUnreadMembers(50);
  } catch (error) {
    console.error('Failed to load unread users:', error);
  } finally {
    unreadLoading.value = false;
  }
};

const resetReadState = () => {
  readListVisible.value = false;
};

const resetUnreadState = () => {
  unreadListVisible.value = false;
};

const setActiveTab = (tab: 'read' | 'unread') => {
  activeTab.value = tab;
};

const handleScroll = (event: Event) => {
  // Use currentTarget (the bound element) for accurate scroll measurements
  const target = (event.currentTarget ?? event.target) as HTMLElement;
  const { scrollTop, scrollHeight, clientHeight } = target;

  if (scrollHeight - scrollTop - clientHeight >= 50) {
    return;
  }

  if (scrollDebounceTimer !== null) {
    clearTimeout(scrollDebounceTimer);
  }

  scrollDebounceTimer = setTimeout(() => {
    scrollDebounceTimer = null;

    if (loadMoreLoading.value) {
      return;
    }

    const shouldLoadMore
      = (activeTab.value === 'read' && hasMoreReadMembers.value && !readLoading.value)
        || (activeTab.value === 'unread' && hasMoreUnreadMembers.value && !unreadLoading.value);

    if (!shouldLoadMore) {
      return;
    }

    loadMoreLoading.value = true;
    loadMoreMembers(activeTab.value === 'read')
      .finally(() => {
        loadMoreLoading.value = false;
      });
  }, 200);
};

const handleClose = (e?: unknown, reason?: 'backdropClick' | 'escapeKeyDown') => {
  emits('onClose', e, reason);
};

// Watchers
watch(() => props.open, (newOpen) => {
  if (newOpen) {
    // Reset states
    resetReadState();
    resetUnreadState();

    // Load initial data
    loadReadUsers();
    loadUnreadUsers();
  }
});

// Skip the first trigger that fires simultaneously with `open` becoming true.
// That initial load is already handled by the open watcher above.
watch([() => props.readCount, () => props.unreadCount], () => {
  if (!props.open || !props.message.msgID) {
    return;
  }
  if (readLoading.value || unreadLoading.value) {
    return;
  }
  if (activeTab.value === 'read') {
    loadReadUsers();
  } else {
    loadUnreadUsers();
  }
});

// Add visibility class when member list is loaded from store
watch([() => readMemberList.value.length, readLoading], ([length, loading]) => {
  if (length > 0 && !loading) {
    readListVisible.value = true;
  } else if (length === 0) {
    readListVisible.value = false;
  }
});

watch([() => unreadMemberList.value.length, unreadLoading], ([length, loading]) => {
  if (length > 0 && !loading) {
    unreadListVisible.value = true;
  } else if (length === 0) {
    unreadListVisible.value = false;
  }
});
</script>

<template>
  <Modal
    :open="open"
    content-class="readReceiptInfo"
    @on-close="handleClose"
  >
    <View class="read-receipt-info__header">
      <IconClose
        class="read-receipt-info__close-icon"
        @click="handleClose"
      />
      <View class="read-receipt-info__title">
        {{ t('MessageList.read_receipt_detail') }}
      </View>
    </View>

    <View class="read-receipt-info__tabs">
      <button
        :class="[
          'read-receipt-info__tab-button',
          { 'read-receipt-info__tab-button--active': activeTab === 'read' }
        ]"
        @click="setActiveTab('read')"
      >
        {{ t('MessageList.read') }} ({{ readCount }})
      </button>
      <button
        :class="[
          'read-receipt-info__tab-button',
          { 'read-receipt-info__tab-button--active': activeTab === 'unread' }
        ]"
        @click="setActiveTab('unread')"
      >
        {{ t('MessageList.unread') }} ({{ unreadCount }})
      </button>
    </View>

    <View class="read-receipt-info__content">
      <View
        v-if="activeTab === 'read'"
        class="read-receipt-info__user-list"
        @scroll="handleScroll"
      >
        <template v-if="readMemberList.length === 0">
          <View
            v-if="readLoading"
            class="read-receipt-info__loading"
          >
            <IconLoading class="read-receipt-info__loading-icon" />
            <View class="read-receipt-info__loading-text">
              {{ t('MessageList.loading') }}
            </View>
          </View>
          <View
            v-else
            class="read-receipt-info__empty"
          >
            {{ t('MessageList.no_read_members') }}
          </View>
        </template>
        <template v-else>
          <div
            :class="[
              'read-receipt-info__user-list-container',
              { 'read-receipt-info__user-list-container--visible': readListVisible }
            ]"
          >
            <View
              v-for="user in readMemberList"
              :key="user.userID || ''"
              class="read-receipt-info__user-item"
            >
              <Avatar
                :src="user.avatarURL ?? ''"
                :alt="user.friendRemark || user.nameCard || user.nickname || user.userID"
              />
              <View class="read-receipt-info__user-item-info">
                <View class="read-receipt-info__user-item-name">
                  {{ user.friendRemark || user.nameCard || user.nickname || user.userID }}
                </View>
              </View>
            </View>
            <View
              v-if="readLoading"
              class="read-receipt-info__loading"
            >
              <IconLoading class="read-receipt-info__loading-icon" />
              <View class="read-receipt-info__loading-text">
                {{ t('MessageList.loading') }}
              </View>
            </View>
            <View
              v-if="!hasMoreReadMembers"
              class="read-receipt-info__list-end"
            >
              {{ t('MessageList.no_more') }}
            </View>
          </div>
        </template>
      </View>

      <View
        v-if="activeTab === 'unread'"
        class="read-receipt-info__user-list"
        @scroll="handleScroll"
      >
        <template v-if="unreadMemberList.length === 0">
          <View
            v-if="unreadLoading"
            class="read-receipt-info__loading"
          >
            <IconLoading class="read-receipt-info__loading-icon" />
            <View class="read-receipt-info__loading-text">
              {{ t('MessageList.loading') }}
            </View>
          </View>
          <View
            v-else
            class="read-receipt-info__empty"
          >
            {{ t('MessageList.no_unread_members') }}
          </View>
        </template>
        <template v-else>
          <div
            :class="[
              'read-receipt-info__user-list-container',
              { 'read-receipt-info__user-list-container--visible': unreadListVisible }
            ]"
          >
            <View
              v-for="user in unreadMemberList"
              :key="user.userID"
              class="read-receipt-info__user-item"
            >
              <Avatar
                :src="user.avatarURL ?? ''"
                :alt="user.friendRemark || user.nameCard || user.nickname || user.userID"
              />
              <View class="read-receipt-info__user-item-info">
                <View class="read-receipt-info__user-item-name">
                  {{ user.friendRemark || user.nameCard || user.nickname || user.userID }}
                </View>
              </View>
            </View>
            <View
              v-if="unreadLoading"
              class="read-receipt-info__loading"
            >
              <IconLoading class="read-receipt-info__loading-icon" />
              <View class="read-receipt-info__loading-text">
                {{ t('MessageList.loading') }}
              </View>
            </View>
            <View
              v-if="!hasMoreUnreadMembers"
              class="read-receipt-info__list-end"
            >
              {{ t('MessageList.no_more') }}
            </View>
          </div>
        </template>
      </View>
    </View>
  </Modal>
</template>

<style lang="scss">
@use '../../../styles/mixins' as mixin;

.readReceiptInfo {
  width: 80vw;
  display: flex;
  flex-direction: column;
  height: 70vh;
  overflow: hidden;

  @include mixin.tablet-and-up {
    width: 50vw;
    height: 60vh;
  }

  @include mixin.desktop-and-up {
    width: 360px;
    height: 480px;
  }
}

</style>

<style lang="scss" scoped>
@use '../../../styles/mixins' as mixin;

:deep(.readReceiptInfo) {
  width: 80vw;
  display: flex;
  flex-direction: column;
  height: 70vh;
  overflow: hidden;

  @include mixin.tablet-and-up {
    width: 50vw;
    height: 60vh;
  }

  @include mixin.desktop-and-up {
    width: 360px;
    height: 480px;
  }
}

.read-receipt-info {
  &__header {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    position: relative;
    height: 56px;
    padding: 0 16px;
    border-bottom: 1px solid var(--stroke-color-module);
  }

  &__title {
    font-size: 16px;
    font-weight: 500;
    color: var(--text-color-primary);
  }

  &__close-icon {
    position: absolute;
    left: 16px;
    cursor: pointer;
    color: var(--text-color-secondary);
    transition: color 0.2s ease;

    &:hover {
      color: var(--text-color-primary);
    }
  }

  &__tabs {
    height: 48px;
    display: flex;
    flex-direction: row;
    align-items: center;
    border-bottom: 1px solid var(--stroke-color-module);
  }

  &__tab-button {
    flex: 1;
    height: 100%;
    border: none;
    background: none;
    font-size: 14px;
    cursor: pointer;
    position: relative;
    transition: color 0.2s;
    padding: 0;
    color: var(--text-color-secondary);

    &:hover {
      color: var(--text-color-primary);
    }

    &:focus {
      outline: none;
    }

    &--active {
      color: var(--text-color-link);
      font-weight: 500;

      &::after {
        content: "";
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 40px;
        height: 2px;
        background-color: var(--text-color-link);
        transition: width 0.2s ease;
      }
    }
  }

  &__content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  &__user-list {
    flex: 1;
    overflow-y: auto;

    @include mixin.scrollbar-default;
  }

  &__user-item {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 12px;
    padding: 10px 16px;
    transition: all 0.2s ease;

    &:hover {
      background-color: var(--list-color-hover);
    }

    &-info {
      flex: 1;
      min-width: 0;
    }

    &-name {
      font-size: 14px;
      line-height: 20px;
      @include mixin.text-ellipsis;
      color: var(--text-color-primary);
    }
  }

  &__user-list-container {
    opacity: 0;
    transform: translateY(10px);
    transition: opacity 0.3s ease, transform 0.3s ease;

    &--visible {
      opacity: 1;
      transform: translateY(0);
    }
  }

  &__loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 16px 0;

    &-icon {
      animation: loading-spin 1s linear infinite;
      color: var(--text-color-link);
    }

    &-text {
      margin-top: 8px;
      font-size: 14px;
      color: var(--text-color-secondary);
    }
  }

  &__empty {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100px;
    font-size: 14px;
    color: var(--text-color-secondary);
  }

  &__list-end {
    text-align: center;
    padding: 12px 0;
    font-size: 12px;
    color: var(--text-color-secondary);
  }
}

@keyframes loading-spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

</style>
