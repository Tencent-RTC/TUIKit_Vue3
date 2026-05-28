// packages/vue3/src/composables/useGroupMemberStore.ts
import { GroupMemberStore } from '@atomicxcore/core';
import type {
  GroupMemberState,
  GroupMember,
  GroupMemberFilterRole,
  AddGroupMemberResult,
} from '@atomicxcore/core';
import { GroupMemberRole } from '@atomicxcore/core';
import type { ComputedRef } from 'vue';
import { createInstanceComposable } from '../internal/createInstanceComposable';

interface GroupMemberStoreAPI {
  memberList: ComputedRef<GroupMemberState['memberList']>;
  hasMoreMembers: ComputedRef<GroupMemberState['hasMoreMembers']>;
  loadMembers(roleList?: GroupMemberFilterRole[]): Promise<any>;
  loadMoreMembers(): Promise<any>;
  getMemberInfo(userIDList: string[]): Promise<GroupMember[]>;
  addMember(userIDList: string[]): Promise<AddGroupMemberResult>;
  deleteMember(userIDList: string[]): Promise<any>;
  muteMember(userID: string, time: number): Promise<any>;
  setSelfNameCard(nameCard: string): Promise<any>;
  setMemberRole(userID: string, role: GroupMemberRole): Promise<any>;
  destroy(): void;
}

const createGroupMemberStore = createInstanceComposable(
  (groupID?: string) => {
    if (!groupID) {
      throw new Error('GroupMemberStore.create() requires a groupID');
    }
    return GroupMemberStore.create(groupID) as any;
  },
  ['memberList', 'hasMoreMembers'] as (keyof GroupMemberState)[],
  [
    'loadMembers',
    'loadMoreMembers',
    'getMemberInfo',
    'addMember',
    'deleteMember',
    'muteMember',
    'setSelfNameCard',
    'setMemberRole',
    'destroy',
  ],
) as unknown as (groupID: string) => GroupMemberStoreAPI;

const GroupMemberStoreVue = {
  create: createGroupMemberStore,
};

/** @deprecated Use GroupMemberStore.create() instead */
const useGroupMemberStore = createGroupMemberStore;

export { GroupMemberStoreVue as GroupMemberStore, useGroupMemberStore };
export type { GroupMemberStoreAPI };
