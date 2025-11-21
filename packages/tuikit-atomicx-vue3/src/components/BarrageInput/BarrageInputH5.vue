<template>
  <div class="live-message-input-h5">
    <BarrageInput
      :autoFocus="props.autoFocus"
      :containerClass="props.containerClass"
      :containerStyle="props.containerStyle"
      :height="props.height"
      :minHeight="props.minHeight"
      :maxHeight="props.maxHeight"
      :placeholder="props.placeholder"
      :disabled="props.disabled"
      @focus="handleFocus"
      @blur="handleBlur"
    />
    <TUIButton
      v-if="isFocus"
      type="primary"
      @touchstart="handleTouchStart"
      @touchend="handleTouchEnd"
    >
      {{ t('Send') }}
    </TUIButton>
  </div>
</template>

<script setup lang="ts">
import { ref, withDefaults, defineProps } from 'vue';
import { useUIKit, TUIButton } from '@tencentcloud/uikit-base-component-vue3';
import { useMessageInputState } from '../../states/MessageInputState';
import BarrageInput from './BarrageInput.vue';

interface Props {
  containerClass?: string;
  containerStyle?: Record<string, any>;
  height?: string;
  minHeight?: string;
  maxHeight?: string;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  containerClass: '',
  containerStyle: () => ({}),
  height: '',
  minHeight: '40px',
  maxHeight: '140px',
  disabled: false,
  autoFocus: false,
});

const { t } = useUIKit();
const { inputRawValue, setContent, sendMessage, blurEditor } = useMessageInputState();
const isFocus = ref(false);
const isTouching = ref(false);

const handleTouchStart = () => {
  isTouching.value = true;
};

const handleSend = () => {
  if (inputRawValue.value) {
    sendMessage();
    setContent('');
    blurEditor();
  }
};
const handleTouchEnd = () => {
  if (!isTouching.value) {
    return;
  }
  isTouching.value = false;

  handleSend();
};

const handleFocus = async () => {
  isFocus.value = true;
};

const handleBlur = () => {
  isFocus.value = false;
};
</script>

<style lang="scss" scoped>
.live-message-input-h5 {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}
</style>
