import { ref } from 'vue';
import type { Ref } from 'vue';
import { useBarrageState } from '../../states/BarrageState';
import { transformTextWithEmojiNameToKey } from '../../utils';
import { MessageContentType } from './type';
import { convertInputContentToEditorNode } from './utils';
import type { InputContent } from './type';
import type { Editor } from '@tiptap/vue-3';

/**
 * Message Input Store
 *
 * This store manages the state and operations related to the chat message input, including:
 * - Raw input value (text or structured content)
 * - Editor instance management
 * - Content manipulation (insertion, updating, etc.)
 * - Message sending functionality
 */
interface MessageInputState {
  inputRawValue: Ref<string | InputContent[]>;
}

interface MessageInputAction {
  updateRawValue: (value: string | InputContent[]) => void;
  setEditorInstance: (editor: Editor | null) => void;
  setContent: (value: string | InputContent[]) => void;
  insertContent: (value: string | InputContent[], focus?: boolean) => void;
  focusEditor: () => void;
  blurEditor: () => void;
  sendMessage: (msg?: string | InputContent[]) => void;
}

const { sendTextMessage } = useBarrageState();

const editor = ref<Editor | null>(null);
const inputRawValue = ref<string | InputContent[]>('');

/* =====================================================
 * MessageInputActions begin
 * ===================================================== */
const updateRawValue = (value: string | InputContent[]) => {
  if (typeof value !== 'string' && !Array.isArray(value)) {
    console.warn('Invalid input type for updateRawValue');
    return;
  }
  if (typeof value === 'string') {
    inputRawValue.value = value.trim();
  } else {
    inputRawValue.value = value?.length > 0 ? value : '';
  }
};

const setEditorInstance = (instance: Editor | null) => {
  if (editor.value) {
    editor.value.destroy();
  }
  editor.value = instance;
};

const setContent = (content: string | InputContent[]) => {
  if (!editor.value) {
    return;
  }
  if (typeof content === 'string') {
    editor.value.commands.setContent(content, true);
  } else {
    const editorContent = content.map(convertInputContentToEditorNode);
    editor.value.commands.setContent(editorContent, true);
  }
  editor.value.commands.focus();
};

const insertContent = (content: string | InputContent[], focus = true) => {
  if (!editor.value) {
    return;
  }
  if (typeof content === 'string') {
    editor.value.commands.insertContent(content);
  } else {
    const editorContent = content.map(convertInputContentToEditorNode);
    editor.value.commands.insertContent(editorContent);
  }
  if (focus) {
    editor.value.commands.focus();
  }
};

const focusEditor = () => {
  editor.value?.commands.focus();
};

const blurEditor = () => {
  editor.value?.commands.blur();
};

const sendMessage = async (msg?: string | InputContent[]) => {
  const messageToSend = msg ?? inputRawValue.value;
  if (!messageToSend) {
    return;
  }

  if (typeof messageToSend === 'string') {
    sendTextMessage({
      text: transformTextWithEmojiNameToKey(messageToSend),
    });
    return;
  }

  let mergedText = '';
  const sendAccumulatedText = async () => {
    if (mergedText) {
      await sendTextMessage({
        text: transformTextWithEmojiNameToKey(mergedText),
      });
      mergedText = '';
    }
  };

  const messageProcessors = {
    [MessageContentType.TEXT]: (content: string) => content,
    [MessageContentType.EMOJI]: (content: { url: string; key: string; text: string }) => content.key,
  };

  // eslint-disable-next-line no-restricted-syntax
  for (const item of messageToSend) {
    if (!item.type || !messageProcessors[item.type]) {
      throw new Error(`Invalid message type: ${item.type}`);
    }

    const processor = messageProcessors[item.type] as (content: never) => string;
    // eslint-disable-next-line no-await-in-loop
    const result = await processor(item.content as never);

    if ([MessageContentType.TEXT, MessageContentType.EMOJI].includes(item.type)) {
      mergedText += result;
    }
  }

  await sendAccumulatedText();
};

/* =====================================================
 * MessageInputActions end
 * ===================================================== */

function useMessageInputState(): MessageInputState & MessageInputAction {
  return {
    inputRawValue,
    updateRawValue,
    setEditorInstance,
    setContent,
    insertContent,
    focusEditor,
    blurEditor,
    sendMessage,
  };
}

export { useMessageInputState, MessageContentType };
export type { InputContent };
