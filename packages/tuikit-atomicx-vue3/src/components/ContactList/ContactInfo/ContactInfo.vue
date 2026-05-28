<template>
  <div v-if="contactInfo" class="contact-info">
    <header
      v-if="isH5"
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
      :key="`${contactInfo?.type}-${'groupID' in contactInfo.data ? contactInfo.data.groupID : 'userID' in contactInfo.data ? contactInfo.data.userID : ''}`"
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
  </div>
  <component v-else :is="PlaceholderEmpty" />
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { IconChevronLeft } from '@tencentcloud/uikit-base-component-vue3';
import { ContactStore, GroupStore } from '../../../chat-store';
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
import type {
  ContactInfo as ContactInfoType,
  FriendApplicationInfo as FriendApplicationInfoType,
  GroupApplicationInfo as GroupApplicationInfoType,
  GroupInfo as GroupInfoType,
} from '@atomicxcore/core';
import type {
  ContactInfoProps,
  ContactGroupItem,
} from '../../../types/contact';

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
  sendMessage: [data: ContactInfoType];
  deleteFriend: [data: ContactInfoType];
  addToBlacklist: [data: ContactInfoType];
  removeFromBlacklist: [data: ContactInfoType];
  updateFriendRemark: [data: ContactInfoType, remark: string];
  enterGroup: [data: GroupInfoType];
  leaveGroup: [data: GroupInfoType];
  dismissGroup: [data: GroupInfoType];
  friendApplicationAction: [action: 'accept' | 'refuse', application: FriendApplicationInfoType];
  groupApplicationAction: [action: 'accept' | 'refuse', application: GroupApplicationInfoType];
  addFriend: [data: ContactInfoType, wording: string];
  joinGroup: [data: GroupInfoType, note: string];
}>();

const { friendList, blackList, friendApplicationList } = ContactStore();
const { joinedGroupList } = GroupStore();

const { activeContact, setActiveContact, contactGroupTitles } = useContactList();

/**
 * Derived displayed contact panel, computed from `activeContact` and the
 * latest store snapshots.
 *
 * Why a pure computed instead of a ref + watchers that write back into
 * `activeContact`:
 *   - The previous design used three watchers that observed both the store
 *     lists and `activeContact`, and called `setActiveContact(...)` inside
 *     the handler to "keep the active entry in sync with the latest store
 *     object reference". Combined with the Store handing out fresh object
 *     references on every `_setState` call, this formed a runaway loop that
 *     tripped Vue's "Maximum recursive updates" guard on first click.
 *   - Deriving the panel data instead of mutating `activeContact` keeps the
 *     reactive graph strictly unidirectional: store + activeContact → panel.
 *     Store updates automatically refresh the panel; no writes back.
 *   - Special behaviors (SEARCH_USER → promote to FRIEND/BLACK, FRIEND whose
 *     id appears in blackList → show as BLACK, etc.) are all expressed here
 *     as transformations, not as side-effectful writes.
 */
const contactInfo = computed<ContactGroupItem | undefined>(() => {
  const source = activeContact.value;
  if (!source) {
    return undefined;
  }

  // SEARCH_USER: promote to FRIEND / BLACK / FRIEND_REQUEST if the user is already known.
  if (source.type === ContactItemType.SEARCH_USER) {
    const userID = source.data.userID;
    const black = blackList.value.find(u => u?.userID === userID);
    if (black) {
      return { type: ContactItemType.BLACK, data: black };
    }
    const friend = friendList.value.find(u => u?.userID === userID);
    if (friend) {
      return { type: ContactItemType.FRIEND, data: friend };
    }
    const application = friendApplicationList.value.find(item => item.userID === userID);
    if (application) {
      return { type: ContactItemType.FRIEND_REQUEST, data: application };
    }
    return { ...source };
  }

  // SEARCH_GROUP: promote to GROUP if the user has already joined.
  if (source.type === ContactItemType.SEARCH_GROUP) {
    const searchData = source.data;
    const groupID = searchData.groupID;
    const joined = joinedGroupList.value.find(g => g?.groupID === groupID);
    if (joined) {
      // Merge: prefer store data but fall back to search data for fields
      // that may be absent in the GROUP_LIST_UPDATED event payload.
      return {
        type: ContactItemType.GROUP,
        data: {
          ...searchData,
          ...joined,
          groupName: joined.groupName || searchData.groupName,
          avatarURL: joined.avatarURL || searchData.avatarURL,
        },
      };
    }
    return { ...source };
  }

  // FRIEND: auto-switch to BLACK, or clear when the user is no longer a friend.
  if (source.type === ContactItemType.FRIEND) {
    const userID = source.data.userID;
    const black = blackList.value.find(u => u?.userID === userID);
    if (black) {
      return { type: ContactItemType.BLACK, data: black };
    }
    const friend = friendList.value.find(u => u?.userID === userID);
    if (!friend) {
      return undefined;
    }
    return { type: ContactItemType.FRIEND, data: friend };
  }

  // BLACK: mirror the latest blacklist entry so unblacklisting transitions cleanly.
  if (source.type === ContactItemType.BLACK) {
    const userID = source.data.userID;
    const black = blackList.value.find(u => u?.userID === userID);
    if (!black) {
      // No longer in blacklist — see if it is now a friend instead.
      const friend = friendList.value.find(u => u?.userID === userID);
      if (friend) {
        return { type: ContactItemType.FRIEND, data: friend };
      }
      return undefined;
    }
    return { type: ContactItemType.BLACK, data: black };
  }

  // FRIEND_REQUEST: switch to friend when accepted; otherwise keep the old request for rejected/handled status.
  if (source.type === ContactItemType.FRIEND_REQUEST) {
    const userID = source.data.userID;
    const friend = friendList.value.find(item => item.userID === userID);
    if (friend) {
      return { type: ContactItemType.FRIEND, data: friend };
    }
    const application = friendApplicationList.value.find(item => item.userID === userID);
    return {
      type: ContactItemType.FRIEND_REQUEST,
      data: application ?? source.data,
    };
  }

  // GROUP: mirror the latest joined-group entry.
  if (source.type === ContactItemType.GROUP) {
    const groupID = source.data.groupID;
    const joined = joinedGroupList.value.find(g => g?.groupID === groupID);
    if (!joined) {
      return undefined;
    }
    return { type: ContactItemType.GROUP, data: joined };
  }

  // GROUP_REQUEST: render as-is.
  return { ...source };
});

