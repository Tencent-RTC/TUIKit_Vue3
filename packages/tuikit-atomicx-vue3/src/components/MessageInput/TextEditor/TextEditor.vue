<template>
  <div :class="[styles['input-wrapper'], props.disabled && styles.disabled]">
    <div :class="styles['input-prefix']">
      <slot name="inputPrefix" />
    </div>
    <div
      ref="editorDomRef"
      :key="props.disabled ? 'disabled' : 'enabled'"
      :class="styles['editor']"
    />
    <div :class="styles['input-suffix']">
      <slot name="inputSuffix" />
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
const { updateRawValue, sendMessage, setEditorInstance, setContent } = useMessageInputState();

const editorDomRef = ref<HTMLDivElement | null>(null);
const isFocused = ref(props.autoFocus);

const computedPlaceholder = computed(() => props.placeholder ?? t('MessageInput.enter_a_message'));

let editorInstance: Editor | null = null;

onMounted(() => {
  const element = editorDomRef.value;
  if (!element) {
    return;
  }

  element.classList.add('message-input');

  if (!element.dataset.editorCreated) {
    editorInstance = createEditor({
      element,
      placeholder: computedPlaceholder.value,
      isPlaceholderOnlyShowWhenEditable: props.placeholder === undefined,
      autoFocus: props.autoFocus,
      disabled: props.disabled,
      maxLength: props.maxLength,
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
  const element = editorDomRef.value;
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

// Watch language change and update placeholder using Tiptap's extensionManager
watch(language, () => {
  if (editorInstance && props.placeholder === undefined) {
    // Update placeholder extension options
    const placeholderExtension = editorInstance.extensionManager.extensions.find(
      ext => ext.name === 'placeholder',
    );
    if (placeholderExtension) {
      // eslint-disable-next-line no-param-reassign
      placeholderExtension.options.placeholder = computedPlaceholder.value;
      // Force re-render to apply new placeholder
      editorInstance.view.updateState(editorInstance.state);
    }
  }
});

watch(() => props.disabled, (newDisabled) => {
  if (editorInstance) {
    editorInstance.setEditable(!newDisabled);
    if (newDisabled) {
      setContent('');
    }
  }
});
</script>
