import { ref } from 'vue';
import type { Ref } from 'vue';
import { ConversationType, getChannel } from '@atomicxcore/core';
import type { Editor } from '@tiptap/vue-3';
import type { MessageInfo } from '@atomicxcore/core';
import type { InputContent } from '../types/messageInput';
import { createTypingCustomData } from '../utils/chatTypingStatus';
import { debounce, throttle } from '../utils/lodash';
import { convertInputContentToEditorNode } from '../utils/messageInput';

export interface LocateMessageInfo {
  conversationID: string;
  messageID: string;
  sequence?: number;
  time?: number;
}

export interface ChatUIStateAPI {
  /**
   * Whether read receipts are enabled. Mirrors the MessageList `enableReadReceipt`
   * prop but is exposed on the UI state so descendants can react to it without
   * prop-drilling.
   */
  enableReadReceipt: Ref<boolean | undefined>;

  /** Whether the peer of current active conversation is typing. */
  isPeerTyping: Ref<boolean>;

  /**
   * Set of message IDs currently being highlighted, for jump-to-message
   * animations and search result navigation.
   */
  highlightMessageIDSet: Ref<Set<string>>;

  /** Highlight a message for the given duration in milliseconds. */
  highlightMessage: (params: { messageID: string; duration: number }) => void;

  /** Set of message IDs that have been recalled. */
  recalledMessageIDSet: Ref<Set<string>>;

  /** The message currently staged for quoting. */
  quotedMessage: Ref<MessageInfo | undefined>;

  /** Stage a message for quoting. */
  setQuotedMessage: (message: MessageInfo | undefined) => void;

  /** Clear the currently quoted message. */
  clearQuotedMessage: () => void;

  /** Register the TipTap editor instance when MessageInput mounts. */
  setEditorInstance: (editor: Editor | null) => void;

  /** Replace the entire editor content and focus the editor afterwards. */
  setInputContent: (content: string | InputContent[]) => void;

  /** Insert content at the current cursor position. */
  insertInputContent: (content: string | InputContent[], focus?: boolean) => void;

  /** Focus the message input editor. */
  focusInput: () => void;

  /** Blur the message input editor. */
  blurInput: () => void;

  /** Update peer typing state for current active conversation. */
  setIsPeerTyping: (value: boolean) => void;

  /** Send typing start message for current active C2C conversation. */
  enterTyping: () => Promise<void>;

  /** Send typing end message for current active C2C conversation. */
  leaveTyping: () => Promise<void>;

  /** Current display mode of the MessageList. */
  listMode: Ref<'latest' | 'fragment'>;

  /** Pending request for MessageList to locate a specific message. */
  pendingLocateMessage: Ref<LocateMessageInfo | null>;

  /** Set or clear the pending locate-message request. */
  setPendingLocateMessage: (info: LocateMessageInfo | null) => void;

  /** Messages pending to be forwarded. */
  forwardMessages: Ref<MessageInfo[]>;

  /** Whether the forward conversation picker modal is open. */
  isForwardModalOpen: Ref<boolean>;

  /** Open the forward modal with the given messages. */
  openForwardModal: (messages: MessageInfo[]) => void;

  /** Close the forward modal and clear the pending message list. */
  closeForwardModal: () => void;
}

const chatUIStateMap = new Map<string, ChatUIStateAPI>();
const TYPING_AUTO_CLEAR_DURATION = 5 * 1000;
const TYPING_ENTER_THROTTLE_DURATION = 5 * 1000;
const TYPING_RECENT_RECEIVED_MESSAGE_DURATION = 30 * 1000;

function hasRecentPeerMessage(messageList: MessageInfo[]): boolean {
  const latestPeerMessage = [...messageList].reverse().find(message => !message.isSentBySelf);
  const latestPeerMessageTime = latestPeerMessage?.timestamp?.getTime();
  return typeof latestPeerMessageTime === 'number'
    && Date.now() - latestPeerMessageTime <= TYPING_RECENT_RECEIVED_MESSAGE_DURATION;
}

