/**
 * useChatContext - Vue3 composable consuming core Channel.
 *
 * Bridges Channel's subscribe/getSnapshot to Vue reactivity.
 * Returns readonly computed refs for state and stable functions for methods.
 *
 * Usage:
 *   const ctx = useChatContext();            // default channel
 *   const ctx = useChatContext('panel-a');   // multi-panel isolation
 *
 * Access: ctx.conversationList.value, ctx.messageList.value, ctx.setActiveConversation(id) etc.
 * (state refs are auto-unwrapped in templates)
 */

import { computed, onScopeDispose, shallowRef } from 'vue';
import type { ComputedRef } from 'vue';
import { getChannel } from '@atomicxcore/core';
import type { ChannelSnapshot } from '@atomicxcore/core';

type ChatContextStateKey =
  | 'conversationList'
  | 'hasMoreConversations'
  | 'totalUnreadCount'
  | 'messageList'
  | 'hasOlderMessages'
  | 'hasNewerMessages'
  | 'pinnedMessageList'
  | 'memberList'
  | 'hasMoreMembers'
  | 'activeConversationID'
  | 'activeConversation';

type ChatContextMethodKey =
  | 'loadConversations'
  | 'loadMoreConversations'
  | 'getConversationInfo'
  | 'deleteConversation'
  | 'pinConversation'
  | 'markConversation'
  | 'setReceiveMessageOpt'
  | 'setConversationDraft'
  | 'clearConversationMessages'
  | 'clearConversationUnreadCount'
  | 'loadMessages'
  | 'loadOlderMessages'
  | 'loadNewerMessages'
  | 'sendMessageReadReceipts'
  | 'deleteMessages'
  | 'forwardMessages'
  | 'messageListOnEvent'
  | 'sendMessage'
  | 'loadMembers'
  | 'loadMoreMembers'
  | 'getMemberInfo'
  | 'addMember'
  | 'deleteMember'
  | 'muteMember'
  | 'setSelfNameCard'
  | 'setMemberRole'
  | 'setActiveConversation';

type ChatContextStateRefs = {
  readonly [K in ChatContextStateKey]: ComputedRef<ChannelSnapshot[K]>;
};

type ChatContextAPI = ChatContextStateRefs & Pick<ChannelSnapshot, ChatContextMethodKey>;

function useChatContext(channelID = 'default'): ChatContextAPI {
  const channel = getChannel(channelID);
  const snapshot = channel.getSnapshot();

  const state = shallowRef(snapshot);

  const unsub = channel.subscribe(() => {
    state.value = channel.getSnapshot();
  });

  onScopeDispose(() => {
    unsub();
  });

  return {
    conversationList: computed(() => state.value.conversationList),
    hasMoreConversations: computed(() => state.value.hasMoreConversations),
    totalUnreadCount: computed(() => state.value.totalUnreadCount),
    messageList: computed(() => state.value.messageList),
    hasOlderMessages: computed(() => state.value.hasOlderMessages),
    hasNewerMessages: computed(() => state.value.hasNewerMessages),
    pinnedMessageList: computed(() => state.value.pinnedMessageList),
    memberList: computed(() => state.value.memberList),
    hasMoreMembers: computed(() => state.value.hasMoreMembers),
    activeConversationID: computed(() => state.value.activeConversationID),
    activeConversation: computed(() => state.value.activeConversation),
    loadConversations: snapshot.loadConversations,
    loadMoreConversations: snapshot.loadMoreConversations,
    getConversationInfo: snapshot.getConversationInfo,
    deleteConversation: snapshot.deleteConversation,
    pinConversation: snapshot.pinConversation,
    markConversation: snapshot.markConversation,
    setReceiveMessageOpt: snapshot.setReceiveMessageOpt,
    setConversationDraft: snapshot.setConversationDraft,
    clearConversationMessages: snapshot.clearConversationMessages,
    clearConversationUnreadCount: snapshot.clearConversationUnreadCount,
    loadMessages: snapshot.loadMessages,
    loadOlderMessages: snapshot.loadOlderMessages,
    loadNewerMessages: snapshot.loadNewerMessages,
    sendMessageReadReceipts: snapshot.sendMessageReadReceipts,
    deleteMessages: snapshot.deleteMessages,
    forwardMessages: snapshot.forwardMessages,
    messageListOnEvent: snapshot.messageListOnEvent,
    sendMessage: snapshot.sendMessage,
    loadMembers: snapshot.loadMembers,
    loadMoreMembers: snapshot.loadMoreMembers,
    getMemberInfo: snapshot.getMemberInfo,
    addMember: snapshot.addMember,
    deleteMember: snapshot.deleteMember,
    muteMember: snapshot.muteMember,
    setSelfNameCard: snapshot.setSelfNameCard,
    setMemberRole: snapshot.setMemberRole,
    setActiveConversation: snapshot.setActiveConversation,
  };
}

export { useChatContext };
export type { ChatContextAPI };
