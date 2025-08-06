import { computed, watch } from 'vue';
import { TUIRole } from '@tencentcloud/tuiroom-engine-js';
import useAudioAction from './useAudioAction';
import useChatAction from './useChatAction';
import useVideoAction from './useVideoAction';
import useTransferOwnerAction from './useTransferOwnerAction';
import useChangeNameCardAction from './useChangeNameCardAction/index';
import useKickUserAction from './useKickUserAction';
import useSeatAction from './useSeatAction';
import useAdminAction from './useAdminAction';
import { UserInfo, SeatStatus, UserAction, ActionType, UserRoomStatus } from '../../types';
import { useRoomState } from '../../states/RoomState';
import useUserState from '../../states/UserState/index';
interface ObjectType {
  [key: string]: any;
}

const { currentRoom } = useRoomState();
const { localUser } = useUserState();

export function useUserActions(option: {
  userInfo: UserInfo;
  actionList?: UserAction[];
}) {
  const { userInfo, actionList } = option;
  const isTargetUserMySelf = computed(
    () => localUser.value?.userId === userInfo.userId
  );
  const isTargetUserRoomOwner = computed(
    () => userInfo.userRole === TUIRole.kRoomOwner
  );
  const isTargetUserGeneral = computed(
    () => userInfo.userRole === TUIRole.kGeneralUser
  );
  const isTargetUserAnchor = computed(() => userInfo?.seatStatus === SeatStatus.On);
  const isTargetUserAudience = computed(() => userInfo?.seatStatus !== SeatStatus.On);
  const isCanOperateCurrentUser = computed(
    () =>
      (localUser.value?.userRole === TUIRole.kRoomOwner && !isTargetUserRoomOwner.value) ||
      (localUser.value?.userRole === TUIRole.kAdministrator && isTargetUserGeneral.value) ||
      isTargetUserMySelf.value
  );

  const audioAction = useAudioAction(userInfo);
  const videoAction = useVideoAction(userInfo);
  const chatAction = useChatAction(userInfo);
  const transferOwnerAction = useTransferOwnerAction(userInfo);
  const adminAction = useAdminAction(userInfo);
  const nameCardAction = useChangeNameCardAction(userInfo);
  const kickUserAction = useKickUserAction(userInfo);
  const { inviteUserOnSeat, agreeUserOnSeat, denyUserOnSeat, kickUserOffSeat } =
    useSeatAction(userInfo);

  const isUserApplyingToAnchor = computed(() => {
    return userInfo.seatStatus === SeatStatus.OffApplicationPending
  });
  const agreeOrDenyStageList = computed(() => isUserApplyingToAnchor.value
    ? [agreeUserOnSeat, denyUserOnSeat]
    : []);
  const inviteStageList = computed(() =>
    isTargetUserAudience.value && !isUserApplyingToAnchor.value
      ? [inviteUserOnSeat]
      : []);
  const onStageControlList = computed(() =>
    isTargetUserAnchor.value
      ? [audioAction, videoAction, kickUserOffSeat]
      : []
  );

  watch(() => JSON.stringify(userInfo), (newVal) => {
    console.error('lixin-debug aaa isTargetUserAnchor', newVal);
  });

  const controlListObj = computed(() => {
    // 显式依赖这些数组的内容，确保内容变化时会触发重新计算

    if (currentRoom.value?.isSeatEnabled) {
      return {
        [TUIRole.kRoomOwner]: [
          ...inviteStageList.value,
          ...onStageControlList.value,
          ...agreeOrDenyStageList.value,
          adminAction,
          transferOwnerAction,
          chatAction,
          kickUserAction,
          nameCardAction,
        ],
        [TUIRole.kAdministrator]: [
          ...inviteStageList.value,
          ...onStageControlList.value,
          ...agreeOrDenyStageList.value,
          chatAction,
          nameCardAction,
        ],
      }
    } else {
      return {
        [TUIRole.kRoomOwner]: [
          audioAction,
          videoAction,
          chatAction,
          adminAction,
          transferOwnerAction,
          kickUserAction,
          nameCardAction,
        ],
        [TUIRole.kAdministrator]: [
          audioAction,
          videoAction,
          chatAction,
          nameCardAction,
        ],
      }
    }
  });

  const controlList = computed(() => {
    if (!userInfo || userInfo.userRoomStatus === UserRoomStatus.NotInRoom) {
      return [];
    }
    if (!isCanOperateCurrentUser.value) {
      return [];
    }
    if (isTargetUserMySelf.value) {
      return [nameCardAction];
    }
    // if (userInfo.userId === '991982884') {
    //   debugger;
    // }
    return controlListObj.value[
      localUser.value?.userRole as keyof typeof controlListObj.value
    ] || [];
  });

  // if (actionList && actionList.length > 0) {
  //   return actionList?.reduce((result: ActionType<UserAction>[], action) => {
  //     const actionItem = controlList.value.find(
  //       (item: ActionType<UserAction>) => item.key === action
  //     );
  //     if (actionItem) {
  //       result.push(actionItem);
  //     }
  //     return result;
  //   }, []);
  // }

  // 监听可能导致 controlList 变化的数组
  watch(
    [inviteStageList, onStageControlList, agreeOrDenyStageList],
    () => {
      // 这个空函数会强制 Vue 在这些数组变化时重新评估依赖它们的计算属性
    },
    { deep: true }
  );

  return {
    userActions: controlList,
    isTargetUserAnchor,
    isTargetUserAudience,
    isUserApplyingToAnchor,
    agreeOrDenyStageList,
    inviteStageList,
    onStageControlList,
  }
}
