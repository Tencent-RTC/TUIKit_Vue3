import { GroupType } from '@atomicxcore/core';
import {
  DEFAULT_GROUP_AVATAR_AVCHATROOM,
  DEFAULT_GROUP_AVATAR_COMMON,
  DEFAULT_GROUP_AVATAR_MEETING,
  DEFAULT_GROUP_AVATAR_PUBLIC,
  DEFAULT_GROUP_AVATAR_WORK,
} from '../../Avatar';

const getDefaultAvatar = (type: GroupType) => {
  switch (type) {
    case GroupType.Work:
      return DEFAULT_GROUP_AVATAR_WORK;
    case GroupType.Public:
      return DEFAULT_GROUP_AVATAR_PUBLIC;
    case GroupType.Meeting:
      return DEFAULT_GROUP_AVATAR_MEETING;
    case GroupType.AVChatRoom:
      return DEFAULT_GROUP_AVATAR_AVCHATROOM;
    case GroupType.Community:
      return DEFAULT_GROUP_AVATAR_COMMON;
    default:
      return '';
  }
};

export const useConversationCreate = () => ({
  getDefaultAvatar,
});
