import { computed, reactive } from 'vue';
import {
  TUIRequestCallbackType,
  TUIErrorCode,
} from '@tencentcloud/tuiroom-engine-js';
import {
  IconInviteOnStage,
  IconDenyOnStage,
  IconOnStage,
  IconOffStage,
} from '@tencentcloud/uikit-base-component-vue3';
import { useI18n } from '../../locales';
import { TUIToast, TOAST_TYPE } from '@tencentcloud/uikit-base-component-vue3';
// import { MESSAGE_DURATION } from '@/constants/message';
import { UserInfo, UserAction, ActionType, RequestType, SeatStatus } from '../../types';
import useRoomEngine from '../useRoomEngine';
import useUserState from '../../states/UserState/index';
import { useRoomState } from '../../states/RoomState';

const { currentRoom } = useRoomState();

const { t } = useI18n();

const roomEngine = useRoomEngine();

export function useInviteUserOnSeat(
  userInfo: UserInfo
): ActionType<UserAction> {
  const { userListOnSeat, getDisplayName, cancelInvitationByAdmin, sendInvitationByAdmin } = useUserState();

  async function toggleInviteUserOnSeat() {
    if (userInfo.seatStatus === SeatStatus.OffInvitationPending) {
      await cancelInvitationByAdmin({
        userId: userInfo.userId,
        type: RequestType.Seat,
      });
    } else {
      if (userListOnSeat.value.length === currentRoom.value?.maxSeatCount) {
        TUIToast({
          type: TOAST_TYPE.WARNING,
          message: `${t('The stage is full')}`,
          // duration: MESSAGE_DURATION.NORMAL,
        });
        return;
      }
      await sendInvitationByAdmin({
        userId: userInfo.userId,
        type: RequestType.Seat,
        timeout: 60,
        requestCallback: (callbackInfo: {
          requestCallbackType: TUIRequestCallbackType;
          userId: string;
          code: TUIErrorCode;
        }) => {
          const { requestCallbackType, code } = callbackInfo;
          switch (requestCallbackType) {
            case TUIRequestCallbackType.kRequestAccepted:
              TUIToast({
                type: TOAST_TYPE.SUCCESS,
                message: `${getDisplayName(userInfo)} ${t('accepted the invitation to the stage')}`,
                // duration: MESSAGE_DURATION.NORMAL,
              });
              break;
            case TUIRequestCallbackType.kRequestRejected:
              TUIToast({
                type: TOAST_TYPE.WARNING,
                message: `${getDisplayName(userInfo)} ${t('declined the invitation to the stage')}`,
                // duration: MESSAGE_DURATION.NORMAL,
              });
              break;
            case TUIRequestCallbackType.kRequestTimeout:
              TUIToast({
                type: TOAST_TYPE.WARNING,
                message: t(
                  'The invitation to sb to go on stage has timed out',
                  {
                    name: getDisplayName(userInfo),
                  }
                ),
                // duration: MESSAGE_DURATION.NORMAL,
              });
              break;
            case TUIRequestCallbackType.kRequestError:
              if (code === TUIErrorCode.ERR_REQUEST_ID_REPEAT) {
                TUIToast({
                  type: TOAST_TYPE.WARNING,
                  message: t(
                    'This member has already received the same request, please try again later'
                  ),
                  // duration: MESSAGE_DURATION.NORMAL,
                });
              }
              break;
            default:
              break;
          }
        },
      });
    }
  }

  const inviteUserOnSeat = reactive({
    key: UserAction.InviteOnSeatAction,
    icon: computed(() =>
      userInfo.seatStatus === SeatStatus.OffInvitationPending
        ? IconDenyOnStage
        : IconInviteOnStage
    ),
    label: computed(() =>
      userInfo.seatStatus === SeatStatus.OffInvitationPending
        ? t('Cancel stage')
        : t('Invite stage')
    ),
    handler: toggleInviteUserOnSeat,
  });
  return inviteUserOnSeat;
}

export function useAgreeUserOnSeat(userInfo: UserInfo): ActionType<UserAction> {
  const { acceptApplicationByAdmin } = useUserState();

  const agreeUserOnSeat = reactive({
    key: UserAction.AgreeOnSeatAction,
    icon: IconOnStage,
    label: t('Agree to the stage'),
    handler: async () => {
      try {
        await acceptApplicationByAdmin({
          userId: userInfo.userId,
          type: RequestType.Seat,
        });
      } catch (error: any) {
        if (error === TUIErrorCode.ERR_ALL_SEAT_OCCUPIED) {
          TUIToast({
            type: TOAST_TYPE.WARNING,
            message: t('The stage is full'),
          });
        } else {
          console.error('Failure to response a user request', error);
        }
      }
    },
  });
  return agreeUserOnSeat;
}

export function useDenyUserOnSeat(userInfo: UserInfo): ActionType<UserAction> {
  const { rejectApplicationByAdmin } = useUserState();
  const denyUserOnSeat = reactive({
    key: UserAction.DenyOnSeatAction,
    icon: IconDenyOnStage,
    label: t('Refuse stage'),
    handler: async () => {
      try {
        await rejectApplicationByAdmin({
          userId: userInfo.userId,
          type: RequestType.Seat,
        });
      } catch (error: any) {
        console.error('Failure to response a user request', error);
      }
    },
  });
  return denyUserOnSeat;
}

export function useKickUserOffSeat(userInfo: UserInfo): ActionType<UserAction> {
  async function kickUserOffSeatByAdmin(userInfo: UserInfo) {
    await roomEngine.instance?.kickUserOffSeatByAdmin({
      seatIndex: -1,
      userId: userInfo.userId,
    });
  }

  const kickUserOffSeat = reactive({
    key: UserAction.KickOffSeatAction,
    icon: IconOffStage,
    label: t('Step down'),
    handler: () => kickUserOffSeatByAdmin(userInfo),
  });
  return kickUserOffSeat;
}

export default function useSeatAction(userInfo: UserInfo) {
  return {
    inviteUserOnSeat: useInviteUserOnSeat(userInfo),
    agreeUserOnSeat: useAgreeUserOnSeat(userInfo),
    denyUserOnSeat: useDenyUserOnSeat(userInfo),
    kickUserOffSeat: useKickUserOffSeat(userInfo),
  };
}
