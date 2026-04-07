import { computed, reactive, Ref, ref } from 'vue';
import {
  TUIMediaDevice, } from '@tencentcloud/tuiroom-engine-electron';
// import { MESSAGE_DURATION } from '../../../../constants/message';
import { useRoomEngine } from '../useRoomEngine';
import { UserInfo, UserAction, ActionType, DeviceStatus, RequestType } from '../../types';
import {
  IconAudioOpen, IconAudioClose, TUIToast, TOAST_TYPE, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import useUserState from '../../states/UserState/index';

export default function useAudioControl(
  userInfo: UserInfo
): ActionType<UserAction> {
  const roomEngine = useRoomEngine();
  const { t } = useUIKit();
  const { sendInvitationByAdmin } = useUserState();

  async function muteUserAudio() {
    if (userInfo.microphoneStatus === DeviceStatus.On) {
      await roomEngine.instance?.closeRemoteDeviceByAdmin({
        userId: userInfo.userId,
        device: TUIMediaDevice.kMicrophone,
      });
    } else {
      if (userInfo.microphoneStatus === DeviceStatus.OffInvitationPending) {
        TUIToast({
          type: TOAST_TYPE.INFO,
          message: `${t('ParticipantList.InviteMicSent', { name: userInfo.displayName })}`,
          // duration: MESSAGE_DURATION.NORMAL,
        });
        return;
      }
      await sendInvitationByAdmin({
        userId: userInfo.userId,
        type: RequestType.Microphone,
        timeout: 0,
      });
      TUIToast({
        type: TOAST_TYPE.INFO,
        message: `${t('ParticipantList.InviteMicSent', { name: userInfo.displayName })}`,
        // duration: MESSAGE_DURATION.NORMAL,
      });
    }
  }

  const audioControl = reactive({
    microphoneStatus: userInfo.microphoneStatus,
    key: UserAction.AudioAction,
    icon: computed(() =>
      userInfo.microphoneStatus === DeviceStatus.On ? IconAudioOpen : IconAudioClose
    ),
    label: computed(() =>
      userInfo.microphoneStatus === DeviceStatus.On ? t('ParticipantList.Mute') : t('ParticipantList.Unmute')
    ),
    handler: muteUserAudio,
  });
  return audioControl;
}
