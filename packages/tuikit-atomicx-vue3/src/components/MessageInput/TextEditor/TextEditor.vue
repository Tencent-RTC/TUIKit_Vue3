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
import { TUIToast, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useEditor, EditorContent } from '@tiptap/vue-3';
import { useChatContext } from '../../../chat-store';
import { useChatUIState } from '../../../context/useChatUIState';
import { MessageContentType } from '../../../types/messageInput';
import { transformTextWithEmojiKeyToName, transformTextWithEmojiNameToKey } from '../../../utils';
import { parseConversationDraftContent, serializeConversationDraftContent } from '../../../utils/conversationDraft';
import { deleteLocalConversationDraft, getLocalConversationDraft, setLocalConversationDraft } from '../../../utils/conversationDraftStorage';
import { blobUrlToFile, convertEditorContent, convertInputContentToEditorNode, trimInputContent } from '../../../utils/messageInput';
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
const {
  activeConversation,
  activeConversationID,
  sendMessage,
  setConversationDraft,
} = useChatContext(channel);

const {
  setEditorInstance,
  setInputContent,
  quotedMessage,
  clearQuotedMessage,
  enterTyping,
  leaveTyping,
} = useChatUIState(channel);

const isProgrammaticUpdate = ref(false);
const activeConversationDraft = ref<string | undefined>(undefined);
const activeConversationIDSnapshot = ref<string | undefined>(undefined);

const computedPlaceholder = computed(() => props.placeholder ?? t('MessageInput.enter_a_message'));

// onEnterCallback is assigned after editor creation to avoid TDZ issues with const editor
let onEnterCallback: () => Promise<void> = async () => {};
const handleEnter = async () => {
  try {
    await onEnterCallback();
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
  onUpdate: () => {
    if (isProgrammaticUpdate.value) {
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

// Assign the real send implementation now that editor is available
onEnterCallback = async () => {
  const editorInstance = editor.value;
  if (!editorInstance) {
    return;
  }
  const raw = trimInputContent(convertEditorContent(editorInstance.getJSON()));
  if (raw.length === 0) {
    return;
  }

  const savedQuotedMessage = quotedMessage.value;
  const sendingConversationID = activeConversation.value?.conversationID;

  isProgrammaticUpdate.value = true;
  try {
    setInputContent('');
  } finally {
    isProgrammaticUpdate.value = false;
  }

  const textBuffer: string[] = [];
  const atUserList: string[] = [];

  const flushText = async () => {
    if (textBuffer.length === 0) {
      return;
    }
    const textWithName = transformTextWithEmojiKeyToName(textBuffer.join(''));
    const text = transformTextWithEmojiNameToKey(textWithName);
    textBuffer.length = 0;
    const sendOption: Record<string, any> = {};
    if (atUserList.length > 0) {
      sendOption.atUserList = [...atUserList];
    }
    if (savedQuotedMessage) {
      sendOption.quotedMessage = savedQuotedMessage;
    }
    await sendMessage(
      { type: 'textMessage', text },
      Object.keys(sendOption).length > 0 ? sendOption : undefined,
    );
    atUserList.length = 0;
  };

  let idx = 0;
  while (idx < raw.length) {
    const item = raw[idx];
    if (item.type === MessageContentType.TEXT) {
      textBuffer.push((item as Extract<InputContent, { type: typeof MessageContentType.TEXT }>).content);
    } else if (item.type === MessageContentType.EMOJI) {
      textBuffer.push((item as Extract<InputContent, { type: typeof MessageContentType.EMOJI }>).content.key);
    } else if (item.type === MessageContentType.MENTION) {
      const mention = (item as Extract<InputContent, { type: typeof MessageContentType.MENTION }>).content;
      atUserList.push(mention.id);
      textBuffer.push(mention.mentionSuggestionChar + mention.label);
    } else if (item.type === MessageContentType.IMAGE) {
      await flushText();
      const imageContent = (item as Extract<InputContent, { type: typeof MessageContentType.IMAGE }>).content;
      const imageFile = imageContent instanceof File ? imageContent : await blobUrlToFile(imageContent);
      if (imageFile) {
        await sendMessage({ type: 'imageMessage', file: imageFile });
      }
    } else if (item.type === MessageContentType.VIDEO) {
      await flushText();
      await sendMessage({ type: 'videoMessage', file: (item as Extract<InputContent, { type: typeof MessageContentType.VIDEO }>).content, duration: 0 });
    } else if (item.type === MessageContentType.FILE) {
      await flushText();
      await sendMessage({ type: 'fileMessage', file: (item as Extract<InputContent, { type: typeof MessageContentType.FILE }>).content });
    }
    idx += 1;
  }
  await flushText();
  await leaveTyping().catch(() => {});
  if (savedQuotedMessage) {
    clearQuotedMessage();
  }
  if (sendingConversationID) {
    deleteLocalConversationDraft(sendingConversationID).catch(() => {});
    setConversationDraft(sendingConversationID, '').catch(() => {});
  }
};

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
