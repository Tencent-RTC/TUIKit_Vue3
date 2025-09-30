<template>
  <div class="panel-content">
    <div class="panel-header">
      <div class="tabs">
        <span
          :class="['tab-item', { active: activeTab === 'applications' }]"
          @click="activeTab = 'applications'"
        >
          {{ t('Application for live') }}
        </span>
        <span
          :class="['tab-item', { active: activeTab === 'invitations' }]"
          @click="activeTab = 'invitations'"
        >
          {{ t('Co-guest management') }}
        </span>
      </div>
    </div>
    <div class="panel-body">
      <div
        v-if="activeTab === 'applications'"
        class="applications-content"
      >
        <div
          v-if="receivedCoGuestUserList.length > 0"
          class="user-list-container"
        >
          <div class="user-list">
            <div
              v-for="user in receivedCoGuestUserList"
              :key="user.userId"
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
                  <TUIButton @click="handleAcceptCoGuestRequest(user.userId)">
                    {{ t('Accept') }}
                  </TUIButton>
                  <TUIButton
                    color="red"
                    @click="handleRejectCoGuestRequest(user.userId)"
                  >
                    {{
                      t('Reject')
                    }}
                  </TUIButton>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div
          v-else
          class="empty-state"
        >
          <span>{{ t('No application for live') }}</span>
        </div>
      </div>
      <div
        v-if="activeTab === 'invitations'"
        class="invitations-content"
      >
        <div class="user-list-container">
          <div class="user-list-title">
            <span class="user-list-title-text">{{ t('Current seat') }}</span>
            <span class="user-list-title-count">
              {{ `(${userListInCoGuest.length})` }}
              <!-- {{ `(${userListInCoGuest.length}/${ seatList.length})` }} -->
            </span>
          </div>
          <div class="user-list">
            <div
              v-for="user in userListInCoGuest"
              :key="user.userId"
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
                  <span
                    v-if="user.userId === loginUserInfo?.userId"
                    class="is-me"
                  >{{ `(${t('Me')})` }}</span>
                </div>
                <div
                  v-if="user.userId !== loginUserInfo?.userId"
                  class="user-actions"
                >
                  <TUIButton
                    color="gray"
                    @click="handleDisconnect(user.userId)"
                  >
                    {{ t('Disconnect') }}
                  </TUIButton>
                </div>
              </div>
            </div>
          </div>
          <div
            v-if="userListInCoGuest.length === 0"
            class="empty-state"
          >
            <span>{{ t('Seat is empty') }}</span>
          </div>
        </div>
        <!-- <div
          v-if="sentCoGuestUserList.length > 0"
          class="user-list-container"
        >
          <div class="user-list-title">
            <span class="user-list-title-text">{{ t('Inviting') }}</span>
          </div>
          <div class="user-list">
            <div
              v-for="user in sentCoGuestUserList"
              :key="user.userId"
              class="user-item"
            >
              <div class="user-item-left">
                <Avatar :src="user.avatarUrl" :size="40" />
              </div>
              <div class="user-item-right">
                <div class="user-info">
                  <span class="user-name">{{ user.userName || user.userId }}</span>
                </div>
                <div class="user-actions">
                  <TUIButton
                    color="gray"
                    @click="cancelCoGuestRequest({ userId: user.userId })"
                  >
                    {{
                      t('Cancel')
                    }}
                  </TUIButton>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="user-list-container">
          <div class="user-list-title">
            <span class="user-list-title-text">{{ t('Invite more') }}</span>
          </div>
          <div class="user-list">
            <div
              v-for="user in availableCoGuestUserList"
              :key="user.userId"
              class="user-item"
            >
              <div class="user-item-left">
                <Avatar :src="user.avatarUrl" :size="40" />
              </div>
              <div class="user-item-right">
                <div class="user-info">
                  <span class="user-name">{{ user.userName || user.userId }}</span>
                </div>
                <div class="user-actions">
                  <TUIButton
                    color="gray"
                    @click="sendCoGuestRequest({ userId: user.userId })"
                  >
                    {{
                      t('Invite')
                    }}
                  </TUIButton>
                </div>
              </div>
            </div>
          </div>
          <div
            v-if="availableCoGuestUserList.length === 0"
            class="empty-state"
          >
            <span>{{ t('No invited users yet') }}</span>
          </div>
        </div> -->
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { TUIButton, TUIToast, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useCoGuestState } from '../../states/CoGuestState';
import { useLoginState } from '../../states/LoginState';
import { useSeatStore } from '../../states/SeatStore';
import { Avatar } from '../Avatar';
import { ERROR_MESSAGE } from './constants';

const { t } = useUIKit();

const { loginUserInfo } = useLoginState();
const { seatList } = useSeatStore();

const {
  receivedCoGuestUserList,
  availableCoGuestUserList,
  sentCoGuestUserList,
  userListInCoGuest,
  sendCoGuestRequest,
  acceptCoGuestRequest,
  rejectCoGuestRequest,
  cancelCoGuestRequest,
  disconnect,
} = useCoGuestState();

const activeTab = ref('applications');

const handleAcceptCoGuestRequest = async (userId: string) => {
  try {
    await acceptCoGuestRequest({ userId });
  } catch (error: any) {
    const message = t(ERROR_MESSAGE[error.code as keyof typeof ERROR_MESSAGE] || 'Accept co-guest request failed');
    TUIToast.error({ message });
  }
};

const handleRejectCoGuestRequest = async (userId: string) => {
  try {
    await rejectCoGuestRequest({ userId });
  } catch (error) {
    console.error('[CoGuestPanel] handleRejectCoGuestRequest error', error);
    TUIToast.error({
      message: t('Reject co-guest request failed'),
    });
  }
};

const handleDisconnect = async (userId: string) => {
  try {
    await disconnect(userId);
  } catch (error) {
    console.error('[CoGuestPanel] handleDisconnect error', error);
    TUIToast.error({
      message: t('Disconnect co-guest failed'),
    });
  }
};
</script>

<style lang="scss" scoped>
.panel-content {
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 200px;
  max-height: 80vh;

  .panel-header {
    display: flex;
    align-items: center;

    .tabs {
      display: flex;
      gap: 24px;
      flex-grow: 1;

      .tab-item {
        background: none;
        border: none;
        color: var(--text-color-secondary);
        font-size: 16px;
        padding: 12px 0;
        cursor: pointer;
        position: relative;
        transition: color 0.3s ease;
        user-select: none;

        &.active {
          color: var(--text-color-link);
          font-weight: 500;

          &::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 3px;
            background-color: var(--text-color-link);
            border-radius: 1.5px;
          }
        }
      }
    }
  }

  .panel-body {
    margin-top: 12px;
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: auto;

    &::-webkit-scrollbar {
      width: 4px;
    }
    &::-webkit-scrollbar-thumb {
      background: #414756;
      border-radius: 2px;
    }
  }
}

.applications-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
}

.invitations-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
}

.user-list-container {
  display: flex;
  flex-direction: column;
  .user-list-title {
    display: flex;
    align-items: center;
    color: var(--text-color-secondary);
    font-size: 14px;
    font-weight: 400;
    gap: 8px;
    margin-bottom: 12px;
  }

  .user-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .user-item {
    display: flex;
    align-items: center;
    gap: 12px;
    height: 50px;
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
    }

    .user-actions {
      display: flex;
      gap: 6px;
    }
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
