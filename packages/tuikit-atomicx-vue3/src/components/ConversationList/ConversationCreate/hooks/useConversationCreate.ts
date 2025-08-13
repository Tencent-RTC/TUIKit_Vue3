import type { Ref } from 'vue';
import { ref, computed, watch } from 'vue';
import TUIChatEngine from '@tencentcloud/chat-uikit-engine';
import { strChineseFirstPy } from '../static/word';
import type { ConversationCreateUsers, ConversationModel, Friend, UserProfile } from '../../../../types';

export const useConversationCreate = (
  conversationList: Ref<ConversationModel[]>,
  friendList: Ref<Friend[]>,
) => {
  const friendListSortResult = ref<ConversationCreateUsers>({});

  const getFirstLetter = (str: string) => {
    const temp = str.trim();
    const uni = temp.charCodeAt(0);
    if (uni > 40869 || uni < 19968) {
      return temp.charAt(0);
    }
    return strChineseFirstPy.charAt(uni - 19968);
  };

  const getCategoryKey = (firstLetter: string): string => {
    const upper = firstLetter.toUpperCase();

    if (firstLetter >= 'a' && firstLetter <= 'z') {
      return upper;
    }

    if (firstLetter >= 'A' && firstLetter <= 'Z') {
      return firstLetter;
    }

    return '#';
  };

  const addProfileToCategory = (
    sortResult: Record<string, Friend[] | UserProfile[]>,
    profile: Friend,
    category: string,
  ) => {
    const categoryList = sortResult[category];
    if (!categoryList.find(item => item.userID === profile.userID)) {
      categoryList.push(profile);
    }
  };

  const handleData = (
    profileList: Friend[],
    frequentlyConversationProfile?: UserProfile[],
  ) => {
    const sortResult: Record<string, Friend[] | UserProfile[]> = {
      '#': frequentlyConversationProfile || [],
    };

    for (let i = 65; i <= 90; i += 1) {
      sortResult[String.fromCharCode(i)] = [];
    }

    profileList?.forEach((profile) => {
      const { nick, userID } = profile;
      const firstLetter = getFirstLetter(nick || userID);
      const categoryKey = getCategoryKey(firstLetter);

      addProfileToCategory(sortResult, profile, categoryKey);
    });

    Object.keys(sortResult).forEach((key) => {
      sortResult[key].sort((a: Friend | UserProfile, b: Friend | UserProfile) => {
        const nameA = (a.nick || a.userID).toLowerCase();
        const nameB = (b.nick || b.userID).toLowerCase();
        return nameA.localeCompare(nameB);
      });
    });

    return sortResult;
  };

  const queryFriendList = (
    list: Friend[],
    frequentlyConversationProfile?: UserProfile[],
  ) => {
    const sortResult = handleData(
      list,
      frequentlyConversationProfile,
    );
    friendListSortResult.value = sortResult;
  };

  const getFriendListSortSearchResult = (searchValue: string) => {
    if (!searchValue) {
      return friendListSortResult.value;
    }
    const result: Record<string, Friend[] | UserProfile[]> = {};
    Object.keys(friendListSortResult.value).forEach((key) => {
      result[key] = friendListSortResult.value[key].filter(
        ({ nick, userID }: { nick: string; userID: string }) => {
          const tempNick = nick?.toLocaleLowerCase();
          const tempSearchValue = searchValue.toLocaleLowerCase();
          const userIDValue = userID.toLocaleLowerCase();
          return tempNick
            ? tempNick.includes(tempSearchValue)
            : userIDValue.includes(tempSearchValue);
        },
      );
    });

    return result;
  };

  watch(
    [friendList, conversationList],
    ([newFriendList, newConversationList]) => {
      let frequentlyConversationProfile: UserProfile[] = [];
      if (newConversationList && newConversationList.length > 0) {
        frequentlyConversationProfile = newConversationList
          .filter((item: ConversationModel) => item?.type === TUIChatEngine.TYPES.CONV_C2C)
          .slice(0, 5)
          .map((item: ConversationModel) => item?.userProfile);
      }

      queryFriendList(newFriendList, frequentlyConversationProfile);
    },
    { immediate: true },
  );

  return {
    friendListSortResult: computed(() => friendListSortResult.value),
    getFirstLetter,
    queryFriendList,
    getFriendListSortSearchResult,
  };
};
