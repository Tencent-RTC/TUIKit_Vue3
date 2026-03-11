<template>
  <div class="live-message-input">
    <div
      ref="messageInputContainerRef"
      :class="['message-input-container', containerClass, disabledAndPlaceholder.disabled && 'disabled']"
      :style="containerStyle"
    >
      <TextEditor
        style="width: 100%; height: 100%"
        :placeholder="disabledAndPlaceholder.placeholder"
        :disabled="disabledAndPlaceholder.disabled"
        :autoFocus="autoFocus"
        :maxLength="props.maxLength"
        @focus="emit('focus')"
        @blur="emit('blur')"
      >
        <template #prefix>
          <div
            v-if="!isRightSafeMode"
            class="input-actions input-actions--prefix"
          >
            <EmojiPicker
              :disabled="disabledAndPlaceholder.disabled"
              :trigger-style="{ display: 'flex' }"
            />
          </div>
        </template>
        <template #suffix>
          <div
            v-if="isRightSafeMode"
            class="input-actions input-actions--suffix"
          >
            <EmojiPicker
              :disabled="disabledAndPlaceholder.disabled"
              :trigger-style="{ display: 'flex' }"
              align="end"
              :panel-width="emojiPanelWidth"
            />
          </div>
        </template>
      </TextEditor>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CSSProperties } from 'vue';
import { computed, ref, onMounted, onBeforeUnmount } from 'vue';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useLiveAudienceState } from '../../states/LiveAudienceState';
import { useLoginState } from '../../states/LoginState';
import { EmojiPicker } from './EmojiPicker';
import TextEditor from './TextEditor/TextEditor.vue';

const emit = defineEmits<{
  (e: 'focus'): void;
  (e: 'blur'): void;
}>();
const { t } = useUIKit();
const { loginUserInfo } = useLoginState();
const { audienceList } = useLiveAudienceState();

interface Props {
  containerClass?: string;
  containerStyle?: CSSProperties;
  width?: string;
  height?: string;
  minHeight?: string;
  maxHeight?: string;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  maxLength?: number;
  emojiPopupMode?: 'default' | 'rightSafe';
}

const props = withDefaults(defineProps<Props>(), {
  containerClass: '',
  containerStyle: () => ({}),
  height: '',
  minHeight: '40px',
  maxHeight: '140px',
  disabled: false,
  autoFocus: true,
  maxLength: 80,
  emojiPopupMode: 'default',
});

const messageInputContainerRef = ref<HTMLElement | null>(null);
const emojiPanelWidth = ref(310);
const isRightSafeMode = computed(() => props.emojiPopupMode === 'rightSafe');
let resizeObserver: ResizeObserver | null = null;
let resizeRafId: number | null = null;

function updateEmojiPanelWidth() {
  if (!isRightSafeMode.value || !messageInputContainerRef.value) {
    return;
  }
  const containerWidth = messageInputContainerRef.value.clientWidth;
  if (!containerWidth) {
    return;
  }
  const rightPanel = messageInputContainerRef.value.closest('.main-right') as HTMLElement | null;
  const panelWidth = rightPanel?.clientWidth || containerWidth;

  // Constrain popup width by available area inside the right panel.
  // This avoids left overflow when the right panel is narrow on Windows.
  const safeMaxWidth = Math.min(containerWidth - 8, panelWidth - 24);
  emojiPanelWidth.value = Math.min(310, Math.max(160, safeMaxWidth));
}

function scheduleEmojiPanelResize() {
  if (typeof window === 'undefined') {
    return;
  }
  if (resizeRafId !== null) {
    window.cancelAnimationFrame(resizeRafId);
  }
  resizeRafId = window.requestAnimationFrame(() => {
    resizeRafId = null;
    updateEmojiPanelWidth();
  });
}

const containerStyle = computed(() => {
  const defaultStyle: CSSProperties = {
    minHeight: props.minHeight,
    maxHeight: props.maxHeight,
  };

  if (props.height) {
    defaultStyle.height = props.height;
  }

  if (props.width) {
    defaultStyle.width = props.width;
  }

  return { ...defaultStyle, ...props.containerStyle };
});

const disabledAndPlaceholder = computed(() => {
  const localUser = audienceList.value.find(item => item.userId === loginUserInfo.value?.userId);
  return {
    disabled: props.disabled || localUser?.isMessageDisabled,
    placeholder: localUser?.isMessageDisabled ? t('You have been muted') : props.placeholder,
  };
});

onMounted(() => {
  updateEmojiPanelWidth();
  if (typeof ResizeObserver !== 'undefined' && messageInputContainerRef.value) {
    resizeObserver = new ResizeObserver(() => {
      scheduleEmojiPanelResize();
    });
    resizeObserver.observe(messageInputContainerRef.value);
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', scheduleEmojiPanelResize);
  }
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  resizeObserver = null;
  if (typeof window !== 'undefined' && resizeRafId !== null) {
    window.cancelAnimationFrame(resizeRafId);
    resizeRafId = null;
  }
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', scheduleEmojiPanelResize);
  }
});
</script>

<style lang="scss" scoped>
.live-message-input {
  width: 100%;

  .message-input-container {
    position: relative;
    display: flex;
    align-items: stretch;
    background-color: var(--bg-color-operate);
    border: 2px solid var(--stroke-color-primary);
    border-radius: 8px;
    padding: 6px 16px;
    overflow: auto;
    box-sizing: border-box;

    &:focus-within {
      border-color: var(--text-color-link);
    }

    .input-actions {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-shrink: 0;

      &--prefix {
        margin-right: 12px;
      }

      &--suffix {
        margin-left: 12px;
      }

      .send-button {
        padding: 8px 20px;
        background: var(--text-color-link);
        color: var(--text-color-primary);
        border: none;
        border-radius: 20px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.2s ease;
        min-width: 60px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;

        &:hover {
          background: var(--text-color-link-hover);
        }

        &:active {
          background: var(--text-color-link-active);
        }

        &:disabled {
          background: var(--text-color-disabled);
          cursor: not-allowed;
        }
      }
    }
  }

  .disabled {
    cursor: not-allowed;
    user-select: none;
  }
}
</style>
