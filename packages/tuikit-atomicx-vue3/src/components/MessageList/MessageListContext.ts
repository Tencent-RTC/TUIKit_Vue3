import { inject } from 'vue';
import { MessageType } from '../../types/engine';
import type { Component, Slots } from 'vue';


const MessageListContextSymbol = Symbol('MessageListContext');

interface MessageListContext {
  slots: Slots;
  /** Custom renderers to override built-in message bubble content by MessageType */
  messageRenderers?: Record<MessageType, Component>;
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
