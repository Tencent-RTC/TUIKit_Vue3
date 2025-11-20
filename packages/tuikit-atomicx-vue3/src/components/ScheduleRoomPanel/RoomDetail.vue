<template>
  <div class="room-detail">
    <div v-if="!roomInfo" class="room-detail-empty">
      {{ t('No room information') }}
    </div>
    <div v-else class="room-detail-content">
      <div class="detail-item">
        <div class="detail-label">
          {{ t('Room Name') }}
        </div>
        <div class="detail-value">
          {{ roomInfo.roomName }}
        </div>
      </div>

      <div class="detail-item">
        <div class="detail-label">
          {{ t('Room ID') }}
        </div>
        <div class="detail-value">
          {{ roomInfo.roomId }}
          <IconCopy class="copy-icon" @click="copyRoomId" />
        </div>
      </div>

      <div class="detail-item">
        <div class="detail-label">
          {{ t('Room Time') }}
        </div>
        <div class="detail-value">
          {{ formatDateTime(roomInfo.scheduledStartTime) }} - {{ formatDateTime(roomInfo.scheduledEndTime) }}
          <span :class="['status-badge', roomInfo.roomStatus === RoomStatus.Running && 'running']">
            {{ getRoomStatusText(roomInfo.roomStatus) }}
          </span>
        </div>
      </div>

      <div class="detail-item">
        <div class="detail-label">
          {{ t('Creator') }}
        </div>
        <div class="detail-value">
          {{ roomInfo.roomOwner.userName || roomInfo.roomOwner.userId }}
        </div>
      </div>

      <div class="detail-item">
        <div class="detail-label">
          {{ t('Attendees') }}
        </div>
        <div class="detail-value">
          <div v-if="isLoadingAttendees" class="attendees-loading">
            <IconLoadingSchedule class="loading-icon" size="16" />
            <span>{{ t('Loading...') }}</span>
          </div>
          <div
            v-else-if="roomInfo.scheduleAttendees && roomInfo.scheduleAttendees.length > 0"
            class="attendees-list"
            :title="roomInfo.scheduleAttendees.map((attendee) => attendee.userName || attendee.userId).join(', ')"
          >
            {{ roomInfo.scheduleAttendees.map((attendee) => attendee.userName || attendee.userId).join(', ') }}
          </div>
          <div v-else class="no-attendees">
            {{ t('No scheduled members') }}
          </div>
        </div>
      </div>

      <div v-if="roomInfo.password" class="detail-item">
        <div class="detail-label">
          {{ t('Room Password') }}
        </div>
        <div class="detail-value">
          {{ roomInfo.password }}
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { IconCopy, IconLoadingSchedule, TUIToast, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { RoomStatus } from '../../types';
import type { RoomInfo } from '../../types';

const { t } = useUIKit();

interface Props {
  roomInfo: RoomInfo | null;
  isLoadingAttendees?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isLoadingAttendees: false,
});

const formatDateTime = (timestamp?: number): string => {
  if (!timestamp) {
    return '--';
  }

  const date = new Date(timestamp * 1000);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

const getRoomStatusText = (status: RoomStatus): string => {
  switch (status) {
    case RoomStatus.Scheduled:
      return t('Not Started');
    case RoomStatus.Running:
      return t('In Progress');
    default:
      return t('Unknown Status');
  }
};

const copyRoomId = async () => {
  if (!props.roomInfo?.roomId) {
    TUIToast.error({ message: t('Room ID not found') });
    return;
  }

  try {
    // 优先使用现代浏览器的 Clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(props.roomInfo.roomId);
      TUIToast.success({ message: t('Copy Success') });
    } else {
      // 降级方案：使用传统的 document.execCommand
      const textArea = document.createElement('textarea');
      textArea.value = props.roomInfo.roomId;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);

      if (successful) {
        TUIToast.success({ message: t('Copy Success') });
      } else {
        throw new Error('复制失败');
      }
    }
  } catch (error) {
    console.error('复制房间号失败:', error);
    TUIToast.error({ message: t('Copy Failed') });
  }
};
</script>

<style lang="scss" scoped>
.room-detail {
  padding: 20px 0;
  user-select: text;

  .room-detail-empty {
    text-align: center;
    color: var(--text-color-secondary);
    padding: 40px 0;
  }

  .room-detail-content {
    .detail-item {
      display: flex;
      margin-bottom: 20px;

      .detail-label {
        min-width: 80px;
        color: var(--text-color-secondary);
        font-size: 14px;
        line-height: 22px;
      }

      .detail-value {
        flex: 1;
        color: var(--text-color-primary);
        font-size: 14px;
        line-height: 22px;
        display: flex;
        align-items: center;
        gap: 8px;

        .copy-icon {
          cursor: pointer;
          color: var(--text-color-link);

          &:hover {
            color: var(--text-color-link-hover);
          }
        }

        .status-badge {
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
          background-color: var(--background-color-secondary);
          color: var(--text-color-secondary);

          &.running {
            background-color: var(--background-color-success);
            color: var(--text-color-success);
          }
        }
      }
    }

    .attendees-loading {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--text-color-secondary);

      .loading-icon {
        animation: rotate 1s linear infinite;
      }

      @keyframes rotate {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }
    }

    .attendees-list {
      display: flex;
      flex-direction: row;
      gap: 8px;
      max-height: 66px; // 3 lines * 22px line-height
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      word-break: break-all;

      .attendee-item {
        display: flex;
        align-items: center;
        gap: 8px;

        .attendee-name {
          font-size: 14px;
        }
      }
    }

    .no-attendees {
      color: var(--text-color-secondary);
      font-style: italic;
    }
  }
}
</style>
