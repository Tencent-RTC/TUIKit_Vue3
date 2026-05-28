import { Component } from 'vue';
import type {
  ContactInfo,
  FriendApplicationInfo,
  GroupApplicationInfo,
  GroupInfo,
} from '@atomicxcore/core';
import type TUIChatEngine from '@tencentcloud/chat-uikit-engine-lite';

/**
 * Runtime contact item carried by ContactList / ContactInfo.
 *
 * M3 aligns ContactList components with `@atomicxcore/core` types:
 *   - Friend / Blacklist user  → ContactInfo
 *   - Group                    → GroupInfo
 *   - Friend application       → FriendApplicationInfo
 *   - Group application        → GroupApplicationInfo
 *
 * Legacy engine-lite types (`Friend`, `UserProfile`, `GroupApplication`,
 * `FriendApplication`, `GroupModel`) are kept in this file for modules that
 * have not been migrated yet (Search, ChatSetting, demos). They will be
 * removed in M7.
 */
export type ContactItem =
  | ContactInfo
  | GroupInfo
  | FriendApplicationInfo
  | GroupApplicationInfo;

export enum ContactItemType {
  FRIEND = 'friend',
  BLACK = 'black',
  GROUP = 'group',
  FRIEND_REQUEST = 'friendRequest',
  GROUP_REQUEST = 'groupRequest',
  SEARCH_USER = 'searchUser',
  SEARCH_GROUP = 'searchGroup',
}

/**
 * Discriminated union — use `item.type` to narrow `item.data` automatically.
 */
export type ContactGroupItem =
  | { type: ContactItemType.FRIEND; data: ContactInfo }
  | { type: ContactItemType.BLACK; data: ContactInfo }
  | { type: ContactItemType.GROUP; data: GroupInfo }
  | { type: ContactItemType.SEARCH_GROUP; data: GroupInfo }
  | { type: ContactItemType.SEARCH_USER; data: ContactInfo }
  | { type: ContactItemType.FRIEND_REQUEST; data: FriendApplicationInfo }
  | { type: ContactItemType.GROUP_REQUEST; data: GroupApplicationInfo };

export enum DeleteFriendType {
  SINGLE = 'Delete_Type_Single',
  BOTH = 'Delete_Type_Both',
}

export enum GroupApplicationType {
  USER_JOIN_REQUEST = 0,
  INVITE_MEMBER_REQUEST = 2,
}

export interface UserProfile {
  userID: string;
  nick: string;
  gender: typeof TUIChatEngine.TYPES.GENDER_UNKNOWN
    | typeof TUIChatEngine.TYPES.GENDER_FEMALE
    | typeof TUIChatEngine.TYPES.GENDER_MALE;
  birthday: number;
  location: string;
  selfSignature: string;
  allowType: typeof TUIChatEngine.TYPES.ALLOW_TYPE_ALLOW_ANY

    | typeof TUIChatEngine.TYPES.ALLOW_TYPE_NEED_CONFIRM
    | typeof TUIChatEngine.TYPES.ALLOW_TYPE_DENY_ANY;
  avatar: string;
  adminForbidType: typeof TUIChatEngine.TYPES.FORBID_TYPE_NONE
    | typeof TUIChatEngine.TYPES.FORBID_TYPE_SEND_OUT;
}

export interface Friend extends UserProfile {
  remark: string;
}

export interface FriendApplication {
  userID: string;
  avatar: string;
  nick: string;
  time: number;
  source: string;
  wording: string;
  type: typeof TUIChatEngine.TYPES.SNS_APPLICATION_SENT_TO_ME
    | typeof TUIChatEngine.TYPES.SNS_APPLICATION_SENT_BY_ME;
}

export interface FriendGroup {
  name: string;
  friendList: Friend[];
  count: number;
}

