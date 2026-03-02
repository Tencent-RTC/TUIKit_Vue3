import { TUIVideoStreamType } from '@tencentcloud/tuiroom-engine-js';
import useRoomEngine from '../../../hooks/useRoomEngine';
import { DeviceStatus } from '../../../types';

const roomEngine = useRoomEngine();

export class MixStreamPlayer {
  private mixUserInfo = {
    userId: '',
    cameraStatus: DeviceStatus.Off,
  };

  static MixStreamPlayer: MixStreamPlayer | null = null;

  constructor() {
    if (MixStreamPlayer.MixStreamPlayer) {
      return MixStreamPlayer.MixStreamPlayer;
    }
    MixStreamPlayer.MixStreamPlayer = this;
  }

  public async start(options: { view: string; userInfo: { userId: string; cameraStatus: DeviceStatus } }) {
    console.log('MixStreamPlayer.startPlay: ', options);
    const {
      view,
      userInfo: { userId, cameraStatus },
    } = options;
    this.mixUserInfo.userId = userId;
    this.mixUserInfo.cameraStatus = cameraStatus;
    if (userId && cameraStatus === DeviceStatus.On) {
      roomEngine.instance?.setRemoteVideoView({
        userId,
        streamType: TUIVideoStreamType.kCameraStream,
        view,
      });
      await roomEngine.instance?.startPlayRemoteVideo({
        userId,
        streamType: TUIVideoStreamType.kCameraStream,
      });
    }
  }

  public async stop() {
    console.log('MixStreamPlayer.stop: ', this.mixUserInfo);
    if (!this.mixUserInfo || !this.mixUserInfo.userId) {
      return;
    }
    await roomEngine.instance?.stopPlayRemoteVideo({
      userId: this.mixUserInfo.userId,
      streamType: TUIVideoStreamType.kCameraStream,
    });
    this.mixUserInfo.userId = '';
    this.mixUserInfo.cameraStatus = DeviceStatus.Off;
  }

  public async destroy() {
    await this.stop();
    MixStreamPlayer.MixStreamPlayer = null;
  }
}
