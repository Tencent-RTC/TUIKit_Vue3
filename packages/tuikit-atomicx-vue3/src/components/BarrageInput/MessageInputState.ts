import { ref } from 'vue';
import type { Ref } from 'vue';
import { useBarrageState } from '../../states/BarrageState';
import { useLoginState } from '../../states/LoginState';
import { useLiveListState } from '../../states/LiveListState';
import { BarrageType } from '../../types/barrage';
import { transformTextWithEmojiNameToKey } from '../../utils';
import { MessageContentType } from './type';
import { convertInputContentToEditorNode } from './utils';
import type { OnWillSendBarrage, OnDidSendBarrage, Barrage } from '../../types/barrage';
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

interface SendHooks {
  onWillSendBarrage?: OnWillSendBarrage;
  onDidSendBarrage?: OnDidSendBarrage;
}

interface MessageInputAction {
  updateRawValue: (value: string | InputContent[]) => void;
  setEditorInstance: (editor: Editor | null) => void;
  setContent: (value: string | InputContent[]) => void;
  insertContent: (value: string | InputContent[], focus?: boolean) => void;
  focusEditor: () => void;
  blurEditor: () => void;
  sendMessage: (msg?: string | InputContent[]) => Promise<void>;
  setSendHooks: (instanceId: string, hooks: SendHooks) => void;
  clearSendHooks: (instanceId: string) => void;
}

const { sendTextMessage } = useBarrageState();

const { loginUserInfo } = useLoginState();
const { currentLive } = useLiveListState();

const editor = ref<Editor | null>(null);
const inputRawValue = ref<string | InputContent[]>('');

// Map of instance ID -> hooks, allowing multiple BarrageInput instances to coexist.
const sendHooksMap = new Map<string, SendHooks>();

const setSendHooks = (instanceId: string, hooks: SendHooks) => {
  sendHooksMap.set(instanceId, hooks);
};

const clearSendHooks = (instanceId: string) => {
  sendHooksMap.delete(instanceId);
};

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

/**
 * Build a preview Barrage object for will/did send hooks.
 * Fields like sequence and timestampInSecond are best-effort since the server assigns final values.
 */
const buildSendBarrage = (text: string, extensionInfo?: Record<string, string>): Barrage => ({
  liveId: currentLive.value?.liveId || '',
  sender: {
    userId: loginUserInfo.value?.userId || '',
    userName: loginUserInfo.value?.userName || '',
    nameCard: '',
    avatarUrl: loginUserInfo.value?.avatarUrl || ''
  },
  sequence: 0,
  timestampInSecond: Math.floor(Date.now() / 1000),
  messageType: BarrageType.text,
  textContent: text,
  extensionInfo: extensionInfo ?? null,
});

const sendMessage = async (msg?: string | InputContent[]) => {
  const messageToSend = msg ?? inputRawValue.value;
  if (!messageToSend) {
    return;
  }

  /**
   * Resolve the final text to send and call sendTextMessage with will/did hooks.
   * Restores editor content if onWillSendBarrage blocks the send.
   */
  const sendTextWithHooks = async (text: string) => {
    const barrage = buildSendBarrage(text);

    // Snapshot current hooks so that async iteration is not affected by concurrent map mutations.
    const sendHooksMapSnapshot = [...sendHooksMap.values()];

    // Iterate all registered hooks. Any `onWillSendBarrage` returning `false` blocks the send.
    // If a callback throws, we log the error and proceed (fail-open).
    for (const hooks of sendHooksMapSnapshot) {
      if (hooks.onWillSendBarrage) {
        try {
          const allowed = await hooks.onWillSendBarrage(barrage);
          if (allowed === false) {
            setContent(messageToSend);
            return;
          }
        } catch (error) {
          console.error('[BarrageInput] onWillSendBarrage callback error:', error);
        }
      }
    }

    await sendTextMessage({ text });

    // Notify all registered didSend hooks. Wrap in try-catch so a faulty callback
    // never breaks the already-sent state.
    for (const hooks of sendHooksMapSnapshot) {
      if (hooks.onDidSendBarrage) {
        try {
          hooks.onDidSendBarrage(barrage);
        } catch (error) {
          console.error('[BarrageInput] onDidSendBarrage callback error:', error);
        }
      }
    }
  };

  if (typeof messageToSend === 'string') {
    await sendTextWithHooks(transformTextWithEmojiNameToKey(messageToSend));
    return;
  }

  let mergedText = '';
  const sendAccumulatedText = async () => {
    if (mergedText) {
      await sendTextWithHooks(transformTextWithEmojiNameToKey(mergedText));
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
    setSendHooks,
    clearSendHooks,
  };
}

export { useMessageInputState, MessageContentType };
export type { InputContent };
