// packages/vue3/src/composables/useMessageActionStore.ts
//
// MessageActionStore 的 Vue3 组合式 API 适配。
// 参照 useMessageListStore：用 createInstanceComposable 把 Store 的 state
// 拆成一组 ComputedRef 暴露，把方法直接透传。onScopeDispose 里自动销毁。
//
// 调用契约：
//   - message 必填（未传时 Store 创建会抛错）
//   - 返回的 readMemberList / hasMoreReadMembers / unreadMemberList /
//     hasMoreUnreadMembers / reactionUserList / hasMoreReactionUsers
//     是 ComputedRef，可在 template 里直接用
//   - 17 个方法直接透传到 Store 实例
//   - Store 不对外抛事件，故没有 onEvent

import { MessageActionStore } from '@atomicxcore/core';
import type {
  MessageActionState,
  MessageActionStoreInstance,
  MessageInfo,
  MessageExtension,
  TranslateResult,
  MediaQuality,
} from '@atomicxcore/core';
import type { ComputedRef } from 'vue';
import { createInstanceComposable } from '../internal/createInstanceComposable';

interface MessageActionStoreAPI {
  readMemberList: ComputedRef<MessageActionState['readMemberList']>;
  hasMoreReadMembers: ComputedRef<boolean>;
  unreadMemberList: ComputedRef<MessageActionState['unreadMemberList']>;
  hasMoreUnreadMembers: ComputedRef<boolean>;
  reactionUserList: ComputedRef<MessageActionState['reactionUserList']>;
  hasMoreReactionUsers: ComputedRef<boolean>;

  revoke(): Promise<void>;
  delete(): Promise<void>;
  pin(isPinned: boolean): Promise<void>;
  addReaction(reactionID: string): Promise<void>;
  removeReaction(reactionID: string): Promise<void>;
  setExtensions(extensions: MessageExtension[]): Promise<void>;
  deleteExtensions(keys: string[] | null): Promise<void>;
  translateText(
    sourceTextList: string[],
    sourceLanguage: string | null,
    targetLanguage: string,
  ): Promise<TranslateResult>;
  convertVoiceToText(language: string): Promise<string>;
  downloadMedia(quality?: MediaQuality): Promise<void>;
  downloadMergedMessageList(): Promise<MessageInfo[]>;
  loadReadMembers(count: number): Promise<void>;
  loadUnreadMembers(count: number): Promise<void>;
  loadMoreMembers(isRead: boolean): Promise<void>;
  loadReactionUsers(reactionID: string, count: number): Promise<void>;
  loadMoreReactionUsers(): Promise<void>;
  destroy(): void;
}

const createMessageActionStore = createInstanceComposable(
  (message?: MessageInfo) => {
    if (!message) {
      throw new Error('MessageActionStore.create() requires a message');
    }
    return MessageActionStore.create(message) as any;
  },
  [
    'readMemberList',
    'hasMoreReadMembers',
    'unreadMemberList',
    'hasMoreUnreadMembers',
    'reactionUserList',
    'hasMoreReactionUsers',
  ] as (keyof MessageActionState)[],
  [
    'revoke',
    'delete',
    'pin',
    'addReaction',
    'removeReaction',
    'setExtensions',
    'deleteExtensions',
    'translateText',
    'convertVoiceToText',
    'downloadMedia',
    'downloadMergedMessageList',
    'loadReadMembers',
    'loadUnreadMembers',
    'loadMoreMembers',
    'loadReactionUsers',
    'loadMoreReactionUsers',
    'destroy',
  ] as (keyof MessageActionStoreInstance)[],
) as unknown as (message: MessageInfo) => MessageActionStoreAPI;

const MessageActionStoreVue = {
  create: createMessageActionStore,
};

/** @deprecated Use MessageActionStore.create() instead */
const useMessageActionStore = createMessageActionStore;

export { MessageActionStoreVue as MessageActionStore, useMessageActionStore };
export type { MessageActionStoreAPI };