function createChatUIState(channel: string): ChatUIStateAPI {
  const enableReadReceipt = ref<boolean | undefined>(undefined);
  const isPeerTyping = ref(false);
  const highlightMessageIDSet = ref<Set<string>>(new Set());
  const recalledMessageIDSet = ref<Set<string>>(new Set());
  let hasEnteredTyping = false;

  const clearPeerTyping = debounce(() => {
    isPeerTyping.value = false;
  }, TYPING_AUTO_CLEAR_DURATION);

  const setIsPeerTyping = (value: boolean): void => {
    clearPeerTyping.cancel();
    isPeerTyping.value = value;
    if (value) {
      clearPeerTyping();
    }
  };

  const highlightMessage = ({ messageID, duration }: { messageID: string; duration: number }): void => {
    const next = new Set(highlightMessageIDSet.value);
    next.add(messageID);
    highlightMessageIDSet.value = next;

    setTimeout(() => {
      const after = new Set(highlightMessageIDSet.value);
      after.delete(messageID);
      highlightMessageIDSet.value = after;
    }, duration);
  };

  const quotedMessage = ref<MessageInfo | undefined>(undefined);
  const setQuotedMessage = (message: MessageInfo | undefined): void => {
    quotedMessage.value = message;
  };
  const clearQuotedMessage = (): void => {
    quotedMessage.value = undefined;
  };

  const editor = ref<Editor | null>(null);
  const setEditorInstance = (instance: Editor | null): void => {
    if (editor.value) {
      editor.value.destroy();
    }
    editor.value = instance;
  };

  const setInputContent = (content: string | InputContent[]): void => {
    if (!editor.value) { return; }
    if (typeof content === 'string') {
      editor.value.commands.setContent(content, true);
    } else {
      editor.value.commands.setContent(content.map(convertInputContentToEditorNode), true);
    }
    editor.value.commands.focus();
  };

  const insertInputContent = (content: string | InputContent[], focus = true): void => {
    if (!editor.value) { return; }
    if (typeof content === 'string') {
      editor.value.commands.insertContent(content);
    } else {
      editor.value.commands.insertContent(content.map(convertInputContentToEditorNode));
    }
    if (focus) { editor.value.commands.focus(); }
  };

  const focusInput = (): void => { editor.value?.commands.focus(); };
  const blurInput = (): void => { editor.value?.commands.blur(); };

  const sendTypingStart = throttle(async (): Promise<void> => {
    const snapshot = getChannel(channel).getSnapshot();
    const conversationID = snapshot.activeConversationID;
    if (!conversationID || snapshot.activeConversation?.type !== ConversationType.C2C) {
      return;
    }
    if (!hasRecentPeerMessage(snapshot.messageList)) {
      return;
    }

    await snapshot.sendMessage(
      {
        type: 'customMessage',
        customData: createTypingCustomData(true),
      },
      { onlineUserOnly: true },
    );
    hasEnteredTyping = true;
  }, TYPING_ENTER_THROTTLE_DURATION, {
    leading: true,
    trailing: false,
  });

  const enterTyping = async (): Promise<void> => {
    await sendTypingStart();
  };

  const leaveTyping = async (): Promise<void> => {
    sendTypingStart.cancel();
    const snapshot = getChannel(channel).getSnapshot();
    const conversationID = snapshot.activeConversationID;
    if (!conversationID || !hasEnteredTyping) {
      return;
    }

    await snapshot.sendMessage(
      {
        type: 'customMessage',
        customData: createTypingCustomData(false),
      },
      { onlineUserOnly: true },
    );
    hasEnteredTyping = false;
  };

  const listMode = ref<'latest' | 'fragment'>('latest');

  const pendingLocateMessage = ref<LocateMessageInfo | null>(null);
  const setPendingLocateMessage = (info: LocateMessageInfo | null): void => {
    pendingLocateMessage.value = info;
  };

  const forwardMessages = ref<MessageInfo[]>([]);
  const isForwardModalOpen = ref<boolean>(false);
  const openForwardModal = (messages: MessageInfo[]): void => {
    forwardMessages.value = messages;
    isForwardModalOpen.value = true;
  };
  const closeForwardModal = (): void => {
    forwardMessages.value = [];
    isForwardModalOpen.value = false;
  };

  return {
    enableReadReceipt,
    isPeerTyping,
    highlightMessageIDSet,
    highlightMessage,
    recalledMessageIDSet,
    quotedMessage,
    setQuotedMessage,
    clearQuotedMessage,
    setEditorInstance,
    setInputContent,
    insertInputContent,
    focusInput,
    blurInput,
    setIsPeerTyping,
    enterTyping,
    leaveTyping,
    listMode,
    pendingLocateMessage,
    setPendingLocateMessage,
    forwardMessages,
    isForwardModalOpen,
    openForwardModal,
    closeForwardModal,
  };
}

function useChatUIState(channel = 'default'): ChatUIStateAPI {
  if (!chatUIStateMap.has(channel)) {
    chatUIStateMap.set(channel, createChatUIState(channel));
  }
  return chatUIStateMap.get(channel)!;
}

export { useChatUIState };
