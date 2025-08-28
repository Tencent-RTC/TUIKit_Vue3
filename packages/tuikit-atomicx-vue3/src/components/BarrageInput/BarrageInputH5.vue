<template>
  <div class="live-message-input-h5">
    <div v-if="!editorShow" class="placeholder-container" :style="{width: props.width}"  @click="handleShowEditor">
      <div class="input-actions">
        <EmojiPicker :disabled="disabled" :trigger-style="{ display: 'flex' }" />
      </div>
      <span>{{ placeholderText }}</span>
    </div>

    <BarrageInput
      v-if="editorShow"
      :autoFocus="props.autoFocus"
      :containerClass="inputClass"
      :containerStyle="props.containerStyle"
      :width="props.width"
      :height="props.height"
      :minHeight="props.minHeight"
      :maxHeight="props.maxHeight"
      :placeholder="placeholderText"
      :disabled="disabled"
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
import { ref, withDefaults, defineProps, defineEmits, computed, nextTick } from 'vue';
import { useUIKit, TUIButton, TUIToast } from '@tencentcloud/uikit-base-component-vue3';
import { useLiveAudienceState } from '../../states/LiveAudienceState';
import { useLoginState } from '../../states/LoginState';
import { useMessageInputState } from '../../states/MessageInputState';
import BarrageInput from './BarrageInput.vue';
import EmojiPicker from './EmojiPicker/EmojiPicker.vue';
import { ERROR_MESSAGE } from './constants';

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

const { t } = useUIKit();

const props = withDefaults(defineProps<Props>(), {
  containerClass: '',
  containerStyle: () => ({}),
  height: '',
  minHeight: '',
  maxHeight: '',
  disabled: false,
  autoFocus: false,
  maxLength: 80,
});

const placeholderText = computed(() => props.placeholder || t('Say something'));
const { loginUserInfo } = useLoginState();
const { audienceList } = useLiveAudienceState();

const inputClass = computed(() => ['message-input-container-h5', props.containerClass].join(' '));
const disabled = computed(() => {
  const localUser = audienceList.value.find(item => item.userId === loginUserInfo.value?.userId);
  return props.disabled || localUser?.isMessageDisabled;
});

const { inputRawValue, setContent, sendMessage, blurEditor, focusEditor } = useMessageInputState();
const isFocus = ref(false);
const editorShow = ref(false);
const isTouching = ref(false);

const handleTouchStart = () => {
  isTouching.value = true;
};

const handleSend = async () => {
  if (inputRawValue.value) {
    blurEditor();
    try {
      const inputValue = inputRawValue.value;
      setContent('');
      await sendMessage(inputValue);
    } catch (err: any) {
      TUIToast.error({
        message: t(ERROR_MESSAGE[err.code as keyof typeof ERROR_MESSAGE] || 'send message failed'),
      });
    }
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

const handleShowEditor = async () => {
  editorShow.value = true;
  await nextTick();
  focusEditor();
}
</script>

<style lang="scss" scoped>
.live-message-input-h5 {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  :deep(.message-input-container-h5) {
    height: 36px;
    max-height: 140px;
    min-height: 36px;
    padding: 2px 12px;
    border-radius: 100px;
    border: 1px solid var(--stroke-color-primary)
  }

  .placeholder-container {
    position: relative;
    display: flex;
    align-items: center;
    background-color: var(--bg-color-operate);
    overflow: auto;
    box-sizing: border-box;
    height: 36px;
    max-height: 140px;
    min-height: 36px;
    padding: 2px 12px;
    border-radius: 100px;
    border: 1px solid var(--stroke-color-primary);
    color: var(--text-color-secondary);
    text-align: center;
    line-height: 1.5;
    font-size: 14px;
    user-select: none;

    .input-actions {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-right: 12px;
      flex-shrink: 0;
    }
  }
}
</style>
