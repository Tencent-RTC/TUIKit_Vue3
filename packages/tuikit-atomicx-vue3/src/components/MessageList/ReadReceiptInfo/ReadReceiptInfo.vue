<script lang="ts" setup>
import { ref, computed, watch } from 'vue';
import { TUIStore, TUIChatService } from '@tencentcloud/chat-uikit-engine';
import { useUIKit, IconLoading, IconClose } from '@tencentcloud/uikit-base-component-vue3';

import { Modal } from '../../../baseComp/Modal';
import { View } from '../../../baseComp/View';
import { Avatar } from '../../Avatar';

// Types
interface IUserInfo {
  userID: string;
  nick?: string;
  avatar?: string;
}

interface IGroupMessageReadMemberListResponse {
  code: number;
  data: {
    cursor: string;
    isCompleted: boolean;
    messageID: string;
    readUserInfoList?: IUserInfo[];
    unreadUserInfoList?: IUserInfo[];
  };
}

// Props
interface ReadReceiptInfoProps {
  /** Message ID */
  messageID: string;
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
  messageID: '',
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

// State
const activeTab = ref<'read' | 'unread'>('read');
const readListRef = ref<HTMLDivElement>();
const unreadListRef = ref<HTMLDivElement>();

// Read users state
const readUsers = ref<IUserInfo[]>([]);
const readCursor = ref('');
const readCompleted = ref(false);
const readLoading = ref(false);
const readListVisible = ref(false);

// Unread users state
const unreadUsers = ref<IUserInfo[]>([]);
const unreadCursor = ref('');
const unreadCompleted = ref(false);
const unreadLoading = ref(false);
const unreadListVisible = ref(false);

// Computed
const getMessageModel = computed(() => {
  if (!props.messageID) {
    throw new Error('ReadReceiptInfo::Message ID is required');
  }
  return TUIStore.getMessageModel(props.messageID);
});

// Methods
const loadReadUsers = async (cursor = '') => {
  const message = getMessageModel.value;
  if (!message) {
    return;
  }

  // Reset completed state when starting fresh load
  if (cursor === '') {
    readCompleted.value = false;
  }

  readLoading.value = true;
  try {
    const response = await TUIChatService.getGroupMessageReadMemberList({
      message,
      filter: 0, // 0 indicates read members
      cursor,
      count: 100,
    }) as IGroupMessageReadMemberListResponse;

    if (response.code === 0 && response.data) {
      const { isCompleted, cursor: nextCursor, readUserInfoList = [] } = response.data;

      readCursor.value = nextCursor;
      readCompleted.value = isCompleted;

      if (cursor === '') {
        // Initial load
        readUsers.value = readUserInfoList;
      } else {
        // Load more
        readUsers.value = [...readUsers.value, ...readUserInfoList];
      }
    }
  } catch (error) {
    console.error('Failed to load read users:', error);
  } finally {
    readLoading.value = false;
  }
};

const loadUnreadUsers = async (cursor = '') => {
  const message = getMessageModel.value;
  if (!message) {
    return;
  }

  // Reset completed state when starting fresh load
  if (cursor === '') {
    unreadCompleted.value = false;
  }

  unreadLoading.value = true;
  try {
    const response = await TUIChatService.getGroupMessageReadMemberList({
      message,
      filter: 1, // 1 indicates unread members
      cursor,
      count: 50,
    }) as IGroupMessageReadMemberListResponse;

    if (response.code === 0 && response.data) {
      const { isCompleted, cursor: nextCursor, unreadUserInfoList = [] } = response.data;

      unreadCursor.value = nextCursor;
      unreadCompleted.value = isCompleted;

      if (cursor === '') {
        // Initial load
        unreadUsers.value = unreadUserInfoList;
      } else {
        // Load more
        unreadUsers.value = [...unreadUsers.value, ...unreadUserInfoList];
      }
    }
  } catch (error) {
    console.error('Failed to load unread users:', error);
  } finally {
    unreadLoading.value = false;
  }
};

const resetReadState = () => {
  readUsers.value = [];
  readCursor.value = '';
  readCompleted.value = false;
  readListVisible.value = false;
};

const resetUnreadState = () => {
  unreadUsers.value = [];
  unreadCursor.value = '';
  unreadCompleted.value = false;
  unreadListVisible.value = false;
};

const setActiveTab = (tab: 'read' | 'unread') => {
  activeTab.value = tab;
};

const handleScroll = (event: Event) => {
  const target = event.target as HTMLDivElement;
  const { scrollTop, scrollHeight, clientHeight } = target;

  // Load more when scrolled to bottom
  if (scrollHeight - scrollTop - clientHeight < 50) {
    if (activeTab.value === 'read' && !readCompleted.value && !readLoading.value && readCursor.value) {
      loadReadUsers(readCursor.value);
    } else if (activeTab.value === 'unread' && !unreadCompleted.value && !unreadLoading.value && unreadCursor.value) {
      loadUnreadUsers(unreadCursor.value);
    }
  }
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

watch([() => props.readCount, () => props.unreadCount], () => {
  // Only refresh data when modal is open and counts change
  // This ensures the lists stay updated without causing flicker
  if (props.open && props.messageID) {
    // Refresh the currently active tab's data
    if (activeTab.value === 'read') {
      loadReadUsers();
    } else {
      loadUnreadUsers();
    }
  }
});

// Add visibility class when user list is loaded
watch(() => [readUsers.value.length, readLoading.value], () => {
  let timer: any;
  if (readUsers.value.length > 0 && !readLoading.value) {
    timer = setTimeout(() => {
      readListVisible.value = true;
    }, 50);
  }
  return () => clearTimeout(timer);
});

watch(() => [unreadUsers.value.length, unreadLoading.value], () => {
  let timer: any;
  if (unreadUsers.value.length > 0 && !unreadLoading.value) {
    timer = setTimeout(() => {
      unreadListVisible.value = true;
    }, 50);
  }
  return () => clearTimeout(timer);
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
        {{ t('TUIChat.Read Receipt Detail') }}
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
        {{ t('TUIChat.Read') }} ({{ readCount }})
      </button>
      <button
        :class="[
          'read-receipt-info__tab-button',
          { 'read-receipt-info__tab-button--active': activeTab === 'unread' }
        ]"
        @click="setActiveTab('unread')"
      >
        {{ t('TUIChat.Unread') }} ({{ unreadCount }})
      </button>
    </View>

    <View class="read-receipt-info__content">
      <View
        v-if="activeTab === 'read'"
        ref="readListRef"
        class="read-receipt-info__user-list"
        @scroll="handleScroll"
      >
        <template v-if="readUsers.length === 0">
          <View
            v-if="readLoading"
            class="read-receipt-info__loading"
          >
            <IconLoading class="read-receipt-info__loading-icon" />
            <View class="read-receipt-info__loading-text">
              {{ t('TUIChat.Loading') }}
            </View>
          </View>
          <View
            v-else
            class="read-receipt-info__empty"
          >
            {{ t('TUIChat.No Read Members') }}
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
              v-for="user in readUsers"
              :key="user.userID"
              class="read-receipt-info__user-item"
            >
              <Avatar
                :src="user.avatar ?? ''"
                :alt="user.nick || user.userID"
              />
              <View class="read-receipt-info__user-item-info">
                <View class="read-receipt-info__user-item-name">
                  {{ user.nick || user.userID }}
                </View>
              </View>
            </View>
            <View
              v-if="readLoading"
              class="read-receipt-info__loading"
            >
              <IconLoading class="read-receipt-info__loading-icon" />
              <View class="read-receipt-info__loading-text">
                {{ t('TUIChat.Loading') }}
              </View>
            </View>
            <View
              v-if="readCompleted"
              class="read-receipt-info__list-end"
            >
              {{ t('TUIChat.No More') }}
            </View>
          </div>
        </template>
      </View>

      <View
        v-if="activeTab === 'unread'"
        ref="unreadListRef"
        class="read-receipt-info__user-list"
        @scroll="handleScroll"
      >
        <template v-if="unreadUsers.length === 0">
          <View
            v-if="unreadLoading"
            class="read-receipt-info__loading"
          >
            <IconLoading class="read-receipt-info__loading-icon" />
            <View class="read-receipt-info__loading-text">
              {{ t('TUIChat.Loading') }}
            </View>
          </View>
          <View
            v-else
            class="read-receipt-info__empty"
          >
            {{ t('TUIChat.No Unread Members') }}
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
              v-for="user in unreadUsers"
              :key="user.userID"
              class="read-receipt-info__user-item"
            >
              <Avatar
                :src="user.avatar ?? ''"
                :alt="user.nick || user.userID"
              />
              <View class="read-receipt-info__user-item-info">
                <View class="read-receipt-info__user-item-name">
                  {{ user.nick || user.userID }}
                </View>
              </View>
            </View>
            <View
              v-if="unreadLoading"
              class="read-receipt-info__loading"
            >
              <IconLoading class="read-receipt-info__loading-icon" />
              <View class="read-receipt-info__loading-text">
                {{ t('TUIChat.Loading') }}
              </View>
            </View>
            <View
              v-if="unreadCompleted"
              class="read-receipt-info__list-end"
            >
              {{ t('TUIChat.No More') }}
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
