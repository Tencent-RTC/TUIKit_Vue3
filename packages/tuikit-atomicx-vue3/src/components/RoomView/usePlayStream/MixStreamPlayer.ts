import { TUIVideoStreamType } from '@tencentcloud/tuiroom-engine-js';
import useRoomEngine from '../../../hooks/useRoomEngine';
import { DeviceStatus } from '../../../types';

const roomEngine = useRoomEngine();

export class MixStreamPlayer {
  private isPlayingMixStream = false;

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
    console.log('MixStreamPlayer.startPlay: ', options, this.isPlayingMixStream);
    const {
      view,
      userInfo: { userId, cameraStatus },
    } = options;
    this.mixUserInfo.userId = userId;
    this.mixUserInfo.cameraStatus = cameraStatus;
    if (this.isPlayingMixStream) {
      return;
    }
    if (userId && cameraStatus === DeviceStatus.On) {
      roomEngine.instance?.setRemoteVideoView({
        userId,
        streamType: TUIVideoStreamType.kCameraStream,
        view,
      });
      // TODO: Confirm whether to add render mode
      await roomEngine.instance?.startPlayRemoteVideo({
        userId,
        streamType: TUIVideoStreamType.kCameraStream,
      });
      this.isPlayingMixStream = true;
      setTimeout(() => {
        const { x: xContainer, y: yContainer, width: widthContainer, height: heightContainer } = document.querySelector('#atomicx-live-stream-content')?.getBoundingClientRect() ?? {};
        console.log('MixStreamPlayer.startPlay: container', xContainer, yContainer, widthContainer, heightContainer);
        const { x: xVideo, y: yVideo, width: widthVideo, height: heightVideo } = document.querySelector('#atomicx-live-stream-content #atomicx-live-stream-content_video')?.getBoundingClientRect() ?? {};
        console.log('MixStreamPlayer.startPlay: videoDiv', xVideo, yVideo, widthVideo, heightVideo);
        const { x: xVideoElement, y: yVideoElement, width: widthVideoElement, height: heightVideoElement } = document.querySelector('#atomicx-live-stream-content video')?.getBoundingClientRect() ?? {};
        console.log('MixStreamPlayer.startPlay: videoElement', xVideoElement, yVideoElement, widthVideoElement, heightVideoElement);
      }, 1000);
    }
  }

  public async stop() {
    console.log('MixStreamPlayer.stop: ', this.mixUserInfo);
    if (!this.mixUserInfo || !this.mixUserInfo.userId) {
      return;
    }
    this.isPlayingMixStream = false;
    await roomEngine.instance?.stopPlayRemoteVideo({
      userId: this.mixUserInfo.userId,
      streamType: TUIVideoStreamType.kCameraStream,
    });
    this.mixUserInfo.userId = '';
    this.mixUserInfo.cameraStatus = DeviceStatus.Off;
  }

  public async destroy() {
    if (this.isPlayingMixStream) {
      await this.stop();
    }
    MixStreamPlayer.MixStreamPlayer = null;
  }
}
