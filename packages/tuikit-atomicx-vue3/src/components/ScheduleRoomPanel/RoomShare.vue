<template>
  <div class="room-share">
    <div v-if="!roomInfo" class="room-share-empty">
      {{ t('No room information') }}
    </div>
    <div v-else class="room-share-content">
      <div class="share-item">
        <div class="share-label">
          {{ t('Room Name') }}
        </div>
        <div class="share-value">
          {{ roomInfo.roomName }}
        </div>
      </div>

      <div class="share-item">
        <div class="share-label">
          {{ t('Room Time') }}
        </div>
        <div class="share-value">
          {{ formatDateTime(roomInfo.scheduledStartTime) }} - {{ formatDateTime(roomInfo.scheduledEndTime) }}
        </div>
      </div>

      <div class="share-item">
        <div class="share-label">
          {{ t('Room ID') }}
        </div>
        <div class="share-value">
          {{ roomInfo.roomId }}
          <IconCopy class="copy-icon" @click="() => copy(roomInfo?.roomId || '')" />
        </div>
      </div>

      <div class="share-item">
        <div class="share-label">
          {{ t('Room Link') }}
        </div>
        <div class="share-value room-link">
          {{ roomLink }}
          <IconCopy class="copy-icon" @click="() => copy(roomLink)" />
        </div>
      </div>

      <div class="share-actions">
        <TUIButton
          type="primary"
          size="large"
          class="copy-button"
          @click="copyRoomInfoAndLink"
        >
          {{ t('Copy Meeting ID and Link') }}
        </TUIButton>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { IconCopy, TUIButton, TUIToast, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import type { RoomInfo } from '../../types';

const { t } = useUIKit();

interface Props {
  roomInfo: RoomInfo | null;
}

const props = defineProps<Props>();

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

const roomLink = computed(() => {
  if (!props.roomInfo?.roomId) {
    return '';
  }

  // 使用当前域名生成房间链接
  const baseUrl = `${window.location.protocol}//${window.location.host}`;

  // 检测当前是否使用 hash 路由
  const isHashRouter = window.location.hash.includes('#');
  const currentPath = window.location.pathname;

  // 构建房间参数
  const roomParams = props.roomInfo.password
    ? `roomId=${props.roomInfo.roomId}&password=${props.roomInfo.password}`
    : `roomId=${props.roomInfo.roomId}`;

  // 根据路由模式生成链接
  if (isHashRouter) {
    // Hash 路由模式: http://localhost:5173/#/room?roomId=xxx
    return `${baseUrl}${currentPath}#/room?${roomParams}`;
  }
  // History 路由模式: http://localhost:5173/room?roomId=xxx
  return `${baseUrl}/room?${roomParams}`;
});

const copyText = async (text: string): Promise<boolean> => {
  try {
    // 优先使用现代浏览器的 Clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // 降级方案：使用传统的 document.execCommand
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (error) {
    console.error('复制失败:', error);
    return false;
  }
};

const copy = async (value: string) => {
  const success = await copyText(value);
  if (success) {
    TUIToast.success({ message: t('Copy Success') });
  } else {
    TUIToast.error({ message: t('Copy Failed') });
  }
};

const copyRoomInfoAndLink = async () => {
  if (!props.roomInfo) {
    TUIToast.error({ message: t('No room information') });
    return;
  }

  const roomInfoText = `${t('Room Name')}: ${props.roomInfo.roomName}
${t('Room ID')}: ${props.roomInfo.roomId}
${t('Room Time')}: ${formatDateTime(props.roomInfo.scheduledStartTime)} - ${formatDateTime(props.roomInfo.scheduledEndTime)}
${t('Room Link')}: ${roomLink.value}`;

  const success = await copyText(roomInfoText);
  if (success) {
    TUIToast.success({ message: t('Copy Success') });
  } else {
    TUIToast.error({ message: t('Copy Failed') });
  }
};
</script>

<style lang="scss" scoped>
.room-share {
  min-width: 400px;
  user-select: text;

  .room-share-empty {
    text-align: center;
    color: var(--text-color-secondary);
    padding: 40px 0;
  }

  .room-share-content {
    .share-item {
      display: flex;
      margin-bottom: 16px;
      align-items: flex-start;

      .share-label {
        min-width: 80px;
        color: var(--text-color-secondary);
        font-size: 14px;
        line-height: 22px;
        flex-shrink: 0;
      }

      .share-value {
        flex: 1;
        color: var(--text-color-primary);
        font-size: 14px;
        line-height: 22px;
        display: flex;
        align-items: center;
        gap: 8px;
        word-break: break-all;

        &.room-link {
          color: var(--text-color-link);
          cursor: pointer;

          &:hover {
            color: var(--text-color-link-hover);
          }
        }

        .copy-icon {
          cursor: pointer;
          color: var(--text-color-link);
          flex-shrink: 0;

          &:hover {
            color: var(--text-color-link-hover);
          }
        }
      }
    }

    .share-actions {
      margin-top: 32px;
      display: flex;
      justify-content: center;

      .copy-button {
        min-width: 200px;
      }
    }
  }
}
</style>
