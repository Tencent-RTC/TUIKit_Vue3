<template>
  <div class="live-message-input-h5">
    <!--
      Outside-tap dismiss mask.
      Rendered only while the editor is focused. It is a `position: fixed`
      viewport-sized layer placed BEFORE the editor in DOM order so the
      editor (and the Send button) paint on top of it. Tapping the mask
      becomes the natural event target, so the underlying UI (player
      controls, request-co-stream trigger, etc.) cannot accidentally
      receive the same gesture. The mask itself only blurs the editor.

      IMPORTANT: this mask MUST resolve to the visual viewport. That
      means no ancestor between this node and the document root may
      establish a containing block for fixed elements (i.e. no
      `transform`, `filter`, `perspective`, `will-change`, `backdrop-
      filter`, or `contain: paint/layout/strict` on any ancestor).
      LivePlayerH5's keyboard compensation deliberately uses `bottom`
      (not `transform`) on `.bottom` for exactly this reason — see the
      comment block above `syncBottomBarOffset` there.
    -->
    <div
      v-if="isFocus"
      class="outside-tap-mask"
      @touchstart.stop.prevent="handleMaskDismiss"
      @click.stop.prevent="handleMaskDismiss"
    ></div>

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
      :onWillSendBarrage="props.onWillSendBarrage"
      :onDidSendBarrage="props.onDidSendBarrage"
      @focus="handleFocus"
      @blur="handleBlur"
    />
    <TUIButton
      v-if="showSendButton"
      type="primary"
      @touchstart="handleTouchStart"
      @touchend="handleTouchEnd"
    >
      {{ t('BarrageInput.Send') }}
    </TUIButton>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import { useUIKit, TUIButton, TUIToast } from '@tencentcloud/uikit-base-component-vue3';
import { useLiveAudienceState } from '../../states/LiveAudienceState';
import { useLoginState } from '../../states/LoginState';
import { useMessageInputState } from './MessageInputState';
import BarrageInput from './BarrageInput.vue';
import EmojiPicker from './EmojiPicker/EmojiPicker.vue';
import { ERROR_MESSAGE } from './constants';
import type { OnWillSendBarrage, OnDidSendBarrage } from '../../types/barrage';

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
  onWillSendBarrage?: OnWillSendBarrage;
  onDidSendBarrage?: OnDidSendBarrage;
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

const placeholderText = computed(() => props.placeholder || t('BarrageInput.saySomething'));
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

// Show the send button while the input is focused, or — even after blur —
// while there is still non-empty content. This lets the user dismiss the
// keyboard, review their draft, and tap Send without re-focusing.
// `inputRawValue` is `string | InputContent[]`: trim strings to ignore
// whitespace-only drafts; for the rich-content array, treat any item as
// real content (mirrors `handleSend`'s own non-empty check).
const hasContent = computed(() => {
  const raw = inputRawValue.value;
  if (!raw) return false;
  if (typeof raw === 'string') return raw.trim().length > 0;
  return raw.length > 0;
});
const showSendButton = computed(() => isFocus.value || hasContent.value);

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
        message: t(ERROR_MESSAGE[err.code as keyof typeof ERROR_MESSAGE] || 'BarrageInput.sendFailed'),
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

// Mask handler: any tap on the mask just dismisses the editor. Because
// the mask is the actual event target, the underlying UI (player
// controls, request-co-stream button, etc.) never sees this gesture, so
// closing the keyboard cannot accidentally trigger background actions.
const handleMaskDismiss = () => {
  blurEditor();
};

const handleFocus = () => {
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

  // Viewport-sized, fully-transparent dismiss layer. Captures any tap
  // that lands outside the editor (and Send button) and turns it into
  // a blur — never letting the gesture propagate to underlying UI
  // (player controls, request-co-stream button, etc.).
  //
  // Layering inside this flex row:
  //   .outside-tap-mask     z-index: 1 (covers everything in the row)
  //   editor + Send button  z-index: 2 (sit on top of the mask)
  // The relative+z-index pair on the siblings is required because the
  // mask is `position: fixed` and would otherwise paint above static
  // siblings purely by being positioned.
  .outside-tap-mask {
    position: fixed;
    inset: 0;
    background: transparent;
    z-index: 1;
    -webkit-tap-highlight-color: transparent;
  }

  > *:not(.outside-tap-mask) {
    position: relative;
    z-index: 2;
  }

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

    span {
      white-space: nowrap;
      text-overflow: ellipsis;
    }
  }
}
</style>
