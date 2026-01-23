<template>
  <div :class="$style['message-input-h5']">
    <!-- Input Bar Area -->
    <div :class="$style['message-input-h5__bar']">
      <!-- Textarea -->
      <div :class="$style['message-input-h5__input-wrapper']">
        <textarea
          ref="textareaRef"
          v-model="inputValue"
          :class="$style['message-input-h5__textarea']"
          :placeholder="computedPlaceholder"
          :disabled="disabled"
          :maxlength="maxLength"
          rows="1"
          @focus="handleTextareaFocus"
          @blur="saveCursorPosition"
          @input="handleTextareaInput"
          @mousedown="handleTextareaMousedown"
          @keyup="saveCursorPosition"
        />
      </div>

      <!-- Action Buttons -->
      <div :class="$style['message-input-h5__actions']">
        <!-- Emoji Button -->
        <button
          type="button"
          :class="[
            $style['message-input-h5__action-btn'],
            mode === 'emoji' && $style['message-input-h5__action-btn--active']
          ]"
          :disabled="disabled"
          @click="handleEmojiClick"
        >
          <IconEmoji :size="24" />
        </button>

        <!-- Plus Button (when empty) / Send Button (when has value) -->
        <button
          v-if="!hasValue"
          type="button"
          :class="[
            $style['message-input-h5__action-btn'],
            mode === 'action' && $style['message-input-h5__action-btn--active']
          ]"
          :disabled="disabled"
          @click="handlePlusClick"
        >
          <IconPlus :size="20" />
        </button>

        <TUIButton
          v-else
          type="primary"
          radius="round"
          size="medium"
          :disabled="disabled"
          @click="handleSend"
        >
          {{ t('MessageInput.send') }}
        </TUIButton>
      </div>
    </div>

    <!-- Panel Area -->
    <div
      v-show="mode === 'emoji' || mode === 'action'"
      :class="$style['message-input-h5__panel']"
    >
      <!-- Emoji Panel -->
      <div
        v-if="mode === 'emoji'"
        :class="$style['message-input-h5__emoji-panel']"
        @touchmove.stop
      >
        <div :class="$style['message-input-h5__emoji-list']">
          <button
            v-for="emoji in emojiList"
            :key="emoji"
            type="button"
            :class="$style['message-input-h5__emoji-item']"
            @click="insertEmoji(emoji)"
          >
            {{ emoji }}
          </button>
        </div>
      </div>

      <!-- Action Panel -->
      <div
        v-if="mode === 'action'"
        :class="$style['message-input-h5__action-panel']"
        @touchmove.stop
      >
        <div :class="$style['message-input-h5__action-grid']">
          <!-- Image Picker -->
          <ImagePicker :disabled="disabled">
            <div :class="$style['message-input-h5__action-item']">
              <div :class="$style['message-input-h5__action-icon-wrapper']">
                <IconImage :size="28" :class="$style['message-input-h5__action-icon']" />
              </div>
              <span :class="$style['message-input-h5__action-label']">{{ t('MessageInput.image') }}</span>
            </div>
          </ImagePicker>

          <!-- Video Picker -->
          <VideoPicker :disabled="disabled">
            <div :class="$style['message-input-h5__action-item']">
              <div :class="$style['message-input-h5__action-icon-wrapper']">
                <IconVideo :size="28" :class="$style['message-input-h5__action-icon']" />
              </div>
              <span :class="$style['message-input-h5__action-label']">{{ t('MessageInput.video') }}</span>
            </div>
          </VideoPicker>
        </div>
      </div>

      <!-- Safe Area Bottom Padding -->
      <div :class="$style['message-input-h5__safe-area-bottom']" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue';
import { IconImage, IconVideo, IconEmoji, IconPlus, TUIButton, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useMessageInputState, MessageContentType } from '../../states/MessageInputState';
import ImagePicker from './AttachmentPicker/ImagePicker.vue';
import VideoPicker from './AttachmentPicker/VideoPicker.vue';

const { t } = useUIKit();

// ==================== Types ====================
type InputMode = 'none' | 'text' | 'emoji' | 'action';

interface MessageInputH5Props {
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
}

// ==================== Props ====================
const props = withDefaults(defineProps<MessageInputH5Props>(), {
  disabled: false,
  placeholder: undefined,
  maxLength: 500,
});

// ==================== Emits ====================
const emit = defineEmits<{
  /**
   * Emitted when input area expands (keyboard shows, panel opens, or textarea clicked)
   * Use this to scroll message list to bottom
   */
  (e: 'inputAreaExpand'): void;
}>();

// ==================== Message Input State ====================
const { sendMessage } = useMessageInputState();

// ==================== Refs ====================
const textareaRef = ref<HTMLTextAreaElement | null>(null);

