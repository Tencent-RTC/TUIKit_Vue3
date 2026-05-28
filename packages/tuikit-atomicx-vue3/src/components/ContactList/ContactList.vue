<template>
  <div class="contact-list">
    <div class="contact-list__container">
      <div class="contact-list__main">
        <component
          :is="ContactSearch"
          v-if="enableSearch"
          :placeholder="searchPlaceholder"
          @result-click="handleSearchResultClick"
        />
        <div class="contact-list__content">
          <template v-if="contactGroups.length > 0">
            <div
              v-for="group in contactGroups"
              :key="group.key"
            >
              <component
                :is="GroupHeader"
                v-if="GroupHeader"
                :data="group"
                @click="toggleGroupExpanded(group.key)"
              />
              <div
                v-else
                class="contact-list__group-header"
                role="button"
                tabindex="0"
                @click="toggleGroupExpanded(group.key)"
                @keydown.enter="toggleGroupExpanded(group.key)"
                @keydown.space="toggleGroupExpanded(group.key)"
              >
                <div class="contact-list__group-title">
                  <IconArrowStrokeSelectDown
                    :class="[
                      'contact-list__group-icon',
                      group.isExpanded && 'contact-list__group-icon--expanded']"
                  />
                  <span class="contact-list__group-name">{{ group.title }}</span>
                </div>
                <div
                  v-if="group.showTotalCount"
                  class="contact-list__group-count"
                >
                  {{ group.count ?? 0 }}
                </div>
                <div
                  v-else-if="group.unreadCount !== undefined && group.unreadCount > 0"
                  class="contact-list__unread-badge"
                >
                  {{ group.unreadCount > UNREAD_COUNT_LIMIT ? '99+' : group.unreadCount }}
                </div>
              </div>
              <div
                v-if="group.isExpanded"
                class="contact-list__group-content"
              >
                <template
                  v-if="group.type === ContactItemType.FRIEND && group.sections?.length"
                >
                  <section
                    v-for="section in group.sections"
                    :key="section.key"
                    class="contact-list__section"
                  >
                    <div class="contact-list__section-header">
                      <span class="contact-list__section-title">{{ section.title }}</span>
                      <span class="contact-list__section-count">({{ section.count }})</span>
                    </div>
                    <component
                      :is="ContactItem"
                      v-for="(friend, index) in section.items"
                      :key="getContactItemKey(ContactItemType.FRIEND, friend, index)"
                      :contact-item="{ type: ContactItemType.FRIEND, data: friend }"
                      :active-contact-item="activeContact"
                      @click="handleContactClick"
                      @friend-application-action="handleFriendApplicationAction"
                      @group-application-action="handleGroupApplicationAction"
                    />
                  </section>
                </template>
                <template v-else>
                  <component
                    :is="ContactItem"
                    v-for="(contactItem, index) in group.items"
                    :key="getContactItemKey(group.type, contactItem, index)"
                    :contact-item="{ type: group.type, data: contactItem }"
                    :active-contact-item="activeContact"
                    @click="handleContactClick"
                    @friend-application-action="handleFriendApplicationAction"
                    @group-application-action="handleGroupApplicationAction"
                  />
                </template>
              </div>
            </div>
          </template>
          <template v-else>
            <component
              :is="PlaceholderEmptyList"
              v-if="PlaceholderEmptyList"
            />
            <div
              v-else
              class="contact-list__empty"
            >
              <div class="contact-list__empty-text">
                {{ emptyText }}
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, watchEffect } from 'vue';
import { ContactOnlineStatus } from '@atomicxcore/core';
import { useContactStore, useGroupStore, useLoginStore } from '../../chat-store';
import { IconArrowStrokeSelectDown, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { ContactItemType } from '../../types/contact';
import { UNREAD_COUNT_LIMIT } from './constants/const';
import { ContactListItem } from './ContactListItem';
import { ContactSearch } from './ContactSearch';
import { useContactList } from './hooks';
import { buildFriendSections } from './utils/buildFriendSections';
import type {
  ContactGroupItem,
  ContactItem,
  ContactListProps,
  ContactGroup,
  CustomGroupConfig,
} from '../../types/contact';
import type {
  ContactInfo,
  FriendApplicationInfo,
  GroupApplicationInfo,
  GroupInfo,
  GroupType,
} from '@atomicxcore/core';

const props = withDefaults(defineProps<ContactListProps>(), {
  enableSearch: true,
  searchPlaceholder: undefined,
  emptyText: undefined,
  ContactItem: () => ContactListItem,
  ContactSearchComponent: () => ContactSearch,
  GroupHeader: undefined,
  PlaceholderEmptyList: () => undefined,
});

const emit = defineEmits<{
  'contact-item-click': [item: ContactGroupItem];
  'friend-application-action': [action: 'accept' | 'refuse', application: FriendApplicationInfo];
  'group-application-action': [action: 'accept' | 'refuse', application: GroupApplicationInfo];
}>();

const { t } = useUIKit();

const {
  friendList,
  blackList,
  friendApplicationList,
  friendApplicationUnreadCount,
  loadFriends,
  loadBlackList,
  loadFriendApplications,
  acceptFriendApplication,
  refuseFriendApplication,
  clearFriendApplicationUnreadCount,
} = useContactStore();

const {
  joinedGroupList,
  applicationList: groupApplicationList,
  unreadApplicationCount: groupApplicationUnreadCount,
  loadJoinedGroups,
  loadApplications,
  acceptApplication,
  refuseApplication,
  clearApplicationUnreadCount,
} = useGroupStore();

const { loginStatus } = useLoginStore();

// Trigger data loading once login completes.
// Store instances are singletons, so provide/inject is unnecessary — any
// consumer that calls useContactStore / useGroupStore reads the same data.
watch(loginStatus, (status) => {
  if (status === 'logined') {
    loadFriends().catch(err => console.error('[ContactList loadFriends]', err));
    loadBlackList().catch(err => console.error('[ContactList loadBlackList]', err));
    loadFriendApplications().catch(err => console.error('[ContactList loadFriendApplications]', err));
    loadJoinedGroups().catch(err => console.error('[ContactList loadJoinedGroups]', err));
    loadApplications().catch(err => console.error('[ContactList loadApplications]', err));
  }
}, { immediate: true });

const { activeContact, setActiveContact, setContactGroupTitles } = useContactList();

/**
 * Pure computed: no side effects inside the getter. Previously this computed
 * used to also write into the shared `contactGroupTitles` ref from within its
 * getter — that pattern is a reactivity hazard (Vue treats side-effectful
 * getters as "scheduling a new effect during another effect", and in practice
 * it triggered "Maximum recursive updates exceeded" when combined with the
 * nested watchers below).
 *
 * Side effects are now moved to the dedicated watchEffect right after so the
 * reactive graph stays strictly unidirectional: i18n → titles → UI.
 */
const defaultGroupTitles = computed<Partial<Record<ContactItemType, string>>>(() => ({
  [ContactItemType.FRIEND_REQUEST]: t('TUIContact.New contacts'),
  [ContactItemType.GROUP_REQUEST]: t('TUIContact.Group applications'),
  [ContactItemType.FRIEND]: t('TUIContact.My friends'),
  [ContactItemType.GROUP]: t('TUIContact.My groups'),
  [ContactItemType.BLACK]: t('TUIContact.Blacklist'),
}));

// Sync default titles to the shared `useContactList().contactGroupTitles` ref.
// Runs when i18n-driven titles change; merges with `props.groupConfig` overrides.
watchEffect(() => {
  const defaults = defaultGroupTitles.value;
  const override = props.groupConfig as Partial<Record<ContactItemType, CustomGroupConfig>> | undefined;
  const merged: Partial<Record<ContactItemType, string>> = { ...defaults };
  if (override) {
    (Object.keys(defaults) as ContactItemType[]).forEach((key) => {
      merged[key] = override[key]?.title || defaults[key] || '';
    });
  }
  setContactGroupTitles(merged);
});

watch(
  () => props.activeContactItem,
  (newVal) => {
    if (newVal) {
      setActiveContact(newVal);
    }
  },
  { immediate: true },
);

const expandedGroups = ref<Set<string>>(new Set());

const toggleGroupExpanded = (groupKey: string) => {
  const newExpanded = new Set(expandedGroups.value);
  if (newExpanded.has(groupKey)) {
    newExpanded.delete(groupKey);
  } else {
    newExpanded.add(groupKey);
    // Clear unread count when expanding
    if (groupKey === ContactItemType.FRIEND_REQUEST && friendApplicationUnreadCount.value > 0) {
      clearFriendApplicationUnreadCount().catch(err =>
        console.error('[ContactList clearFriendApplicationUnreadCount]', err),
      );
    }
    if (groupKey === ContactItemType.GROUP_REQUEST && groupApplicationUnreadCount.value > 0) {
      clearApplicationUnreadCount();
    }
  }
  expandedGroups.value = newExpanded;
};

const getItemId = (item: ContactItem): string => {
  if ('userID' in item && item.userID) {
    return item.userID;
  }
  if ('groupID' in item && item.groupID) {
    return item.groupID;
  }
  if ('fromUser' in item && (item as GroupApplicationInfo).fromUser) {
    return (item as GroupApplicationInfo).fromUser as string;
  }
  return '';
};

const getContactItemKey = (
  type: ContactItemType,
  item: ContactItem,
  index: number,
): string => `${type}_${getItemId(item)}_${index}`;

const handleContactClick = (type: ContactItemType, item: ContactItem) => {
  const contactGroupItem = { type, data: item } as ContactGroupItem;
  emit('contact-item-click', contactGroupItem);
  setActiveContact(contactGroupItem);
  if (props.onContactItemClick) {
    props.onContactItemClick(contactGroupItem);
  }
};

/**
 * Boundary adapter for `ContactSearch`.
 *
 * `ContactSearch` is not migrated in M3 and still emits legacy engine-lite
 * payloads — `UserProfile` with `nick`/`avatar`/`selfSignature`, and
 * `GroupModel` with `name`/`avatar`/`type`. This handler normalizes the
 * payload into the unified `ContactInfo` / `GroupInfo` shape at the boundary
 * so that the entire ContactList subtree only ever sees new types.
 *
 * Whenever possible, we prefer the store's own entry (for friends / groups
 * already joined, etc.) over the raw search payload so the UI can immediately
 * show the richer data the store holds. Strangers are represented by a
 * minimal `ContactInfo` / `GroupInfo` constructed from the search payload.
 *
 * This boundary disappears in M7 when Search/ContactSearch is migrated.
 */
const handleSearchResultClick = (item: ContactGroupItem) => {
  const legacyData = item.data as Record<string, any>;

  if (item.type === ContactItemType.SEARCH_USER) {
    const { userID } = legacyData as { userID: string };
    // Prefer the latest store entry if it exists.
    const fromStore = friendList.value.find(u => u.userID === userID)
      ?? blackList.value.find(u => u.userID === userID);
    const normalized: ContactInfo = fromStore ?? {
      userID,
      nickname: legacyData.nickname ?? legacyData.nick ?? '',
      avatarURL: legacyData.avatarURL ?? legacyData.avatar ?? '',
      aboutMe: legacyData.aboutMe ?? legacyData.selfSignature ?? '',
      friendRemark: '',
      onlineStatus: ContactOnlineStatus.Unknown,
      isInBlacklist: false,
      isFriend: false,
    };
    handleContactClick(ContactItemType.SEARCH_USER, normalized);
    return;
  }

  if (item.type === ContactItemType.SEARCH_GROUP) {
    const { groupID } = legacyData as { groupID: string };
    const fromStore = joinedGroupList.value.find(g => g.groupID === groupID);
    const normalized: GroupInfo = fromStore ?? {
      groupID,
      groupName: legacyData.groupName ?? legacyData.name ?? '',
      avatarURL: legacyData.groupAvatarURL ?? legacyData.avatarURL ?? legacyData.avatar ?? '',
      groupType: legacyData.groupType ?? (legacyData.type as GroupType),
      memberCount: legacyData.memberCount,
    };
    handleContactClick(ContactItemType.SEARCH_GROUP, normalized);
    return;
  }

  // Other types (FRIEND / GROUP / BLACK / …) can be forwarded as-is if the
  // search layer ever emits them.
  handleContactClick(item.type, item.data);
};

const handleFriendApplicationAction = async (
  action: 'accept' | 'refuse',
  application: FriendApplicationInfo,
) => {
  try {
    if (action === 'accept') {
      await acceptFriendApplication(application);
    } else {
      await refuseFriendApplication(application);
    }
    emit('friend-application-action', action, application);
    if (props.onFriendApplicationAction) {
      props.onFriendApplicationAction(action, application);
    }
  } catch (error) {
    console.error(`[ContactList handleFriendApplicationAction] Failed to ${action} friend application:`, error);
  }
};

const handleGroupApplicationAction = async (
  action: 'accept' | 'refuse',
  application: GroupApplicationInfo,
) => {
  try {
    if (action === 'accept') {
      await acceptApplication(application);
    } else {
      await refuseApplication(application);
    }
    emit('group-application-action', action, application);
    if (props.onGroupApplicationAction) {
      props.onGroupApplicationAction(action, application);
    }
  } catch (error) {
    console.error(`[ContactList handleGroupApplicationAction] Failed to ${action} group application:`, error);
  }
};

watch(
  () => props.groupConfig,
  (newConfig) => {
    if (newConfig) {
      // Titles merging is handled by the watchEffect above; nothing extra to do.
      // The watch is kept only as an extension point.
    }
  },
);

const contactGroups = computed<ContactGroup[]>(() => {
  const friends = friendList.value as ContactInfo[];
  const groups = joinedGroupList.value as GroupInfo[];
  const blackUsers = blackList.value as ContactInfo[];
  const friendRequests = friendApplicationList.value as FriendApplicationInfo[];
  const groupRequests = groupApplicationList.value as GroupApplicationInfo[];

  const friendSections = buildFriendSections(friends);

  const groupConfigs = [
    {
      type: ContactItemType.FRIEND_REQUEST,
      title: defaultGroupTitles.value[ContactItemType.FRIEND_REQUEST],
      items: friendRequests,
      unreadCount: friendApplicationUnreadCount.value,
      showTotalCount: false,
      order: 1,
    },
    {
      type: ContactItemType.GROUP_REQUEST,
      title: defaultGroupTitles.value[ContactItemType.GROUP_REQUEST],
      items: groupRequests,
      unreadCount: groupApplicationUnreadCount.value,
      showTotalCount: false,
      order: 2,
    },
    {
      type: ContactItemType.FRIEND,
      title: defaultGroupTitles.value[ContactItemType.FRIEND],
      items: friends,
      count: friends.length,
      sections: friendSections,
      showTotalCount: true,
      order: 3,
    },
    {
      type: ContactItemType.GROUP,
      title: defaultGroupTitles.value[ContactItemType.GROUP],
      items: groups,
      count: groups.length,
      showTotalCount: true,
      order: 4,
    },
    {
      type: ContactItemType.BLACK,
      title: defaultGroupTitles.value[ContactItemType.BLACK],
      items: blackUsers,
      count: blackUsers.length,
      showTotalCount: true,
      order: 5,
    },
  ];

  const customGroupConfig = props.groupConfig as Partial<Record<ContactItemType, CustomGroupConfig>>;

  return groupConfigs
    .filter(config => !customGroupConfig?.[config.type]?.hidden)
    .map(config => ({
      key: config.type,
      type: config.type,
      title: customGroupConfig?.[config.type]?.title ?? config.title ?? '',
      items: config.items as ContactItem[],
      ...(config.count !== undefined && { count: config.count }),
      ...(config.sections !== undefined && { sections: config.sections }),
      ...(config.unreadCount !== undefined && { unreadCount: config.unreadCount }),
      ...(config.showTotalCount !== undefined && { showTotalCount: config.showTotalCount }),
      isExpanded: expandedGroups.value.has(config.type),
      order: customGroupConfig?.[config.type]?.order ?? config.order,
    }))
    .sort((a, b) => a.order - b.order);
});

const searchPlaceholder = computed(() => props.searchPlaceholder || t('TUIContact.Search contacts'));
const emptyText = computed(() => props.emptyText || t('TUIContact.No contacts'));
</script>

<style scoped lang="scss">
@use './ContactList.scss';
</style>
