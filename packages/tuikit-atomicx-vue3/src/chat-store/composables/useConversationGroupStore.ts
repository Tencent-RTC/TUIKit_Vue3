// packages/vue3/src/composables/useConversationGroupStore.ts
import { ConversationGroupStore } from '@atomicxcore/core';
import type { ConversationGroupState } from '@atomicxcore/core';
import type { ComputedRef } from 'vue';
import { createSingletonComposable } from '../internal/createSingletonComposable';

interface ConversationGroupStoreAPI {
  groupList: ComputedRef<ConversationGroupState['groupList']>;
  loadGroups(): Promise<void>;
  createGroup(groupName: string, conversationIDList: string[]): Promise<void>;
  deleteGroup(groupName: string): Promise<void>;
  renameGroup(oldName: string, newName: string): Promise<void>;
  addConversationsToGroup(groupName: string, conversationIDList: string[]): Promise<void>;
  deleteConversationsFromGroup(groupName: string, conversationIDList: string[]): Promise<void>;
}

const createConversationGroupStore = createSingletonComposable(
  ConversationGroupStore,
  ['groupList'],
  [
    'loadGroups',
    'createGroup',
    'deleteGroup',
    'renameGroup',
    'addConversationsToGroup',
    'deleteConversationsFromGroup',
  ],
) as () => ConversationGroupStoreAPI;

const ConversationGroupStoreVue = Object.assign(createConversationGroupStore, {
  create: createConversationGroupStore,
});

/** @deprecated Use ConversationGroupStore() instead */
const useConversationGroupStore = createConversationGroupStore;

export { ConversationGroupStoreVue as ConversationGroupStore, useConversationGroupStore };
export type { ConversationGroupStoreAPI };
