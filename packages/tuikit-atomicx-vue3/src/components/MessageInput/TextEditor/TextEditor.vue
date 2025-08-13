<template>
  <div :class="[styles['input-wrapper'], props.disabled && styles.disabled]">
    <div :class="styles['input-prefix']">
      <slot name="prefix" />
    </div>
    <div
      ref="editorRef"
      :class="styles['editor']"
    />
    <div :class="styles['input-suffix']">
      <slot name="suffix" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useConversationListState } from '../../../states/ConversationListState';
import { useMessageInputState } from '../../../states/MessageInputState';
import { createEditor } from './EditorCore';
import styles from './TextEditor.module.scss';
import type { Editor } from './EditorCore';

interface TextEditorProps {
  autoFocus?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

const props = withDefaults(defineProps<TextEditorProps>(), {
  autoFocus: true,
  disabled: false,
  placeholder: '',
});

const { t } = useUIKit();
const { activeConversation } = useConversationListState();
const { updateRawValue, sendMessage, setEditorInstance, setContent } = useMessageInputState();

const editorRef = ref<HTMLDivElement | null>(null);
const isFocused = ref(props.autoFocus);

const placeholderText = computed(() => (props.disabled ? '' : props.placeholder || t('MessageInput.enter_a_message')));

let editorInstance: Editor | null = null;

onMounted(() => {
  const element = editorRef.value;
  if (!element) {
    return;
  }

  if (!element.dataset.editorCreated) {
    editorInstance = createEditor({
      element,
      placeholder: placeholderText.value,
      autoFocus: props.autoFocus,
      disabled: props.disabled,
      onUpdate: (content) => {
        updateRawValue(content);
      },
      onEnter: () => {
        sendMessage();
        setContent('');
      },
      onFocus: () => {
        isFocused.value = true;
      },
      onBlur: () => {
        isFocused.value = false;
      },
    });
    element.dataset.editorCreated = 'true';
    setEditorInstance(editorInstance);
  }
});

onUnmounted(() => {
  const element = editorRef.value;
  if (editorInstance && element) {
    editorInstance.destroy();
    element.removeAttribute('data-editor-created');
    setEditorInstance(null);
  }
});

watch(activeConversation, (newConversation, oldConversation) => {
  if (newConversation?.conversationID !== oldConversation?.conversationID) {
    setContent('');
  }
});
</script>
