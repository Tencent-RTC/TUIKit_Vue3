<template>
  <div class="contact-info">
    <header
      v-if="isH5 && contactInfo"
      class="contact-info__header"
    >
      <IconChevronLeft
        size="24px"
        @click="handleCloseContactInfo"
      />
      <h1 class="contact-info__title">
        {{ contactGroupTitles[contactInfo?.type] }}
      </h1>
    </header>
    <component
      :is="getComponentByType(contactInfo?.type)"
      v-if="contactInfo"
      v-bind="getComponentProps(contactInfo.type)"
      :show-actions="showActions"
      @close="handleCloseContactInfo"
      @send-message="handleSendMessage"
      @delete-friend="handleDeleteFriend"
      @add-to-blacklist="handleAddToBlacklist"
      @remove-from-blacklist="handleRemoveFromBlacklist"
      @update-friend-remark="handleUpdateFriendRemark"
      @enter-group="handleEnterGroup"
      @leave-group="handleLeaveGroup"
      @dismiss-group="handleDismissGroup"
      @friend-application-action="handleFriendApplicationAction"
      @group-application-action="handleGroupApplicationAction"
      @add-friend="handleAddFriend"
      @join-group="handleJoinGroup"
    />
    <div
      v-else-if="PlaceholderEmpty"
      class="contact-info__empty"
    >
      <component :is="PlaceholderEmpty" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch, ref } from 'vue';
import { IconChevronLeft } from '@tencentcloud/uikit-base-component-vue3';
import { useContactListState } from '../../../states/ContactListState';
import { ContactItemType } from '../../../types/contact';
import { isH5 } from '../../../utils/env';
import { useContactList } from '../hooks';
import { BlacklistInfo } from './BlacklistInfo';
import { FriendApplicationInfo } from './FriendApplicationInfo';
import { FriendInfo } from './FriendInfo';
import { GroupApplicationInfo } from './GroupApplicationInfo';
import { GroupInfo } from './GroupInfo';
import { SearchGroupInfo } from './SearchGroupInfo';
import { SearchUserInfo } from './SearchUserInfo';
import type { Friend, GroupModel, UserProfile } from '../../../types';
import type { ContactInfoProps, ContactGroupItem, FriendApplication, GroupApplication } from '../../../types/contact';

const props = withDefaults(defineProps<ContactInfoProps>(), {
  showActions: true,
  PlaceholderEmpty: undefined,
  FriendInfoComponent: undefined,
  GroupInfoComponent: undefined,
  BlacklistInfoComponent: undefined,
  FriendApplicationInfoComponent: undefined,
  GroupApplicationInfoComponent: undefined,
  SearchGroupInfoComponent: undefined,
  SearchUserInfoComponent: undefined,
});

const emit = defineEmits<{
  close: [];
  sendMessage: [data: Friend];
  deleteFriend: [data: Friend];
  addToBlacklist: [data: Friend];
  removeFromBlacklist: [data: UserProfile];
  updateFriendRemark: [data: Friend, remark: string];
  enterGroup: [data: GroupModel];
  leaveGroup: [data: GroupModel];
  dismissGroup: [data: GroupModel];
  friendApplicationAction: [action: 'accept' | 'refuse', application: FriendApplication];
  groupApplicationAction: [action: 'accept' | 'refuse', application: GroupApplication];
  addFriend: [data: UserProfile, wording: string];
  joinGroup: [data: GroupModel, note: string];
}>();

const { friendList, groupList, blackList } = useContactListState();
const { activeContact, setActiveContact, contactGroupTitles } = useContactList();

const contactInfo = ref<ContactGroupItem | undefined>(undefined);

const handleContactInfo = (contactGroupItem?: ContactGroupItem) => {
  const newContactInfo = contactGroupItem ? { ...contactGroupItem } : undefined;

  if (contactGroupItem?.type === ContactItemType.SEARCH_USER) {
    const blackUser = blackList.value.find(
      userInfo => userInfo.userID === (contactGroupItem?.data as UserProfile).userID,
    );
    const friend = friendList.value.find(
      userInfo => userInfo.userID === (contactGroupItem?.data as UserProfile).userID,
    );

    if (blackUser && newContactInfo) {
      newContactInfo.type = ContactItemType.BLACK;
      newContactInfo.data = blackUser;
    } else if (friend && newContactInfo) {
      newContactInfo.type = ContactItemType.FRIEND;
      newContactInfo.data = friend;
    }
  } else if (contactGroupItem?.type === ContactItemType.SEARCH_GROUP) {
    const group = groupList.value.find(
      g => g.groupID === (contactGroupItem?.data as GroupModel).groupID,
    );
    if (group && newContactInfo) {
      newContactInfo.type = ContactItemType.GROUP;
      newContactInfo.data = group;
    }
  } else if (contactGroupItem?.type === ContactItemType.FRIEND) {
    const blackUser = blackList.value.find(
      userInfo => userInfo.userID === (contactGroupItem?.data as Friend).userID,
    );
    if (blackUser && newContactInfo) {
      newContactInfo.type = ContactItemType.BLACK;
      newContactInfo.data = blackUser;
    }
  }

  contactInfo.value = newContactInfo;
};

