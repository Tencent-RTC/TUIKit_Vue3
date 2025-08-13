<template>
  <div class="live-message-input-h5">
    <BarrageInput
      :autoFocus="props.autoFocus"
      :containerClass="props.containerClass"
      :containerStyle="props.containerStyle"
      :width="props.width"
      :height="props.height"
      :minHeight="props.minHeight"
      :maxHeight="props.maxHeight"
      :placeholder="props.placeholder"
      :disabled="props.disabled"
      :maxLength="props.maxLength"
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
import { ref, withDefaults, defineProps, defineEmits } from 'vue';
import { useUIKit, TUIButton } from '@tencentcloud/uikit-base-component-vue3';
import { useMessageInputState } from '../../states/MessageInputState';
import BarrageInput from './BarrageInput.vue';

const emit = defineEmits<{
  (e: 'focus'): void;
  (e: 'blur'): void;
}>();

interface Props {
  containerClass?: string;
  containerStyle?: Record<string, any>;
  height?: string;
  width?: string;
  minHeight?: string;
  maxHeight?: string;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  maxLength?: number;
}

const props = withDefaults(defineProps<Props>(), {
  containerClass: '',
  containerStyle: () => ({}),
  height: '',
  minHeight: '40px',
  maxHeight: '140px',
  disabled: false,
  autoFocus: false,
  maxLength: 80,
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
  emit('focus');
};

const handleBlur = () => {
  isFocus.value = false;
  emit('blur');
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
