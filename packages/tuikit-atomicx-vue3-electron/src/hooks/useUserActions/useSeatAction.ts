import { computed, reactive } from 'vue';
import {
  TUIRequestCallbackType, TUIErrorCode, } from '@tencentcloud/tuiroom-engine-electron';
import {
  IconInviteOnStage, IconDenyOnStage, IconOnStage, IconOffStage, TUIToast, TOAST_TYPE, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
// import { MESSAGE_DURATION } from '@/constants/message';
import { useRoomState } from '../../states/RoomState';
import useUserState from '../../states/UserState/index';
import { UserAction, RequestType, SeatStatus } from '../../types';
import useRoomEngine from '../useRoomEngine';
import type { UserInfo, ActionType } from '../../types';

const { currentRoom } = useRoomState();

const roomEngine = useRoomEngine();

export function useInviteUserOnSeat(
  userInfo: UserInfo,
): ActionType<UserAction> {
  const { t } = useUIKit();
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
          message: `${t('ParticipantList.StageFull')}`,
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
                message: `${getDisplayName(userInfo)} ${t('ParticipantList.AcceptedInviteToStage')}`,
                // duration: MESSAGE_DURATION.NORMAL,
              });
              break;
            case TUIRequestCallbackType.kRequestRejected:
              TUIToast({
                type: TOAST_TYPE.WARNING,
                message: `${getDisplayName(userInfo)} ${t('ParticipantList.DeclinedInviteToStage')}`,
                // duration: MESSAGE_DURATION.NORMAL,
              });
              break;
            case TUIRequestCallbackType.kRequestTimeout:
              TUIToast({
                type: TOAST_TYPE.WARNING,
                message: t(
                  'ParticipantList.InviteStageTimeout',
                  {
                    name: getDisplayName(userInfo),
                  },
                ),
                // duration: MESSAGE_DURATION.NORMAL,
              });
              break;
            case TUIRequestCallbackType.kRequestError:
              if (code === TUIErrorCode.ERR_REQUEST_ID_REPEAT) {
                TUIToast({
                  type: TOAST_TYPE.WARNING,
                  message: t(
                    'ParticipantList.DuplicateStageInvite',
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
        : IconInviteOnStage,
    ),
    label: computed(() =>
      userInfo.seatStatus === SeatStatus.OffInvitationPending
        ? t('ParticipantList.CancelStage')
        : t('ParticipantList.InviteStage'),
    ),
    handler: toggleInviteUserOnSeat,
  });
  return inviteUserOnSeat;
}

export function useAgreeUserOnSeat(userInfo: UserInfo): ActionType<UserAction> {
  const { t } = useUIKit();
  const { acceptApplicationByAdmin } = useUserState();

  const agreeUserOnSeat = reactive({
    key: UserAction.AgreeOnSeatAction,
    icon: IconOnStage,
    label: t('ParticipantList.AgreeToStage'),
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
            message: t('ParticipantList.StageFull'),
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
  const { t } = useUIKit();
  const { rejectApplicationByAdmin } = useUserState();
  const denyUserOnSeat = reactive({
    key: UserAction.DenyOnSeatAction,
    icon: IconDenyOnStage,
    label: t('ParticipantList.RefuseStage'),
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
  const { t } = useUIKit();
  async function kickUserOffSeatByAdmin(userInfo: UserInfo) {
    await roomEngine.instance?.kickUserOffSeatByAdmin({
      seatIndex: -1,
      userId: userInfo.userId,
    });
  }

  const kickUserOffSeat = reactive({
    key: UserAction.KickOffSeatAction,
    icon: IconOffStage,
    label: t('ParticipantList.StepDown'),
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
