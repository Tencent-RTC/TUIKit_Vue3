// packages/vue3/src/composables/useContactStore.ts
import { ContactStore } from '@atomicxcore/core';
import type {
  ContactState,
  ContactInfo,
  FriendApplicationInfo,
  AddFriendParams,
} from '@atomicxcore/core';
import type { ComputedRef } from 'vue';
import { createSingletonComposable } from '../internal/createSingletonComposable';

interface ContactStoreAPI {
  friendList: ComputedRef<ContactState['friendList']>;
  blackList: ComputedRef<ContactState['blackList']>;
  friendApplicationList: ComputedRef<ContactState['friendApplicationList']>;
  friendApplicationUnreadCount: ComputedRef<ContactState['friendApplicationUnreadCount']>;
  loadFriends(): Promise<void>;
  addFriend(params: AddFriendParams): Promise<void>;
  deleteFriend(userID: string): Promise<void>;
  setFriendRemark(userID: string, remark: string): Promise<void>;
  getContactInfo(userIDList: string[]): Promise<ContactInfo[]>;
  loadBlackList(): Promise<void>;
  addToBlacklist(userID: string): Promise<void>;
  removeFromBlacklist(userID: string): Promise<void>;
  loadFriendApplications(): Promise<void>;
  acceptFriendApplication(info: FriendApplicationInfo): Promise<void>;
  refuseFriendApplication(info: FriendApplicationInfo): Promise<void>;
  clearFriendApplicationUnreadCount(): Promise<void>;
}

const createContactStore = createSingletonComposable(
  ContactStore,
  ['friendList', 'blackList', 'friendApplicationList', 'friendApplicationUnreadCount'],
  [
    'loadFriends',
    'addFriend',
    'deleteFriend',
    'setFriendRemark',
    'getContactInfo',
    'loadBlackList',
    'addToBlacklist',
    'removeFromBlacklist',
    'loadFriendApplications',
    'acceptFriendApplication',
    'refuseFriendApplication',
    'clearFriendApplicationUnreadCount',
  ],
) as () => ContactStoreAPI;

const ContactStoreVue = Object.assign(createContactStore, {
  create: createContactStore,
});

/** @deprecated Use ContactStore() instead */
const useContactStore = createContactStore;

export { ContactStoreVue as ContactStore, useContactStore };
export type { ContactStoreAPI };