watch(
  () => props.contactItem,
  (newContactItem, oldContactItem) => {
    if (newContactItem !== oldContactItem) {
      setActiveContact(newContactItem);
    }
  },
  { immediate: true },
);

watch(
  () => activeContact.value,
  (newActiveContact) => {
    handleContactInfo(newActiveContact || undefined);
  },
  { immediate: true },
);

watch(
  (): [GroupModel[], ContactGroupItem | undefined] => [groupList.value, activeContact.value],
  ([newGroupList, newActiveContact]) => {
    if (newGroupList.length > 0 && newActiveContact && newActiveContact.type === ContactItemType.GROUP) {
      const group = newGroupList.find(
        g => g?.groupID === (newActiveContact?.data as GroupModel)?.groupID,
      );
      if (group) {
        if (newActiveContact?.data !== group) {
          setActiveContact({
            type: ContactItemType.GROUP,
            data: group,
          });
        }
      } else {
        setActiveContact(undefined);
      }
    }
  },
);

watch(
  (): [UserProfile[], Friend[], ContactGroupItem | undefined] => [blackList.value, friendList.value, activeContact.value],
  ([newBlackList, newFriendList, newActiveContact]) => {
    if (newActiveContact) {
      const blackUser = newBlackList?.find(
        userInfo => userInfo?.userID === (newActiveContact?.data as UserProfile)?.userID,
      );
      const user = newFriendList?.find(
        userInfo => userInfo?.userID === (newActiveContact?.data as UserProfile)?.userID,
      );

      if (blackUser && newActiveContact.type !== ContactItemType.BLACK) {
        setActiveContact({
          type: ContactItemType.BLACK,
          data: blackUser,
        });
      } else if (user && newActiveContact.type === ContactItemType.FRIEND && newActiveContact.data !== user) {
        setActiveContact({
          type: ContactItemType.FRIEND,
          data: user,
        });
      }
    }
  },
);

const getComponentByType = (type?: ContactItemType) => {
  switch (type) {
    case ContactItemType.FRIEND:
      return props.FriendInfoComponent || FriendInfo;
    case ContactItemType.GROUP:
      return props.GroupInfoComponent || GroupInfo;
    case ContactItemType.BLACK:
      return props.BlacklistInfoComponent || BlacklistInfo;
    case ContactItemType.FRIEND_REQUEST:
      return props.FriendApplicationInfoComponent || FriendApplicationInfo;
    case ContactItemType.GROUP_REQUEST:
      return props.GroupApplicationInfoComponent || GroupApplicationInfo;
    case ContactItemType.SEARCH_USER:
      return props.SearchUserInfoComponent || SearchUserInfo;
    case ContactItemType.SEARCH_GROUP:
      return props.SearchGroupInfoComponent || SearchGroupInfo;
    default:
      return 'div';
  }
};

const getComponentProps = (type?: ContactItemType) => {
  if (!contactInfo.value) {
    return {};
  }

  switch (type) {
    case ContactItemType.FRIEND:
      return { friend: contactInfo.value.data };
    case ContactItemType.GROUP:
      return { group: contactInfo.value.data };
    case ContactItemType.BLACK:
      return { profile: contactInfo.value.data };
    case ContactItemType.FRIEND_REQUEST:
      return { application: contactInfo.value.data };
    case ContactItemType.GROUP_REQUEST:
      return { application: contactInfo.value.data };
    case ContactItemType.SEARCH_USER:
      return { user: contactInfo.value.data };
    case ContactItemType.SEARCH_GROUP:
      return { group: contactInfo.value.data };
    default:
      return {};
  }
};

const handleCloseContactInfo = () => {
  setActiveContact(undefined);
  emit('close');
};

const handleSendMessage = (data: Friend) => emit('sendMessage', data);
const handleDeleteFriend = (data: Friend) => emit('deleteFriend', data);
const handleAddToBlacklist = (data: Friend) => emit('addToBlacklist', data);
const handleRemoveFromBlacklist = (data: UserProfile) => emit('removeFromBlacklist', data);
const handleUpdateFriendRemark = (data: Friend, remark: string) => emit('updateFriendRemark', data, remark);
const handleEnterGroup = (data: GroupModel) => emit('enterGroup', data);
const handleLeaveGroup = (data: GroupModel) => emit('leaveGroup', data);
const handleDismissGroup = (data: GroupModel) => emit('dismissGroup', data);
const handleFriendApplicationAction = (action: 'accept' | 'refuse', application: FriendApplication) => emit('friendApplicationAction', action, application);
const handleGroupApplicationAction = (action: 'accept' | 'refuse', application: GroupApplication) => emit('groupApplicationAction', action, application);
const handleAddFriend = (data: UserProfile, wording: string) => emit('addFriend', data, wording);
const handleJoinGroup = (data: GroupModel, note: string) => emit('joinGroup', data, note);
</script>

<style scoped lang="scss">
@import './ContactInfo.scss';
</style>
