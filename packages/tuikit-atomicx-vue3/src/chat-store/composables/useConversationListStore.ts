// packages/vue3/src/composables/useConversationListStore.ts
import { ConversationListStore, ReceiveMessageOption, ConversationMarkType } from '@atomicxcore/core';
import type {
  ConversationInfo,
  ConversationLoadOption,
} from '@atomicxcore/core';
import type { ComputedRef } from 'vue';
import { createInstanceComposable } from '../internal/createInstanceComposable';

interface ConversationListStoreAPI {
  conversationList: ComputedRef<ConversationInfo[]>;
  hasMoreConversations: ComputedRef<boolean>;
  totalUnreadCount: ComputedRef<number>;
  loadConversations(option?: ConversationLoadOption): Promise<any>;
  loadMoreConversations(): Promise<any>;
  getConversationInfo(conversationID: string): Promise<ConversationInfo>;
  deleteConversation(conversationID: string): Promise<any>;
  pinConversation(conversationID: string, pin: boolean): Promise<any>;
  markConversation(conversationIDList: string[], markType: ConversationMarkType, enable: boolean): Promise<any>;
  setReceiveMessageOpt(conversationID: string, opt: ReceiveMessageOption): Promise<any>;
  setConversationDraft(conversationID: string, draft: string): Promise<any>;
  clearConversationMessages(conversationID: string): Promise<any>;
  clearConversationUnreadCount(conversationID: string): Promise<any>;
  destroy(): void;
}

const createConversationListStore = createInstanceComposable(
  (conversationGroup?: string) => ConversationListStore.create(conversationGroup) as any,
  ['conversationList', 'hasMoreConversations', 'totalUnreadCount'],
  [
    'loadConversations',
    'loadMoreConversations',
    'getConversationInfo',
    'deleteConversation',
    'pinConversation',
    'markConversation',
    'setReceiveMessageOpt',
    'setConversationDraft',
    'clearConversationMessages',
    'clearConversationUnreadCount',
    'destroy',
  ],
) as unknown as (conversationGroup?: string) => ConversationListStoreAPI;

const ConversationListStoreVue = {
  create: createConversationListStore,
};

/** @deprecated Use ConversationListStore.create() instead */
const useConversationListStore = createConversationListStore;

export { ConversationListStoreVue as ConversationListStore, useConversationListStore };
export type { ConversationListStoreAPI };
