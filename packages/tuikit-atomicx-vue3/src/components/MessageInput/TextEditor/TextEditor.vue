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
import { computed, inject, ref, watch, onBeforeUnmount } from 'vue';
import type { OfflinePushInfo, SendMessagePayload } from '@atomicxcore/core';
import { TUIToast, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useEditor, EditorContent } from '@tiptap/vue-3';
import { useChatContext } from '../../../chat-store';
import { useChatUIState } from '../../../context/useChatUIState';
import { parseConversationDraftContent, serializeConversationDraftContent } from '../../../utils/conversationDraft';
import { deleteLocalConversationDraft, getLocalConversationDraft, setLocalConversationDraft } from '../../../utils/conversationDraftStorage';
import { convertEditorContent, convertInputContentToEditorNode } from '../../../utils/messageInput';
import { createExtensions } from './EditorCore';
import { getSendErrorMessage } from '../utils/getSendErrorMessage';
import styles from './TextEditor.module.scss';
import type { InputContent } from '../../../types/messageInput';

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
const channel = inject('channel', 'default') as string;
const setOfflinePushInfo = inject<((payload: SendMessagePayload) => OfflinePushInfo | undefined) | undefined>('setOfflinePushInfo', undefined);
const {
  activeConversation,
  activeConversationID,
  setConversationDraft,
} = useChatContext(channel);

const {
  setEditorInstance,
  setInputContent,
  enterTyping,
  leaveTyping,
  sendInputMessage,
} = useChatUIState(channel);

const isProgrammaticUpdate = ref(false);
const activeConversationDraft = ref<string | undefined>(undefined);
const activeConversationIDSnapshot = ref<string | undefined>(undefined);

const computedPlaceholder = computed(() => props.placeholder ?? t('MessageInput.enter_a_message'));

const handleEnter = async () => {
  try {
    await sendInputMessage(setOfflinePushInfo);
  } catch (error) {
    TUIToast.error({
      message: getSendErrorMessage(t, error),
    });
  }
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
    channel,
  }),
  onUpdate: ({ editor: updatedEditor }) => {
    if (isProgrammaticUpdate.value) {
      return;
    }
    // Do not report typing when the editor has just been cleared (e.g. after send)
    if (updatedEditor.isEmpty) {
      return;
    }
    enterTyping().catch(() => {});
  },
  onBlur: () => {
    leaveTyping().catch(() => {});
  },
});

// Register editor instance into UIContext so other components can call setInputContent etc.
watch(editor, (newEditor) => {
  setEditorInstance(newEditor ?? null);
}, { immediate: true });

// Reactive: disabled prop
watch(() => props.disabled, (newDisabled) => {
  editor.value?.setEditable(!newDisabled);
  if (newDisabled) {
    isProgrammaticUpdate.value = true;
    try {
      setInputContent('');
    } finally {
      isProgrammaticUpdate.value = false;
    }
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

watch(() => activeConversation.value?.draft, (draft) => {
  activeConversationDraft.value = draft;
}, { immediate: true });

watch(activeConversationID, (conversationID) => {
  activeConversationIDSnapshot.value = conversationID;
}, { immediate: true });

const saveCurrentDraft = (conversationID: string) => {
  const editorInstance = editor.value;
  if (!editorInstance) {
    return;
  }

  const content = convertEditorContent(editorInstance.getJSON());
  const draft = serializeConversationDraftContent(content, {
    imageText: `[${t('MessageInput.image')}]`,
    emojiText: emojiContent => emojiContent.text || emojiContent.key,
  });
  setLocalConversationDraft(conversationID, draft).catch(() => {});
  setConversationDraft(conversationID, draft).catch(() => {});
};

const setEditorDraftContent = (content: string | InputContent[] | undefined) => {
  const editorInstance = editor.value;
  if (!editorInstance) {
    return;
  }

  isProgrammaticUpdate.value = true;
  try {
    if (typeof content === 'string' || content === undefined) {
      editorInstance.commands.setContent(content ?? '', true);
    } else {
      editorInstance.commands.setContent(content.map(convertInputContentToEditorNode), true);
    }
  } finally {
    isProgrammaticUpdate.value = false;
  }

  if (props.autoFocus) {
    editorInstance.commands.focus();
  }
};

const restoreDraft = (draft: string | undefined, conversationID: string | undefined) => {
  if (!conversationID) {
    setEditorDraftContent('');
    return;
  }

  getLocalConversationDraft(conversationID).then((localDraft) => {
    if (activeConversationIDSnapshot.value !== conversationID) {
      return;
    }
    setEditorDraftContent(parseConversationDraftContent(localDraft ?? draft));
  });
};

watch(activeConversationID, (newConversationID, oldConversationID) => {
  if (oldConversationID) {
    saveCurrentDraft(oldConversationID);
  }
  restoreDraft(activeConversationDraft.value, newConversationID);
}, { immediate: true });

// Cleanup on unmount
onBeforeUnmount(() => {
  leaveTyping().catch(() => {});
  setEditorInstance(null);
});
</script>