export interface Group {
  groupID: string;
  name: string;
  avatar: string;
  type: typeof TUIChatEngine.TYPES.GRP_WORK
    | typeof TUIChatEngine.TYPES.GRP_PUBLIC
    | typeof TUIChatEngine.TYPES.GRP_MEETING
    | typeof TUIChatEngine.TYPES.GRP_AVCHATROOM
    | typeof TUIChatEngine.TYPES.GRP_COMMUNITY;
  introduction: string;
  notification: string;
  ownerID: string;
  selfInfo: {
    userID: string;
    role: typeof TUIChatEngine.TYPES.GRP_MBR_ROLE_OWNER
      | typeof TUIChatEngine.TYPES.GRP_MBR_ROLE_ADMIN
      | typeof TUIChatEngine.TYPES.GRP_MBR_ROLE_MEMBER;
    nameCard: string;
    joinTime: number;
  };
  memberCount: number;
  maxMemberCount: number;
  muteAllMembers: boolean;
  joinOption: typeof TUIChatEngine.TYPES.JOIN_OPTIONS_FREE_ACCESS
    | typeof TUIChatEngine.TYPES.JOIN_OPTIONS_NEED_PERMISSION
    | typeof TUIChatEngine.TYPES.JOIN_OPTIONS_DISABLE_APPLY;
}

export interface GroupApplication {
  applicant: string;
  applicantNick: string;
  groupID: string;
  groupName: string;
  applicationType: GroupApplicationType;
  userID: string;
  note: string;
}

export interface GroupApplicationParams {
  application: GroupApplication;
  handleMessage?: string;
}

export interface AddFriendParams {
  userID: string;
  addSource: string;
  remark?: string;
  groupName?: string;
  wording?: string;
  type?: typeof TUIChatEngine.TYPES.SNS_ADD_TYPE_SINGLE
    | typeof TUIChatEngine.TYPES.SNS_ADD_TYPE_BOTH;
}

export interface FriendApplicationParams {
  userID: string;
  remark?: string;
  type: typeof TUIChatEngine.TYPES.SNS_APPLICATION_AGREE
    | typeof TUIChatEngine.TYPES.SNS_APPLICATION_AGREE_AND_ADD;
}

export interface DeleteFriendParams {
  userIDList: string[];
  type?: typeof TUIChatEngine.TYPES.SNS_DELETE_TYPE_SINGLE
    | typeof TUIChatEngine.TYPES.SNS_DELETE_TYPE_BOTH;
}

export interface FriendRemarkParams {
  userID: string;
  remark: string;
}

export interface FriendGroupParams {
  name: string;
  userIDList: string[];
}

export interface RenameFriendGroupParams {
  oldName: string;
  newName: string;
}

export interface JoinGroupParams {
  groupID: string;
  applyMessage?: string;
}

export interface ContactLetterSection {
  key: string;
  title: string;
  count: number;
  items: ContactInfo[];
}

export interface ContactGroup {
  key: string;
  type: ContactItemType;
  title: string;
  items: ContactItem[];
  unreadCount?: number;
  count?: number;
  sections?: ContactLetterSection[];
  showTotalCount?: boolean;
  isExpanded: boolean;
}

export interface CustomGroupConfig {
  title?: string;
  hidden?: boolean;
  order?: number;
}

export interface ContactGroupHeaderProps {
  data: ContactGroup;
  onClick: (event: MouseEvent) => void;
}

export interface ContactListProps {
  activeContactItem?: ContactGroupItem;
  enableSearch?: boolean;
  groupConfig?: Partial<Record<ContactItemType, CustomGroupConfig>>;

  searchPlaceholder?: string;
  emptyText?: string;

  ContactItem?: Component;
  ContactSearchComponent?: Component;
  GroupHeader?: Component;
  PlaceholderEmptyList?: Component;

  onContactItemClick?: (item: ContactGroupItem) => void;
  onFriendApplicationAction?: (action: 'accept' | 'refuse', application: FriendApplicationInfo) => void;
  onGroupApplicationAction?: (action: 'accept' | 'refuse', application: GroupApplicationInfo) => void;
}

export interface ContactInfoBaseProps {
  channel?: string;
  showActions?: boolean;
  onClose?: () => void;
}

