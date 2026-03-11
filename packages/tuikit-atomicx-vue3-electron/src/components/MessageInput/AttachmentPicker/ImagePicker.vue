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
      :accept="PICKER_CONSTANTS.ACCEPT_TYPE"
      hidden
      @change="handleFileInput"
    >
  </View>
</template>

<script setup lang="ts">
import { ref, useCssModule } from 'vue';
import { IconImage } from '@tencentcloud/uikit-base-component-vue3';
import cs from 'classnames';
import { View } from '../../../baseComp/View';
import { MessageContentType, useMessageInputState } from '../../../states/MessageInputState';

const PICKER_CONSTANTS = {
  ACCEPT_TYPE: '.jpg,.jpeg,.gif,.png,.bmp,.webp',
};

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
const { sendMessage } = useMessageInputState();
const fileInputRef = ref<HTMLInputElement | null>(null);

function handleButtonClick() {
  if (props.disabled) {
    return;
  }

  fileInputRef.value?.click();
}

function handleFileInput(e: Event) {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) {
    return;
  }

  sendMessage([{ type: MessageContentType.IMAGE, content: file }]);
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
    color: var(--text-color-primary);
  }
}
</style>
