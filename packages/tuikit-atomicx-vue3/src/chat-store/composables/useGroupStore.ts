// packages/vue3/src/composables/useGroupStore.ts
import { GroupStore } from '@atomicxcore/core';
import type {
  GroupState,
  GroupInfo,
  GroupApplicationInfo,
  GroupCreateParams,
  GroupJoinOption,
  GroupInviteOption,
} from '@atomicxcore/core';
import type { ComputedRef } from 'vue';
import { createSingletonComposable } from '../internal/createSingletonComposable';

interface GroupStoreAPI {
  joinedGroupList: ComputedRef<GroupState['joinedGroupList']>;
  applicationList: ComputedRef<GroupState['applicationList']>;
  unreadApplicationCount: ComputedRef<GroupState['unreadApplicationCount']>;
  loadJoinedGroups(): Promise<void>;
  loadGroupAttributes(groupID: string, keys?: string[]): Promise<void>;
  getGroupInfo(groupID: string): Promise<GroupInfo>;
  createGroup(params: GroupCreateParams): Promise<string>;
  joinGroup(groupID: string, message?: string): Promise<void>;
  quitGroup(groupID: string): Promise<void>;
  dismissGroup(groupID: string): Promise<void>;
  loadApplications(): Promise<void>;
  acceptApplication(info: GroupApplicationInfo): Promise<void>;
  refuseApplication(info: GroupApplicationInfo): Promise<void>;
  clearApplicationUnreadCount(): void;
  changeOwner(groupID: string, newOwnerID: string): Promise<void>;
  updateProfile(groupInfo: Partial<GroupInfo> & { groupID: string }): Promise<void>;
  setJoinOption(groupID: string, option: GroupJoinOption): Promise<void>;
  setInviteOption(groupID: string, option: GroupInviteOption): Promise<void>;
  muteAllMembers(groupID: string, isMuted: boolean): Promise<void>;
}

const createGroupStore = createSingletonComposable(
  GroupStore,
  ['joinedGroupList', 'applicationList', 'unreadApplicationCount'],
  [
    'loadJoinedGroups',
    'loadGroupAttributes',
    'getGroupInfo',
    'createGroup',
    'joinGroup',
    'quitGroup',
    'dismissGroup',
    'loadApplications',
    'acceptApplication',
    'refuseApplication',
    'clearApplicationUnreadCount',
    'changeOwner',
    'updateProfile',
    'setJoinOption',
    'setInviteOption',
    'muteAllMembers',
  ],
) as () => GroupStoreAPI;

const GroupStoreVue = Object.assign(createGroupStore, {
  create: createGroupStore,
});

/** @deprecated Use GroupStore() instead */
const useGroupStore = createGroupStore;

export { GroupStoreVue as GroupStore, useGroupStore };
export type { GroupStoreAPI };