// ==================== State ====================
const inputValue = ref('');
const mode = ref<InputMode>('none');
// Save cursor position before textarea loses focus
const cursorPosition = ref(0);

// ==================== Computed ====================
const hasValue = computed(() => inputValue.value.trim().length > 0);

/**
 * Placeholder logic:
 * 1. If user provides placeholder (including empty string), always use it
 * 2. If placeholder is undefined and disabled is true, show no placeholder
 * 3. If placeholder is undefined and disabled is false, show default placeholder
 */
const computedPlaceholder = computed(() =>
  props.placeholder ?? (props.disabled ? '' : t('MessageInput.enter_a_message'))
);

// ==================== Watch ====================
watch(() => props.disabled, (newDisabled) => {
  if (newDisabled) {
    inputValue.value = '';
    mode.value = 'none';
    cursorPosition.value = 0;
    nextTick(() => {
      adjustTextareaHeight();
    });
  }
});

// ==================== Emoji Data ====================
const emojiList = [
  '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂',
  '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩',
  '😘', '😗', '😚', '😙', '🥲', '😋', '😛', '😜',
  '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐',
  '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬',
  '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒',
  '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵',
  '🤯', '🤠', '🥳', '🥸', '😎', '🤓', '🧐', '😕',
  '😟', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺',
  '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱',
  '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤',
  '😡', '😠', '🤬', '😈', '👿', '💀', '☠️', '💩',
  '👍', '👎', '👏', '🙌', '👐', '🤲', '🤝', '🙏',
  '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
];

// ==================== Constants ====================
const MAX_TEXTAREA_HEIGHT = 100;
// Min height = line-height (16 * 1.4 = 22.4) + padding (8 * 2 = 16) + border (2) ≈ 40px
const MIN_TEXTAREA_HEIGHT = 40;
// Delay for keyboard to hide before showing panel (in ms)
const KEYBOARD_HIDE_DELAY = 300;

function adjustTextareaHeight(): void {
  const textarea = textareaRef.value;
  if (!textarea) {
    return;
  }

  // Temporarily set height to min to get accurate scrollHeight
  textarea.style.height = `${MIN_TEXTAREA_HEIGHT}px`;

  // Calculate new height, respecting min and max
  const { scrollHeight } = textarea;
  const newHeight = Math.max(MIN_TEXTAREA_HEIGHT, Math.min(scrollHeight, MAX_TEXTAREA_HEIGHT));
  textarea.style.height = `${newHeight}px`;

  // Toggle overflow based on content
  textarea.style.overflowY = scrollHeight > MAX_TEXTAREA_HEIGHT ? 'auto' : 'hidden';
}

// ==================== Mode Handlers ====================
function saveCursorPosition(): void {
  const textarea = textareaRef.value;
  if (textarea) {
    cursorPosition.value = textarea.selectionStart ?? inputValue.value.length;
  }
}

function handleTextareaFocus(): void {
  mode.value = 'text';
  emit('inputAreaExpand');
}

/**
 * Prevent textarea from gaining focus when panel is open.
 * This avoids Safari's viewport jump when keyboard appears while panel is visible.
 */
function handleTextareaMousedown(e: MouseEvent): void {
  if (mode.value === 'emoji' || mode.value === 'action') {
    // Prevent focus when panel is open to avoid keyboard + panel conflict
    e.preventDefault();
    // Close the panel instead
    mode.value = 'none';
  }
}

function handleTextareaInput(): void {
  saveCursorPosition();
  adjustTextareaHeight();
}

function handleEmojiClick(): void {
  if (mode.value === 'emoji') {
    // If already in emoji mode, just close panel (don't focus textarea)
    mode.value = 'none';
  } else {
    const wasInTextMode = mode.value === 'text';
    // Blur textarea first to hide keyboard
    blurTextarea();

    if (wasInTextMode) {
      // Delay showing panel to wait for keyboard to hide
      setTimeout(() => {
        mode.value = 'emoji';
        emit('inputAreaExpand');
      }, KEYBOARD_HIDE_DELAY);
    } else {
      mode.value = 'emoji';
      emit('inputAreaExpand');
    }
  }
}

function handlePlusClick(): void {
  if (mode.value === 'action') {
    // If already in action mode, just close panel (don't focus textarea)
    mode.value = 'none';
  } else {
    const wasInTextMode = mode.value === 'text';
    // Blur textarea first to hide keyboard
    blurTextarea();

    if (wasInTextMode) {
      // Delay showing panel to wait for keyboard to hide
      setTimeout(() => {
        mode.value = 'action';
        emit('inputAreaExpand');
      }, KEYBOARD_HIDE_DELAY);
    } else {
      mode.value = 'action';
      emit('inputAreaExpand');
    }
  }
}

function blurTextarea(): void {
  textareaRef.value?.blur();
}

