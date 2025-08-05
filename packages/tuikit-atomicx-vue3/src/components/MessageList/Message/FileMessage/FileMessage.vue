<script lang="ts" setup>
import {
  IconFile,
  IconDownload,
  TUIToast,
  useUIKit,
} from '@tencentcloud/uikit-base-component-vue3';
import cs from 'classnames';
import { View } from '../../../../baseComp/View';
import type { IMessageModel } from '@tencentcloud/chat-uikit-engine';

interface IFileMessageProps {
  message: IMessageModel;
}

interface IFileMessageContent {
  /** sender show name */
  showName: string;
  /** file name */
  name: string;
  /** file type */
  type: string;
  /** file size */
  size: string;
  /** file url */
  url: string;
}

const { t } = useUIKit();

const props = withDefaults(defineProps<IFileMessageProps>(), {
  message: () => ({} as IMessageModel),
});

const messageContent = props.message.getMessageContent() as IFileMessageContent;

const handleFileClick = async (event: MouseEvent) => {
  // If ctrl key (Windows) or command key (Mac) is pressed, open in new tab
  if (event.metaKey || event.ctrlKey) {
    window.open(messageContent.url, '_blank');
  } else {
    try {
      event.preventDefault();

      const response = await fetch(messageContent.url);
      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = messageContent.name;
      link.click();

      // Clean up blob url
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      TUIToast.error({
        message: t('TUIChat.Download failed'),
      });
    }
  }
};
</script>

<template>
  <View
    :class="cs('file-message')"
    @click="handleFileClick"
  >
    <View class="file-message__icon">
      <IconFile />
    </View>
    <View class="file-message__middle">
      <View class="file-message__name">
        {{ messageContent.name }}
      </View>
      <View class="file-message__size">
        {{ messageContent.size }}
      </View>
    </View>
    <View class="file-message__download">
      <IconDownload />
    </View>
  </View>
</template>

<style lang="scss" scoped>
@use '../../../../styles/mixins/text' as text;

.file-message {
  display: flex;
  flex-direction: row;
  align-items: center;
  background-color: var(--background-color-secondary);
  border-radius: 8px;
  gap: 12px;
  padding: 12px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  max-width: 250px;

  &__icon {
    flex-shrink: 0;
    color: var(--text-color-primary);
  }

  &__download {
    flex-shrink: 0;
    opacity: 0;
    transition: opacity 0.2s ease;
    color: var(--text-color-primary);
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
