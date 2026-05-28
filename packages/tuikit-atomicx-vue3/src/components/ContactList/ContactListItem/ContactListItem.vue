<template>
  <component
    :is="getComponentByType(contactItem.type)"
    v-bind="getComponentProps()"
    @click="handleClick"
    @friend-application-action="handleFriendApplicationAction"
    @group-application-action="handleGroupApplicationAction"
  />
</template>

<script setup lang="ts">
import { ContactItemType } from '../../../types/contact';
import { BlacklistItem } from './BlacklistItem';
import { FriendApplicationItem } from './FriendApplicationItem';
import { FriendItem } from './FriendItem';
import { GroupApplicationItem } from './GroupApplicationItem';
import { GroupItem } from './GroupItem';
import type {
  ContactListItemProps,
  ContactItem as ContactItemData,
} from '../../../types';
import type {
  ContactInfo,
  FriendApplicationInfo,
  GroupApplicationInfo,
  GroupInfo,
} from '@atomicxcore/core';

const props = withDefaults(defineProps<ContactListItemProps>(), {});

const emit = defineEmits<{
  'click': [type: ContactItemType, item: ContactItemData];
  'friend-application-action': [action: 'accept' | 'refuse', application: FriendApplicationInfo];
  'group-application-action': [action: 'accept' | 'refuse', application: GroupApplicationInfo];
}>();

const getComponentByType = (type: ContactItemType) => {
  switch (type) {
    case ContactItemType.FRIEND:
      return FriendItem;
    case ContactItemType.GROUP:
      return GroupItem;
    case ContactItemType.BLACK:
      return BlacklistItem;
    case ContactItemType.FRIEND_REQUEST:
      return FriendApplicationItem;
    case ContactItemType.GROUP_REQUEST:
      return GroupApplicationItem;
    default:
      console.warn(`Unknown contact type: ${type}`);
      return 'div';
  }
};

/**
 * Determine whether the given data is the active contact item.
 * Uses ID comparison instead of reference comparison because the new stores
 * emit fresh object instances on every state update.
 */
const isActive = (): boolean => {
  const active = props.activeContactItem;
  const current = props.contactItem;
  if (!active || active.type !== current.type) {
    return false;
  }
  switch (current.type) {
    case ContactItemType.FRIEND:
    case ContactItemType.BLACK:
    case ContactItemType.SEARCH_USER:
      return current.data.userID === (active.data as ContactInfo).userID;
    case ContactItemType.GROUP:
    case ContactItemType.SEARCH_GROUP:
      return current.data.groupID === (active.data as GroupInfo).groupID;
    case ContactItemType.FRIEND_REQUEST:
      return current.data.userID === (active.data as FriendApplicationInfo).userID;
    case ContactItemType.GROUP_REQUEST: {
      const b = active.data as GroupApplicationInfo;
      return current.data.groupID === b.groupID && current.data.fromUser === b.fromUser;
    }
    default:
      return false;
  }
};

const getComponentProps = () => {
  const item = props.contactItem;
  const active = isActive();
  switch (item.type) {
    case ContactItemType.FRIEND:
      return { friend: item.data, isActive: active };
    case ContactItemType.GROUP:
      return { group: item.data, isActive: active };
    case ContactItemType.BLACK:
      return { profile: item.data, isActive: active };
    case ContactItemType.FRIEND_REQUEST:
      return { application: item.data, isActive: active };
    case ContactItemType.GROUP_REQUEST:
      return { application: item.data, isActive: active };
    default:
      return {};
  }
};

const handleClick = (item: ContactItemData) => {
  emit('click', props.contactItem.type, item);
};

const handleFriendApplicationAction = (
  action: 'accept' | 'refuse',
  application: FriendApplicationInfo,
) => {
  emit('friend-application-action', action, application);
};

const handleGroupApplicationAction = (
  action: 'accept' | 'refuse',
  application: GroupApplicationInfo,
) => {
  emit('group-application-action', action, application);
};
</script>
