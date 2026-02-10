import { TUIVideoStreamType } from '@tencentcloud/tuiroom-engine-js';
import { DeviceStatus } from '../../../types';
import RTCStreamPlayer from './RTCStreamPlayer';

export type UserPlayOption = {
  userId: string;
  cameraStatus: DeviceStatus;
  rect: {
    left: string;
    top: string;
    width: string;
    height: string;
    zIndex: number;
  };
};

export class RTCStreamManager {
  static rtcStreamManager: RTCStreamManager | null = null;
  private containerView: HTMLElement | null = null;
  private view: HTMLElement | null = null;

  private playerMap: Map<string, RTCStreamPlayer> = new Map();

  constructor() {
    if (RTCStreamManager.rtcStreamManager) {
      return RTCStreamManager.rtcStreamManager;
    }
    RTCStreamManager.rtcStreamManager = this;
  }

  public async start(options: { view: string; userList: UserPlayOption[] }) {
    console.log('RTCStreamManger.start: ', options.view, options.userList);
    if (!options.userList) {
      return;
    }
    const { view, userList } = options;
    this.containerView = document.getElementById(view) as HTMLElement;
    if (!this.view) {
      const rtcPlayerContainer = document.createElement('div');
      // todo: 这里的 id 需要斟酌一下
      rtcPlayerContainer.id = 'live-stream-view';
      rtcPlayerContainer.style.position = 'absolute';
      this.containerView?.appendChild(rtcPlayerContainer);
      this.view = rtcPlayerContainer;
    }
    userList.forEach(async (item) => {
      const isCameraOn = item.cameraStatus === DeviceStatus.On;
      if (isCameraOn) {
        if (this.playerMap.has(item.userId)) {
          this.playerMap.get(item.userId)?.updateRect(item.rect);
          return;
        }
        const player = new RTCStreamPlayer({
          userId: item.userId,
          streamType: TUIVideoStreamType.kCameraStream,
          container: this.view as HTMLElement,
          rect: item.rect,
        });
        this.playerMap.set(item.userId, player);
        await player.play();
      }
    });
  }

  public async update(options: { userList: UserPlayOption[] }) {
    console.log('RTCStreamManger.update: ', options);
    const { userList } = options;
    userList.forEach(async (item) => {
      if (item.cameraStatus === DeviceStatus.On && !this.playerMap.has(item.userId)) {
        const player = new RTCStreamPlayer({
          userId: item.userId,
          streamType: TUIVideoStreamType.kCameraStream,
          container: this.view as HTMLElement,
          rect: item.rect,
        });
        this.playerMap.set(item.userId, player);
        await player.play();
      }
    });
    [...this.playerMap.keys()].forEach((key) => {
      const userInfo = userList.find(item => item.userId === key);
      if (!userInfo || userInfo.cameraStatus === DeviceStatus.Off) {
        this.playerMap.get(key)?.destroy();
        this.playerMap.delete(key);
      }
      this.playerMap.get(key)?.updateRect(userInfo?.rect as any);
    });
  }

  public async stop() {
    console.log('RTCStreamManger.stop.');
    this.containerView?.removeChild(this.view as HTMLElement);
    [...this.playerMap.values()].forEach(async (player) => {
      await player.destroy();
    });
    this.playerMap.clear();
    this.view = null;
    this.containerView = null;
  }
}
