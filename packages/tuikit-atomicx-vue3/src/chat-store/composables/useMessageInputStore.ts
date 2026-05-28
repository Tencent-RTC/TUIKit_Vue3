// packages/vue3/src/composables/useMessageInputStore.ts
import { computed, getCurrentScope, onScopeDispose } from 'vue';
import type { ComputedRef } from 'vue';
import { MessageInputStore } from '@atomicxcore/core';
import type {
  SendMessagePayload,
  SendMessageInputOption,
  MessageInfo,
} from '@atomicxcore/core';

interface UseMessageInputStoreResult {
  conversationID: ComputedRef<string>;
  sendMessage(payload: SendMessagePayload, option?: SendMessageInputOption): Promise<MessageInfo>;
  destroy(): void;
}

function createMessageInputStore(conversationID: string): UseMessageInputStoreResult {
  const store = MessageInputStore.create(conversationID);
  if (getCurrentScope()) {
    onScopeDispose(() => store.destroy());
  }

  return {
    conversationID: computed(() => store.conversationID),
    sendMessage: store.sendMessage,
    destroy: store.destroy,
  };
}

const MessageInputStoreVue = {
  create: createMessageInputStore,
};

/** @deprecated Use MessageInputStore.create() instead */
const useMessageInputStore = createMessageInputStore;

export { MessageInputStoreVue as MessageInputStore, useMessageInputStore };
export type { UseMessageInputStoreResult };
