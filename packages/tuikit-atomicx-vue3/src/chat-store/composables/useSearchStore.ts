// packages/vue3/src/composables/useSearchStore.ts
// -----------------------------------------------------------------------------
// SearchStore 的 Vue3 适配组合式函数（多实例）。
// -----------------------------------------------------------------------------
//
// SearchStore 是多实例 store：每次调用 useSearchStore() 都会拥有自己独立的
// Store 实例，独立持有搜索结果和分页游标。适合「多个搜索面板同时存在」的场景。
//
// 生命周期由 createInstanceComposable 管理，onScopeDispose 时自动 unsubscribe
// + destroy。详见：
//   packages/vue3/src/internal/createInstanceComposable.ts

import { SearchStore, SearchType } from '@atomicxcore/core';
import type {
  SearchOption,
  GroupSearchInfo,
  MessageSearchResultItem,
  UserProfile,
  GroupMember,
} from '@atomicxcore/core';
import type { ComputedRef } from 'vue';
import { createInstanceComposable } from '../internal/createInstanceComposable';

interface SearchStoreAPI {
  userList: ComputedRef<UserProfile[]>;
  userTotalCount: ComputedRef<number>;
  hasMoreUsers: ComputedRef<boolean>;

  groupList: ComputedRef<GroupSearchInfo[]>;
  groupTotalCount: ComputedRef<number>;
  hasMoreGroups: ComputedRef<boolean>;

  groupMemberList: ComputedRef<Record<string, GroupMember[]>>;
  groupMemberTotalCount: ComputedRef<number>;
  hasMoreGroupMembers: ComputedRef<boolean>;

  messageResults: ComputedRef<MessageSearchResultItem[]>;
  messageResultTotalCount: ComputedRef<number>;
  hasMoreMessageResults: ComputedRef<boolean>;

  search(keywordList: string[], option?: SearchOption): Promise<void>;
  searchMore(searchType: SearchType): Promise<void>;
  destroy(): void;
}

const createSearchStore = createInstanceComposable(
  () => SearchStore.create(),
  [
    'userList',
    'userTotalCount',
    'hasMoreUsers',
    'groupList',
    'groupTotalCount',
    'hasMoreGroups',
    'groupMemberList',
    'groupMemberTotalCount',
    'hasMoreGroupMembers',
    'messageResults',
    'messageResultTotalCount',
    'hasMoreMessageResults',
  ],
  ['search', 'searchMore', 'destroy'],
) as unknown as () => SearchStoreAPI;

const SearchStoreVue = {
  create: createSearchStore,
};

/** @deprecated Use SearchStore.create() instead */
const useSearchStore = createSearchStore;

export { SearchStoreVue as SearchStore, useSearchStore };
export type { SearchStoreAPI };
