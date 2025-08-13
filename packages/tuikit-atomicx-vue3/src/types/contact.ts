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

// 参数接口
export interface AddFriendParams {
  userID: string;
  addSource: string;
  remark?: string;
  groupName?: string;
  wording?: string;
  type?: string;
}

export interface DeleteFriendParams {
  userIDList: string[];
  type?: typeof TUIChatEngine.TYPES.SNS_DELETE_TYPE_SINGLE | typeof TUIChatEngine.TYPES.SNS_DELETE_TYPE_BOTH;
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

export interface FriendApplicationParams {
  userID: string;
  remark?: string;
  type?: typeof TUIChatEngine.TYPES.SNS_APPLICATION_AGREE | typeof TUIChatEngine.TYPES.SNS_APPLICATION_AGREE_AND_ADD;
}

export interface JoinGroupParams {
  groupID: string;
  applyMessage?: string;
  type?: typeof TUIChatEngine.TYPES.JOIN_TYPE_FREE | typeof TUIChatEngine.TYPES.JOIN_TYPE_NEED_PERMISSION;
}

export interface GroupApplicationParams {
  application: GroupApplication;
  handleMessage?: string;
}
