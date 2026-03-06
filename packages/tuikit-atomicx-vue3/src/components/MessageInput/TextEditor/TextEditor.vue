<template>
  <div :class="[styles['input-wrapper'], props.disabled && styles.disabled]">
    <div :class="styles['input-prefix']">
      <slot name="inputPrefix" />
    </div>
    <EditorContent
      :editor="editor"
      :class="styles['editor']"
      class="message-input"
    />
    <div :class="styles['input-suffix']">
      <slot name="inputSuffix" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, onBeforeUnmount } from 'vue';
import { TUIChatService } from '@tencentcloud/chat-uikit-engine-lite';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useEditor, EditorContent } from '@tiptap/vue-3';
import { useConversationListState } from '../../../states/ConversationListState';
import { useMessageInputState } from '../../../states/MessageInputState';
import { createExtensions } from './EditorCore';
import styles from './TextEditor.module.scss';

interface TextEditorProps {
  autoFocus?: boolean;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
}

const props = withDefaults(defineProps<TextEditorProps>(), {
  autoFocus: true,
  disabled: false,
  placeholder: undefined,
  maxLength: undefined,
});

const { t, language } = useUIKit();
const { activeConversation } = useConversationListState();
const { sendMessage, setEditorInstance, setContent } = useMessageInputState();

let typingTimer: ReturnType<typeof setTimeout> | null = null;

const computedPlaceholder = computed(() => props.placeholder ?? t('MessageInput.enter_a_message'));

// Handle Enter key to send message
const handleEnter = () => {
  sendMessage();
  setContent('');
};

// Create editor using Tiptap's official useEditor composable
const editor = useEditor({
  autofocus: props.autoFocus,
  editable: !props.disabled,
  extensions: createExtensions({
    placeholder: computedPlaceholder.value,
    maxLength: props.maxLength,
    showPlaceholderOnlyWhenEditable: props.placeholder === undefined,
    onEnter: handleEnter,
  }),
  onUpdate: () => {
    TUIChatService.enterTypingState();
    if (typingTimer) {
      clearTimeout(typingTimer);
    }
    typingTimer = setTimeout(() => {
      TUIChatService.leaveTypingState();
      typingTimer = null;
    }, 3000);
  },
});

// Sync editor instance to global state
watch(editor, (newEditor) => {
  setEditorInstance(newEditor ?? null);
}, { immediate: true });

// Reactive: disabled prop
watch(() => props.disabled, (newDisabled) => {
  editor.value?.setEditable(!newDisabled);
  if (newDisabled) {
    setContent('');
  }
});

// Reactive: placeholder (including language change)
watch([computedPlaceholder, language], () => {
  if (!editor.value) {
    return;
  }

  const placeholderExtension = editor.value.extensionManager.extensions.find(
    ext => ext.name === 'placeholder',
  );
  if (placeholderExtension) {
    placeholderExtension.options.placeholder = computedPlaceholder.value;
    editor.value.view.updateState(editor.value.state);
  }
});

// Reactive: maxLength
watch(() => props.maxLength, (newMaxLength) => {
  if (!editor.value) {
    return;
  }

  const characterCountExtension = editor.value.extensionManager.extensions.find(
    ext => ext.name === 'characterCount',
  );
  if (characterCountExtension) {
    characterCountExtension.options.limit = newMaxLength;
  }
});

// Clear content when conversation changes
watch(activeConversation, (newConversation, oldConversation) => {
  if (newConversation?.conversationID !== oldConversation?.conversationID) {
    setContent('');
  }
});

// Cleanup on unmount
onBeforeUnmount(() => {
  setEditorInstance(null);
});
</script>
