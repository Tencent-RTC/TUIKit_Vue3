<template>
  <View>
    <template v-if="label">
      <button
        :class="[styles['attachment-picker__item'], className]"
        :style="style"
        @click="handleButtonClick"
      >
        <IconVideo
          :size="iconSize"
          :class="styles['attachment-picker__item-icon']"
        />
        <div>{{ label }}</div>
      </button>
    </template>
    <template v-else>
      <IconVideo
        :size="iconSize"
        :class="styles['attachment-picker__item-icon']"
        @click="handleButtonClick"
      />
    </template>
    <input
      ref="fileInputRef"
      type="file"
      :accept="PICKER_CONSTANTS.ACCEPT_TYPE"
      hidden
      @change="handleFileInput"
    >
  </View>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { IconVideo } from '@tencentcloud/uikit-base-component-vue3';
import { MessageContentType, useMessageInputState } from '../../../states/MessageInputState';
import { View } from '../../../baseComp/View';
import styles from './AttachmentPicker.module.scss';

const PICKER_CONSTANTS = {
  ACCEPT_TYPE: '.mp4,.mov,.qt',
};

interface Props {
  label?: string;
  iconSize?: number;
  onClose?: () => void;
  className?: string;
  style?: Record<string, string>;
}

const props = withDefaults(defineProps<Props>(), {
  label: '',
  className: '',
  style: undefined,
  onClose: () => {},
  iconSize: 24,
});

const { sendMessage } = useMessageInputState();
const fileInputRef = ref<HTMLInputElement | null>(null);

function handleButtonClick() {
  fileInputRef.value?.click();
}

function handleFileInput(e: Event) {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) {
    return;
  }

  sendMessage([{ type: MessageContentType.VIDEO, content: file }]);
  target.value = '';
  props.onClose?.();
}
</script>