watch(
  contactInfo,
  (newContactInfo) => {
    if (
      activeContact.value?.type === ContactItemType.SEARCH_USER
      && newContactInfo?.type === ContactItemType.FRIEND_REQUEST
    ) {
      // Persist this transition so later request updates start from the application state.
      setActiveContact(newContactInfo);
      return;
    }

    if (
      activeContact.value?.type === ContactItemType.FRIEND_REQUEST
      && newContactInfo?.type === ContactItemType.FRIEND
      && activeContact.value.data.userID === newContactInfo.data.userID
    ) {
      // Persist acceptance so deleting the new friend clears from FRIEND state.
      setActiveContact(newContactInfo);
    }
  },
);

watch(
  () => props.contactItem,
  (newContactItem, oldContactItem) => {
    if (newContactItem !== oldContactItem) {
      setActiveContact(newContactItem);
    }
  },
  { immediate: true },
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

  const baseProps = {
    channel: props.channel,
  };

  switch (type) {
    case ContactItemType.FRIEND:
      return { ...baseProps, friend: contactInfo.value.data };
    case ContactItemType.GROUP:
      return { ...baseProps, group: contactInfo.value.data };
    case ContactItemType.BLACK:
      return { ...baseProps, profile: contactInfo.value.data };
    case ContactItemType.FRIEND_REQUEST:
      return { ...baseProps, application: contactInfo.value.data };
    case ContactItemType.GROUP_REQUEST:
      return { ...baseProps, application: contactInfo.value.data };
    case ContactItemType.SEARCH_USER:
      return { ...baseProps, user: contactInfo.value.data };
    case ContactItemType.SEARCH_GROUP:
      return { ...baseProps, group: contactInfo.value.data };
    default:
      return {};
  }
};

const handleCloseContactInfo = () => {
  setActiveContact(undefined);
  emit('close');
};

const handleSendMessage = (data: ContactInfoType) => emit('sendMessage', data);
const handleDeleteFriend = (data: ContactInfoType) => emit('deleteFriend', data);
const handleAddToBlacklist = (data: ContactInfoType) => emit('addToBlacklist', data);
const handleRemoveFromBlacklist = (data: ContactInfoType) => emit('removeFromBlacklist', data);
const handleUpdateFriendRemark = (data: ContactInfoType, remark: string) =>
  emit('updateFriendRemark', data, remark);
const handleEnterGroup = (data: GroupInfoType) => emit('enterGroup', data);
const handleLeaveGroup = (data: GroupInfoType) => emit('leaveGroup', data);
const handleDismissGroup = (data: GroupInfoType) => emit('dismissGroup', data);
const handleFriendApplicationAction = (
  action: 'accept' | 'refuse',
  application: FriendApplicationInfoType,
) => emit('friendApplicationAction', action, application);
const handleGroupApplicationAction = (
  action: 'accept' | 'refuse',
  application: GroupApplicationInfoType,
) => emit('groupApplicationAction', action, application);
const handleAddFriend = (data: ContactInfoType, wording: string) => emit('addFriend', data, wording);
const handleJoinGroup = (data: GroupInfoType, note: string) => emit('joinGroup', data, note);
</script>

<style scoped lang="scss">
@use './ContactInfo.scss';
</style>
