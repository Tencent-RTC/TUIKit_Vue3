<template>
  <View>
    <div @click="handleButtonClick">
      <slot>
        <div
          :class="cs(styles['image-picker__button'], {
            [styles['disabled']]: props.disabled,
          })"
        >
          <IconImage
            :size="props.iconSize"
            :class="cs(styles['image-picker__icon'])"
          />
        </div>
      </slot>
    </div>
    <input
      ref="fileInputRef"
      type="file"
      :accept="AcceptFileTypes.join(',')"
      hidden
      @change="handleFileInput"
    >
  </View>
</template>

<script setup lang="ts">
import { ref, useCssModule, inject } from 'vue';
import { IconImage, TUIToast, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import cs from 'classnames';
import { View } from '../../../baseComp/View';
import { useChatContext } from '../../../chat-store';
import { getSendErrorMessage } from '../utils/getSendErrorMessage';
import type { OfflinePushInfo, SendMessagePayload } from '@atomicxcore/core';

const { t } = useUIKit();

const AcceptFileTypes = [
  'image/jpg',
  'image/jpeg',
  'image/gif',
  'image/bmp',
  'image/png',
  'image/webp',
];

function validFileType(file: File) {
  return AcceptFileTypes.includes(file.type);
}

interface Props {
  label?: string;
  iconSize?: number;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  label: '',
  disabled: false,
  iconSize: 20,
});

const styles = useCssModule();
const channel = inject('channel', 'default') as string;
const setOfflinePushInfo = inject<((payload: SendMessagePayload) => OfflinePushInfo | undefined) | undefined>('setOfflinePushInfo', undefined);
const { sendMessage } = useChatContext(channel);
const fileInputRef = ref<HTMLInputElement | null>(null);

function handleButtonClick() {
  if (props.disabled) {
    return;
  }

  // Reset before click so iOS Safari reopens the picker even after a cancel
  if (fileInputRef.value) {
    fileInputRef.value.value = '';
    fileInputRef.value.click();
  }
}

function handleFileInput(e: Event) {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];

  if (!file) {
    return;
  }

  if (!validFileType(file)) {
    TUIToast.error({
      message: t('MessageInput.invalid_image_type'),
    });
    return;
  }

  const payload: SendMessagePayload = { type: 'imageMessage', file };
  const offlinePushInfo = setOfflinePushInfo?.(payload);
  sendMessage(payload, offlinePushInfo ? { offlinePushInfo } : undefined)
    .catch((error) => {
      TUIToast.error({
        message: getSendErrorMessage(t, error),
      });
    });
  target.value = '';
}
</script>

<style lang="scss" module>
.image-picker {
  &__button {
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 4px 6px;
    transition: background-color 0.5s ease;
    border-radius: 4px;

    &:hover {
      background-color: var(--button-color-secondary-hover);
    }

    &:active {
      background-color: var(--button-color-secondary-active);
    }

    &.disabled {
      opacity: 0.5;
      cursor: not-allowed;
      user-select: none;
      pointer-events: none;
    }
  }

  &__icon {
    color: var(--icon-color-primary);
  }
}
</style>
