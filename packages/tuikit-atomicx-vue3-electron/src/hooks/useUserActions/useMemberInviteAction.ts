import { computed, defineComponent, reactive, watch } from 'vue';
import { TUIInvitationStatus } from '@tencentcloud/tuiroom-engine-electron';
import { TUIToast, TOAST_TYPE, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { ActionType, UserAction } from '../../types';
import { UserInfo } from '../../types';
// import { MESSAGE_DURATION } from '../../../../constants/message';
// import { UserInfo, UserAction, ActionType } from '../../../type';

export default function useMemberInviteAction(
  userInfo: UserInfo
): ActionType<UserAction> {
  const { t } = useUIKit();
  const handleInvite = () => {
    roomService.conferenceInvitationManager.inviteUsers({
      userIdList: [userInfo.userId],
    });
    TUIToast({
      type: TOAST_TYPE.SUCCESS,
      message: t('ParticipantList.InviteSuccess'),
      // duration: MESSAGE_DURATION.NORMAL,
    });
  };

  const invitationStatus = computed(() => userInfo.invitationStatus);

  const inviteControl = reactive({
    key: UserAction.InviteEnterRoomAction,
    type: 'control',
    label: t('ParticipantList.Call'),
    handler: handleInvite,
  });

  watch(invitationStatus, newVal => {
    if (newVal === TUIInvitationStatus.kPending) {
      inviteControl.label = t('ParticipantList.Calling');
      inviteControl.type = 'info';
      inviteControl.handler = () => {};
    }
    if (newVal === TUIInvitationStatus.kRejected) {
      inviteControl.label = t('ParticipantList.NotJoin');
      inviteControl.type = 'info';
      inviteControl.handler = () => {};
      setTimeout(() => {
        inviteControl.label = t('ParticipantList.Call');
        inviteControl.type = 'control';
        inviteControl.handler = handleInvite;
      }, 3000);
    }
  });

  return inviteControl;
}
