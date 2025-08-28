<template>
  <div class="contact-list">
    <div class="contact-list__container">
      <div class="contact-list__main">
        <component
          :is="ContactSearch"
          v-if="enableSearch"
          :placeholder="searchPlaceholder"
          @result-click="(item: ContactGroupItem) => {
            handleContactClick(item.type, item.data);
          }"
        />
        <div class="contact-list__content">
          <template v-if="contactGroups.length > 0">
            <div
              v-for="group in contactGroups"
              :key="group.key"
              class="contact-list__group"
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
                  <div
                    v-if="group.unreadCount !== undefined && group.unreadCount > 0"
                    class="contact-list__unread-badge"
                  >
                    {{ group.unreadCount > UNREAD_COUNT_LIMIT ? '99+' : group.unreadCount }}
                  </div>
                </div>
              </div>
              <div
                v-if="group.isExpanded"
                class="contact-list__group-content"
              >
                <component
                  :is="ContactItem"
                  v-for="(contactItem, index) in group.items"
                  :key="`${group.type}_${getItemId(contactItem)}_${index}`"
                  :contact-item="{ type: group.type, data: contactItem }"
                  :active-contact-item="activeContact"
                  @click="handleContactClick"
                  @friend-application-action="handleFriendApplicationAction"
                  @group-application-action="handleGroupApplicationAction"
                />
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
import { computed, ref, watch } from 'vue';
import { IconArrowStrokeSelectDown, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useContactListState } from '../../states/ContactListState';
import { ContactItemType } from '../../types/contact';
import { UNREAD_COUNT_LIMIT } from './constants/const';
import { ContactListItem } from './ContactListItem';
import { ContactSearch } from './ContactSearch';
import { useContactList } from './hooks';
import type {
  ContactGroupItem,
  FriendApplication,
  GroupApplication,
  ContactListProps,
  ContactGroup,
  CustomGroupConfig,
  ContactItem,
} from '../../types/contact';

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
  'friend-application-action': [action: 'accept' | 'refuse', application: FriendApplication];
  'group-application-action': [action: 'accept' | 'refuse', application: GroupApplication];
}>();

const { t } = useUIKit();

const {
  friendList,
  groupList,
  blackList,
  friendApplicationList,
  groupApplicationList,
  friendApplicationUnreadCount,
  acceptFriendApplication,
  refuseFriendApplication,
  acceptGroupApplication,
  refuseGroupApplication,
  markFriendApplicationAsRead,
} = useContactListState();

const { activeContact, setActiveContact, setContactGroupTitles } = useContactList();

const defaultGroupTitles = computed<Partial<Record<ContactItemType, string>>>(() => {
  const groupTitle = {
    [ContactItemType.FRIEND_REQUEST]: t('TUIContact.New contacts'),
    [ContactItemType.GROUP_REQUEST]: t('TUIContact.Group applications'),
    [ContactItemType.FRIEND]: t('TUIContact.My friends'),
    [ContactItemType.GROUP]: t('TUIContact.My groups'),
    [ContactItemType.BLACK]: t('TUIContact.Blacklist'),
  };
  setContactGroupTitles(groupTitle);
  return groupTitle;
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
  }
  if (groupKey === ContactItemType.FRIEND_REQUEST && friendApplicationUnreadCount.value > 0) {
    markFriendApplicationAsRead();
  }
  expandedGroups.value = newExpanded;
};

const getItemId = (item: ContactItem): string => {
  if ('userID' in item) {
    return item.userID;
  }
  if ('groupID' in item) {
    return item.groupID;
  }
  return '';
};

const handleContactClick = (type: ContactItemType, item: ContactItem) => {
  const contactGroupItem: ContactGroupItem = { type, data: item };
  emit('contact-item-click', contactGroupItem);
  setActiveContact(contactGroupItem);
  if (props.onContactItemClick) {
    props.onContactItemClick(contactGroupItem);
  }
};

const handleFriendApplicationAction = async (
  action: 'accept' | 'refuse',
  application: FriendApplication,
) => {
  try {
    if (action === 'accept') {
      await acceptFriendApplication({
        userID: application.userID,
        type: application.type as any,
      });
    } else {
      await refuseFriendApplication(application.userID);
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
  application: GroupApplication,
) => {
  try {
    const params = {
      handleMessage: '',
      application,
    };

    if (action === 'accept') {
      await acceptGroupApplication(params);
    } else {
      await refuseGroupApplication(params);
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
      const newGroupTitles: Partial<Record<ContactItemType, string>> = defaultGroupTitles.value;
      (Object.keys(defaultGroupTitles) as ContactItemType[]).forEach((key) => {
        newGroupTitles[key] = newConfig[key]?.title || defaultGroupTitles.value[key] || '';
      });
      setContactGroupTitles(newGroupTitles);
    }
  },
);

const contactGroups = computed<ContactGroup[]>(() => {
  const groupConfigs = [
    {
      type: ContactItemType.FRIEND_REQUEST,
      title: defaultGroupTitles.value[ContactItemType.FRIEND_REQUEST],
      items: friendApplicationList.value,
      unreadCount: friendApplicationUnreadCount.value,
      order: 1,
    },
    {
      type: ContactItemType.GROUP_REQUEST,
      title: defaultGroupTitles.value[ContactItemType.GROUP_REQUEST],
      items: groupApplicationList.value,
      order: 2,
    },
    {
      type: ContactItemType.FRIEND,
      title: defaultGroupTitles.value[ContactItemType.FRIEND],
      items: friendList.value,
      order: 3,
    },
    {
      type: ContactItemType.GROUP,
      title: defaultGroupTitles.value[ContactItemType.GROUP],
      items: groupList.value,
      order: 4,
    },
    {
      type: ContactItemType.BLACK,
      title: defaultGroupTitles.value[ContactItemType.BLACK],
      items: blackList.value,
      order: 5,
    },
  ];

  const customGroupConfig = props.groupConfig as Partial<Record<ContactItemType, CustomGroupConfig>>;

  const groups = groupConfigs
    .filter(config => !customGroupConfig?.[config.type]?.hidden)
    .map(config => ({
      key: config.type,
      type: config.type,
      title: customGroupConfig?.[config.type]?.title ?? config.title ?? '',
      items: config.items,
      ...(config.unreadCount !== undefined && { unreadCount: config.unreadCount }),
      isExpanded: expandedGroups.value.has(config.type),
      order: customGroupConfig?.[config.type]?.order ?? config.order,
    }))
    .sort((a, b) => a.order - b.order);

  return groups;
});

const searchPlaceholder = computed(() => props.searchPlaceholder || t('TUIContact.Search contacts'));
const emptyText = computed(() => props.emptyText || t('TUIContact.No contacts'));
</script>

<style scoped lang="scss">
@import './ContactList.scss';
</style>