// ==================== Send Handler ====================
function handleSend(): void {
  const text = inputValue.value.trim();
  if (!text || props.disabled) {
    return;
  }

  // Use internal sendMessage from state
  console.log('>>> LOG(1)::REMOVE::sendMessage::getfromsoftinput', text);
  sendMessage([{
    type: MessageContentType.TEXT,
    content: text,
  }]);

  inputValue.value = '';

  // Reset textarea height
  nextTick(() => {
    adjustTextareaHeight();
  });
}

// ==================== Emoji Handler ====================
function insertEmoji(emoji: string): void {
  // Use saved cursor position since textarea is blurred
  const pos = cursorPosition.value;
  const before = inputValue.value.substring(0, pos);
  const after = inputValue.value.substring(pos);

  inputValue.value = before + emoji + after;

  // Update saved cursor position
  cursorPosition.value = pos + emoji.length;

  nextTick(() => {
    adjustTextareaHeight();
  });
}

// ==================== Public Methods ====================
/**
 * Collapse the panel (emoji/action) if open
 * Call this when user taps outside the input area
 */
function collapsePanel(): void {
  if (mode.value === 'emoji' || mode.value === 'action') {
    mode.value = 'none';
  }
}

/**
 * Check if panel is currently open
 */
function isPanelOpen(): boolean {
  return mode.value === 'emoji' || mode.value === 'action';
}

defineExpose({
  collapsePanel,
  isPanelOpen,
});
</script>

<style lang="scss" module>
.message-input-h5 {
  background-color: var(--bg-color-operate);
  // Disable tap highlight on mobile webkit browsers
  -webkit-tap-highlight-color: transparent;
  border-top: 1px solid var(--stroke-color-secondary);

  // Input Bar
  &__bar {
    display: flex;
    align-items: flex-end;
    padding: 12px 12px;
    gap: 8px;
  }

  &__input-wrapper {
    flex: 1;
    min-width: 0;
  }

  &__textarea {
    width: 100%;
    min-height: 40px;
    max-height: 100px;
    padding: 8px 12px;
    border-radius: 16px;
    background-color: var(--bg-color-input);
    color: var(--text-color-primary);
    font-size: 16px;
    line-height: 1.4;
    resize: none;
    outline: none;
    box-sizing: border-box;
    overflow-y: hidden;
    border: none;

    &::placeholder {
      color: var(--text-color-secondary);
    }

    &:focus {
      // border-color: var(--text-color-link, #007aff);
    }

    &:disabled {
      background-color: var(--bg-color-bubble-reciprocal);
      cursor: not-allowed;
    }
  }

  // Action Buttons
  &__actions {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
    padding-bottom: 4px;
  }

  &__action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    border: none;
    border-radius: 50%;
    background-color: transparent;
    color: var(--text-color-secondary);
    cursor: pointer;
    transition: background-color 0.2s, color 0.2s;

    &:active {
      background-color: var(--bg-color-hover);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    &--active {
      color: var(--text-color-link);
    }
  }

  // Panel Area
  &__panel {
    border-top: 1px solid var(--stroke-color-primary);
    background-color: var(--bg-color-operate);
  }

  // Emoji Panel - with scroll lock for iOS
  &__emoji-panel {
    height: 220px;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    // Prevent iOS scroll chaining (bounce effect propagating to parent)
    overscroll-behavior-y: contain;
  }

  &__emoji-list {
    display: flex;
    flex-wrap: wrap;
    padding: 12px;
    gap: 4px;
  }

  &__emoji-item {
    display: flex;
    align-items: center;
    justify-content: center;
    width: calc((100% - 28px) / 8);
    aspect-ratio: 1;
    padding: 0;
    border: none;
    border-radius: 8px;
    background-color: transparent;
    font-size: 24px;
    cursor: pointer;
    transition: background-color 0.2s;

    &:active {
      background-color: var(--bg-color-hover);
    }
  }

  // Action Panel - with scroll lock for iOS
  &__action-panel {
    height: 220px;
    padding: 20px;
    box-sizing: border-box;
    overflow-y: auto;
    // Prevent iOS scroll chaining
    overscroll-behavior-y: contain;
  }

  &__action-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
  }

  &__action-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    cursor: pointer;

    &:active {
      opacity: 0.7;
    }
  }

  &__action-icon-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 56px;
    border-radius: 12px;
    background-color: var(--bg-color-input);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  &__action-icon {
    width: 28px;
    height: 28px;
    color: var(--text-color-primary);
  }

  &__action-label {
    font-size: 12px;
    color: var(--text-color-secondary);
  }

  // Safe Area Bottom - for iPhone home indicator
  &__safe-area-bottom {
    height: env(safe-area-inset-bottom, 0);
    background-color: var(--bg-color-operate);
  }
}
</style>
