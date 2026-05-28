// New API: XxxStore.create()
export { LoginStore, useLoginStore } from './composables/useLoginStore';
export type { LoginStoreAPI } from './composables/useLoginStore';
export { ConversationListStore, useConversationListStore } from './composables/useConversationListStore';
export type { ConversationListStoreAPI } from './composables/useConversationListStore';
export { MessageListStore, useMessageListStore } from './composables/useMessageListStore';
export type { MessageListStoreAPI } from './composables/useMessageListStore';
export { MessageInputStore, useMessageInputStore } from './composables/useMessageInputStore';
export type { UseMessageInputStoreResult } from './composables/useMessageInputStore';
export { MessageActionStore, useMessageActionStore } from './composables/useMessageActionStore';
export type { MessageActionStoreAPI } from './composables/useMessageActionStore';
export { ContactStore, useContactStore } from './composables/useContactStore';
export type { ContactStoreAPI } from './composables/useContactStore';
export { GroupStore, useGroupStore } from './composables/useGroupStore';
export type { GroupStoreAPI } from './composables/useGroupStore';
export { GroupMemberStore, useGroupMemberStore } from './composables/useGroupMemberStore';
export type { GroupMemberStoreAPI } from './composables/useGroupMemberStore';
export { ConversationGroupStore, useConversationGroupStore } from './composables/useConversationGroupStore';
export type { ConversationGroupStoreAPI } from './composables/useConversationGroupStore';
export { SearchStore, useSearchStore } from './composables/useSearchStore';
export type { SearchStoreAPI } from './composables/useSearchStore';

// Internal factories (re-export for advanced use / M4+ extension)
export { createSingletonComposable } from './internal/createSingletonComposable';
export { createInstanceComposable } from './internal/createInstanceComposable';

// Context - Chat Store Channel bridge.
export { useChatContext } from './context/useChatContext';
