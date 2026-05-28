// packages/vue3/src/composables/useMessageListStore.ts
//
// MessageList 的 Vue3 组合式 API 适配。
// 参考 useConversationListStore 的形态：用 createInstanceComposable 把 Store 的
// state 拆成一组 ComputedRef 暴露，把方法直接透传。onScopeDispose 里自动销毁。
//
// 调用契约：
//   - conversationID 必填（未传时 Store 创建会抛错）
//   - 返回的 messageList / hasOlderMessages / hasNewerMessages / pinnedMessageList
//     是 ComputedRef，可在 template 里直接用
//   - 8 个方法直接透传到 Store 实例

import { MessageListStore } from '@atomicxcore/core';
import type {
  MessageListState,
  MessageInfo,
  MessageLoadOption,
  ForwardMessageOption,
  MessageEvent,
} from '@atomicxcore/core';
import type { ComputedRef } from 'vue';
import { createInstanceComposable } from '../internal/createInstanceComposable';

interface MessageListStoreAPI {
  messageList: ComputedRef<MessageInfo[]>;
  hasOlderMessages: ComputedRef<boolean>;
  hasNewerMessages: ComputedRef<boolean>;
  pinnedMessageList: ComputedRef<MessageInfo[]>;
  loadMessages(option?: MessageLoadOption): Promise<any>;
  loadOlderMessages(): Promise<any>;
  loadNewerMessages(): Promise<any>;
  sendMessageReadReceipts(messages: MessageInfo[]): Promise<any>;
  deleteMessages(messages: MessageInfo[]): Promise<any>;
  forwardMessages(
    messages: MessageInfo[],
    option: ForwardMessageOption,
    conversationID: string,
  ): Promise<any>;
  onEvent(listener: (event: MessageEvent) => void): () => void;
  destroy(): void;
}

const createMessageListStore = createInstanceComposable(
  (conversationID?: string) => {
    if (!conversationID) {
      throw new Error('MessageListStore.create() requires a conversationID');
    }
    return MessageListStore.create(conversationID) as any;
  },
  ['messageList', 'hasOlderMessages', 'hasNewerMessages', 'pinnedMessageList'] as (keyof MessageListState)[],
  [
    'loadMessages',
    'loadOlderMessages',
    'loadNewerMessages',
    'sendMessageReadReceipts',
    'deleteMessages',
    'forwardMessages',
    'onEvent',
    'destroy',
  ],
) as unknown as (conversationID: string) => MessageListStoreAPI;

const MessageListStoreVue = {
  create: createMessageListStore,
};

/** @deprecated Use MessageListStore.create() instead */
const useMessageListStore = createMessageListStore;

export { MessageListStoreVue as MessageListStore, useMessageListStore };
export type { MessageListStoreAPI };
