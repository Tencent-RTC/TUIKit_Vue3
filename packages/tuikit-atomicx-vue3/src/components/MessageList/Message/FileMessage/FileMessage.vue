<script lang="ts" setup>
import { computed } from 'vue';
import {
  IconFile,
  IconDownload,
  TUIToast,
  useUIKit,
} from '@tencentcloud/uikit-base-component-vue3';
import cs from 'classnames';
import { View } from '../../../../baseComp/View';
import type { FileMessagePayload, MessageInfo } from '@atomicxcore/core';

interface FileMessageProps {
  message: MessageInfo;
}

const { t } = useUIKit();

const props = withDefaults(defineProps<FileMessageProps>(), {
  message: () => ({} as MessageInfo),
});

const messageContent = computed(() => props.message.messagePayload as FileMessagePayload);

function formatFileSize(bytes: number | undefined): string {
  if (!bytes || bytes <= 0) {
    return '';
  }
  const MB = 1024 * 1024;
  if (bytes >= MB) {
    return `${(bytes / MB).toFixed(1)} MB`;
  }
  return `${(bytes / 1024).toFixed(1)} KB`;
}

const handleFileClick = async (event: MouseEvent) => {
  // If ctrl key (Windows) or command key (Mac) is pressed, open in new tab
  if (event.metaKey || event.ctrlKey) {
    window.open(messageContent.value.fileUrl, '_blank');
  } else {
    try {
      event.preventDefault();

      const response = await fetch(messageContent.value.fileUrl ?? '');
      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = messageContent.value.fileName ?? '';
      link.click();

      // Clean up blob url
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      TUIToast.error({
        message: t('MessageList.download_failed'),
      });
    }
  }
};
</script>

<template>
  <View
    :class="cs('file-message', {
      'file-message--flow-in': !message.isSentBySelf,
      'file-message--flow-out': message.isSentBySelf,
    })"
    @click="handleFileClick"
  >
    <View class="file-message__icon">
      <IconFile />
    </View>
    <View class="file-message__middle">
      <View class="file-message__name">
        {{ messageContent.fileName }}
      </View>
      <View class="file-message__size">
        {{ formatFileSize(messageContent.fileSize) }}
      </View>
    </View>
    <View class="file-message__download">
      <IconDownload />
    </View>
  </View>
</template>

<style lang="scss" scoped>
@use '../../../../styles/mixins/text' as text;
@use '../bubble-mixins' as bubble;

.file-message {
  @include bubble.bubble-base();
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  max-width: 250px;

  &__icon {
    flex-shrink: 0;
    color: var(--icon-color-primary);
  }

  &__download {
    flex-shrink: 0;
    opacity: 0;
    transition: opacity 0.2s ease;
    color: var(--icon-color-primary);
  }

  &:hover {
    .file-message__download {
      opacity: 1;
    }
  }

  &__middle {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__name {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-color-primary);

    @include text.text-ellipsis;
  }

  &__size {
    font-size: 12px;
    color: var(--text-color-secondary);
  }
}
</style>
