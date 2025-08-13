<template>
  <div :class="[styles['input-wrapper'], props.disabled && styles.disabled]">
    <div :class="styles['input-prefix']">
      <slot name="prefix" />
    </div>
    <div
      v-if="!props.disabled"
      ref="editorRef"
      :class="styles['editor']"
    />
    <div
      v-if="props.disabled"
      :class="[styles['disabled-editor']]"
    >
      {{ placeholderText }}
    </div>
    <span :class="styles['input-suffix']">
      <slot name="suffix" />
    </span>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, withDefaults, defineProps, nextTick, defineEmits } from 'vue';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useConversationListState } from '../../../states/ConversationListState';
import { useMessageInputState } from '../../../states/MessageInputState';
import { createEditor } from './EditorCore';
import styles from './TextEditor.module.scss';
import type { Editor } from './EditorCore';

interface ITextEditorProps {
  autoFocus?: boolean;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
}

const props = withDefaults(defineProps<ITextEditorProps>(), {
  autoFocus: true,
  disabled: false,
  placeholder: '',
});

const emit = defineEmits<{
  (e: 'focus'): void;
  (e: 'blur'): void;
}>();
const { t } = useUIKit();
const { activeConversation } = useConversationListState();
const { updateRawValue, sendMessage, setEditorInstance, setContent } = useMessageInputState();

const editorRef = ref<HTMLDivElement | null>(null);
const isFocused = ref(props.autoFocus);

const placeholderText = computed(() => props.placeholder || t('Say something'));

let editorInstance: Editor | null = null;

const createEditorInstance = (p: ITextEditorProps) => {
  const element = editorRef.value;
  if (!element || p.disabled) {
    return;
  }
  if (!element.dataset.editorCreated) {
    editorInstance = createEditor({
      element,
      placeholder: placeholderText.value,
      autoFocus: p.autoFocus,
      disabled: p.disabled,
      maxLength: p.maxLength,
      onUpdate: (content) => {
        updateRawValue(content);
      },
      onEnter: () => {
        sendMessage();
        setContent('');
      },
      onFocus: () => {
        isFocused.value = true;
        emit('focus');
      },
      onBlur: () => {
        isFocused.value = false;
        emit('blur');
      },
    });
    element.dataset.editorCreated = 'true';
    setEditorInstance(editorInstance);
  }
};

const destroyEditorInstance = () => {
  editorInstance?.destroy();
  editorRef.value?.removeAttribute('data-editor-created');
  setEditorInstance(null);
};

watch(
  () => props.disabled,
  async (newDisabled, oldDisabled) => {
    if (newDisabled !== oldDisabled) {
      if (newDisabled) {
        destroyEditorInstance();
      } else {
        await nextTick();
        createEditorInstance(props);
      }
    }
  },
);

onMounted(() => {
  createEditorInstance(props);
});

onUnmounted(() => {
  destroyEditorInstance();
});

watch(activeConversation, (newConversation, oldConversation) => {
  if (newConversation?.conversationID !== oldConversation?.conversationID) {
    setContent('');
  }
});
</script>
