import { computed, reactive, markRaw } from 'vue';
import {
  TUIMediaDevice, } from '@tencentcloud/tuiroom-engine-electron';
import { TUIToast, TOAST_TYPE, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
// import { MESSAGE_DURATION } from '../../../../constants/message';
import useRoomEngine from '../useRoomEngine';
import { IconVideoOpen } from '@tencentcloud/uikit-base-component-vue3';
import { UserInfo, UserAction, DeviceStatus, RequestType } from '../../types';
import useUserState from '../../states/UserState/index';

const { sendDeviceRequest, getDisplayName } = useUserState();
export default function useVideoAction(userInfo: UserInfo) {
  const roomEngine = useRoomEngine();
  const { t } = useUIKit();
  async function muteUserVideo() {
    if (userInfo.cameraStatus === DeviceStatus.On) {
      await roomEngine.instance?.closeRemoteDeviceByAdmin({
        userId: userInfo.userId,
        device: TUIMediaDevice.kCamera,
      });
    } else {
      if (userInfo.cameraStatus === DeviceStatus.OffInvitationPending) {
        TUIToast({
          type: TOAST_TYPE.INFO,
          message: `${t('ParticipantList.InviteCameraSent', { name: getDisplayName({ userId: userInfo.userId }) })}`,
          // duration: MESSAGE_DURATION.NORMAL,
        });
        return;
      }
      sendDeviceRequest({
        userId: userInfo.userId,
        type: RequestType.Camera,
        timeout: 0,
      });
      TUIToast({
        type: TOAST_TYPE.INFO,
        message: `${t('ParticipantList.InviteCameraSent', { name: getDisplayName({ userId: userInfo.userId }) })}`,
        // duration: MESSAGE_DURATION.NORMAL,
      });
    }
  }
  const videoControl = reactive({
    key: UserAction.VideoAction,
    icon: markRaw(IconVideoOpen),
    label: computed(() =>
      userInfo.cameraStatus === DeviceStatus.On ? t('ParticipantList.DisableVideo') : t('ParticipantList.EnableVideo')
    ),
    handler: muteUserVideo,
  });
  return videoControl;
}
