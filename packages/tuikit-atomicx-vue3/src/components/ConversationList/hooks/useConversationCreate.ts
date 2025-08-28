import { GroupType } from '../../../types';
import {
  DEFAULT_GROUP_AVATAR_AVCHATROOM,
  DEFAULT_GROUP_AVATAR_COMMON,
  DEFAULT_GROUP_AVATAR_MEETING,
  DEFAULT_GROUP_AVATAR_PUBLIC,
  DEFAULT_GROUP_AVATAR_WORK,
} from '../../Avatar';

const getDefaultAvatar = (type: GroupType) => {
  switch (type) {
    case GroupType.WORK:
      return DEFAULT_GROUP_AVATAR_WORK;
    case GroupType.PUBLIC:
      return DEFAULT_GROUP_AVATAR_PUBLIC;
    case GroupType.MEETING:
      return DEFAULT_GROUP_AVATAR_MEETING;
    case GroupType.AVCHATROOM:
      return DEFAULT_GROUP_AVATAR_AVCHATROOM;
    case GroupType.COMMUNITY:
      return DEFAULT_GROUP_AVATAR_COMMON;
    default:
      return '';
  }
};

export const useConversationCreate = () => ({
  getDefaultAvatar,
});
