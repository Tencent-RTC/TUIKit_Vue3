<template>
  <component
    :is="getComponentByType(contactItem.type)"
    v-bind="getComponentProps(contactItem.type)"
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
  Friend,
  GroupModel,
  FriendApplication,
  UserProfile,
  GroupApplication,
} from '../../../types';

const props = withDefaults(defineProps<ContactListItemProps>(), {});

const emit = defineEmits<{
  'click': [type: ContactItemType, item: any];
  'friend-application-action': [action: 'accept' | 'refuse', application: FriendApplication];
  'group-application-action': [action: 'accept' | 'refuse', application: GroupApplication];
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

const getComponentProps = (type: ContactItemType) => {
  const { type: activeType, data: activeItem } = props.activeContactItem || { type: null, data: null };

  switch (type) {
    case ContactItemType.FRIEND:
      return {
        friend: props.contactItem.data as Friend,
        isActive: activeType === ContactItemType.FRIEND && activeItem === props.contactItem.data,
      };
    case ContactItemType.GROUP:
      return {
        group: props.contactItem.data as GroupModel,
        isActive: activeType === ContactItemType.GROUP && activeItem === props.contactItem.data,
      };
    case ContactItemType.BLACK:
      return {
        profile: props.contactItem.data as UserProfile,
        isActive: activeType === ContactItemType.BLACK && activeItem === props.contactItem.data,
      };
    case ContactItemType.FRIEND_REQUEST:
      return {
        application: props.contactItem.data as FriendApplication,
        isActive: activeType === ContactItemType.FRIEND_REQUEST && activeItem === props.contactItem.data,
      };
    case ContactItemType.GROUP_REQUEST:
      return {
        application: props.contactItem.data as GroupApplication,
        isActive: activeType === ContactItemType.GROUP_REQUEST && activeItem === props.contactItem.data,
      };
    default:
      return {};
  }
};

const handleClick = (item: any) => {
  emit('click', props.contactItem.type, item);
};

const handleFriendApplicationAction = (action: 'accept' | 'refuse', application: FriendApplication) => {
  emit('friend-application-action', action, application);
};

const handleGroupApplicationAction = (action: 'accept' | 'refuse', application: GroupApplication) => {
  emit('group-application-action', action, application);
};
</script>
