import { Component } from 'vue';
import type { GroupModel } from './engine';
import type TUIChatEngine from '@tencentcloud/chat-uikit-engine';

export type ContactItem = Friend
  | GroupModel
  | UserProfile
  | FriendApplication
  | GroupApplication;

export enum ContactItemType {
  FRIEND = 'friend',
  BLACK = 'black',
  GROUP = 'group',
  FRIEND_REQUEST = 'friendRequest',
  GROUP_REQUEST = 'groupRequest',
  SEARCH_USER = 'searchUser',
  SEARCH_GROUP = 'searchGroup',
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

export interface ContactGroupItem {
  type: ContactItemType;
  data: ContactItem;
}

export interface ContactGroup {
  key: string;
  type: ContactItemType;
  title: string;
  items: ContactItem[];
  unreadCount?: number;
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
  onFriendApplicationAction?: (action: 'accept' | 'refuse', application: FriendApplication) => void;
  onGroupApplicationAction?: (action: 'accept' | 'refuse', application: GroupApplication) => void;
}

export interface ContactInfoBaseProps {
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
  onSendMessage?: (friend: Friend) => void;
  onDeleteFriend?: (friend: Friend) => void;
  onUpdateFriendRemark?: (friend: Friend, remark: string) => void;
  onAddToBlacklist?: (friend: Friend) => void;
  onRemoveFromBlacklist?: (profile: UserProfile) => void;
  onEnterGroup?: (group: GroupModel) => void;
  onLeaveGroup?: (group: GroupModel) => void;
  onDismissGroup?: (group: GroupModel) => void;
  onFriendApplicationAction?: (action: 'accept' | 'refuse', application: FriendApplication) => void;
  onGroupApplicationAction?: (action: 'accept' | 'refuse', application: GroupApplication) => void;
  onAddFriend?: (user: UserProfile, wording: string) => void;
  onJoinGroup?: (group: GroupModel, note: string) => void;
}

export interface BlacklistInfoProps extends ContactInfoBaseProps {
  profile: UserProfile;
  onRemoveFromBlacklist?: (profile: UserProfile) => void;
}

export interface FriendApplicationInfoProps extends ContactInfoBaseProps {
  application: FriendApplication;
  onAccept?: (application: FriendApplication) => void;
  onRefuse?: (application: FriendApplication) => void;
}

export interface FriendInfoProps extends ContactInfoBaseProps {
  friend: Friend;
  onSendMessage?: (friend: Friend) => void;
  onDeleteFriend?: (friend: Friend) => void;
  onAddToBlacklist?: (friend: Friend) => void;
  onUpdateFriendRemark?: (friend: Friend, remark: string) => void;
}

export interface GroupApplicationInfoProps extends ContactInfoBaseProps {
  application: GroupApplication;
  onAccept?: (application: GroupApplication) => void;
  onRefuse?: (application: GroupApplication) => void;
}

export interface GroupInfoProps extends ContactInfoBaseProps {
  group: GroupModel;
  onEnterGroup?: (group: GroupModel) => void;
  onLeaveGroup?: (group: GroupModel) => void;
  onDismissGroup?: (group: GroupModel) => void;
}

export interface SearchGroupInfoProps extends ContactInfoBaseProps {
  group: GroupModel;
  onJoinGroup?: (group: GroupModel, note: string) => void;
}

export interface SearchUserInfoProps extends ContactInfoBaseProps {
  user: UserProfile;
  onAddFriend?: (user: UserProfile, wording: string) => void;
}

export interface ContactListItemProps {
  contactItem: ContactGroupItem;
  activeContactItem?: ContactGroupItem | undefined;
  onClick?: (type: ContactItemType, item: ContactItem) => void;
  onFriendApplicationAction?: (action: 'accept' | 'refuse', application: FriendApplication) => void;
  onGroupApplicationAction?: (action: 'accept' | 'refuse', application: GroupApplication) => void;
}

export interface BlacklistItemProps {
  profile: UserProfile;
  isActive?: boolean;
  onClick?: (profile: UserProfile) => void;
}

export interface FriendApplicationItemProps {
  application: FriendApplication;
  isActive?: boolean;
  onClick?: (application: FriendApplication) => void;
  onAction?: (action: 'accept' | 'refuse', application: FriendApplication) => void;
}

export interface FriendItemProps {
  friend: Friend;
  isActive?: boolean;
  onClick?: (friend: Friend) => void;
}

export interface GroupApplicationItemProps {
  application: GroupApplication;
  isActive?: boolean;
  onClick?: (application: GroupApplication) => void;
  onAction?: (action: 'accept' | 'refuse', application: GroupApplication) => void;
}

export interface GroupItemProps {
  group: GroupModel;
  isActive?: boolean;
  onClick?: (group: GroupModel) => void;
}

export interface ContactSearchProps {
  placeholder?: string;
  autoFocus?: boolean;
  onResultClick?: (item: ContactGroupItem) => void;
  onKeywordChange?: (keyword: string) => void;
}