export interface ContactInfoProps extends ContactInfoBaseProps {
  contactItem?: ContactGroupItem | undefined;
  PlaceholderEmpty?: Component;
  FriendInfoComponent?: Component;
  GroupInfoComponent?: Component;
  BlacklistInfoComponent?: Component;
  FriendApplicationInfoComponent?: Component;
  GroupApplicationInfoComponent?: Component;
  SearchGroupInfoComponent?: Component;
  SearchUserInfoComponent?: Component;
  onSendMessage?: (friend: ContactInfo) => void;
  onDeleteFriend?: (friend: ContactInfo) => void;
  onUpdateFriendRemark?: (friend: ContactInfo, remark: string) => void;
  onAddToBlacklist?: (friend: ContactInfo) => void;
  onRemoveFromBlacklist?: (profile: ContactInfo) => void;
  onEnterGroup?: (group: GroupInfo) => void;
  onLeaveGroup?: (group: GroupInfo) => void;
  onDismissGroup?: (group: GroupInfo) => void;
  onFriendApplicationAction?: (action: 'accept' | 'refuse', application: FriendApplicationInfo) => void;
  onGroupApplicationAction?: (action: 'accept' | 'refuse', application: GroupApplicationInfo) => void;
  onAddFriend?: (user: ContactInfo, wording: string) => void;
  onJoinGroup?: (group: GroupInfo, note: string) => void;
}

export interface BlacklistInfoProps extends ContactInfoBaseProps {
  profile: ContactInfo;
  onRemoveFromBlacklist?: (profile: ContactInfo) => void;
}

export interface FriendApplicationInfoProps extends ContactInfoBaseProps {
  application: FriendApplicationInfo;
  onAccept?: (application: FriendApplicationInfo) => void;
  onRefuse?: (application: FriendApplicationInfo) => void;
}

export interface FriendInfoProps extends ContactInfoBaseProps {
  friend: ContactInfo;
  onSendMessage?: (friend: ContactInfo) => void;
  onDeleteFriend?: (friend: ContactInfo) => void;
  onAddToBlacklist?: (friend: ContactInfo) => void;
  onUpdateFriendRemark?: (friend: ContactInfo, remark: string) => void;
}

export interface GroupApplicationInfoProps extends ContactInfoBaseProps {
  application: GroupApplicationInfo;
  onAccept?: (application: GroupApplicationInfo) => void;
  onRefuse?: (application: GroupApplicationInfo) => void;
}

export interface GroupInfoProps extends ContactInfoBaseProps {
  group: GroupInfo;
  onEnterGroup?: (group: GroupInfo) => void;
  onLeaveGroup?: (group: GroupInfo) => void;
  onDismissGroup?: (group: GroupInfo) => void;
}

/**
 * Search-user / search-group info panels consume the unified `ContactInfo` /
 * `GroupInfo` model. `ContactList` normalizes the raw payload emitted from
 * the legacy `ContactSearch` into these types at the boundary.
 */
export interface SearchGroupInfoProps extends ContactInfoBaseProps {
  group: GroupInfo;
  onJoinGroup?: (group: GroupInfo, note: string) => void;
}

export interface SearchUserInfoProps extends ContactInfoBaseProps {
  user: ContactInfo;
  onAddFriend?: (user: ContactInfo, wording: string) => void;
}

export interface ContactListItemProps {
  contactItem: ContactGroupItem;
  activeContactItem?: ContactGroupItem | undefined;
  onClick?: (type: ContactItemType, item: ContactItem) => void;
  onFriendApplicationAction?: (action: 'accept' | 'refuse', application: FriendApplicationInfo) => void;
  onGroupApplicationAction?: (action: 'accept' | 'refuse', application: GroupApplicationInfo) => void;
}

export interface BlacklistItemProps {
  profile: ContactInfo;
  isActive?: boolean;
  onClick?: (profile: ContactInfo) => void;
}

export interface FriendApplicationItemProps {
  application: FriendApplicationInfo;
  isActive?: boolean;
  onClick?: (application: FriendApplicationInfo) => void;
  onAction?: (action: 'accept' | 'refuse', application: FriendApplicationInfo) => void;
}

export interface FriendItemProps {
  friend: ContactInfo;
  isActive?: boolean;
  onClick?: (friend: ContactInfo) => void;
}

export interface GroupApplicationItemProps {
  application: GroupApplicationInfo;
  isActive?: boolean;
  onClick?: (application: GroupApplicationInfo) => void;
  onAction?: (action: 'accept' | 'refuse', application: GroupApplicationInfo) => void;
}

export interface GroupItemProps {
  group: GroupInfo;
  isActive?: boolean;
  onClick?: (group: GroupInfo) => void;
}

export interface ContactSearchProps {
  placeholder?: string;
  autoFocus?: boolean;
  onResultClick?: (item: ContactGroupItem) => void;
  onKeywordChange?: (keyword: string) => void;
}
