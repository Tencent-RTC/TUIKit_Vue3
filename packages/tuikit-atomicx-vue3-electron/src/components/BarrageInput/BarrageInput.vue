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
          <div ref="prefixActionsRef" class="input-actions input-actions--prefix">
            <EmojiPicker
              :disabled="disabledAndPlaceholder.disabled"
              :trigger-style="{ display: 'flex' }"
              v-bind="emojiPickerProps"
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
  emojiPopupMode?: 'inset' | 'outset';
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
  emojiPopupMode: 'outset',
});

const messageInputContainerRef = ref<HTMLElement | null>(null);
const prefixActionsRef = ref<HTMLElement | null>(null);
const emojiPanelWidth = ref(310);
const emojiAlignOffset = ref(0);
const isInsetMode = computed(() => props.emojiPopupMode === 'inset');

// Aggregate EmojiPicker props based on popup mode to keep the template clean.
const emojiPickerProps = computed(() => {
  if (isInsetMode.value) {
    return {
      align: 'start' as const,
      alignOffset: emojiAlignOffset.value,
      panelWidth: emojiPanelWidth.value,
      panelMaxHeight: 320,
      showScrollbar: true,
    };
  }
  return {
    align: 'center' as const,
    alignOffset: 0,
    panelWidth: 310,
    panelMaxHeight: undefined,
    showScrollbar: false,
  };
});

let resizeObserver: ResizeObserver | null = null;
let resizeRafId: number | null = null;

function updateEmojiPanelWidth() {
  if (!isInsetMode.value || !messageInputContainerRef.value) {
    return;
  }
  const containerWidth = messageInputContainerRef.value.clientWidth;
  if (!containerWidth) {
    return;
  }
  // In inset mode, set popup width equal to the input container width.
  emojiPanelWidth.value = Math.max(160, containerWidth);

  // Compute negative offset so the popup left edge aligns with the container left edge.
  // The trigger (emoji icon) is inside prefix padding, so we shift the popup left
  // by the distance between the container's left edge and the trigger's left edge.
  const containerRect = messageInputContainerRef.value.getBoundingClientRect();
  if (prefixActionsRef.value) {
    const triggerRect = prefixActionsRef.value.getBoundingClientRect();
    // Ensure offset is always non-positive to prevent unexpected rightward shift.
    emojiAlignOffset.value = Math.min(0, -(triggerRect.left - containerRect.left));
  }
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

    .input-actions {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-shrink: 0;

      &--prefix {
        margin-right: 12px;
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
