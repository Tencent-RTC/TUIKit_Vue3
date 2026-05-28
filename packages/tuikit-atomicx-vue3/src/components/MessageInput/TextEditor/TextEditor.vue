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
import { computed, inject, watch, onBeforeUnmount } from 'vue';
import { TUIToast, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useEditor, EditorContent } from '@tiptap/vue-3';
import { useChatContext } from '../../../chat-store';
import { useChatUIState } from '../../../context/useChatUIState';
import { convertEditorContent, trimInputContent } from '../../../states/MessageInputState/utils';
import { MessageContentType } from '../../../types/messageInput';
import { transformTextWithEmojiKeyToName, transformTextWithEmojiNameToKey } from '../../../utils';
import { createExtensions } from './EditorCore';
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
const { activeConversation, sendMessage } = useChatContext(channel);
const { setEditorInstance, setInputContent, quotedMessage, clearQuotedMessage } = useChatUIState(channel);

let typingTimer: ReturnType<typeof setTimeout> | null = null;

const computedPlaceholder = computed(() => props.placeholder ?? t('MessageInput.enter_a_message'));

// onEnterCallback is assigned after editor creation to avoid TDZ issues with const editor
let onEnterCallback: () => Promise<void> = async () => {};
const handleEnter = async () => {
  try {
    await onEnterCallback();
  } catch (error) {
    switch (error.code) {
      case 10007:
        TUIToast.error({
          message: '你不在群里',
        });
        break;
      default:
        TUIToast.error({
          message: '发送失败',
        });
        break;
    }
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
    // TODO: replace with new MessageInputStore typing API when available
    if (typingTimer) {
      clearTimeout(typingTimer);
    }
    typingTimer = setTimeout(() => {
      typingTimer = null;
    }, 3000);
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

  // Snapshot state before clearing for instant UX feedback
  const savedQuotedMessage = quotedMessage.value;

  setInputContent('');
  if (savedQuotedMessage) {
    clearQuotedMessage();
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
      await sendMessage({ type: 'imageMessage', file: (item as Extract<InputContent, { type: typeof MessageContentType.IMAGE }>).content });
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
};

// Reactive: disabled prop
watch(() => props.disabled, (newDisabled) => {
  editor.value?.setEditable(!newDisabled);
  if (newDisabled) {
    setInputContent('');
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
    setInputContent('');
  }
});

// Cleanup on unmount
onBeforeUnmount(() => {
  setEditorInstance(null);
});
</script>
