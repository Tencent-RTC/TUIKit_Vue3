import { inject } from 'vue';
import { MessageType } from '@atomicxcore/core';
import type { Component, Ref, Slots } from 'vue';


const MessageListContextSymbol = Symbol('MessageListContext');

interface MessageListContext {
  slots: Slots;
  /** Custom renderers to override built-in message bubble content by MessageType */
  messageRenderers?: Record<MessageType, Component>;
  activeMessageActionMenuID: Ref<string | null>;
}

function useMessageListContext(componentName: string): MessageListContext {
  const context = inject<MessageListContext | null>(MessageListContextSymbol, null);
  if (context === null) {
    throw new Error(`<${componentName}> must be used within Parent MessageList.`);
  }
  return context;
}

export {
  MessageListContextSymbol,
  useMessageListContext,
};

export type { MessageListContext };
